import Dexie from "dexie";
import type { Tweet, Account, ProfileWithId } from "./types";
import type { QueryResult } from "./views/query_view/ai_utils";

class AppDatabase extends Dexie {
  accounts: Dexie.Table<Account, string>;
  profiles: Dexie.Table<ProfileWithId, string>;
  tweets: Dexie.Table<Tweet, string>;

  queryResults: Dexie.Table<QueryResult, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      accounts: "accountId",
      profiles: "accountId",
      tweets: "id,account_id,created_at",
      queryResults: "id",
    });

    this.accounts = this.table("accounts");
    this.profiles = this.table("profiles");
    this.tweets = this.table("tweets");
    this.queryResults = this.table("queryResults");
  }
}

export const db = new AppDatabase();
