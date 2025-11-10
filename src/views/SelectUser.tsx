import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { IngestArchive } from "../components/IngestArchive";
import { getCommunityArchiveUserProgressLabel } from "../components/CommunityArchiveUserProgress";
import { db } from "../db";
import type { ProfileWithId } from "../types";
import { ViewTweetsButton } from "../components/ViewTweetsButton";
import { UserSelectEntry } from "../components/UserSelectEntry";
import { Box, Flex, Heading, Button } from "@radix-ui/themes";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string) => void;
}) {
  const {
    accounts,
    allTweets,
    loadCommunityArchiveUserProgress,
    removeArchive,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
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
      <Flex align="center" justify="between" gap="3" mb="2">
        <Heading size="4">Select an archive</Heading>
        <Flex align="center" gap="3">
          <IngestArchive variant="compact" />
          {loadCommunityArchiveUserProgress ? (
            <Button disabled variant="soft" color="gray">
              {getCommunityArchiveUserProgressLabel(
                loadCommunityArchiveUserProgress,
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              color="blue"
            >
              Select from Community Archive
            </Button>
          )}
        </Flex>
      </Flex>
      <Flex direction="column" gap="2">
        {accounts.map((acc) => (
          <Flex key={acc.accountId} gap="3">
            <UserSelectEntry
              acc={acc}
              profile={profilesById[acc.accountId]}
              onClick={() => setSelectedAccountId(acc.accountId)}
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

            <ViewTweetsButton account={acc} />
          </Flex>
        ))}
      </Flex>

      <CommunityArchiveUserModal
        showModal={showModal}
        setShowModal={setShowModal}
      />
    </Box>
  );
}
