import Dexie from "dexie";
import type { Tweet, Account, FilterMatch } from "./types";

class AppDatabase extends Dexie {
  tweets: Dexie.Table<Tweet, string>;
  accounts: Dexie.Table<Account, string>;
  excludedTweetIds: Dexie.Table<{ id: string }, string>;
  filterTweetIds: Dexie.Table<FilterMatch, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      tweets: "id,created_at",
      accounts: "accountId",
      excludedTweetIds: "id",
      filterTweetIds: "[filterName+id]",
    });

    this.tweets = this.table("tweets");
    this.accounts = this.table("accounts");
    this.excludedTweetIds = this.table("excludedTweetIds");
    this.filterTweetIds = this.table("filterTweetIds");
  }
}

export const db = new AppDatabase();
