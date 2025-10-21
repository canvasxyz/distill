import Dexie from "dexie";
import type {
  Tweet,
  Account,
  FilterMatch,
  ProfileWithId,
  Following,
  Follower,
} from "./types";
import type { QueryResult } from "./views/query_view/ai_utils";

class AppDatabase extends Dexie {
  accounts: Dexie.Table<Account, string>;
  follower: Dexie.Table<Follower, string>;
  following: Dexie.Table<Following, string>;
  profiles: Dexie.Table<ProfileWithId, string>;
  tweets: Dexie.Table<Tweet, string>;

  excludedTweetIds: Dexie.Table<{ id: string }, string>;
  filterTweetIds: Dexie.Table<FilterMatch, string>;
  queryResults: Dexie.Table<QueryResult, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      accounts: "accountId",
      follower: "accountId",
      following: "accountId",
      profiles: "accountId",
      tweets: "id,created_at",
      excludedTweetIds: "id",
      filterTweetIds: "[filterName+id]",
      queryResults: "id",
    });

    this.accounts = this.table("accounts");
    this.follower = this.table("follower");
    this.following = this.table("following");
    this.profiles = this.table("profiles");
    this.tweets = this.table("tweets");
    this.excludedTweetIds = this.table("excludedTweetIds");
    this.filterTweetIds = this.table("filterTweetIds");
    this.queryResults = this.table("queryResults");
  }
}

export const db = new AppDatabase();
