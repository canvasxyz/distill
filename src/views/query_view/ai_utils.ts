import OpenAI from "openai";
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
        .map((tweet) => `<Tweet>${tweet.full_text}</Tweet>`)
        .join("\n"),
    },
  ];
}

export async function submitQuery(
  tweetsSample: Tweet[],
  query: Query,
  account: Account
) {
  const openai = new OpenAI({
    baseURL: "https://api.deepinfra.com/v1",
    apiKey: import.meta.env.VITE_DEEPINFRA_KEY,
    dangerouslyAllowBrowser: true,
  });

  // something with a big context window that doesn't cost too much
  const model = "Qwen/Qwen2.5-72B-Instruct";

  const response = await openai.chat.completions.create({
    model,
    messages: makePromptMessages(tweetsSample, query, account),
  });

  return response.choices[0].message.content;
}
