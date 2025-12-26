import type { ChatCompletionMessageParam } from "openai/resources";
import type { ChatCompletion } from "openai/resources";

import type { Account, Tweet } from "../../types";
import OpenAI from "openai";
import {
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
};

export const finalSystemPrompt =
    "You will be given a list of tweets, and a prompt. Review the tweets and provide an answer to the prompt. Provide citations for claims that you make when they are grounded in specific tweets that have been provided. Citations should be provided inline, as Markdown links to the tweets themselves on x.com. Always use the tweet_id for the Markdown link's text, and https://x.com/i/status/{tweet_id} for the link (example: https://x.com/i/status/1111). Do not create tables in your response.";

export function replaceAccountName(text: string, accountName: string) {
  // If accountName is "this user", don't add @ prefix
  if (accountName === "this user") {
    return text.replace(/\{account\}/g, accountName);
  }
  return text.replace(/\{account\}/g, `this user`);
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
) {
  const promptPlacement = query.promptPlacement || "prompt-before";
  const tweetsContent = tweetsSample
    .map(
      (tweet) =>
        `<Post id="${tweet.id_str}" date="${tweet.created_at}" num_likes="${tweet.favorite_count}" num_retweets="${tweet.retweet_count}">${tweet.full_text}</Post>`,
    )
    .join("\n");

  const promptText = replaceAccountName(query.prompt, account.username);
  const combinedUserContent =
    promptPlacement === "prompt-before"
      ? `${promptText}\n\n${tweetsContent}`
      : `${tweetsContent}\n\n${promptText}`;

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
      content: combinedUserContent,
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
  model: string;
  provider: LLMQueryProvider;
  openrouterProvider?: string | null | undefined;
  isBatchRequest?: boolean;
}) {
  const { tweetsSample, query, account, model, provider, openrouterProvider } =
    params;
  const startTime = performance.now();

  const messages = makePromptMessages(tweetsSample, query, account);
  const aiParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
    provider?: { only: string[] };
  } = {
    model,
    messages,
    provider: openrouterProvider ? { only: [openrouterProvider] } : undefined,
  };

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
  let data: ChatCompletion & { provider?: string; model?: string };

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
    type WorkerLLMConfig = [string, LLMQueryProvider, string | null, boolean];
    const llmConfigs: WorkerLLMConfig[] = [
      [model, provider, resolvedOpenrouterProvider, false],
      ...AVAILABLE_LLM_CONFIGS.map<WorkerLLMConfig>(
        ([
          configModel,
          configProvider,
          configOpenrouterProvider,
          recommended,
        ]) => [
          configModel,
          configProvider,
          configOpenrouterProvider,
          recommended,
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

  return {
    query: query.prompt,
    result: data.choices[0].message.content as string,
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
