import { supabase } from "../../../supabase";
import {
  AVAILABLE_LLM_CONFIGS,
  getGenuineTweetIds,
} from "../../../state/llm_query";
import {
  batchSystemPrompt,
  finalSystemPrompt,
  submitQuery,
} from "../../query_view/ai_utils";

import { QUERY_BATCH_SIZE, type LLMQueryConfig } from "../../../constants";
import { mapKeysDeep, snakeToCamelCase } from "../../../utils";
import type { Account } from "../../../types";

import type { Tool } from "./type";

const name = "ask_question";

export const AskQuestion: Tool<
  {
    username: string;
    question: string;
    includeRetweets: boolean;
  },
  Promise<string>
> = {
  name,
  schema: {
    type: "function" as const,
    function: {
      name,
      description:
        "Try to generate a report that answers a question about a user's tweets",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description:
              "The username of the Twitter user that we want to ask a question about",
          },
          question: {
            type: "string",
            description: "The question itself",
          },
          includeRetweets: {
            type: "boolean",
            description: "Whether to include retweets",
          },
        },
        required: ["username", "question", "includeRetweets"],
      },
    },
  },
  handler: async (args) => {
    const { username, question } = args;
    const query = question;

    const { data: accountData } = await supabase
      .schema("public")
      .from("account")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    const account = mapKeysDeep(accountData, snakeToCamelCase) as Account;

    // get the tweets to analyse
    const config: LLMQueryConfig = AVAILABLE_LLM_CONFIGS[0];

    const [model, provider, openrouterProvider] = config;

    const numBatches = 3;

    const collectedTweets = [];

    for (let i = 0; i < numBatches; i++) {
      const { data } = await supabase
        .schema("public")
        .from("tweets")
        .select(
          "tweet_id,account_id,full_text,created_at,favorite_count,retweet_count",
        )
        .eq("account_id", account.accountId)
        .not("full_text", "like", "RT %")
        .order("created_at", { ascending: false })
        .range(QUERY_BATCH_SIZE * i, QUERY_BATCH_SIZE * (i + 1));

      if (!data) {
        break;
      }

      const batch = data.map((tweet) => ({
        ...tweet,
        id: tweet.tweet_id,
        id_str: tweet.tweet_id,
      }));

      const queryResult = await submitQuery({
        tweetsSample: batch,
        query: { systemPrompt: batchSystemPrompt, prompt: query },
        account,
        model,
        provider,
        openrouterProvider: openrouterProvider,
        isBatchRequest: true,
      });

      const tweetIds = JSON.parse(queryResult.result).ids;
      const groundedTweets = getGenuineTweetIds(tweetIds, batch);

      collectedTweets.push(groundedTweets.genuine);
    }

    // submit query to create the final result based on the collected texts
    const finalQueryResult = await submitQuery({
      tweetsSample: collectedTweets.flat(),
      query: { systemPrompt: finalSystemPrompt, prompt: query },
      account,
      model,
      provider,
      openrouterProvider: openrouterProvider,
    });
    return finalQueryResult.result;
  },
  getLabel: (args) => {
    return `Ask question "${args.question}" for user ${args.username}, ${args.includeRetweets ? "with retweets" : "without retweets"} `;
  },
};
