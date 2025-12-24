import {
  type RangeSelection,
  replaceAccountName,
  selectSubset,
} from "./ai_utils";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { useStore } from "../../state/store";
import { RunQueryButton } from "./RunQueryButton";
import {
  ProgressBar,
  ProgressLabel,
  ResultsBox,
  QueryResultHeader,
} from "./ResultsBox";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import {
  EXAMPLE_QUERIES_SINGULAR,
  FEATURED_QUERIES_SINGULAR,
  type FeaturedQuery,
} from "./example_queries";
import Markdown from "react-markdown";
import type { ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTweetCounts } from "./useTweetCounts";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import { BatchTweetsModal } from "./BatchTweetsModal";
import { getBatchSizeForConfig, type PromptPlacement } from "../../constants";
import {
  stripThink,
  TWEET_STATUS_URL_REGEX,
  extractTweetIdFromUrl,
} from "../../utils";
import { AVAILABLE_LLM_CONFIGS } from "../../state/llm_query";
import { FeaturedQueryCard } from "../../components/FeaturedQueryCard";
import { BrowseMoreButton } from "../../components/BrowseMoreButton";
import { SelectUser } from "../SelectUser";
import {
  Box,
  Flex,
  TextArea,
  Select,
  Checkbox,
  RadioGroup,
  Text,
  Grid,
  Button,
  Callout,
  Separator,
  HoverCard,
} from "@radix-ui/themes";
import type { Tweet } from "../../types";

type MarkdownLinkProps = ComponentPropsWithoutRef<"a"> & ExtraProps;

