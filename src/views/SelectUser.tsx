import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useStore } from "../state/store";
import { db } from "../db";
import type { ProfileWithId } from "../types";
import { UserSelectList } from "../components/UserSelectList";
import { CommunityArchiveUserModal } from "../components/CommunityArchiveUserModal";
import { Box, Flex, Popover, Button, Text, Avatar } from "@radix-ui/themes";

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
    loadCommunityArchiveUser,
    loadCommunityArchiveUserProgress,
  } = useStore();

  const profiles = useLiveQuery(() => db.profiles.toArray(), [], []);
  const profilesById = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [profile.accountId, profile]),
      ) as Record<string, ProfileWithId>,
    [profiles],
  );

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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCommunityArchiveModal, setShowCommunityArchiveModal] =
    useState(false);
  const [refreshingAccountId, setRefreshingAccountId] = useState<string | null>(
    null,
  );

  const hasAccounts = accounts.length > 0;

  const refreshCommunityArchive = async (accountId: string) => {
    setRefreshingAccountId(accountId);
    try {
      await loadCommunityArchiveUser(accountId);
    } catch (error) {
      console.error("Failed to refresh community archive", error);
      window.alert("Failed to refresh this archive from Community Archive.");
    } finally {
      useStore.setState({ loadCommunityArchiveUserProgress: null });
      setRefreshingAccountId(null);
    }
  };

  const buttonContent = (
    <Button
      className="selected-person"
      variant="ghost"
      aria-label={
        selectedAccount
          ? `Change person: @${selectedAccount.username}`
          : "Choose a person"
      }
      onClick={
        !hasAccounts
          ? () => {
              setShowCommunityArchiveModal(true);
            }
          : undefined
      }
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
                className="person-name"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {selectedAccount.accountDisplayName ||
                  selectedAccount.username ||
                  selectedAccount.accountId}
              </Text>
              <Text className="person-handle">@{selectedAccount.username}</Text>
            </Flex>
          </>
        ) : (
          <Text size="2">Choose someone ↗</Text>
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
  );

  return (
    <Box>
      {hasAccounts ? (
        <Popover.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <Popover.Trigger>{buttonContent}</Popover.Trigger>
          <Popover.Content
            style={{
              width: "min(380px, calc(100vw - 32px))",
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid var(--line)",
              boxShadow: "none",
              padding: "8px",
              borderRadius: "5px",
              background: "var(--paper)",
              marginTop: "-6px",
            }}
          >
            <UserSelectList
              accounts={accounts}
              profilesById={profilesById}
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
              removeArchive={removeArchive}
              refreshCommunityArchive={refreshCommunityArchive}
              isCommunityArchiveRefreshInProgress={
                loadCommunityArchiveUserProgress !== null
              }
              refreshingAccountId={
                loadCommunityArchiveUserProgress ? refreshingAccountId : null
              }
              countsByAccount={countsByAccount}
              onSelect={() => setDropdownOpen(false)}
            />
          </Popover.Content>
        </Popover.Root>
      ) : (
        buttonContent
      )}
      <CommunityArchiveUserModal
        showModal={showCommunityArchiveModal}
        setShowModal={setShowCommunityArchiveModal}
      />
    </Box>
  );
}
