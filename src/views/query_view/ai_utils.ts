import type { ChatCompletionMessageParam } from "openai/resources";
import type { ChatCompletion } from "openai/resources";

import type { Account, Profile, Tweet } from "../../types";
import OpenAI from "openai";
import {
  IMAGE_GEN_MODELS,
  VISION_CAPABLE_MODELS,
  type LLMQueryProvider,
  type PromptPlacement,
} from "../../constants";
import { AVAILABLE_LLM_CONFIGS } from "../../state/llm_query";
import {
  getSelectedProvider,
  getProviderUrl,
  getProviderApiKey,
} from "../../utils/provider";

export type Query = {
  prompt: string;
  systemPrompt?: string;
  promptPlacement?: PromptPlacement;
};

type ReasoningConfig = {
  effort: "minimal" | "low" | "medium" | "high";
};

type ChatCompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  provider?: { only: string[] };
  reasoning?: ReasoningConfig;
};

export type RangeSelection =
  | { type: "last-tweets"; numTweets: number }
  | { type: "date-range"; startDate: string; endDate: string };

export type BatchStatus =
  | {
      status: "done";
      startTime: number;
      endTime: number;
      runTime: number;
      groundedTweets: {
        genuine: Tweet[];
        hallucinated: string[];
      };
      outputText: string;
      usage: {
        completion_tokens: number;
        estimated_cost?: number;
        prompt_tokens: number;
        total_tokens: number;
      };
      provider: string;
      model: string;
    }
  | { status: "pending"; startTime: number }
  | { status: "queued" };

export type QueryResult = {
  id: string;
  query: string;
  result: string;
  totalRunTime: number;
  runTime: number;
  messages: ChatCompletionMessageParam[];
  rangeSelection: RangeSelection;
  batchStatuses: Record<string, BatchStatus>;
  totalEstimatedCost: number;
  totalTokens: number;
  provider: string;
  model: string;
  // The handle that was queried when this result was created (e.g. "@alice")
  queriedHandle?: string;
  // Data URLs of avatar images generated from this result
  generatedImages?: string[];
};

export const finalSystemPrompt =
    "You will be given a user's profile (bio, and possibly their current avatar image), a list of their tweets, and a prompt. Review the tweets and provide an answer to the prompt. Provide citations for claims that you make when they are grounded in specific tweets that have been provided. Citations should be provided inline, as Markdown links to the tweets themselves on x.com. Always use the tweet_id for the Markdown link's text, and https://x.com/i/status/{tweet_id} for the link (example: https://x.com/i/status/1111). Do not create tables in your response.";

const REASONING_ENABLED_MODELS = new Set([
  "google/gemini-3-flash-preview",
  "google/gemini-2.0-flash-001",
  "gpt-oss-120b",
]);
const DEFAULT_REASONING_EFFORT: ReasoningConfig["effort"] = "medium";

const getReasoningConfigForModel = (model: string): ReasoningConfig | null =>
  REASONING_ENABLED_MODELS.has(model)
    ? { effort: DEFAULT_REASONING_EFFORT }
    : null;

export function replaceAccountName(text: string, accountName: string) {
  // If accountName is "this user", don't add @ prefix
  if (accountName === "this user") {
    return text.replace(/\{account\}/g, accountName);
  }
  return text.replace(/\{account\}/g, `this user`);
}
export function formatProfileBlock(
  account: Account,
  profile?: Profile | null,
) {
  const parts = [
    `<Profile username="@${account.username}" display_name="${account.accountDisplayName}">`,
  ];
  if (profile?.description?.bio) parts.push(`Bio: ${profile.description.bio}`);
  if (profile?.description?.location)
    parts.push(`Location: ${profile.description.location}`);
  if (profile?.description?.website)
    parts.push(`Website: ${profile.description.website}`);
  parts.push("</Profile>");
  return parts.join("\n");
}

