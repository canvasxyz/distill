import type { Account, Profile } from "../types";
import { Box, Flex, Text, IconButton, Avatar } from "@radix-ui/themes";
import { UpdateIcon } from "@radix-ui/react-icons";

export const UserSelectEntry = ({
  acc,
  profile,
  isActive,
  onClick,
  onClickRemove,
  onClickRefresh,
  isRefreshing,
  isRefreshDisabled,
  numTweets,
  numRetweets,
}: {
  acc: Account;
  profile?: Profile;
  isActive: boolean;
  onClick: () => void;
  onClickRemove: () => void;
  onClickRefresh?: () => void | Promise<void>;
  isRefreshing: boolean;
  isRefreshDisabled: boolean;
  numTweets: number;
  numRetweets: number;
}) => {
  return (
    <Box
      key={acc.accountId}
      p="2"
      style={{
        flexGrow: "1",
        backgroundColor: isActive ? "var(--soft)" : "var(--paper)",
        border: isActive ? "1px solid var(--muted)" : "1px solid var(--line)",
        borderRadius: "4px",
      }}
    >
      <Flex align="center" justify="between" gap="3">
        <button
          className="person-option"
          onClick={onClick}
          aria-pressed={isActive}
          aria-label={`Select @${acc.username}`}
        >
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
              {acc.username || acc.accountDisplayName || acc.accountId}
            </Text>
            <Text size="2" color="gray">
              {numTweets} tweets · {numRetweets} retweets
              {acc.fromArchive && " · My archive"}
            </Text>
          </Flex>
        </button>
        <Flex align="center" gap="3" pr="1" style={{ flexShrink: 0 }}>
          <IconButton
            type="button"
            title="Remove archive"
            aria-label={`Remove @${acc.username} archive`}
            onClick={async (e) => {
              e.stopPropagation();
              onClickRemove();
            }}
            variant="ghost"
            size="1"
            style={{ flexShrink: 0 }}
          >
            &nbsp;×&nbsp;
          </IconButton>
          {onClickRefresh && (
            <IconButton
              type="button"
              title={
                isRefreshing
                  ? "Refreshing archive from Community Archive"
                  : isRefreshDisabled
                    ? "Another archive is refreshing from Community Archive"
                    : "Refresh archive from Community Archive"
              }
              aria-label="Refresh archive from Community Archive"
              onClick={(e) => {
                e.stopPropagation();
                if (isRefreshDisabled) return;
                void onClickRefresh();
              }}
              disabled={isRefreshDisabled}
              variant="ghost"
              size="1"
              style={{
                width: "24px",
                height: "24px",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <UpdateIcon />
            </IconButton>
          )}
          <IconButton
            type="button"
            title="View tweets for this user"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `#/all-tweets/?account_id=${acc.accountId}`,
                "_blank",
              );
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
        </Flex>
      </Flex>
    </Box>
  );
};
