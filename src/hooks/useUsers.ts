import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";

export type CAAccount = {
  accountId: string;
  username: string;
  numTweets: number;
  numFollowers: number;
  profile: null | {
    avatarMediaUrl: string;
  };
};

type Result = CAAccount[];

export const COMMUNITY_ARCHIVE_PAGE_SIZE = 1000;

export async function loadAllCommunityArchiveAccounts(
  loadPage: (from: number, to: number) => Promise<CAAccount[] | null>,
  pageSize = COMMUNITY_ARCHIVE_PAGE_SIZE,
  concurrency = 20,
) {
  const accounts: CAAccount[] = [];

  for (let batchStart = 0; ; batchStart += pageSize * concurrency) {
    const pages = await Promise.all(
      Array.from({ length: concurrency }, (_, index) => {
        const from = batchStart + index * pageSize;
        return loadPage(from, from + pageSize - 1);
      }),
    );

    for (const page of pages) {
      if (!page) return null;
      accounts.push(...page);
      if (page.length < pageSize) return accounts;
    }
  }
}

export const useCommunityArchiveAccounts = (enabled = true) => {
  const [accounts, setAccounts] = useState<null | Result>(null);
  const loadStarted = useRef(false);
  useEffect(() => {
    if (!enabled || accounts || loadStarted.current) return;
    loadStarted.current = true;

    async function getAccounts() {
      const data = await loadAllCommunityArchiveAccounts(async (from, to) => {
        const { data: page, error } = await supabase
          .schema("public")
          .from("all_account")
          .select(
            "account_id, username, num_tweets, num_followers, profile(avatar_media_url)",
          )
          .order("account_id", { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Failed to load Community Archive users", error);
          return null;
        }

        return page ? (mapKeysDeep(page, snakeToCamelCase) as Result) : null;
      });

      // field names in the community archive are in snake case, while the twitter archive uses camel case
      const mapped = data;

      // Always pin these users to the top of the list (in this order)
      // Exported so other components can reference the same list for UI cues.
      // Keep values case-insensitive by comparing lowercased usernames.

      if (!mapped) {
        loadStarted.current = false;
        setAccounts(null);
        return;
      }

      const pinnedRank = new Map(
        PINNED_USERNAMES.map((username, index) => [
          username.toLowerCase(),
          index,
        ]),
      );
      mapped.sort((a, b) => {
        const aRank = pinnedRank.get((a.username || "").toLowerCase());
        const bRank = pinnedRank.get((b.username || "").toLowerCase());
        if (aRank !== undefined || bRank !== undefined) {
          if (aRank === undefined) return 1;
          if (bRank === undefined) return -1;
          return aRank - bRank;
        }

        return (
          (b.numFollowers ?? 0) - (a.numFollowers ?? 0) ||
          a.accountId.localeCompare(b.accountId)
        );
      });

      setAccounts(mapped);
    }
    getAccounts();
  }, [accounts, enabled]);

  return accounts;
};

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