export function makePromptMessages(
  tweetsSample: {
    id_str: string;
    created_at: string;
    favorite_count: string;
    retweet_count: string;
    full_text: string;
  }[],
  query: Query,
  account: Account,
  profile?: Profile | null,
  includeAvatarImage = false,
): ChatCompletionMessageParam[] {
  const promptPlacement = query.promptPlacement || "prompt-before";
  const tweetsContent = tweetsSample
    .map(
      (tweet) =>
        `<Post id="${tweet.id_str}" date="${tweet.created_at}" num_likes="${tweet.favorite_count}" num_retweets="${tweet.retweet_count}">${tweet.full_text}</Post>`,
    )
    .join("\n");

  const promptText = replaceAccountName(query.prompt, account.username);
  const profileBlock = formatProfileBlock(account, profile);
  const combinedUserContent =
    promptPlacement === "prompt-before"
      ? `${promptText}\n\n${profileBlock}\n\n${tweetsContent}`
      : `${profileBlock}\n\n${tweetsContent}\n\n${promptText}`;

  const avatarUrl = includeAvatarImage ? profile?.avatarMediaUrl : undefined;
  const userContent: ChatCompletionMessageParam["content"] = avatarUrl
    ? [
        { type: "text", text: "Current avatar image:" },
        { type: "image_url", image_url: { url: avatarUrl } },
        { type: "text", text: combinedUserContent },
      ]
    : combinedUserContent;

  return [
    {
      role: "system" as const,
      content: replaceAccountName(
        query.systemPrompt || finalSystemPrompt,
        account.username,
      ),
    },

    {
      role: "user" as const,
      content: userContent,
    },
  ];
}

export const serverUrl = "https://tweet-analysis-worker.raymond-a96.workers.dev";

export async function submitQuery(params: {
  tweetsSample: {
    id_str: string;
    created_at: string;
    favorite_count: string;
    retweet_count: string;
    full_text: string;
  }[];
  query: Query;
  account: Account;
  profile?: Profile | null;
  model: string;
  provider: LLMQueryProvider;
  openrouterProvider?: string | null | undefined;
  isBatchRequest?: boolean;
}) {
  const {
    tweetsSample,
    query,
    account,
    profile,
    model,
    provider,
    openrouterProvider,
  } = params;
  const startTime = performance.now();

  const messages = makePromptMessages(
    tweetsSample,
    query,
    account,
    profile,
    VISION_CAPABLE_MODELS.has(model),
  );
  const aiParams: ChatCompletionParams = {
    model,
    messages,
    provider: openrouterProvider ? { only: [openrouterProvider] } : undefined,
  };
  const reasoningConfig = getReasoningConfigForModel(model);
  if (reasoningConfig) {
    aiParams.reasoning = reasoningConfig;
  }

  if (params.isBatchRequest) {
    aiParams.response_format = {
      type: "json_schema",
      json_schema: {
        name: "tweet_ids",
        strict: true,
        schema: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          required: ["ids"],
          additionalProperties: false,
        },
      },
    };
  }

  // Check if user has selected a provider to use directly
  const selectedProvider = getSelectedProvider();
  // Extended type to include OpenRouter's reasoning field in responses
  type ExtendedMessage = ChatCompletion["choices"][0]["message"] & {
    reasoning?: string;
  };
  type ExtendedChatCompletion = Omit<ChatCompletion, "choices"> & {
    choices: Array<Omit<ChatCompletion["choices"][0], "message"> & { message: ExtendedMessage }>;
    provider?: string;
    model?: string;
  };
  let data: ExtendedChatCompletion;

  if (selectedProvider && getProviderApiKey(selectedProvider)) {
    // Use direct provider API call
    const providerUrl = getProviderUrl(selectedProvider);
    const providerApiKey = getProviderApiKey(selectedProvider);

    // For direct calls, use the selected provider instead of the one from config
    const directProvider = selectedProvider;
    const directModel = model; // Use the model from config

    const directResponse = await fetch(`${providerUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerApiKey}`,
      },
      body: JSON.stringify(aiParams),
    });

    if (directResponse.status !== 200) {
      const errorText = await directResponse.text();
      throw new Error(
        `Provider error (${directResponse.status}): ${errorText}`,
      );
    }

    data = await directResponse.json();
    // Add provider and model info to match the expected response format
    data.provider = directProvider;
    data.model = directModel;
  } else {
    // Use proxy server (default behavior)
    // put the selected model at the start of the llm configs list
    // i.e. if it's not available then fall back to the other models in the list
    const resolvedOpenrouterProvider = openrouterProvider ?? null;
    type WorkerLLMConfig = [string, LLMQueryProvider, string | null, boolean, number];
    const llmConfigs: WorkerLLMConfig[] = [
      [model, provider, resolvedOpenrouterProvider, false, 1500], // Use default batch size
      ...AVAILABLE_LLM_CONFIGS.map<WorkerLLMConfig>(
        ([
          configModel,
          configProvider,
          configOpenrouterProvider,
          recommended,
          batchSize,
        ]) => [
          configModel,
          configProvider,
          configOpenrouterProvider,
          recommended,
          batchSize,
        ],
      ),
    ];

    const classificationResponse = await fetch(serverUrl, {
      method: "POST",
      body: JSON.stringify({ params: aiParams, provider, llmConfigs }),
      headers: { "Content-Type": "application/json" },
    });

    if (classificationResponse.status !== 200) {
      const errorText = await classificationResponse.text();
      throw new Error(errorText);
    }

    data = await classificationResponse.json();
  }

  const endTime = performance.now();
  const runTime = endTime - startTime;

  // Extract content and reasoning from response
  const message = data.choices[0].message;
  const content = message.content as string;
  const reasoning = message.reasoning;

  // If reasoning is present, wrap it in <think> tags and prepend to content
  const result = reasoning
    ? `<think>${reasoning}</think>\n\n${content}`
    : content;

  return {
    query: query.prompt,
    result,
    messages,
    runTime,
    usage: data.usage!,
    provider: data.provider!,
    model: data.model,
  };
}

