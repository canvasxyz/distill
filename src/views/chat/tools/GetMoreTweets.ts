import { supabase } from "../../../supabase";
import type { Tool } from "./type";

const name = "get_more_tweets";

export const GetMoreTweets: Tool<
  {
    username?: string;
    textSearch?: string;
    offset?: number;
  },
  Promise<
    | {
        tweet_id: string;
        full_text: string;
        created_at: string;
        favorite_count: string;
        retweet_count: string;
      }[]
    | null
  >
> = {
  name,
  schema: {
    type: "function" as const,
    function: {
      name,
      description:
        "Get additional tweets matching the given fields. Only use this if you really need more information.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description:
              "The username of the Twitter users whose tweets are being requested",
          },
          textSearch: {
            type: "string",
            description:
              "A search term for the tweet text, this uses the Postgres FTS feature",
          },
          offset: {
            type: "number",
            description: "An offset which is used to paginate results.",
          },
        },
        required: [],
      },
    },
  },
  handler: async (args) => {
    const offset = args.offset || 0;
    const limit = 100;

    let queryObj = supabase
      .schema("public")
      .from("tweets")
      .select("tweet_id,full_text,created_at,favorite_count,retweet_count")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    if (args.username) {
      const accountIdResponse = await supabase
        .schema("public")
        .from("account")
        .select("account_id")
        .eq("username", args.username)
        .limit(1)
        .maybeSingle();

      const accountId = accountIdResponse.data?.account_id;

      queryObj = queryObj.eq("account_id", accountId);
    }

    if (args.textSearch) {
      queryObj = queryObj.textSearch(
        "full_text",
        args.textSearch.replaceAll(" ", "+"),
      );
    }

    const response = await queryObj;

    return response.data;
  },
  getLabel: (args) =>
    `Retrieve more tweets${args.username && ` for user ${args.username}`}${args.textSearch && ` matching ${args.textSearch}`}${args.offset && ` with offset ${args.offset}`}`,
};
