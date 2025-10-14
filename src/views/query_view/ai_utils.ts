import type { Account } from "../../types";
import OpenAI from "openai";

export type Query = { prompt: string; systemPrompt?: string };

export const batchSystemPrompt =
  "You are a researcher who is looking through an archive of a user's tweets ({account}) trying to answer a question (given in the user prompt). You are trying to collect together all of the tweets that might provide a way to answer that question. Give your reasoning in <Reasoning>...</Reasoning> tags and then return a list of the tweets that you used as evidence with each tweet text wrapped in a <Tweet>...</Tweet> tag. Return at most 20 tweets.";

export const finalSystemPrompt =
  "You will be given a prompt, followed by a list of tweets. Review the tweets and provide an answer to the prompt.";

export function replaceAccountName(text: string, accountName: string) {
  return text.replace("{account}", `@${accountName}`);
}
export function makePromptMessages(
  tweetsSample: { full_text: string }[],
  query: Query,
  account: Account
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
        .map((tweet) => `<Post">${tweet.full_text}</Post>`)
        .join("\n"),
    },
  ];
}

export const serverUrl = "https://tweet-analysis-worker.bob-wbb.workers.dev";

export async function submitQuery(
  tweetsSample: { full_text: string }[],
  query: Query,
  account: Account
) {
  const model = "Qwen/Qwen3-Next-80B-A3B-Instruct";

  const messages = makePromptMessages(tweetsSample, query, account);
  const aiParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
    {
      model,
      messages,
    };

  const classificationResponse = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({ params: aiParams }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await classificationResponse.json();

  return data.choices[0].message.content as string;
}