export const selectSubset = (
  tweets: Tweet[],
  rangeSelection: RangeSelection,
) => {
  if (rangeSelection.type === "last-tweets") {
    // Sort tweets by created_at date in ascending order (older first)
    const tweetsSorted = [...tweets].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    // return the last N tweets
    const numTweets = rangeSelection.numTweets;

    return tweetsSorted.slice(-numTweets);
  } else if (rangeSelection.type === "date-range") {
    const startDateTime = new Date(rangeSelection.startDate);
    const endDateTime = new Date(rangeSelection.endDate);
    endDateTime.setMonth(endDateTime.getMonth() + 1); // Include the entire end month

    return tweets.filter((tweet) => {
      // tweet.created_at
      const tweetDate = new Date(tweet.created_at);
      return tweetDate >= startDateTime && tweetDate < endDateTime;
    });
  } else {
    throw new Error("Unknown rangeSelection type (should never happen)");
  }
};

// ---------------------------------------------------------------------------
// Avatar image generation
// ---------------------------------------------------------------------------

type ImageMessage = ChatCompletion["choices"][0]["message"] & {
  images?: { type: "image_url"; image_url: { url: string } }[];
};
type ImageChatCompletion = Omit<ChatCompletion, "choices"> & {
  choices: Array<
    Omit<ChatCompletion["choices"][0], "message"> & { message: ImageMessage }
  >;
  model?: string;
};

export const AVATAR_IMAGE_SYSTEM_PROMPT =
  "You are an illustrator that designs profile avatars. You will be given a description of a person's online personality (derived from their tweets), their bio, and possibly their current avatar image. Produce a single square avatar image that visually captures their personality — their interests, tone, and vibe. If a current avatar is provided, use it as loose inspiration (palette, subject, or mood) but create something new. No text or letters in the image.";

export function buildAvatarImagePrompt(params: {
  analysis: string;
  account: Account;
  profile?: Profile | null;
  styleHint?: string;
}) {
  const { analysis, account, profile, styleHint } = params;
  // Strip any <think>...</think> reasoning from the analysis text
  const cleanAnalysis = analysis.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  return [
    `Design a new profile avatar for @${account.username}.`,
    styleHint ? `Style: ${styleHint}` : "",
    "",
    formatProfileBlock(account, profile),
    "",
    "<PersonalityAnalysis>",
    cleanAnalysis,
    "</PersonalityAnalysis>",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function generateAvatarImage(params: {
  analysis: string;
  account: Account;
  profile?: Profile | null;
  styleHint?: string;
}): Promise<{ imageDataUrl: string; model: string; runTime: number }> {
  const { profile } = params;
  const startTime = performance.now();

  const promptText = buildAvatarImagePrompt(params);
  const avatarUrl = profile?.avatarMediaUrl;

  const userContent: ChatCompletionMessageParam["content"] = avatarUrl
    ? [
        { type: "text", text: "Current avatar image, for reference:" },
        { type: "image_url", image_url: { url: avatarUrl } },
        { type: "text", text: promptText },
      ]
    : promptText;

  const aiParams: Omit<ChatCompletionParams, "modalities"> & {
    modalities?: string[];
  } = {
    model: IMAGE_GEN_MODELS[0],
    messages: [
      { role: "system", content: AVATAR_IMAGE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    modalities: ["image", "text"],
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
    data.model = data.model || IMAGE_GEN_MODELS[0];
  } else {
    // Proxy through the worker; it tries each config in order.
    type WorkerLLMConfig = [string, LLMQueryProvider, string | null, boolean, number];
    const llmConfigs: WorkerLLMConfig[] = IMAGE_GEN_MODELS.map((m) => [
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
    model: data.model || IMAGE_GEN_MODELS[0],
    runTime: performance.now() - startTime,
  };
}
