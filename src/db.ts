import Dexie from "dexie";
import type { Tweet, Account } from "./types";

class AppDatabase extends Dexie {
  tweets: Dexie.Table<Tweet, string>;
  account: Dexie.Table<Account, string>;

  constructor() {
    super("TweetArchiveExplorerDB");
    this.version(1).stores({
      tweets: "id,created_at",
      account: "id",
    });

    this.tweets = this.table("tweets");
    this.account = this.table("account");
  }
}

export const db = new AppDatabase();
