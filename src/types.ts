export type Account = {
  email: string;
  createdVia: string;
  username: string;
  accountId: string;
  createdAt: string;
  accountDisplayName: string;
};

export type Tweet = {
  id: string;
  id_str: string;
  full_text: string;
  created_at: string;
  retweet_count: string;
  favorite_count: string;
  favorited: boolean;
  retweeted: boolean;
  truncated: boolean;
  in_reply_to_status_id?: string;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id?: string;
  in_reply_to_user_id_str?: string;
  in_reply_to_screen_name?: string;
  lang: string;
  source: string;
  raw_json: string;
};

export type FilterMatch = {
  id: string;
  filterName: string;
  type: "llm" | "regex";
  regexMatch?: RegExpExecArray;
};
