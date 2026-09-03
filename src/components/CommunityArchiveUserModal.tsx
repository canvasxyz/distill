import { Fragment, useEffect, useMemo, useState } from "react";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useStore } from "../state/store";
import { Modal } from "./Modal";
import {
  Avatar,
  Box,
  Button,
  DropdownMenu,
  Flex,
  Grid,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";

const SEARCH_DEBOUNCE_MS = 250;

function HighlightedUsername({
  username,
  query,
}: {
  username: string;
  query: string;
}) {
  const matchStart = username.toLowerCase().indexOf(query.toLowerCase());
  if (!query || matchStart === -1) return username;

  const matchEnd = matchStart + query.length;
  return (
    <>
      {username.slice(0, matchStart)}
      <mark
        style={{
          background: "var(--amber-5)",
          color: "inherit",
          borderRadius: 2,
          padding: 0,
        }}
      >
        {username.slice(matchStart, matchEnd)}
      </mark>
      {username.slice(matchEnd)}
    </>
  );
}

export const CommunityArchiveUserModal = ({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { accounts, error, hasMore, isLoading, isLoadingMore, loadMore } =
    useCommunityArchiveAccounts(showModal, debouncedQuery);

  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );
  const { loadCommunityArchiveUser } = useStore();
  const normalizedQuery = query.trim().toLowerCase();
  const isSearchPending = normalizedQuery !== debouncedQuery.toLowerCase();

  return (
    <Modal
      open={showModal}
      onClose={() => setShowModal(false)}
      title="Select a user from Community Archive"
    >
      <Flex direction="column" gap="3">
        <TextField.Root
          aria-label="Search Community Archive users"
          placeholder="Search by username…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        {isLoading || isSearchPending ? (
          <Flex align="center" justify="center" gap="2" py="6">
            <Spinner />
            <Text color="gray">
              {normalizedQuery ? "Searching users…" : "Loading users…"}
            </Text>
          </Flex>
        ) : accounts.length === 0 ? (
          <Box py="6" style={{ textAlign: "center" }}>
            <Text color="gray">
              {error
                ? error
                : normalizedQuery
                  ? `No usernames match “${query.trim()}”.`
                  : "No users found."}
            </Text>
          </Box>
        ) : (
          <>
            <Text size="1" color="gray">
              {accounts.length.toLocaleString()} users loaded
              {normalizedQuery && " matching your search"}
            </Text>
            <Box
              style={{ maxHeight: "min(60vh, 560px)", overflowY: "auto" }}
              onScroll={(event) => {
                const element = event.currentTarget;
                if (
                  element.scrollHeight -
                    element.scrollTop -
                    element.clientHeight <
                  100
                ) {
                  void loadMore();
                }
              }}
            >
              <Grid columns="3" gap="2" align="center" pr="2">
                {accounts.map((account) => {
                  const isPinned = pinnedSet.has(
                    (account.username || "").toLowerCase(),
                  );
                  return (
                    <Fragment key={account.accountId}>
                      <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                        {account.profile && account.profile.avatarMediaUrl ? (
                          <Avatar
                            src={account.profile.avatarMediaUrl}
                            size="2"
                            radius="full"
                            fallback="?"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://www.community-archive.org/_next/image?url=%2Fplaceholder.jpg&w=3840&q=75";
                            }}
                          />
                        ) : (
                          <Avatar size="2" radius="full" fallback="?" />
                        )}
                        <Text style={{ overflowWrap: "anywhere" }}>
                          <HighlightedUsername
                            username={account.username}
                            query={query.trim()}
                          />
                        </Text>
                      </Flex>
                      <Text style={{ textAlign: "center" }}>
                        {account.numTweets?.toLocaleString() ?? "—"}
                      </Text>
                      <Flex justify="end" align="center" gap="2">
                        {isPinned && (
                          <Text
                            title="Pinned"
                            aria-label="Pinned account"
                            color="amber"
                            size="2"
                          >
                            ★
                          </Text>
                        )}
                        <Flex gap="0" style={{ position: "relative" }}>
                          <Button
                            size="2"
                            color="blue"
                            onClick={() => {
                              loadCommunityArchiveUser(
                                account.accountId,
                                10000,
                              );
                              setShowModal(false);
                            }}
                            style={{
                              borderTopRightRadius: 0,
                              borderBottomRightRadius: 0,
                              borderRight: "1px solid var(--blue-8)",
                              height: 31,
                            }}
                          >
                            Select
                          </Button>
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                              <Button
                                size="2"
                                color="blue"
                                style={{
                                  borderTopLeftRadius: 0,
                                  borderBottomLeftRadius: 0,
                                  paddingLeft: "8px",
                                  paddingRight: "8px",
                                  minWidth: "28px",
                                  height: 31,
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M3 4.5L6 7.5L9 4.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                              <DropdownMenu.Item
                                onClick={() => {
                                  loadCommunityArchiveUser(account.accountId);
                                  setShowModal(false);
                                }}
                              >
                                Select full history
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        </Flex>
                      </Flex>
                    </Fragment>
                  );
                })}
              </Grid>
              {hasMore && (
                <Flex justify="center" py="3">
                  <Button
                    type="button"
                    variant="soft"
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                  >
                    {isLoadingMore ? (
                      <>
                        <Spinner /> Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </Flex>
              )}
              {error && (
                <Text
                  as="p"
                  size="1"
                  color="red"
                  align="center"
                  style={{ padding: "8px 0" }}
                >
                  {error}
                </Text>
              )}
            </Box>
          </>
        )}
      </Flex>
    </Modal>
  );
};
