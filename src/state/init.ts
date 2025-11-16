import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import { processTwitterArchive } from "../processTwitterArchive";
import { db } from "../db";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";
import type { Account, ProfileWithId, Tweet } from "../types";

type IngestTwitterArchiveProgress =
  | { status: "processingArchive" }
  | { status: "addingAccount" }
  | { status: "addingFollowers" }
  | { status: "addingFollowing" }
  | { status: "addingProfile" }
  | { status: "addingTweets" }
  | { status: "applyingFilters" }
  | { status: "generatingTextIndex" };

export type LoadCommunityArchiveUserProgress =
  | { status: "starting" }
  | {
      status: "loadingTweets";
      totalNumTweets: number;
      tweetsLoaded: number;
    }
  | { status: "loadingProfile" }
  | { status: "loadingAccount" }
  | { status: "loadingFollowing" }
  | { status: "loadingFollower" }
  | { status: "applyWordLists" }
  | { status: "generatingTextIndex" };

export type InitSlice = {
  init: () => Promise<void>;
  dbHasTweets: boolean;
  clearDatabase: () => Promise<void>;
  appIsReady: boolean;
  ingestTwitterArchive: (file: File) => Promise<void>;
  ingestTwitterArchiveProgress: IngestTwitterArchiveProgress | null;
  loadCommunityArchiveUser: (accountId: string) => Promise<void>;
  loadCommunityArchiveUserProgress: LoadCommunityArchiveUserProgress | null;
  removeLocalArchive: (accountId: string) => Promise<void>;
  removeArchive: (accountId: string) => Promise<void>;
  lastLoadedAccountId: string | null;
};

export const createInitSlice: StateCreator<StoreSlices, [], [], InitSlice> = (
  set,
) => ({
  init: async () => {
    // before anything else is displayed we need to check that the database has tweets in it
    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;

    set({ dbHasTweets, appIsReady: true });
  },

  dbHasTweets: false,
  clearDatabase: async () => {
    // Clear all archive-related tables but preserve past query results
    await Promise.all([
      db.accounts.clear(),
      db.profiles.clear(),
      db.tweets.clear(),
    ]);
    // refresh page to reinitialize state; queryResults remain intact
    location.reload();
  },

  appIsReady: false,
  ingestTwitterArchiveProgress: null,
  ingestTwitterArchive: async (file: File) => {
    set({ ingestTwitterArchiveProgress: { status: "processingArchive" } });
    const { account, profile, tweets } = await processTwitterArchive(file);

    set({ ingestTwitterArchiveProgress: { status: "addingAccount" } });
    await db.accounts.put({ ...account, fromArchive: true });

    set({ ingestTwitterArchiveProgress: { status: "addingProfile" } });
    await db.profiles.put(profile);

    set({ ingestTwitterArchiveProgress: { status: "addingTweets" } });
    await db.tweets.bulkPut(
      tweets.map((tweet) => ({ ...tweet, account_id: account.accountId })),
    );

    set({ ingestTwitterArchiveProgress: { status: "applyingFilters" } });

    set({ ingestTwitterArchiveProgress: null });
    set(() => ({
      dbHasTweets: true,
      lastLoadedAccountId: account.accountId,
    }));
  },
  loadCommunityArchiveUser: async (accountId) => {
    // Fetch all required data from Supabase
    // Page through all tweets for this account

    set({
      loadCommunityArchiveUserProgress: {
        status: "starting",
      },
    });

    const { count: tweetCountData, error: tweetCountError } = await supabase
      .schema("public")
      .from("tweets")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);

    if (tweetCountError) throw tweetCountError;

    const totalNumTweets = tweetCountData || 0;

    set({
      loadCommunityArchiveUserProgress: {
        status: "loadingTweets",
        totalNumTweets,
        tweetsLoaded: 0,
      },
    });

    let allTweets: Array<Record<string, unknown> & { tweet_id: string }> = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageTweets, error } = await supabase
        .schema("public")
        .from("tweets")
        .select("*, tweet_media(*)")
        .eq("account_id", accountId)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      if (pageTweets && pageTweets.length > 0) {
        allTweets = allTweets.concat(pageTweets);
        if (pageTweets.length < pageSize) break;
        page += 1;

        set({
          loadCommunityArchiveUserProgress: {
            status: "loadingTweets",
            totalNumTweets,
            tweetsLoaded: allTweets.length,
          },
        });
      } else {
        break;
      }
    }
    const tweets = (allTweets || []).map((tweet) => ({
      ...tweet,
      id: tweet.tweet_id,
      id_str: tweet.tweet_id,
    })) as unknown as Tweet[];

    await db.tweets.bulkPut(tweets);

    set({
      loadCommunityArchiveUserProgress: {
        status: "loadingProfile",
      },
    });

    const { data: profileData } = await supabase
      .schema("public")
      .from("profile")
      .select("*")
      .eq("account_id", accountId)
      .maybeSingle();

    const profile = mapKeysDeep(profileData, snakeToCamelCase) as ProfileWithId;

    await db.profiles.put(profile);

    set({
      loadCommunityArchiveUserProgress: {
        status: "loadingAccount",
      },
    });

    const { data: accountData } = await supabase
      .schema("public")
      .from("account")
      .select("*")
      .eq("account_id", accountId)
      .maybeSingle();
    const account = mapKeysDeep(accountData, snakeToCamelCase) as Account;

    await db.accounts.put({ ...account, fromArchive: false });

    set({
      loadCommunityArchiveUserProgress: null,
      lastLoadedAccountId: accountId,
    });

    set({ dbHasTweets: true });
  },
  loadCommunityArchiveUserProgress: null,
  lastLoadedAccountId: null,
  removeLocalArchive: async (accountId: string) => {
    // Remove all data for a locally ingested archive (by accountId)
    await Promise.all([
      db.tweets.where("account_id").equals(accountId).delete(),
      db.profiles.where("accountId").equals(accountId).delete(),
      db.accounts.delete(accountId),
    ]);

    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets });
  },
  removeArchive: async (accountId: string) => {
    // Alias for removing any archive (local or community)
    await Promise.all([
      db.tweets.where("account_id").equals(accountId).delete(),
      db.profiles.where("accountId").equals(accountId).delete(),
      db.accounts.delete(accountId),
    ]);

    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets });
  },
});
