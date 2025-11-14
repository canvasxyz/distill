import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { db } from "../db";
import type { ProfileWithId } from "../types";
import { UserSelectEntry } from "../components/UserSelectEntry";
import { Box, Flex } from "@radix-ui/themes";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string | null) => void;
}) {
  const {
    accounts,
    allTweets,
    removeArchive,
  } = useStore();

  const [profilesById, setProfilesById] = useState<
    Record<string, ProfileWithId>
  >({});

  useEffect(() => {
    let cancelled = false;
    const loadProfiles = async () => {
      const profiles = await db.profiles.toArray();
      if (!cancelled) {
        const map: Record<string, ProfileWithId> = {};
        for (const p of profiles) map[p.accountId] = p;
        setProfilesById(map);
      }
    };
    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, []);

  const countsByAccount = useMemo(() => {
    const map = new Map<string, { tweets: number; retweets: number }>();
    for (const t of allTweets) {
      const accId = t.account_id;
      const isRt = t.full_text && t.full_text.trim().startsWith("RT @");
      const prev = map.get(accId) || { tweets: 0, retweets: 0 };
      if (isRt) prev.retweets += 1;
      else prev.tweets += 1;
      map.set(accId, prev);
    }
    return map;
  }, [allTweets]);

  return (
    <Box>
      <Flex direction="column" gap="2" style={{ margin: "18px 0 24px" }}>
        {accounts.map((acc) => (
          <UserSelectEntry
            key={acc.accountId}
            acc={acc}
            profile={profilesById[acc.accountId]}
            onClick={() => {
              if (selectedAccountId === acc.accountId) {
                setSelectedAccountId(null);
              } else {
                setSelectedAccountId(acc.accountId);
              }
            }}
            onClickRemove={async () => {
              const ok = window.confirm(
                "Remove this archive? This will delete the locally stored tweets and profile for this account.",
              );
              if (!ok) return;

              const idx = accounts.findIndex(
                (a) => a.accountId === acc.accountId,
              );
              const next =
                (idx >= 0 && accounts[idx + 1]) ||
                (idx > 0 && accounts[idx - 1]) ||
                null;

              await removeArchive(acc.accountId);

              if (selectedAccountId === acc.accountId && next?.accountId) {
                setSelectedAccountId(next.accountId);
              }
            }}
            isActive={
              selectedAccountId ? acc.accountId === selectedAccountId : false
            }
            numTweets={
              (countsByAccount.get(acc.accountId) || { tweets: 0 }).tweets
            }
            numRetweets={
              (countsByAccount.get(acc.accountId) || { retweets: 0 }).retweets
            }
          />
        ))}
      </Flex>
    </Box>
  );
}
