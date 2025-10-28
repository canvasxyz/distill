import Dexie from "dexie";
import type {
  Tweet,
  Account,
  ProfileWithId,
  Following,
  Follower,
  SessionData,
  FuzzySetFields,
} from "./types";
import type { QueryResult } from "./views/query_view/ai_utils";

class AppDatabase extends Dexie {
  accounts: Dexie.Table<Account, string>;
  follower: Dexie.Table<Follower, string>;
  following: Dexie.Table<Following, string>;
  profiles: Dexie.Table<ProfileWithId, string>;
  tweets: Dexie.Table<Tweet, string>;

  queryResults: Dexie.Table<QueryResult, string>;

  sessionData: Dexie.Table<SessionData, string>;

  fullTextFuzzySetFields: Dexie.Table<FuzzySetFields, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      accounts: "accountId",
      follower: "accountId",
      following: "accountId",
      profiles: "accountId",
      tweets: "id,created_at",
      queryResults: "id",
      sessionData: "id",
      fullTextFuzzySetFields: "id",
    });

    this.accounts = this.table("accounts");
    this.follower = this.table("follower");
    this.following = this.table("following");
    this.profiles = this.table("profiles");
    this.tweets = this.table("tweets");
    this.queryResults = this.table("queryResults");
    this.sessionData = this.table("sessionData");
    this.fullTextFuzzySetFields = this.table("fullTextFuzzySetFields");
  }
}

export const db = new AppDatabase();
