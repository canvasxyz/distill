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
        <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
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
          <Flex align="baseline" gap="2" style={{ minWidth: 0, flex: 1 }}>
            <Text weight="bold" color={isActive ? "blue" : "gray"} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {acc.username || acc.accountDisplayName || acc.accountId}{" "}
            </Text>
            <Text size="2" color={isActive ? "blue" : "gray"} style={{ flexShrink: 0 }}>
              {numTweets} tweets · {numRetweets} retweets {acc.fromArchive && "· My archive"}
            </Text>
          </Flex>
        </Flex>
        <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
          <IconButton
            type="button"
            title="View tweets for this user"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`#/all-tweets/?account_id=${acc.accountId}`, "_blank");
            }}
            variant="solid"
            size="1"
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </IconButton>
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
              flexShrink: 0,
            }}
          >
            ×
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
};
