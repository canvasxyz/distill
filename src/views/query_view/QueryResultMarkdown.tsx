import { useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
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

type ContentSegment =
  | { type: "content"; text: string }
  | { type: "think"; text: string };

const formatTweetTimestamp = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const linkifyText = (text: string): ReactNode => {
  // Regex patterns for URLs and @mentions
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const mentionPattern = /(@\w+)/g;

  // Combine patterns to match both URLs and mentions
  const combinedPattern = /(https?:\/\/[^\s]+)|(@\w+)/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];

    if (matchedText.startsWith('http')) {
      // It's a URL
      parts.push(
        <a
          key={match.index}
          href={matchedText}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.startsWith('@')) {
      // It's a mention
      const username = matchedText.slice(1); // Remove the @
      parts.push(
        <a
          key={match.index}
          href={`https://x.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    }

    lastIndex = combinedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
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
          {linkifyText(tweet.full_text)}
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

const splitThinkingSegments = (input: string): ContentSegment[] => {
  const segments: ContentSegment[] = [];
  const regex = /<think>([\s\S]*?)<\/think>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      const preceding = input.slice(lastIndex, match.index);
      if (preceding.trim().length > 0) {
        segments.push({ type: "content", text: preceding });
      }
    }
    const thinkText = match[1];
    if (thinkText && thinkText.trim().length > 0) {
      segments.push({ type: "think", text: thinkText });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    const remaining = input.slice(lastIndex);
    if (remaining.trim().length > 0) {
      segments.push({ type: "content", text: remaining });
    }
  }

  if (segments.length === 0 && input.trim().length > 0) {
    return [{ type: "content", text: input }];
  }

  return segments;
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
  const segments = useMemo(() => splitThinkingSegments(content), [content]);
  const [collapsedThinking, setCollapsedThinking] = useState<Set<number>>(() => {
    // Start with all thinking traces collapsed
    const thinkingIndices = new Set<number>();
    segments.forEach((segment, idx) => {
      if (segment.type === "think") {
        thinkingIndices.add(idx);
      }
    });
    return thinkingIndices;
  });

  const toggleThinking = (idx: number) => {
    setCollapsedThinking((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

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
      {segments.map((segment, idx) =>
        segment.type === "think" ? (
          <div
            className={`thinking-trace ${collapsedThinking.has(idx) ? "collapsed" : ""}`}
            key={`think-${idx}`}
            onClick={() => toggleThinking(idx)}
          >
            <div className="thinking-trace-header">
              <span className="thinking-trace-toggle">
                {collapsedThinking.has(idx) ? "▶" : "▼"}
              </span>
              <span className="thinking-trace-label">Thinking</span>
            </div>
            {!collapsedThinking.has(idx) && (
              <div className="thinking-trace-content">
                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {segment.text}
                </Markdown>
              </div>
            )}
          </div>
        ) : (
          <Markdown
            key={`content-${idx}`}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {segment.text}
          </Markdown>
        ),
      )}
    </div>
  );
}
