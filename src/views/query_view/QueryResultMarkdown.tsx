import { useMemo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import Markdown from "react-markdown";
import type { ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { HoverCard, Text, Flex } from "@radix-ui/themes";
import type { Tweet } from "../../types";
import {
  extractTweetIdFromUrl,
  TWEET_STATUS_URL_REGEX,
  formatCompactNumber,
} from "../../utils";

type MarkdownLinkProps = ComponentPropsWithoutRef<"a"> & ExtraProps;

const formatTweetTimestamp = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const TweetPreviewCard = ({
  tweet,
  username,
}: {
  tweet: Tweet | null;
  username?: string | null;
}) => {
  if (!tweet) {
    return (
      <div className="tweet-citation-card">
        <Text size="2" weight="medium">
          Tweet unavailable
        </Text>
        <Text size="1" color="gray">
          <br />
          This citation points to a tweet that was not included in your archive.
        </Text>
      </div>
    );
  }

  const likes = Number(tweet.favorite_count || 0);
  const retweets = Number(tweet.retweet_count || 0);

  return (
    <div className="tweet-citation-card">
      <Flex direction="column" gap="1">
        <Text size="2" weight="bold">
          {username ? `@${username}` : "Tweet"}
        </Text>
        <Text size="1" color="gray">
          {formatTweetTimestamp(tweet.created_at)}
        </Text>
        <Text as="p" size="2" className="tweet-citation-card__text">
          {tweet.full_text}
        </Text>
        <Flex gap="3" className="tweet-citation-card__stats">
          <Text size="1" color="gray">
            ❤️ {formatCompactNumber(likes)}
          </Text>
          <Text size="1" color="gray">
            🔁 {formatCompactNumber(retweets)}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
};

const getChildText = (children: ReactNode): string => {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return "";
  }
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map((child) => getChildText(child)).join("");
  }
  return "";
};

const isTweetCitationLink = (text: string, href?: string) => {
  if (!href) return false;
  return /^\d+$/.test(text.trim()) && TWEET_STATUS_URL_REGEX.test(href);
};

type Props = {
  content: string;
  tweetsById: Map<string, Tweet>;
  accountIdToUsername: Map<string, string>;
};

export function QueryResultMarkdown({
  content,
  tweetsById,
  accountIdToUsername,
}: Props) {
  const markdownComponents = useMemo(
    () => ({
      a: (props: MarkdownLinkProps) => {
        const { children, href, className, node, ...rest } = props;
        void node;
        const anchorProps = rest as ComponentPropsWithoutRef<"a">;
        const childText = getChildText(children);
        if (childText && isTweetCitationLink(childText, href)) {
          const tweetId = href ? extractTweetIdFromUrl(href) : null;
          const citationTweet = (tweetId && tweetsById.get(tweetId)) || null;
          const username = citationTweet
            ? accountIdToUsername.get(citationTweet.account_id) || null
            : null;
          const citationClassNames = [
            "tweet-citation",
            !citationTweet && "tweet-citation--invalid",
            className,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <HoverCard.Root openDelay={150} closeDelay={75}>
              <HoverCard.Trigger>
                <a
                  {...anchorProps}
                  href={href}
                  className={citationClassNames}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              </HoverCard.Trigger>
              <HoverCard.Content
                className="tweet-citation-hovercard"
                sideOffset={10}
                collisionPadding={16}
              >
                <TweetPreviewCard tweet={citationTweet} username={username} />
              </HoverCard.Content>
            </HoverCard.Root>
          );
        }
        return (
          <a
            {...anchorProps}
            href={href}
            className={className}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        );
      },
    }),
    [accountIdToUsername, tweetsById],
  );

  return (
    <div className="query-result-markdown">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </Markdown>
    </div>
  );
}
