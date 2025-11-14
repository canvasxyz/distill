import { useState } from "react";
import type { Account, Profile } from "../types";
import { Box, Flex, Text, IconButton, Avatar } from "@radix-ui/themes";

export const UserSelectEntry = ({
  acc,
  profile,
  isActive,
  onClick,
  onClickRemove,
  numTweets,
  numRetweets,
}: {
  acc: Account;
  profile?: Profile;
  isActive: boolean;
  onClick: () => void;
  onClickRemove: () => void;
  numTweets: number;
  numRetweets: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      key={acc.accountId}
      onClick={onClick}
      p="3"
      style={{
        cursor: isActive ? "default" : "pointer",
        flexGrow: "1",
        backgroundColor: isActive ? "var(--sky-3)" : undefined,
        border: isActive
          ? "1px solid var(--sky-7)"
          : "1px solid var(--gray-6)",
        borderRadius: "6px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="3">
          {profile && profile.avatarMediaUrl ? (
            <Avatar
              src={profile.avatarMediaUrl}
              alt="avatar"
              size="2"
              radius="full"
              fallback={(acc.username || acc.accountDisplayName || "?")
                .toUpperCase()
                .slice(0, 1)}
            />
          ) : (
            <Avatar
              size="2"
              radius="full"
              fallback={(acc.username || acc.accountDisplayName || "?")
                .toUpperCase()
                .slice(0, 1)}
            />
          )}
          <Flex align="baseline" gap="2">
            <Text weight="bold" color={isActive ? "blue" : "gray"}>
              {acc.username || acc.accountDisplayName || acc.accountId}{" "}
              {acc.fromArchive && "(My archive)"}
            </Text>
            <Text size="2" color={isActive ? "blue" : "gray"}>
              {numTweets} tweets · {numRetweets} retweets
            </Text>
          </Flex>
        </Flex>
        <IconButton
          type="button"
          title="Remove archive"
          onClick={async (e) => {
            e.stopPropagation();
            onClickRemove();
          }}
          variant="ghost"
          size="1"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
          }}
        >
          ×
        </IconButton>
      </Flex>
    </Box>
  );
};
