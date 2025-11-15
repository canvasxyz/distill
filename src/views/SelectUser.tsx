import { useEffect, useMemo, useState } from "react";
import { useStore } from "../state/store";
import { db } from "../db";
import type { ProfileWithId } from "../types";
import { UserSelectList } from "../components/UserSelectList";
import { Box, Flex, Popover, Button, Text, Avatar } from "@radix-ui/themes";

export function SelectUser({
  selectedAccountId,
  setSelectedAccountId,
}: {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string | null) => void;
}) {
  const { accounts, allTweets, removeArchive } = useStore();

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

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.accountId === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );

  const selectedProfile = selectedAccount
    ? profilesById[selectedAccount.accountId]
    : undefined;

  const selectedCounts = selectedAccount
    ? countsByAccount.get(selectedAccount.accountId) || {
        tweets: 0,
        retweets: 0,
      }
    : { tweets: 0, retweets: 0 };

  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <Box style={{ margin: "18px 0 24px" }}>
      <Popover.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <Popover.Trigger>
          <Button
            variant="soft"
            style={{
              width: "100%",
              justifyContent: "space-between",
              minHeight: "60px",
              border: selectedAccount
                ? "1px solid var(--sky-7)"
                : "1px solid var(--gray-6)",
              borderRadius: "9px",
              backgroundColor: selectedAccount
                ? "var(--sky-3)"
                : undefined,
            }}
          >
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              {selectedAccount ? (
                <>
                  {selectedProfile && selectedProfile.avatarMediaUrl ? (
                    <Avatar
                      src={selectedProfile.avatarMediaUrl}
                      alt="avatar"
                      size="2"
                      radius="full"
                      fallback={(
                        selectedAccount.username ||
                        selectedAccount.accountDisplayName ||
                        "?"
                      )
                        .toUpperCase()
                        .slice(0, 1)}
                    />
                  ) : (
                    <Avatar
                      size="2"
                      radius="full"
                      fallback={(
                        selectedAccount.username ||
                        selectedAccount.accountDisplayName ||
                        "?"
                      )
                        .toUpperCase()
                        .slice(0, 1)}
                    />
                  )}
                  <Flex
                    direction="column"
                    align="start"
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <Text
                      weight="bold"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      {selectedAccount.username ||
                        selectedAccount.accountDisplayName ||
                        selectedAccount.accountId}
                    </Text>
                    <Text size="2" color="gray">
                      {selectedCounts.tweets} tweets · {selectedCounts.retweets}{" "}
                      retweets
                      {selectedAccount.fromArchive && " · My archive"}
                    </Text>
                  </Flex>
                </>
              ) : (
                <Text>Select a user...</Text>
              )}
            </Flex>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ flexShrink: 0, color: "var(--gray-11)" }}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </Popover.Trigger>
        <Popover.Content
          style={{
            width: "var(--radix-popover-trigger-width)",
            maxHeight: "400px",
            overflowY: "auto",
            border: "none",
            boxShadow: "none",
            padding: "0",
            marginTop: "-6px",
          }}
        >
          <UserSelectList
            accounts={accounts}
            profilesById={profilesById}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            removeArchive={removeArchive}
            countsByAccount={countsByAccount}
            onSelect={() => setDropdownOpen(false)}
          />
        </Popover.Content>
      </Popover.Root>
    </Box>
  );
}
