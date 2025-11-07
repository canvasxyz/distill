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

type LoadCommunityArchiveUserProgress =
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
  // are we viewing the user's own uploaded archive or an archive from the community archive supabase api?
  viewingMyArchive: boolean;
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
      db.follower.clear(),
      db.following.clear(),
      db.profiles.clear(),
      db.tweets.clear(),
      db.sessionData.clear(),
    ]);
    // refresh page to reinitialize state; queryResults remain intact
    location.reload();
  },

  appIsReady: false,
  ingestTwitterArchiveProgress: null,
  ingestTwitterArchive: async (file: File) => {
    set({ ingestTwitterArchiveProgress: { status: "processingArchive" } });
    const { account, follower, following, profile, tweets } =
      await processTwitterArchive(file);

    set({ ingestTwitterArchiveProgress: { status: "addingAccount" } });
    await db.accounts.clear();
    await db.accounts.add(account);

    set({ ingestTwitterArchiveProgress: { status: "addingFollowers" } });
    await db.follower.clear();
    await db.follower.bulkAdd(follower);

    set({ ingestTwitterArchiveProgress: { status: "addingFollowing" } });
    await db.following.clear();
    await db.following.bulkAdd(following);

    set({ ingestTwitterArchiveProgress: { status: "addingProfile" } });
    await db.profiles.clear();
    await db.profiles.add(profile);

    set({ ingestTwitterArchiveProgress: { status: "addingTweets" } });
    await db.tweets.clear();
    await db.tweets.bulkAdd(
      tweets.map((tweet) => ({ ...tweet, account_id: account.accountId })),
    );

    set({ ingestTwitterArchiveProgress: { status: "applyingFilters" } });
    await db.sessionData.add({ id: "singleton", viewingMyArchive: true });

    set({ ingestTwitterArchiveProgress: null });
    set(() => ({
      dbHasTweets: true,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allTweets: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: pageTweets, error } = await supabase
        .schema("public")
        .from("tweets")
        .select("*")
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
    })) as Tweet[];

    await db.tweets.clear();
    await db.tweets.bulkAdd(tweets);

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

    await db.profiles.clear();
    const profile = mapKeysDeep(profileData, snakeToCamelCase) as ProfileWithId;

    await db.profiles.add(profile);

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
    await db.accounts.clear();
    const account = mapKeysDeep(accountData, snakeToCamelCase) as Account;

    await db.accounts.add(account);

    set({
      loadCommunityArchiveUserProgress: {
        status: "loadingFollowing",
      },
    });

    const { data: followingData } = await supabase
      .schema("public")
      .from("following")
      .select("*")
      .eq("account_id", accountId);
    await db.following.clear();

    const following = (followingData || []).map((entry) => ({
      accountId: entry.following_account_id,
      userLink: "",
    }));

    await db.following.bulkAdd(following);

    set({
      loadCommunityArchiveUserProgress: {
        status: "loadingFollower",
      },
    });

    const { data: followerData } = await supabase
      .schema("public")
      .from("followers")
      .select("*")
      .eq("account_id", accountId);
    await db.follower.clear();
    const follower = (followerData || []).map((entry) => ({
      accountId: entry.follower_account_id,
      userLink: "",
    }));

    await db.follower.bulkAdd(follower);

    set({
      loadCommunityArchiveUserProgress: null,
    });

    await db.sessionData.add({ id: "singleton", viewingMyArchive: false });

    set({ dbHasTweets: true });
  },
  loadCommunityArchiveUserProgress: null,
  viewingMyArchive: false,
});
