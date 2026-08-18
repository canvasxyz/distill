import type { ChatCompletionMessageParam } from "openai/resources";
import type { ChatCompletion } from "openai/resources";
import type { Account, Profile, Tweet } from "../../types";
import {
  DEFAULT_IMAGE_GEN_MODEL,
  IMAGE_GEN_MODELS,
  getImageGenModel,
  type LLMQueryConfig,
  type LLMQueryProvider,
} from "../../constants";
import {
  formatProfileBlock,
  getFullSizeAvatarUrl,
  serverUrl,
  submitQuery,
} from "../query_view/ai_utils";
import {
  getProviderApiKey,
  getProviderUrl,
  getSelectedProvider,
} from "../../utils/provider";

// ---------------------------------------------------------------------------
// Step 1: analyse tweets -> content-only image description
// ---------------------------------------------------------------------------

// Deliberately says nothing about style: the description should only cover
// WHAT is in the image so the image model's default look comes through.
export const AVATAR_ANALYSIS_SYSTEM_PROMPT =
  "You will be given a user's profile (bio, and possibly their current avatar image) and a list of their tweets. Your job is to write a short description of what should appear in a new profile avatar for this user, grounded in what they actually post about. Do not include citations, links, or tweet ids. Do not explain your reasoning. Output only the description.";

export const AVATAR_ANALYSIS_PROMPT =
  "Read the tweets and profile, then write a description of the CONTENT of a profile avatar that captures this user's online personality. Describe: the main subject (a person, creature, character, or object), what they are doing or holding, any objects, symbols, animals, or motifs that recur in their tweets, the setting or background, and the mood or expression. Be concrete and specific to this user. STRICT RULES: do not mention art style, medium, technique, rendering, lighting, colour palette, colours, artists, aesthetics, or how the image should look — describe only what is depicted. Do not include any text or letters in the image. Output 2-4 sentences, nothing else.";

export const stripThinking = (text: string) =>
  text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

export async function analyseTweetsForAvatar(params: {
  tweets: Tweet[];
  account: Account;
  profile?: Profile | null;
  config: LLMQueryConfig;
}) {
  const { tweets, account, profile, config } = params;
  const [model, provider, openrouterProvider] = config;
  const result = await submitQuery({
    tweetsSample: tweets,
    query: {
      systemPrompt: AVATAR_ANALYSIS_SYSTEM_PROMPT,
      prompt: AVATAR_ANALYSIS_PROMPT,
      promptPlacement: "prompt-before",
    },
    account,
    profile,
    model,
    provider,
    openrouterProvider,
  });
  return {
    description: stripThinking(result.result),
    model: result.model || model,
    provider: result.provider,
    usage: result.usage,
    runTime: result.runTime,
  };
}

// ---------------------------------------------------------------------------
// Step 2: description -> image
// ---------------------------------------------------------------------------

type ImageMessage = ChatCompletion["choices"][0]["message"] & {
  images?: { type: "image_url"; image_url: { url: string } }[];
};
type ImageChatCompletion = Omit<ChatCompletion, "choices"> & {
  choices: Array<
    Omit<ChatCompletion["choices"][0], "message"> & { message: ImageMessage }
  >;
  model?: string;
  usage?: { cost?: number };
};

// Intentionally minimal: no style direction at all.
export const AVATAR_IMAGE_SYSTEM_PROMPT =
  "Generate a single square profile avatar image based on the user's description. Do not include any text or letters in the image.";

export function buildAvatarImagePrompt(params: {
  description: string;
  account: Account;
  profile?: Profile | null;
}) {
  const { description, account, profile } = params;
  return [
    `Profile avatar for @${account.username}.`,
    "",
    formatProfileBlock(account, profile),
    "",
    description.trim(),
  ].join("\n");
}

export async function generateAvatarImage(params: {
  description: string;
  account: Account;
  profile?: Profile | null;
  model?: string;
  includeCurrentAvatar?: boolean;
}): Promise<{ imageDataUrl: string; model: string; runTime: number; cost?: number }> {
  const { profile, includeCurrentAvatar = true } = params;
  const model = params.model || DEFAULT_IMAGE_GEN_MODEL;
  const modalities = getImageGenModel(model)?.modalities ?? ["image", "text"];
  const startTime = performance.now();

  const promptText = buildAvatarImagePrompt(params);
  const avatarUrl = includeCurrentAvatar
    ? getFullSizeAvatarUrl(profile?.avatarMediaUrl)
    : undefined;

  const userContent: ChatCompletionMessageParam["content"] = avatarUrl
    ? [
        { type: "text", text: "The user's current avatar, for reference:" },
        { type: "image_url", image_url: { url: avatarUrl } },
        { type: "text", text: promptText },
      ]
    : promptText;

  const aiParams = {
    model,
    messages: [
      { role: "system" as const, content: AVATAR_IMAGE_SYSTEM_PROMPT },
      { role: "user" as const, content: userContent },
    ],
    modalities,
  };

  const selectedProvider = getSelectedProvider();
  let data: ImageChatCompletion;

  if (selectedProvider === "openrouter" && getProviderApiKey("openrouter")) {
    // Direct call with the user's own OpenRouter key
    const response = await fetch(
      `${getProviderUrl("openrouter")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getProviderApiKey("openrouter")}`,
        },
        body: JSON.stringify(aiParams),
      },
    );
    if (response.status !== 200) {
      throw new Error(`Provider error (${response.status}): ${await response.text()}`);
    }
    data = await response.json();
    data.model = data.model || model;
  } else {
    // Proxy through the worker; selected model first, then other image
    // models with the same modalities as fallbacks.
    type WorkerLLMConfig = [string, LLMQueryProvider, string | null, boolean, number];
    const key = modalities.join(",");
    const orderedModels = [
      model,
      ...IMAGE_GEN_MODELS.filter(
        (m) => m.id !== model && m.modalities.join(",") === key,
      ).map((m) => m.id),
    ];
    const llmConfigs: WorkerLLMConfig[] = orderedModels.map((m) => [
      m,
      "openrouter",
      null,
      false,
      1,
    ]);
    const response = await fetch(serverUrl, {
      method: "POST",
      body: JSON.stringify({ params: aiParams, provider: "openrouter", llmConfigs }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.status !== 200) {
      throw new Error(await response.text());
    }
    data = await response.json();
  }

  const message = data.choices?.[0]?.message;
  const imageDataUrl = message?.images?.[0]?.image_url?.url;
  if (!imageDataUrl) {
    const text = typeof message?.content === "string" ? message.content : "";
    throw new Error(
      `Image model returned no image${text ? `: ${text.slice(0, 300)}` : "."}`,
    );
  }

  return {
    imageDataUrl,
    model: data.model || model,
    runTime: performance.now() - startTime,
    cost: data.usage?.cost,
  };
}
