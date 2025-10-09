import type { Account, Tweet } from "../../types";

export type Query = { prompt: string; systemPrompt?: string };

export const defaultSystemPrompt =
  "You will be given a prompt, followed by a list of tweets. Review the tweets and provide an answer to the prompt.";

export function replaceAccountName(text: string, accountName: string) {
  return text.replace("{account}", `@${accountName}`);
}
export function makePromptMessages(
  tweetsSample: Tweet[],
  query: Query,
  account: Account
) {
  return [
    {
      role: "system" as const,
      content: `${query.systemPrompt || defaultSystemPrompt}

  ${replaceAccountName(query.prompt, account.username)}`,
    },

    {
      role: "user" as const,
      content: tweetsSample
        .map((tweet) => `<Post>${tweet.full_text}</Post>`)
        .join("\n"),
    },
  ];
}

export const serverUrl = "https://tweet-analysis-worker.bob-wbb.workers.dev";

export async function submitQuery(
  tweetsSample: Tweet[],
  query: Query,
  account: Account
) {
  const model = "Qwen/Qwen3-Next-80B-A3B-Instruct";

  const aiParams = {
    model,
    messages: makePromptMessages(tweetsSample, query, account),
  };

  const classificationResponse = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({ params: aiParams }),
    headers: { "Content-Type": "application/json" },
  });
  const data = await classificationResponse.json();

  return data.choices[0].message.content;
}
