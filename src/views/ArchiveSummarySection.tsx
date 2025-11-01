import { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Card, Flex, Text } from "@radix-ui/themes";
import { useStore } from "../state/store";

export function ArchiveSummarySection() {
  const { account, allTweets, profile } = useStore();
  const [showProfilePicture, setShowProfilePicture] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetch(profile.avatarMediaUrl).then((response) => {
      if (response.status === 200) setShowProfilePicture(true);
    });
  }, [profile]);

  const { totalTweetsCount, originalTweetsCount, repliesCount, retweetsCount } =
    useMemo(() => {
      const tweets = allTweets || [];
      let replies = 0;
      let retweets = 0;

      for (const tweet of tweets) {
        if (tweet.in_reply_to_user_id) {
          replies += 1;
          continue;
        }

        const text = tweet.full_text || "";
        if (text.trim().toUpperCase().startsWith("RT ")) {
          retweets += 1;
        }
      }

      const total = tweets.length;
      const original = Math.max(total - replies - retweets, 0);

      return {
        totalTweetsCount: total,
        originalTweetsCount: original,
        repliesCount: replies,
        retweetsCount: retweets,
      };
    }, [allTweets]);

  if (!account) {
    return null;
  }

  const avatarFallback = account.accountDisplayName
    ? account.accountDisplayName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "@";

  return (
    <Card
      variant="surface"
      style={{
        background: "var(--indigo-2)",
        borderRadius: "var(--radius-5)",
        boxShadow: "0 8px 24px rgba(30, 60, 160, 0.12)",
        padding: "20px",
      }}
    >
      <Flex direction="column" align="center" gap="3">
        <Avatar
          size="5"
          radius="full"
          src={showProfilePicture ? profile?.avatarMediaUrl ?? undefined : undefined}
          fallback={avatarFallback}
        />
        <Box style={{ textAlign: "center" }}>
          <Text weight="bold" size="4" color="indigo">
            {account.accountDisplayName}
          </Text>
          <Text size="2" color="gray">
            @{account.username}
          </Text>
        </Box>
        <Flex direction="column" align="center" gap="1">
          <Text size="2" color="gray">
            Total tweets: <Text as="span" weight="medium">{totalTweetsCount.toLocaleString()}</Text>
          </Text>
          <Flex align="center" gap="3">
            <Text size="1" color="gray">
              Originals: <Text as="span" weight="medium">{originalTweetsCount.toLocaleString()}</Text>
            </Text>
            <Text size="1" color="gray">
              Replies: <Text as="span" weight="medium">{repliesCount.toLocaleString()}</Text>
            </Text>
            <Text size="1" color="gray">
              Retweets: <Text as="span" weight="medium">{retweetsCount.toLocaleString()}</Text>
            </Text>
          </Flex>
        </Flex>
        {account.createdAt && (
          <Text size="1" color="gray">
            Since {new Date(account.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        )}
      </Flex>
    </Card>
  );
}
