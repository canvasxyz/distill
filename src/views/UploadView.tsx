import React, { useRef } from "react";
import { useStore } from "../state/store";
import { Navigate } from "react-router";
import {
  useCommunityArchiveAccounts,
  PINNED_USERNAMES,
} from "../hooks/useUsers";
import { useMemo } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Text,
} from "@radix-ui/themes";
import { StarFilledIcon, UploadIcon } from "@radix-ui/react-icons";

export function UploadPanel() {
  const {
    ingestTwitterArchive,
    ingestTwitterArchiveProgress,
    loadCommunityArchiveUser,
    loadCommunityArchiveUserProgress,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const otherUserAccounts = useCommunityArchiveAccounts();
  const pinnedSet = useMemo(
    () => new Set(PINNED_USERNAMES.map((u) => u.toLowerCase())),
    [],
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await ingestTwitterArchive(file);
    }
  };

  const selectCommunityArchiveUser = (accountId: string) => {
    // call something in the store
    loadCommunityArchiveUser(accountId);
  };

  return (
    <Box maxWidth="768px" mx="auto" px="4" py="6">
      <Flex direction="column" gap="5">
        <Heading size="6">Open your archive</Heading>
        <Text size="2" color="gray">
          To begin, open your archive. Use the ".zip" file that you received when
          you requested your archive from Twitter/X. The Archive Explorer will only
          look at the account.js, follower.js, following.js, profile.js and
          tweet(s).js files.
        </Text>

        {ingestTwitterArchiveProgress == null ? (
          <Card
            variant="surface"
            style={{
              border: "2px dashed var(--indigo-a6)",
              backgroundColor: "var(--indigo-2)",
              cursor: "pointer",
            }}
            onClick={() => {
              fileInputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type === "application/zip") {
                await ingestTwitterArchive(file);
              }
            }}
          >
            <Flex direction="column" align="center" gap="3" py="6">
              <UploadIcon width={32} height={32} />
              <Text weight="medium" color="indigo">
                Drag and drop your Twitter archive (.zip) here or click to open.
              </Text>
              <Text size="2" color="gray">
                We will guide you through the upload.
              </Text>
            </Flex>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </Card>
        ) : (
          <Card
            variant="surface"
            style={{ padding: "24px", textAlign: "center" }}
          >
            <Text weight="medium" color="indigo">
              {ingestTwitterArchiveProgress.status === "processingArchive" &&
                "Processing archive..."}
              {ingestTwitterArchiveProgress.status === "addingAccount" &&
                "Adding account"}
              {ingestTwitterArchiveProgress.status === "addingFollowers" &&
                "Adding followers"}
              {ingestTwitterArchiveProgress.status === "addingFollowing" &&
                "Adding following"}
              {ingestTwitterArchiveProgress.status === "addingProfile" &&
                "Adding profile"}
              {ingestTwitterArchiveProgress.status === "addingTweets" &&
                "Adding tweets"}
              {ingestTwitterArchiveProgress.status === "applyingFilters" &&
                "Applying filters"}
              {ingestTwitterArchiveProgress.status === "generatingTextIndex" &&
                "Generating text index"}
            </Text>
          </Card>
        )}

        <Heading size="4">... or select a user from Community Archive</Heading>
        {loadCommunityArchiveUserProgress ? (
          <Card
            variant="surface"
            style={{ padding: "24px", textAlign: "center" }}
          >
            <Text>
              {loadCommunityArchiveUserProgress.status === "starting" &&
                "Starting download..."}
              {loadCommunityArchiveUserProgress.status === "loadingTweets" &&
                `Loading tweets... (${loadCommunityArchiveUserProgress.tweetsLoaded}/${loadCommunityArchiveUserProgress.totalNumTweets})`}
              {loadCommunityArchiveUserProgress.status === "loadingProfile" &&
                "Loading profile"}
              {loadCommunityArchiveUserProgress.status === "loadingAccount" &&
                "Loading account"}
              {loadCommunityArchiveUserProgress.status === "loadingFollower" &&
                "Loading followers"}
              {loadCommunityArchiveUserProgress.status === "loadingFollowing" &&
                "Loading following"}
              {loadCommunityArchiveUserProgress.status === "generatingTextIndex" &&
                "Generating text index"}
            </Text>
          </Card>
        ) : (
          <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
            {(otherUserAccounts || []).map((account) => {
              const isPinned = pinnedSet.has(
                (account.username || "").toLowerCase(),
              );
              return (
                <Card key={account.accountId} variant="surface">
                  <Flex align="center" justify="between" gap="3">
                    <Flex align="center" gap="3">
                      <Avatar
                        src={account.profile?.avatarMediaUrl ?? undefined}
                        size="3"
                        radius="full"
                        fallback={
                          account.username?.slice(0, 2).toUpperCase() || "?"
                        }
                      />
                      <Box>
                        <Text weight="medium">{account.username}</Text>
                        <Text size="1" color="gray">
                          {account.numTweets.toLocaleString()} tweets
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap="2">
                      {isPinned && (
                        <Badge color="amber" variant="soft" radius="full">
                          <Flex align="center" gap="1">
                            <StarFilledIcon />
                            <span>Pinned</span>
                          </Flex>
                        </Badge>
                      )}
                      <Button
                        size="2"
                        variant="solid"
                        onClick={() => selectCommunityArchiveUser(account.accountId)}
                      >
                        Select
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              );
            })}
          </Grid>
        )}
      </Flex>
    </Box>
  );
}

export function UploadView() {
  const { allTweets } = useStore();

  if (allTweets && allTweets.length > 0) {
    return <Navigate to="/" />;
  }

  return <UploadPanel />;
}
