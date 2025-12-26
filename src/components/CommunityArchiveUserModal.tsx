import { useMemo } from "react";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useStore } from "../state/store";
import { Modal } from "./Modal";
import { Grid, Flex, Avatar, Text, Button, DropdownMenu } from "@radix-ui/themes";

export const CommunityArchiveUserModal = ({
  showModal,
  setShowModal,
}: {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}) => {
  const otherUserAccounts = useCommunityArchiveAccounts();

  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );
  const { loadCommunityArchiveUser } = useStore();

  return (
    <Modal
      open={showModal}
      onClose={() => setShowModal(false)}
      title="Select a user from Community Archive"
    >
      <Grid columns="3" gap="2" mt="4" align="center">
        {(otherUserAccounts || []).map((account, idx) => {
          const isPinned = pinnedSet.has(
            (account.username || "").toLowerCase(),
          );
          return (
            <>
              <Flex key={`avatar-${idx}`} align="center" gap="2">
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
                <Text>{account.username}</Text>
              </Flex>
              <Text key={`tweets-${idx}`} style={{ textAlign: "center" }}>
                {account.numTweets.toLocaleString()}
              </Text>
              <Flex
                key={`select-${idx}`}
                justify="end"
                align="center"
                gap="2"
              >
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
                      loadCommunityArchiveUser(account.accountId, 10000);
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
            </>
          );
        })}
      </Grid>
    </Modal>
  );
};
