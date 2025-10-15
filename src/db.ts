import Dexie from "dexie";
import type { Tweet, Account, FilterMatch } from "./types";
import type { QueryResult } from "./views/query_view/ai_utils";

class AppDatabase extends Dexie {
  tweets: Dexie.Table<Tweet, string>;
  accounts: Dexie.Table<Account, string>;
  excludedTweetIds: Dexie.Table<{ id: string }, string>;
  filterTweetIds: Dexie.Table<FilterMatch, string>;
  queryResults: Dexie.Table<QueryResult, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      tweets: "id,created_at",
      accounts: "accountId",
      excludedTweetIds: "id",
      filterTweetIds: "[filterName+id]",
      queryResults: "id",
    });

    this.tweets = this.table("tweets");
    this.accounts = this.table("accounts");
    this.excludedTweetIds = this.table("excludedTweetIds");
    this.filterTweetIds = this.table("filterTweetIds");
    this.queryResults = this.table("queryResults");
  }
}

export const db = new AppDatabase();
