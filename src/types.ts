export type Account = {
  fromArchive: boolean;
  email: string;
  createdVia: string;
  username: string;
  accountId: string;
  createdAt: string;
  accountDisplayName: string;
};

export type ProfileDescription = {
  bio: string;
  website: string;
  location: string;
};

export type Profile = {
  description: ProfileDescription;
  avatarMediaUrl: string;
  headerMediaUrl: string;
};

export type ProfileWithId = { accountId: string } & Profile;

type TweetMedia = {
  width: number;
  height: number;
  media_id: number;
  tweet_id: string;
  media_url: string;
  media_type: "photo";
  updated_at: string;
  archive_upload_id: number;
};

export type Tweet = {
  id: string;
  id_str: string;
  account_id: string;
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
  tweet_media: TweetMedia[];
  raw_json: string;
};
