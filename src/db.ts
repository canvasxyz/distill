import Dexie from "dexie";
import type { Tweet, Account } from "./types";

class AppDatabase extends Dexie {
  tweets: Dexie.Table<Tweet, string>;
  accounts: Dexie.Table<Account, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      tweets: "id,created_at",
      accounts: "accountId",
    });

    this.tweets = this.table("tweets");
    this.accounts = this.table("accounts");
  }
}

export const db = new AppDatabase();
