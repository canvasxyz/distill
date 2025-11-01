import { Badge, Card, Flex, Link, Text } from "@radix-ui/themes";
import type { Tweet } from "../types";
import { useStore } from "../state/store";

export function TweetEntry({ tweet }: { tweet: Tweet }) {
  const { account } = useStore();

  return (
    <Card
      variant="surface"
      style={{
        margin: "8px 0",
        borderColor: "var(--green-a5)",
        backgroundColor: "var(--green-2)",
      }}
    >
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2" wrap="wrap">
          <Text weight="medium">{account?.accountDisplayName}</Text>
          <Text color="gray">·</Text>
          <Link
            href={`https://x.com/${account?.username}/status/${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            color="indigo"
          >
            {new Date(tweet.created_at).toLocaleString()}
          </Link>
        </Flex>
        <Text as="p" style={{ whiteSpace: "pre-wrap" }}>
          “{tweet.full_text}”
        </Text>
        <Flex gap="2" wrap="wrap">
          <Badge size="2" radius="full" color="green" variant="soft">
            ⭐ {tweet.favorite_count}
          </Badge>
          <Badge size="2" radius="full" color="indigo" variant="soft">
            🔁 {tweet.retweet_count}
          </Badge>
        </Flex>
      </Flex>
    </Card>
  );
}
