import type { StateCreator } from "zustand";
import type { StoreSlices } from "./types";
import { processTwitterArchive } from "../processTwitterArchive";
import { db } from "../db";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";
import type { Account, ProfileWithId, Tweet } from "../types";
import { filterPosts, type RangeSelection } from "../views/query_view/ai_utils";

type IngestTwitterArchiveProgress =
  | { status: "processingArchive" }
  | { status: "addingAccount" }
  | { status: "addingFollowers" }
  | { status: "addingFollowing" }
  | { status: "addingProfile" }
  | { status: "addingTweets" }
  | { status: "applyingFilters" }
  | { status: "generatingTextIndex" };

export type FetchPostsProgress = {
  username: string;
  loaded: number;
  total: number;
};

// Posts are fetched from Community Archive the first time a question needs
// them, then kept locally. This records what has been fetched so far.
export type PostCacheEntry = {
  accountId: string;
  // How many of the newest posts are stored locally, newest-first with no
  // gaps. `complete` means the archive has no more posts than that.
  recentCount: number;
  complete: boolean;
  ranges: {
    startDate: string;
    endDate: string;
    limit: number;
    complete: boolean;
  }[];
};

export type PostRequest = {
  rangeSelection: RangeSelection;
  includeReplies: boolean;
  includeRetweets: boolean;
  // The most a single question can read with the chosen model.
  limit: number;
};

export type InitSlice = {
  init: () => Promise<void>;
  dbHasTweets: boolean;
  clearDatabase: () => Promise<void>;
  appIsReady: boolean;
  ingestTwitterArchive: (file: File) => Promise<void>;
  ingestTwitterArchiveProgress: IngestTwitterArchiveProgress | null;
  addCommunityArchiveUser: (
    accountId: string,
    numTweets?: number | null,
  ) => Promise<void>;
  // Returns the account's posts that match the request, fetching from
  // Community Archive first when they are not stored locally yet.
  preparePosts: (account: Account, request: PostRequest) => Promise<Tweet[]>;
  fetchPostsProgress: FetchPostsProgress | null;
  removeLocalArchive: (accountId: string) => Promise<void>;
  removeArchive: (accountId: string) => Promise<void>;
  lastLoadedAccountId: string | null;
};

const PAGE_SIZE = 1000;

const EMPTY_CACHE = (accountId: string): PostCacheEntry => ({
  accountId,
  recentCount: 0,
  complete: false,
  ranges: [],
});

// Community Archive rows name the reply column differently from a Twitter
// export; the filters and views read the export's name.
const normalizeCommunityArchivePost = (row: Record<string, unknown>) =>
  ({
    ...row,
    id: row.tweet_id,
    id_str: row.tweet_id,
    in_reply_to_user_id:
      row.in_reply_to_user_id ?? row.reply_to_user_id ?? undefined,
  }) as Tweet;

const exclusiveEndOfMonth = (endDate: string) => {
  const end = new Date(endDate);
  end.setMonth(end.getMonth() + 1);
  return end.toISOString();
};