const formatCompactNumber = (n: number) => {
  try {
    const s = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
    return s.replace("K", "k").replace("M", "m").replace("G", "g");
  } catch {
    if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}m`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
    return String(n);
  }
};

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
          <br/>This citation points to a tweet that was not included in your archive.
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

export function RunQueries() {
  const [exampleQueriesModalIsOpen, setExampleQueriesModalIsOpen] =
    useState(false);
  const [selectedQuery, setSelectedQuery] = useState("");

  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const promptPlacement: PromptPlacement = "prompt-before";

  const {
    accounts,
    allTweets,
    submit,
    batchStatuses,
    isProcessing,
    startedProcessingTime,
    currentRunningQuery,
    queryResult,
    errorMessage,
    selectedConfigIndex,
    setSelectedConfigIndex,
    lastLoadedAccountId,
  } = useStore();

  const selectedConfig = useMemo(
    () =>
      AVAILABLE_LLM_CONFIGS[selectedConfigIndex] || AVAILABLE_LLM_CONFIGS[0],
    [selectedConfigIndex],
  );

  const batchSize = useMemo(
    () => getBatchSizeForConfig(selectedConfig),
    [selectedConfig],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const account = useMemo(
    () => accounts.filter((a) => a.accountId === selectedAccountId)[0] || null,

    [accounts, selectedAccountId],
  );
  const accountUsername = account?.username ?? null;

  const accountIdToUsername = useMemo(() => {
    return new Map<string, string>(
      (accounts || []).map((a) => [a.accountId, a.username]),
    );
  }, [accounts]);

  const tweetsById = useMemo(() => {
    const map = new Map<string, Tweet>();
    (allTweets || []).forEach((tweet) => {
      if (tweet.id) map.set(tweet.id, tweet);
      if (tweet.id_str) map.set(tweet.id_str, tweet);
    });
    return map;
  }, [allTweets]);

  const hasReplies = useMemo(
    () => (allTweets || []).some((t) => Boolean(t.in_reply_to_user_id)),
    [allTweets],
  );
  const hasRetweets = useMemo(
    () => (allTweets || []).some((t) => t.full_text.startsWith("RT ")),
    [allTweets],
  );

  // Keep UI state intuitive: if none exist, ensure toggles are off
  useEffect(() => {
    if (!hasReplies && includeReplies) setIncludeReplies(false);
  }, [hasReplies, includeReplies]);
  useEffect(() => {
    if (!hasRetweets && includeRetweets) setIncludeRetweets(false);
  }, [hasRetweets, includeRetweets]);

  const filteredTweetsToAnalyse = useMemo(
    () =>
      (allTweets || []).filter((tweet) => {
        if (tweet.account_id !== selectedAccountId) {
          return false;
        }

        if (!includeReplies && tweet.in_reply_to_user_id) {
          return false;
        }
        if (!includeRetweets && tweet.full_text.startsWith("RT ")) {
          return false;
        }
        return true;
      }),
    [allTweets, selectedAccountId, includeReplies, includeRetweets],
  );

  const tweetCounts = useTweetCounts(filteredTweetsToAnalyse);

  const [rangeSelection, setRangeSelection] = useState<RangeSelection>({
    type: "last-tweets",
    numTweets: batchSize,
  });

  const lastTweetsCount =
    rangeSelection.type === "last-tweets" ? rangeSelection.numTweets : null;

  useEffect(() => {
    if (
      rangeSelection.type === "last-tweets" &&
      lastTweetsCount !== batchSize
    ) {
      setRangeSelection({ type: "last-tweets", numTweets: batchSize });
    }
  }, [batchSize, lastTweetsCount, rangeSelection.type]);

  const [currentProgress, totalProgress] = useMemo(() => {
    if (batchStatuses === null) return [0, 1];
    const currentProgress = Object.values(batchStatuses).filter(
      (status) => status.status === "done",
    ).length;
    const totalProgress = Object.values(batchStatuses).length;
    return [currentProgress, totalProgress];
  }, [batchStatuses]);

  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  const handleRunQuery = (queryText: string) => {
    if (!account || queryText === "" || queryText.trim() === "") return;

    submit(
      filteredTweetsToAnalyse,
      account,
      queryText,
      rangeSelection,
      promptPlacement,
    );
  };

  const tweetsSelectedForQuery = useMemo(() => {
    return selectSubset(filteredTweetsToAnalyse, rangeSelection);
  }, [filteredTweetsToAnalyse, rangeSelection]);

  const batchCount = useMemo(() => {
    if (tweetsSelectedForQuery.length === 0) return 0;
    return 1;
  }, [tweetsSelectedForQuery]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevUsernameRef = useRef<string | null>(null);
  const lastAutoSelectedAccountIdRef = useRef<string | null>(null);
  const hasRestoredFromStorageRef = useRef(false);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  useEffect(() => {
    if (!account) return;
    if (!selectedQuery) return;
    textareaRef.current?.focus();
  }, [account, selectedQuery]);

  // When switching between archives, replace mentions of the previous
  // account's handle with the new account's handle in the current query.
  // Only replace exact handle matches (case-insensitive) when followed by
  // whitespace to avoid matching larger substrings.
  useEffect(() => {
    const newUsername = accountUsername;
    const prevUsername = prevUsernameRef.current;
    if (
      newUsername &&
      prevUsername &&
      newUsername.toLowerCase() !== prevUsername.toLowerCase() &&
      selectedQuery
    ) {
      const prevHandle = `@${prevUsername}`;
      const newHandle = `@${newUsername}`;
      const pattern = new RegExp(`${escapeRegExp(prevHandle)}(?=\\s)`, "gi");
      const replaced = selectedQuery.replace(pattern, newHandle);
      if (replaced !== selectedQuery) setSelectedQuery(replaced);
    }
    prevUsernameRef.current = newUsername;
  }, [accountUsername, selectedQuery]);

  // Utility: only persist queries that don't reference a different @handle
  const shouldPersistQuery = (text: string, currentHandle: string) => {
    if (!text) return true;
    const handles = (text.match(/@[A-Za-z0-9_]{1,15}/g) || []).map((h) =>
      h.toLowerCase(),
    );
    if (handles.length === 0) return true;
    const uniq = new Set(handles);
    uniq.delete(currentHandle.toLowerCase());
    return uniq.size === 0; // persist only if remaining set is empty
  };

  // Restore last query from localStorage when account is available
  useEffect(() => {
    if (!account) return;
    try {
      const saved = localStorage.getItem("llm:lastQuery");
      const currentHandle = `@${account.username}`.toLowerCase();
      if (saved && shouldPersistQuery(saved, currentHandle)) {
        setSelectedQuery((prev) => (prev ? prev : saved));
      }
    } catch {
      // ignore storage errors
    }
  }, [account]);

  // Persist query text changes to localStorage when valid for this account
  useEffect(() => {
    if (!account) return;
    try {
      const currentHandle = `@${account.username}`.toLowerCase();
      if (shouldPersistQuery(selectedQuery, currentHandle)) {
        localStorage.setItem("llm:lastQuery", selectedQuery || "");
      }
      // else: do not persist queries mentioning other handles
    } catch {
      // ignore storage errors
    }
  }, [selectedQuery, account]);

  // Persist selected account ID to localStorage
  useEffect(() => {
    if (selectedAccountId) {
      try {
        localStorage.setItem("llm:lastSelectedAccountId", selectedAccountId);
      } catch {
        // ignore storage errors
      }
    }
  }, [selectedAccountId]);

  // Restore last selected account from localStorage after accounts are loaded
  useEffect(() => {
    if (
      hasRestoredFromStorageRef.current ||
      selectedAccountId !== null ||
      accounts.length === 0
    ) {
      return;
    }

    try {
      const savedAccountId = localStorage.getItem("llm:lastSelectedAccountId");
      if (
        savedAccountId &&
        accounts.some((a) => a.accountId === savedAccountId)
      ) {
        setSelectedAccountId(savedAccountId);
        hasRestoredFromStorageRef.current = true;
      }
    } catch {
      // ignore storage errors
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  // Automatically select newly loaded archive
  useEffect(() => {
    if (
      lastLoadedAccountId &&
      lastLoadedAccountId !== lastAutoSelectedAccountIdRef.current &&
      accounts.some((a) => a.accountId === lastLoadedAccountId)
    ) {
      setSelectedAccountId(lastLoadedAccountId);
      lastAutoSelectedAccountIdRef.current = lastLoadedAccountId;
      hasRestoredFromStorageRef.current = true; // Prevent restoring from storage after auto-selecting new archive
    }
  }, [lastLoadedAccountId, accounts, setSelectedAccountId]);

  const totalPostsCount = filteredTweetsToAnalyse.length;
  const lastTweetsLabel =
    totalPostsCount < batchSize ? (
      <>All posts</>
    ) : (
      <>Most recent {formatCompactNumber(batchSize)}</>
    );

  return (
    <Box style={{ maxWidth: "800px", margin: "auto", width: "100%", boxSizing: "border-box", padding: "0 16px" }}>
      <Flex direction="column" gap="3" pb="5">
        <Box mt="6">
          <SelectUser
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
          />
        </Box>
        <Box>
          <TextArea
            ref={textareaRef}
            value={selectedQuery}
            disabled={isProcessing || !account}
            onChange={(e) => setSelectedQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              if (!event.metaKey) return;
              event.preventDefault();
              if (isProcessing) return;
              handleRunQuery(selectedQuery);
            }}
            placeholder={
              account ? "Type your query here..." : "Select a user to query..."
            }
            size="3"
            rows={3}
            style={{ minHeight: "60px" }}
          />
        </Box>
        <Flex align="center" gap="3" mb="3">
          <RunQueryButton
            disabled={isProcessing || !account}
            onClick={() => {
              handleRunQuery(selectedQuery);
            }}
            showShortcut
          />
          <Flex align="center" gap="4" ml="1">
            <RadioGroup.Root
              value={rangeSelection.type}
              onValueChange={(value) => {
                if (value === "last-tweets") {
                  setRangeSelection({
                    type: "last-tweets",
                    numTweets: batchSize,
                  });
                } else if (value === "date-range") {
                  setRangeSelection({
                    type: "date-range",
                    startDate: "",
                    endDate: "",
                  });
                }
              }}
              disabled={isProcessing || !account}
            >
              <Flex gap="2">
                <Text size="2" as="label">
                  <Flex align="center" gap="2" style={{ textWrap: "nowrap" }}>
                    <RadioGroup.Item value="last-tweets" />
                    {lastTweetsLabel}
                  </Flex>
                </Text>
                <Text size="2" as="label">
                  <Flex align="center" gap="2">
                    <RadioGroup.Item value="date-range" />
                    Custom
                  </Flex>
                </Text>
              </Flex>
            </RadioGroup.Root>

            <Separator orientation="vertical" />

            <Text size="2" as="label">
              <Flex align="center" gap="2">
                <Checkbox
                  disabled={isProcessing || !account || !hasReplies}
                  checked={includeReplies}
                  onCheckedChange={(checked) =>
                    setIncludeReplies(checked === true)
                  }
                />
                Replies
              </Flex>
            </Text>
            <Text size="2" as="label">
              <Flex align="center" gap="2">
                <Checkbox
                  disabled={isProcessing || !account || !hasRetweets}
                  checked={includeRetweets}
                  onCheckedChange={(checked) =>
                    setIncludeRetweets(checked === true)
                  }
                />
                RTs
              </Flex>
            </Text>
          </Flex>
          <Box style={{ flex: 1 }} />
          <Select.Root
            value={String(selectedConfigIndex)}
            onValueChange={(value) => setSelectedConfigIndex(Number(value))}
            disabled={isProcessing || !account}
          >
            <Select.Trigger style={{ maxWidth: 280 }} />
            <Select.Content>
              {AVAILABLE_LLM_CONFIGS.map(
                ([model, provider, openrouterProvider, recommended], idx) => (
                  <Select.Item
                    key={`${model}-${provider}-${openrouterProvider || ""}`}
                    value={String(idx)}
                  >
                    {recommended && "️⭐️ "}
                    {model} - {openrouterProvider ?? provider}{" "}
                  </Select.Item>
                ),
              )}
            </Select.Content>
          </Select.Root>
        </Flex>
        {rangeSelection.type === "date-range" && (
          <TweetFrequencyGraph
            tweetCounts={tweetCounts}
            startDate={rangeSelection.startDate}
            endDate={rangeSelection.endDate}
            onRangeSelect={(newStartDate, newEndDate) => {
              setRangeSelection({
                type: "date-range",
                startDate: newStartDate,
                endDate: newEndDate,
              });
            }}
          />
        )}
        {errorMessage && (
          <Callout.Root color="red" mt="2">
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        {isProcessing && currentRunningQuery && (
          <ResultsBox>
            <Box pt="1" pb="2">
              <ProgressLabel
                currentProgress={currentProgress}
                totalProgress={totalProgress}
              />
              <ProgressBar
                currentProgress={currentProgress}
                totalProgress={totalProgress}
                startedAtMs={startedProcessingTime}
                isProcessing={isProcessing}
                numBatches={batchCount || totalProgress}
              />
            </Box>
          </ResultsBox>
        )}
        {queryResult && (
          <>
            <ResultsBox>
              <QueryResultHeader
                query={queryResult.query}
                subtitle={`completed in ${(queryResult.totalRunTime / 1000).toFixed(2)} seconds, ${queryResult.totalTokens} tokens`}
                resultText={queryResult.result}
                onShowEvidence={() => {
                  setShowBatchTweetsModal(true);
                }}
              />
              <div className="query-result-markdown">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props: MarkdownLinkProps) => {
                      const { children, href, className, node, ...rest } = props;
                      void node;
                      const anchorProps = rest as ComponentPropsWithoutRef<"a">;
                      const childText = getChildText(children);
                      if (childText && isTweetCitationLink(childText, href)) {
                        const tweetId = href ? extractTweetIdFromUrl(href) : null;
                        const citationTweet =
                          (tweetId && tweetsById.get(tweetId)) || null;
                        const username = citationTweet
                          ? accountIdToUsername.get(citationTweet.account_id) ||
                            null
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
                                <TweetPreviewCard
                                  tweet={citationTweet}
                                  username={username}
                                />
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
                  }}
                >
                  {stripThink(queryResult.result)}
                </Markdown>
              </div>
            </ResultsBox>
          </>
        )}
        <Grid
          columns={{ initial: "1", sm: "2", md: "3" }}
          gap="3"
          mt="2"
          style={{ alignItems: "stretch" }}
        >
          {FEATURED_QUERIES_SINGULAR.map((featuredQuery: FeaturedQuery) => {
            const title = replaceAccountName(
              featuredQuery.title,
              account ? account.username : "this user",
            );
            const textTemplate = featuredQuery.text ?? featuredQuery.title;
            const query = replaceAccountName(
              textTemplate,
              account ? account.username : "this user",
            );

            return (
              <FeaturedQueryCard key={featuredQuery.title} isProcessing={isProcessing}>
                <Box py="1">{title}</Box>
                <Flex justify="center" width="100%" gap="2">
                  <RunQueryButton
                    variant="outline"
                    disabled={isProcessing || !account}
                    onClick={() => {
                      if (isProcessing) return;
                      setSelectedQuery(query);
                      handleRunQuery(query);
                      textareaRef.current?.focus();
                    }}
                  />
                  <Button
                    type="button"
                    disabled={isProcessing || !account}
                    variant="outline"
                    color="gray"
                    size="2"
                    onClick={() => {
                      if (isProcessing) return;
                      setSelectedQuery(query);
                      textareaRef.current?.focus();
                    }}
                  >
                    Edit
                  </Button>
                </Flex>
              </FeaturedQueryCard>
            );
          })}
        </Grid>
        <BrowseMoreButton
          isProcessing={isProcessing}
          onClick={() => {
            if (isProcessing) return;
            setExampleQueriesModalIsOpen(true);
          }}
        />
        <ExampleQueriesModal
          queries={EXAMPLE_QUERIES_SINGULAR}
          isOpen={exampleQueriesModalIsOpen}
          onClose={() => {
            setExampleQueriesModalIsOpen(false);
          }}
          username={account ? account.username : ""}
          onSelectQuery={(query) => {
            setSelectedQuery(query);
            setExampleQueriesModalIsOpen(false);
          }}
        />
        <BatchTweetsModal
          isOpen={showBatchTweetsModal}
          queryResult={queryResult}
          onClose={() => setShowBatchTweetsModal(false)}
        />
      </Flex>
    </Box>
  );
}
