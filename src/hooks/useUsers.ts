import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";
import type { Json } from "../utils";

export type CAAccount = {
  accountId: string;
  username: string;
  numTweets: number | null;
  numFollowers: number | null;
  profile: null | {
    avatarMediaUrl: string;
  };
};

type Result = CAAccount[];

export const COMMUNITY_ARCHIVE_PAGE_SIZE = 50;

export const PINNED_USERNAMES = [
  "exgenesis",
  "repligate",
  "visakanv",
  "IvanVendrov",
  "DefenderOfBasic",
  "Ben_Reinhardt",
  "__drewface",
  "erikbjareholt",
  "rhyslindmark",
  "crystalcultures",
];

const ACCOUNT_FIELDS =
  "account_id, username, num_tweets, num_followers, profile(avatar_media_url)";

const pinnedRank = new Map(
  PINNED_USERNAMES.map((username, index) => [username.toLowerCase(), index]),
);

function mapAccounts(data: Json): Result {
  return mapKeysDeep(data, snakeToCamelCase) as Result;
}

async function loadPinnedAccounts(searchQuery: string) {
  let request = supabase
    .schema("public")
    .from("account")
    .select(ACCOUNT_FIELDS)
    .in("username", PINNED_USERNAMES);

  if (searchQuery) {
    request = request.ilike("username", `%${searchQuery}%`);
  }

  const { data, error } = await request;
  if (error) throw error;
  return mapAccounts(data || []);
}

async function loadAccountPage(
  searchQuery: string,
  offset: number,
  pageSize = COMMUNITY_ARCHIVE_PAGE_SIZE,
) {
  let request = supabase
    .schema("public")
    .from("account")
    .select(ACCOUNT_FIELDS);

  if (searchQuery) {
    request = request.ilike("username", `%${searchQuery}%`);
  }

  const { data, error } = await request
    .order("num_followers", { ascending: false, nullsFirst: false })
    .order("account_id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;
  return mapAccounts(data || []);
}

export function mergeCommunityArchiveAccounts(...groups: Result[]) {
  const seenIds = new Set<string>();
  const pinned: CAAccount[] = [];
  const other: CAAccount[] = [];

  for (const account of groups.flat()) {
    if (seenIds.has(account.accountId)) continue;
    seenIds.add(account.accountId);

    if (pinnedRank.has((account.username || "").toLowerCase())) {
      pinned.push(account);
    } else {
      other.push(account);
    }
  }

  pinned.sort(
    (a, b) =>
      (pinnedRank.get((a.username || "").toLowerCase()) ?? Infinity) -
      (pinnedRank.get((b.username || "").toLowerCase()) ?? Infinity),
  );

  return [...pinned, ...other];
}

type CommunityArchiveAccountsState = {
  accounts: Result;
  error: string | null;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
};

const EMPTY_STATE: CommunityArchiveAccountsState = {
  accounts: [],
  error: null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
};

export const useCommunityArchiveAccounts = (
  enabled = true,
  searchQuery = "",
) => {
  const normalizedQuery = searchQuery.trim();
  const [retryCount, setRetryCount] = useState(0);
  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  const [state, setState] = useState(EMPTY_STATE);
  const requestIdRef = useRef(0);
  const nextOffsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;
    nextOffsetRef.current = 0;
    hasMoreRef.current = false;
    isLoadingMoreRef.current = false;

    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    setState({ ...EMPTY_STATE, isLoading: true });

    async function loadInitialAccounts() {
      try {
        const [pinned, page] = await Promise.all([
          loadPinnedAccounts(normalizedQuery),
          loadAccountPage(normalizedQuery, 0),
        ]);
        if (cancelled || requestId !== requestIdRef.current) return;

        nextOffsetRef.current = page.length;
        hasMoreRef.current = page.length === COMMUNITY_ARCHIVE_PAGE_SIZE;
        setState({
          accounts: mergeCommunityArchiveAccounts(pinned, page),
          error: null,
          hasMore: hasMoreRef.current,
          isLoading: false,
          isLoadingMore: false,
        });
      } catch (error) {
        if (cancelled || requestId !== requestIdRef.current) return;
        console.error("Failed to load Community Archive users", error);
        setState({
          ...EMPTY_STATE,
          error: "Failed to load Community Archive users.",
        });
      }
    }

    void loadInitialAccounts();

    return () => {
      cancelled = true;
    };
  }, [enabled, normalizedQuery, retryCount]);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasMoreRef.current || isLoadingMoreRef.current) return;

    const requestId = requestIdRef.current;
    isLoadingMoreRef.current = true;
    setState((current) => ({ ...current, isLoadingMore: true }));

    try {
      const page = await loadAccountPage(
        normalizedQuery,
        nextOffsetRef.current,
      );
      if (requestId !== requestIdRef.current) return;

      nextOffsetRef.current += page.length;
      hasMoreRef.current = page.length === COMMUNITY_ARCHIVE_PAGE_SIZE;
      setState((current) => ({
        ...current,
        accounts: mergeCommunityArchiveAccounts(current.accounts, page),
        error: null,
        hasMore: hasMoreRef.current,
        isLoadingMore: false,
      }));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("Failed to load more Community Archive users", error);
      setState((current) => ({
        ...current,
        error: "Failed to load more Community Archive users.",
        isLoadingMore: false,
      }));
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingMoreRef.current = false;
      }
    }
  }, [enabled, normalizedQuery]);

  return { ...state, loadMore, retry };
};
