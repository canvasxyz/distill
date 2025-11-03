import type { ChatCompletionMessageParam } from "openai/resources";
import type { Account, Tweet } from "../../types";
import OpenAI from "openai";
import { pickSampleNoRepeats } from "../../utils";
import type { LLMQueryProvider } from "../../constants";

export type Query = { prompt: string; systemPrompt?: string };

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
        estimated_cost: number;
        prompt_tokens: number;
        prompt_tokens_details: null; // only used with prompt caching
        total_tokens: number;
      };
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

export const batchSystemPrompt =
  "You are a researcher who is looking through an archive of a user's tweets ({account}) trying to answer a question (given in the user prompt). You are trying to collect together all of the tweets that might provide a way to answer that question. Give your reasoning in <Reasoning>...</Reasoning> tags and then return a list of the tweets that you used as evidence with each tweet id wrapped in a <TweetId>...</TweetId> tag. Use only the exact tweet ids provided. Return at most 20 tweets.";

export const finalSystemPrompt =
  "You will be given a prompt, followed by a list of tweets. Review the tweets and provide an answer to the prompt. Do not create tables in your response.";

export function replaceAccountName(text: string, accountName: string) {
  return text.replace(/\{account\}/g, `@${accountName}`);
}
export function makePromptMessages(
  tweetsSample: { id_str: string; full_text: string }[],
  query: Query,
  account: Account,
) {
  return [
    {
      role: "system" as const,
      content: `${replaceAccountName(query.systemPrompt || finalSystemPrompt, account.username)}

        ${replaceAccountName(query.prompt, account.username)}`,
    },

    {
      role: "user" as const,
      content: tweetsSample
        .map((tweet) => `<Post id="${tweet.id_str}">${tweet.full_text}</Post>`)
        .join("\n"),
    },
  ];
}

export const serverUrl = "https://tweet-analysis-worker.bob-wbb.workers.dev";

export async function submitQuery(params: {
  tweetsSample: { id_str: string; full_text: string }[];
  query: Query;
  account: Account;
  model: string;
  provider: LLMQueryProvider;
  openrouterProvider?: string | null | undefined;
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

  const classificationResponse = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({ params: aiParams, provider }),
    headers: { "Content-Type": "application/json" },
  });

  if (classificationResponse.status !== 200) {
    const errorText = await classificationResponse.text();
    throw new Error(errorText);
  }

  const data = await classificationResponse.json();

  const endTime = performance.now();
  const runTime = endTime - startTime;

  return {
    query: query.prompt,
    result: data.choices[0].message.content as string,
    messages,
    runTime,
    usage: data.usage,
  };
}

export const extractTweetIds = (queryResult: string) => {
  const idMatches = queryResult.match(/<TweetId>([\s\S]*?)<\/TweetId>/g) || [];
  const tweetIds = idMatches.map((m) =>
    m
      .replace(/^<TweetId>/, "")
      .replace(/<\/TweetId>$/, "")
      .trim(),
  );
  return tweetIds;
};

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
    // random sample
    return pickSampleNoRepeats(tweets, rangeSelection.sampleSize);
  }
};
