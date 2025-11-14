import {
  type RangeSelection,
  replaceAccountName,
  selectSubset,
} from "./ai_utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../state/store";
import { RunQueryButton } from "./RunQueryButton";
import {
  CopyButton,
  ProgressBar,
  ProgressLabel,
  ResultsBox,
} from "./ResultsBox";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import {
  EXAMPLE_QUERIES_SINGULAR,
  FEATURED_QUERIES_SINGULAR,
} from "./example_queries";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTweetCounts } from "./useTweetCounts";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import { BatchTweetsModal } from "./BatchTweetsModal";
import { MAX_ARCHIVE_SIZE, QUERY_BATCH_SIZE } from "../../constants";
import { stripThink } from "../../utils";
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
  Heading,
  Grid,
  Button,
  Callout,
  Separator,
} from "@radix-ui/themes";

export function RunQueries() {
  const [exampleQueriesModalIsOpen, setExampleQueriesModalIsOpen] =
    useState(false);
  const [selectedQuery, setSelectedQuery] = useState("");

  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);

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
  } = useStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const account = useMemo(
    () => accounts.filter((a) => a.accountId === selectedAccountId)[0] || null,

    [accounts, selectedAccountId],
  );

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
  }, [hasReplies]);
  useEffect(() => {
    if (!hasRetweets && includeRetweets) setIncludeRetweets(false);
  }, [hasRetweets]);

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

  const formatCompact = (n: number) => {
    try {
      const s = new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n);
      // Use lowercase suffix to match "10k" style
      return s.replace("K", "k").replace("M", "m").replace("G", "g");
    } catch {
      if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}m`;
      if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
      return String(n);
    }
  };

  const [rangeSelection, setRangeSelection] = useState<RangeSelection>({
    type: "last-tweets",
    numTweets: MAX_ARCHIVE_SIZE,
  });

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

    submit(filteredTweetsToAnalyse, account, queryText, rangeSelection);
  };

  const tweetsSelectedForQuery = useMemo(() => {
    return selectSubset(filteredTweetsToAnalyse, rangeSelection);
  }, [filteredTweetsToAnalyse, rangeSelection]);

  const batchCount = useMemo(() => {
    if (tweetsSelectedForQuery.length === 0) return 0;
    return Math.ceil(tweetsSelectedForQuery.length / QUERY_BATCH_SIZE);
  }, [tweetsSelectedForQuery]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevUsernameRef = useRef<string | null>(null);

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
    const newUsername = account?.username ?? null;
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
  }, [account?.username]);

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

  const totalPostsCount = (allTweets || []).length;
  const lastTweetsLabel =
    totalPostsCount < MAX_ARCHIVE_SIZE
        ? (<>All&nbsp;posts</>)
        : (<>Most&nbsp;recent&nbsp;{formatCompact(MAX_ARCHIVE_SIZE)}</>);

  return (
    <Flex direction="column" gap="3" pb="5">
      <SelectUser
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
      />
      <Box mt="6">
        <TextArea
          ref={textareaRef}
          value={selectedQuery}
          disabled={isProcessing}
          onChange={(e) => setSelectedQuery(e.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            if (!event.metaKey) return;
            event.preventDefault();
            if (isProcessing) return;
            handleRunQuery(selectedQuery);
          }}
          placeholder="Type your query here..."
          size="3"
          rows={3}
          style={{ minHeight: "60px" }}
        />
      </Box>
      <Flex align="center" gap="3" mb="3">
        <RunQueryButton
          disabled={isProcessing}
          onClick={() => {
            handleRunQuery(selectedQuery);
          }}
          showShortcut
        />

        <Separator orientation="vertical" />

        <Flex align="center" gap="4">
          <RadioGroup.Root
            value={rangeSelection.type}
            onValueChange={(value) => {
              if (value === "last-tweets") {
                setRangeSelection({
                  type: "last-tweets",
                  numTweets: MAX_ARCHIVE_SIZE,
                });
              } else if (value === "date-range") {
                setRangeSelection({
                  type: "date-range",
                  startDate: "",
                  endDate: "",
                });
              }
            }}
            disabled={isProcessing}
          >
            <Flex gap="4">
              <Text size="2" as="label">
                <Flex align="center" gap="2">
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
                disabled={isProcessing || !hasReplies}
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
                disabled={isProcessing || !hasRetweets}
                checked={includeRetweets}
                onCheckedChange={(checked) =>
                  setIncludeRetweets(checked === true)
                }
              />
              Retweets
            </Flex>
          </Text>
        </Flex>
        <Box style={{ flex: 1 }} />
        <Select.Root
          value={String(selectedConfigIndex)}
          onValueChange={(value) => setSelectedConfigIndex(Number(value))}
          disabled={isProcessing}
        >
          <Select.Trigger style={{ width: 280 }} />
          <Select.Content>
            {AVAILABLE_LLM_CONFIGS.map(
              ([model, provider, openrouterProvider, recommended], idx) => (
                <Select.Item
                  key={`${model}-${provider}-${openrouterProvider || ""}`}
                  value={String(idx)}
                >
                  {recommended && "️⭐️ "}
                  {openrouterProvider && "🔀 "}
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
        </ResultsBox>
      )}
      {queryResult && (
        <>
          <ResultsBox>
            <Flex direction="row" mb="-2" gap="3">
              <Flex direction="column" gap="1" style={{ flex: 1 }}>
                <Heading size="4">{queryResult.query}</Heading>
                <Text size="1" style={{ fontStyle: "italic" }}>
                  completed in {(queryResult.totalRunTime / 1000).toFixed(2)}{" "}
                  seconds, {queryResult.totalTokens} tokens
                </Text>
              </Flex>
              <Flex gap="2" align="start">
                <Button
                  size="1"
                  variant="soft"
                  color="green"
                  onClick={() => {
                    setShowBatchTweetsModal(true);
                  }}
                >
                  Evidence
                </Button>
                <CopyButton text={queryResult.result} />
              </Flex>
            </Flex>
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(queryResult.result)}
            </Markdown>
          </ResultsBox>
        </>
      )}
      <Grid
        columns={{ initial: "1", sm: "2", md: "3" }}
        gap="3"
        mt="2"
        style={{ alignItems: "stretch" }}
      >
        {FEATURED_QUERIES_SINGULAR.map((baseQuery) => {
          const query = replaceAccountName(
            baseQuery,
            account ? account.username : "user",
          );
          return (
            <FeaturedQueryCard key={baseQuery} isProcessing={isProcessing}>
              <Text
                color="blue"
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  flex: 1,
                }}
              >
                {query}
              </Text>
              <Flex justify="center" width="100%" gap="2">
                <RunQueryButton
                  disabled={isProcessing}
                  onClick={() => {
                    if (isProcessing) return;
                    setSelectedQuery(query);
                    handleRunQuery(query);
                    textareaRef.current?.focus();
                  }}
                />
                <Button
                  type="button"
                  disabled={isProcessing}
                  variant="soft"
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
  );
}
