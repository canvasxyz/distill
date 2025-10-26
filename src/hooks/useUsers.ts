import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { mapKeysDeep, snakeToCamelCase } from "../utils";

type CAAccount = {
  accountId: string;
  createdVia: string;
  username: string;
  createdAt: string;
  accountDisplayName: string;
  numTweets: number;
  numFollowing: number;
  numFollowers: number;
  numLikes: number;
  updatedAt: string;
  profile: {
    accountId: string;
    bio: string;
    website: string;
    location: string;
    avatarMediaUrl: string;
    headerMediaUrl: string;
    archiveUploadId: string;
    updatedAt: string;
  };
};

type Result = CAAccount[];

export const useCommunityArchiveAccounts = () => {
  const [accounts, setAccounts] = useState<null | Result>(null);
  useEffect(() => {
    async function getAccounts() {
      const { data } = await supabase
        .schema("public")
        .from("account")
        .select("*, profile(*)")
        .order("num_followers", { ascending: false });

      // field names in the community archive are in snake case, while the twitter archive uses camel case
      const mapped = data
        ? (mapKeysDeep(data, snakeToCamelCase) as Result)
        : null;

      // Always pin these users to the top of the list (in this order)
      // Exported so other components can reference the same list for UI cues.
      // Keep values case-insensitive by comparing lowercased usernames.

      if (!mapped) {
        setAccounts(null);
        return;
      }

      const byUsername = new Map(
        mapped.map((a) => [a.username?.toLowerCase() || "", a]),
      );
      const pinnedLower = new Set(PINNED_USERNAMES.map((u) => u.toLowerCase()));

      const pinnedAccounts = PINNED_USERNAMES.map((u) =>
        byUsername.get(u.toLowerCase()),
      ).filter(Boolean) as Result;
      const otherAccounts = mapped.filter(
        (a) => !pinnedLower.has((a.username || "").toLowerCase()),
      );

      setAccounts([...pinnedAccounts, ...otherAccounts]);
    }
    getAccounts();
  }, []);

  return accounts;
};

export const PINNED_USERNAMES = [
  "exgenesis",
  "IvanVendrov",
  "DefenderOfBasic",
  "Ben_Reinhardt",
  "__drewface",
  "crystalcultures",
  "bvalosek",
  "marksest",
  "erikbjareholt",
  "rhyslindmark",
];