async function removeAccountData(accountId: string) {
  await Promise.all([
    db.tweets.where("account_id").equals(accountId).delete(),
    db.profiles.where("accountId").equals(accountId).delete(),
    db.accounts.delete(accountId),
    db.postCache.delete(accountId),
  ]);
}

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
      db.postCache.clear(),
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
    await db.accounts.put({
      ...account,
      fromArchive: true,
      numTweets: tweets.length,
    });

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

  addCommunityArchiveUser: async (accountId, numTweets) => {
    // Only the profile and account details are stored now. Posts are fetched
    // when a question or avatar first needs them.
    const [
      { data: profileData, error: profileError },
      { data: accountData, error: accountError },
    ] = await Promise.all([
      supabase
        .schema("public")
        .from("profile")
        .select("*")
        .eq("account_id", accountId)
        .maybeSingle(),
      supabase
        .schema("public")
        .from("all_account")
        .select("*")
        .eq("account_id", accountId)
        .maybeSingle(),
    ]);
    if (profileError) throw profileError;
    if (accountError) throw accountError;
    if (!accountData) throw new Error("Account not found on Community Archive");

    const account = mapKeysDeep(accountData, snakeToCamelCase) as Account;
    const existing = await db.accounts.get(accountId);
    await db.accounts.put({
      ...existing,
      ...account,
      fromArchive: false,
      numTweets: numTweets ?? account.numTweets ?? existing?.numTweets ?? null,
    });
    if (profileData) {
      const profile = mapKeysDeep(
        profileData,
        snakeToCamelCase,
      ) as ProfileWithId;
      await db.profiles.put(profile);
    }
    set({ lastLoadedAccountId: accountId });
  },

  fetchPostsProgress: null,
  preparePosts: async (account, request) => {
    if (!account.fromArchive) {
      await ensureCommunityArchivePosts(account, request, (progress) =>
        set({ fetchPostsProgress: progress }),
      ).finally(() => set({ fetchPostsProgress: null }));
      if ((await db.tweets.limit(1).toArray()).length > 0)
        set({ dbHasTweets: true });
    }
    const posts = await db.tweets
      .where("account_id")
      .equals(account.accountId)
      .toArray();
    return filterPosts(posts, request);
  },

  lastLoadedAccountId: null,
  removeLocalArchive: async (accountId: string) => {
    // Remove all data for a locally ingested archive (by accountId)
    await removeAccountData(accountId);

    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets });
  },
  removeArchive: async (accountId: string) => {
    // Alias for removing any archive (local or community)
    await removeAccountData(accountId);

    const dbHasTweets = (await db.tweets.limit(1).toArray()).length > 0;
    set({ dbHasTweets });
  },
});

async function ensureCommunityArchivePosts(
  account: Account,
  request: PostRequest,
  onProgress: (progress: FetchPostsProgress) => void,
) {
  const { rangeSelection, limit } = request;
  const cache =
    (await db.postCache.get(account.accountId)) ??
    EMPTY_CACHE(account.accountId);

  if (rangeSelection.type === "last-tweets") {
    const wanted = Math.min(rangeSelection.numTweets, limit);
    if (cache.complete || cache.recentCount >= wanted) return;

    const { posts, reachedEnd } = await fetchPosts({
      account,
      offset: cache.recentCount,
      count: wanted - cache.recentCount,
      onProgress: (loaded) =>
        onProgress({
          username: account.username,
          loaded: cache.recentCount + loaded,
          total: wanted,
        }),
    });
    await db.tweets.bulkPut(posts);
    await db.postCache.put({
      ...cache,
      recentCount: cache.recentCount + posts.length,
      complete: cache.complete || reachedEnd,
    });
    return;
  }

  const { startDate, endDate } = rangeSelection;
  if (!startDate || !endDate) return;
  const covered = cache.ranges.find(
    (range) =>
      range.startDate === startDate &&
      range.endDate === endDate &&
      (range.complete || range.limit >= limit),
  );
  if (covered) return;

  const { posts, reachedEnd } = await fetchPosts({
    account,
    offset: 0,
    count: limit,
    startDate,
    endDate,
    onProgress: (loaded) =>
      onProgress({ username: account.username, loaded, total: limit }),
  });
  await db.tweets.bulkPut(posts);
  await db.postCache.put({
    ...cache,
    ranges: [
      ...cache.ranges.filter(
        (range) => range.startDate !== startDate || range.endDate !== endDate,
      ),
      { startDate, endDate, limit, complete: reachedEnd },
    ],
  });
}

async function fetchPosts({
  account,
  offset,
  count,
  startDate,
  endDate,
  onProgress,
}: {
  account: Account;
  offset: number;
  count: number;
  startDate?: string;
  endDate?: string;
  onProgress: (loaded: number) => void;
}) {
  const posts: Tweet[] = [];
  let reachedEnd = false;
  onProgress(0);
  while (posts.length < count) {
    const pageSize = Math.min(PAGE_SIZE, count - posts.length);
    const from = offset + posts.length;
    let query = supabase
      .schema("public")
      .from("tweets")
      .select("*, tweet_media(*)")
      .eq("account_id", account.accountId);
    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lt("created_at", exclusiveEndOfMonth(endDate));
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as Record<string, unknown>[];
    posts.push(...rows.map(normalizeCommunityArchivePost));
    onProgress(posts.length);
    if (rows.length < pageSize) {
      reachedEnd = true;
      break;
    }
  }
  return { posts, reachedEnd };
}
