import type { Tweet } from "../types";
import { useStore } from "../state/store";
import { useMemo } from "react";
import { Box, Flex, Text, Link, Badge } from "@radix-ui/themes";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { accounts } = useStore();
  const account = useMemo(
    () => accounts.filter((a) => a.accountId === tweet.account_id)[0],
    [accounts, tweet],
  );

  const imageUrls = tweet.tweet_media
    ? tweet.tweet_media.map((entry) => entry.media_url)
    : [];

  return (
    <Box
      style={{
        backgroundColor: "var(--green-3)",
        border: "1px solid var(--green-6)",
        marginTop: 4,
        marginLeft: 2,
        marginRight: 2,
        marginBottom: 12,
        borderRadius: "5px",
        padding: "8px",
      }}
    >
      <Flex direction="column" gap="3" ml="2">
        {/* username */}
        <Text>
          {account?.accountDisplayName} ·{" "}
          <Link
            href={`https://x.com/${account?.username}/status/${tweet.id}`}
            target="_blank"
            color="blue"
          >
            {new Date(tweet.created_at).toLocaleString()}
          </Link>
        </Text>
        {/* tweet body */}
        <Text>&quot;{tweet.full_text}&quot;</Text>
        {/* If there are images, show them */}
        {imageUrls.length > 0 && (
          <Flex wrap="wrap" gap="2">
            {imageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt="Tweet media"
                style={{
                  maxWidth: "180px",
                  maxHeight: "180px",
                  borderRadius: "6px",
                  objectFit: "cover",
                  border: "1px solid var(--green-6)",
                  marginTop: "2px",
                }}
              />
            ))}
          </Flex>
        )}
        {/* labels */}
        <Flex gap="3">
          <Badge variant="soft" size="1" title="Favorites">
            ⭐ {tweet.favorite_count}
          </Badge>
          <Badge variant="soft" size="1" title="Retweets">
            🔁 {tweet.retweet_count}
          </Badge>
        </Flex>
      </Flex>
    </Box>
  );
}
