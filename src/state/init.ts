import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import { filters } from "../filtering/filters";
import { processTwitterArchive } from "../processTwitterArchive";
import { db } from "../db";
import { strToU8, zipSync } from "fflate";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";
import type { Account, ProfileWithId, Tweet } from "../types";

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
  | { status: "applyWordLists" };

export type InitSlice = {
  init: () => Promise<void>;
  dbHasTweets: boolean;
  clearDatabase: () => Promise<void>;
  appIsReady: boolean;
  ingestTwitterArchive: (file: File) => Promise<void>;
  loadCommunityArchiveUser: (accountId: string) => Promise<void>;
  loadCommunityArchiveUserProgress: LoadCommunityArchiveUserProgress | null;
  downloadArchive: () => Promise<void>;
  // are we viewing the user's own uploaded archive or an archive from the community archive supabase api?
  viewingMyArchive: boolean;
};

export const createInitSlice: StateCreator<StoreSlices, [], [], InitSlice> = (
  set,
  get,
) => ({
  init: async () => {
    // before anything else is displayed we need to check that the database has tweets in it
    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets, appIsReady: true });
  },

  dbHasTweets: false,
  clearDatabase: async () => {
    await db.delete();
    // refresh page
    location.reload();
  },

  appIsReady: false,
  ingestTwitterArchive: async (file: File) => {
    const { account, follower, following, profile, tweets } =
      await processTwitterArchive(file);

    await db.accounts.clear();
    await db.accounts.add(account);

    await db.follower.clear();
    await db.follower.bulkAdd(follower);

    await db.following.clear();
    await db.following.bulkAdd(following);

    await db.profiles.clear();
    await db.profiles.add(profile);

    await db.tweets.clear();
    await db.tweets.bulkAdd(tweets);

    // apply filters
    const filterMatchesToAdd = [];
    for (const tweet of tweets || []) {
      for (const filter of filters) {
        const filterMatch = filter.evaluateFilter(tweet);

        if (filterMatch) {
          filterMatchesToAdd.push(filterMatch);
        }
      }
    }
    await db.filterTweetIds.bulkAdd(filterMatchesToAdd);

    await db.sessionData.add({ id: "singleton", viewingMyArchive: true });

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
      loadCommunityArchiveUserProgress: {
        status: "applyWordLists",
      },
    });

    // apply filters
    const filterMatchesToAdd = [];
    for (const tweet of tweets || []) {
      for (const filter of filters) {
        const filterMatch = filter.evaluateFilter(tweet);

        if (filterMatch) {
          filterMatchesToAdd.push(filterMatch);
        }
      }
    }
    await db.filterTweetIds.bulkAdd(filterMatchesToAdd);

    set({
      loadCommunityArchiveUserProgress: null,
    });

    await db.meta.add({ id: "singleton", viewingMyArchive: false });

    set({ dbHasTweets: true });
  },
  loadCommunityArchiveUserProgress: null,

  downloadArchive: async () => {
    // Fetch all relevant data from the database
    const accounts = await db.accounts.toArray();
    const follower = await db.follower.toArray();
    const following = await db.following.toArray();
    const profiles = await db.profiles.toArray();
    const tweets = await db.tweets.toArray();

    // Get the excluded tweet IDs set from the store
    const excludedTweetIdsSet = get().excludedTweetIdsSet;

    // Filter tweets using the excludedTweetIdsSet
    const filteredTweets = tweets.filter(
      (tweet) => !excludedTweetIdsSet.has(tweet.id),
    );

    const zipBlob = zipSync({
      data: {
        "account.js": strToU8(
          `window.YTD.account.part0 = ${JSON.stringify(
            accounts.map((account) => ({ account })),
            null,
            2,
          )}`,
        ),
        "follower.js": strToU8(
          `window.YTD.follower.part0 = ${JSON.stringify(
            follower.map((f) => ({ follower: f })),
            null,
            2,
          )}`,
        ),
        "following.js": strToU8(
          `window.YTD.following.part0 = ${JSON.stringify(
            following.map((f) => ({ following: f })),
            null,
            2,
          )}`,
        ),
        "profile.js": strToU8(
          `window.YTD.profile.part0 = ${JSON.stringify(
            profiles.map((p) => ({ profile: p })),
            null,
            2,
          )}`,
        ),
        "tweets.js": strToU8(
          `window.YTD.tweets.part0 = ${JSON.stringify(
            filteredTweets.map((ft) => ({ tweet: ft })),
            null,
            2,
          )}`,
        ),
      },
    });

    // Create a Blob from the Uint8Array, then trigger download using a temporary anchor element
    const blob = new Blob([zipBlob as Uint8Array<ArrayBuffer>], {
      type: "application/zip",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twitter-archive.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  viewingMyArchive: false,
});
