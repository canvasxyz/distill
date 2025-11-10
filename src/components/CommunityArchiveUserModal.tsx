import { useMemo } from "react";
import {
  PINNED_USERNAMES,
  useCommunityArchiveAccounts,
} from "../hooks/useUsers";
import { useStore } from "../state/store";
import { Modal } from "./Modal";
import { Grid, Flex, Avatar, Text, Button } from "@radix-ui/themes";

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
                    onError={(e) =>
                      // @ts-expect-error "..."
                      (e.target.src =
                        "https://www.community-archive.org/_next/image?url=%2Fplaceholder.jpg&w=3840&q=75")
                    }
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
                <Button
                  size="2"
                  color="blue"
                  onClick={() => {
                    loadCommunityArchiveUser(account.accountId);
                    setShowModal(false);
                  }}
                >
                  Select
                </Button>
              </Flex>
            </>
          );
        })}
      </Grid>
    </Modal>
  );
};
