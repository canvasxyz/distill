import { filterPosts, replaceAccountName, selectSubset } from "./ai_utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../state/store";
import { useQuestionDraft } from "../../state/questionDraft";
import { RunQueryButton } from "./RunQueryButton";
import {
  ProgressBar,
  ProgressLabel,
  ResultsBox,
  QueryResultHeader,
  QueryResultActions,
} from "./ResultsBox";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import {
  EXAMPLE_QUERIES_SINGULAR,
  FEATURED_QUERIES_SINGULAR,
  type FeaturedQuery,
} from "./example_queries";
import { useTweetCounts } from "./useTweetCounts";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import { SourceTweetsPanel } from "./SourceTweetsPanel";
import {
  getBatchSizeForConfig,
  POST_COUNT_OPTIONS,
  type PromptPlacement,
} from "../../constants";
import {
  AVAILABLE_LLM_CONFIGS,
  getLlmConfigLabel,
} from "../../state/llm_query";
import { AccountContextLine } from "../../components/AccountContextLine";
import { ChooseArchive } from "../../components/ChooseArchive";
import { getFetchPostsProgressLabel } from "../../components/CommunityArchiveUserProgress";
import { useSelectedAccount } from "../../hooks/useSelectedAccount";
import { PageContent } from "../../components/PageContent";
import {
  Flex,
  Select,
  Checkbox,
  Text,
  Callout,
  Spinner,
} from "@radix-ui/themes";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import type { Tweet } from "../../types";
import { QueryResultMarkdown } from "./QueryResultMarkdown";

const formatMonth = (date: string) =>
  date
    ? new Date(`${date.slice(0, 7)}-01T00:00:00`).toLocaleDateString(
        undefined,
        { month: "short", year: "numeric" },
      )
    : "";

export function RunQueries() {
  const [exampleQueriesModalIsOpen, setExampleQueriesModalIsOpen] =
    useState(false);
  const {
    selectedQuery,
    setSelectedQuery,
    showFilters,
    setShowFilters,
    includeReplies,
    setIncludeReplies,
    includeRetweets,
    setIncludeRetweets,
    rangeSelection,
    setRangeSelection,
    setDraftUsername,
  } = useQuestionDraft();
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
    setQueryError,
    selectedConfigIndex,
    setSelectedConfigIndex,
    preparePosts,
    fetchPostsProgress,
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

  const { selectedAccountId, account } = useSelectedAccount();
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

  // Posts stored in this browser. Imported archives are complete; for a
  // Community Archive person this is whatever earlier questions fetched.
  const accountTweets = useMemo(
    () => allTweets.filter((tweet) => tweet.account_id === selectedAccountId),
    [allTweets, selectedAccountId],
  );
  const isLocalArchive = account?.fromArchive ?? false;
  const totalPosts = account
    ? isLocalArchive
      ? accountTweets.length
      : (account.numTweets ?? null)
    : null;
  // Community Archive posts may not be stored yet, so the reply and repost
  // filters stay available until we know there is nothing to filter.
  const hasReplies =
    !isLocalArchive ||
    accountTweets.some((tweet) => Boolean(tweet.in_reply_to_user_id));
  const hasRetweets =
    !isLocalArchive ||
    accountTweets.some((tweet) => tweet.full_text.startsWith("RT "));

  const filteredTweetsToAnalyse = useMemo(
    () => filterPosts(accountTweets, { includeReplies, includeRetweets }),
    [accountTweets, includeReplies, includeRetweets],
  );

  const tweetCounts = useTweetCounts(filteredTweetsToAnalyse);

  const postCountOptions = useMemo(() => {
    const options = POST_COUNT_OPTIONS.filter(
      (count) =>
        count <= batchSize && (totalPosts == null || count < totalPosts),
    );
    if (totalPosts != null && totalPosts > 0 && totalPosts <= batchSize)
      options.push(totalPosts);
    return options.length ? options : [batchSize];
  }, [batchSize, totalPosts]);

  // Keep the chosen count within what the model and the person allow.
  const lastTweetsCount =
    rangeSelection.type === "last-tweets" ? rangeSelection.numTweets : null;
  useEffect(() => {
    if (lastTweetsCount === null || postCountOptions.includes(lastTweetsCount))
      return;
    const nearest =
      [...postCountOptions]
        .reverse()
        .find((count) => count <= lastTweetsCount) ?? postCountOptions[0];
    setRangeSelection({ type: "last-tweets", numTweets: nearest });
  }, [lastTweetsCount, postCountOptions, setRangeSelection]);

  const [currentProgress, totalProgress] = useMemo(() => {
    if (batchStatuses === null) return [0, 1];
    const currentProgress = Object.values(batchStatuses).filter(
      (status) => status.status === "done",
    ).length;
    const totalProgress = Object.values(batchStatuses).length;
    return [currentProgress, totalProgress];
  }, [batchStatuses]);

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const preparing = useRef(false);

  const tweetsSelectedForQuery = useMemo(() => {
    return selectSubset(filteredTweetsToAnalyse, rangeSelection);
  }, [filteredTweetsToAnalyse, rangeSelection]);

  const datesMissing =
    rangeSelection.type === "date-range" &&
    (!rangeSelection.startDate || !rangeSelection.endDate);
  const nothingToRead =
    datesMissing || (isLocalArchive && tweetsSelectedForQuery.length === 0);
  const busy = isProcessing || fetchPostsProgress !== null;
  const askDisabled =
    busy || !account || !selectedQuery.trim() || nothingToRead;

  const handleRunQuery = async (queryText: string) => {
    if (!account || askDisabled || !queryText.trim() || preparing.current)
      return;

    setSourcesOpen(false);
    preparing.current = true;
    let posts: Tweet[];
    try {
      posts = await preparePosts(account, {
        rangeSelection,
        includeReplies,
        includeRetweets,
        limit: batchSize,
      });
    } catch (error) {
      console.error("Fetching posts failed:", error);
      setQueryError(
        `@${account.username}’s posts couldn’t be fetched from Community Archive. Please try again.`,
      );
      return;
    } finally {
      preparing.current = false;
    }
    if (!selectSubset(posts, rangeSelection).length) {
      setQueryError("No posts match these filters.");
      return;
    }
    submit(posts, account, queryText, rangeSelection, promptPlacement);
  };

  const batchCount = useMemo(() => {
    if (tweetsSelectedForQuery.length === 0) return 0;
    return 1;
  }, [tweetsSelectedForQuery]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const prevUsernameRef = useRef(useQuestionDraft.getState().username);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    setDraftUsername(newUsername);
  }, [accountUsername, selectedQuery, setSelectedQuery, setDraftUsername]);

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
  }, [account, setSelectedQuery]);

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

  if (!account)
    return (
      <PageContent>
        <AccountContextLine />
        <div className="page-intro">
          <h1>What’s their deal?</h1>
          <p className="intro-copy">
            A little self-reflection. A concrete impression of a friend.
            <br />
            Start with their tweets and ask whatever you’re curious about.
          </p>
        </div>
        <ChooseArchive />
      </PageContent>
    );

  const scopeDetail = isLocalArchive
    ? `${tweetsSelectedForQuery.length.toLocaleString()} of ${accountTweets.length.toLocaleString()} posts`
    : totalPosts != null
      ? `${totalPosts.toLocaleString()} on Community Archive`
      : null;

  return (
    <PageContent>
      <AccountContextLine />
      <div className="page-intro">
        <h1>What’s their deal?</h1>
        <p className="intro-copy">
          Their strengths, their soft spots, their oddly specific interests.
          <br />
          Ask whatever you’re curious about.
        </p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleRunQuery(selectedQuery);
        }}
      >
        <div className="question-composer">
          <label htmlFor="question">Your question</label>
          <textarea
            id="question"
            ref={textareaRef}
            value={selectedQuery}
            disabled={busy || !account}
            onChange={(event) => setSelectedQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void handleRunQuery(selectedQuery);
              }
            }}
            placeholder={
              account
                ? "What would you like to know?"
                : "Choose someone to get started"
            }
            rows={2}
          />
          <div className="composer-footer">
            <span>According to their tweets, anyway.</span>
            <RunQueryButton
              disabled={askDisabled}
              onClick={() => void handleRunQuery(selectedQuery)}
              showShortcut
            />
          </div>
        </div>
        <div className="scope-row">
          <div className="scope-summary">
            {rangeSelection.type === "last-tweets" ? (
              <label className="post-count">
                Reads their most recent
                <select
                  className="post-count-select"
                  aria-label="How many posts"
                  value={String(rangeSelection.numTweets)}
                  disabled={busy}
                  onChange={(event) =>
                    setRangeSelection({
                      type: "last-tweets",
                      numTweets: Number(event.target.value),
                    })
                  }
                >
                  {postCountOptions.map((count) => (
                    <option key={count} value={count}>
                      {count === totalPosts
                        ? `all ${count.toLocaleString()}`
                        : count.toLocaleString()}
                    </option>
                  ))}
                </select>
                posts
              </label>
            ) : (
              <span>
                {datesMissing
                  ? "Reads posts from the months you choose"
                  : `Reads posts from ${formatMonth(rangeSelection.startDate)} through ${formatMonth(rangeSelection.endDate)}`}
                {" · "}up to {batchSize.toLocaleString()}
              </span>
            )}
            {scopeDetail && (
              <span className="scope-detail">· {scopeDetail}</span>
            )}
          </div>
          <button
            className="disclosure-button"
            type="button"
            aria-expanded={showFilters}
            aria-controls="post-filters"
            onClick={() => setShowFilters(!showFilters)}
          >
            Which posts?
            <ChevronDownIcon
              className="disclosure-chevron"
              aria-hidden="true"
            />
          </button>
        </div>
      </form>
      <section
        className="post-filters"
        id="post-filters"
        aria-label="Choose posts"
        hidden={!showFilters}
      >
        <div className="filter-heading">
          <h2>Which posts should count?</h2>
          <button
            className="plain-button"
            onClick={() => {
              setShowFilters(false);
              document
                .querySelector<HTMLButtonElement>(
                  '[aria-controls="post-filters"]',
                )
                ?.focus();
            }}
            aria-label="Close post filters"
          >
            Close ×
          </button>
        </div>
        <label className="field-label" htmlFor="post-range">
          Post range
        </label>
        <select
          id="post-range"
          value={rangeSelection.type}
          disabled={busy || !account}
          onChange={({ target: { value } }) => {
            if (value === "last-tweets")
              setRangeSelection({
                type: "last-tweets",
                numTweets: postCountOptions.includes(Math.min(batchSize, 1500))
                  ? Math.min(batchSize, 1500)
                  : postCountOptions[postCountOptions.length - 1],
              });
            else
              setRangeSelection({
                type: "date-range",
                startDate: "",
                endDate: "",
              });
          }}
        >
          <option value="last-tweets">Most recent posts</option>
          <option value="date-range">Choose months</option>
        </select>
        {rangeSelection.type === "date-range" && (
          <>
            <div className="month-range">
              <label>
                From month
                <input
                  type="month"
                  aria-label="From month"
                  value={rangeSelection.startDate.slice(0, 7)}
                  max={rangeSelection.endDate.slice(0, 7) || undefined}
                  disabled={busy || !account}
                  onChange={(event) =>
                    setRangeSelection({
                      ...rangeSelection,
                      startDate: event.target.value
                        ? `${event.target.value}-01`
                        : "",
                    })
                  }
                />
              </label>
              <label>
                Through month
                <input
                  type="month"
                  aria-label="Through month"
                  value={rangeSelection.endDate.slice(0, 7)}
                  min={rangeSelection.startDate.slice(0, 7) || undefined}
                  disabled={busy || !account}
                  onChange={(event) =>
                    setRangeSelection({
                      ...rangeSelection,
                      endDate: event.target.value
                        ? `${event.target.value}-01`
                        : "",
                    })
                  }
                />
              </label>
            </div>
            {accountTweets.length > 0 && (
              <details className="timeline-details">
                <summary>
                  {isLocalArchive
                    ? "Show posting activity"
                    : "Show posting activity for fetched posts"}
                </summary>
                <TweetFrequencyGraph
                  tweetCounts={tweetCounts}
                  startDate={rangeSelection.startDate}
                  endDate={rangeSelection.endDate}
                  onRangeSelect={(startDate, endDate) => {
                    if (busy) return;
                    setRangeSelection({
                      type: "date-range",
                      startDate,
                      endDate,
                    });
                  }}
                />
              </details>
            )}
          </>
        )}
        <Flex gap="4" wrap="wrap" my="4">
          <Text size="2" as="label">
            <Flex align="center" gap="2">
              <Checkbox
                disabled={busy || !account || !hasReplies}
                checked={hasReplies && includeReplies}
                onCheckedChange={(checked) =>
                  setIncludeReplies(checked === true)
                }
              />
              Include replies
            </Flex>
          </Text>
          <Text size="2" as="label">
            <Flex align="center" gap="2">
              <Checkbox
                disabled={busy || !account || !hasRetweets}
                checked={hasRetweets && includeRetweets}
                onCheckedChange={(checked) =>
                  setIncludeRetweets(checked === true)
                }
              />
              Include reposts
            </Flex>
          </Text>
        </Flex>
        <p className="quiet-note">
          Up to {batchSize.toLocaleString()} posts with this model. If more
          match, the most recent are used.
          {!isLocalArchive &&
            " Posts are fetched from Community Archive the first time a question needs them, then kept in this browser."}
        </p>
        <details className="model-details">
          <summary>AI model</summary>
          <Select.Root
            value={String(selectedConfigIndex)}
            onValueChange={(value) => setSelectedConfigIndex(Number(value))}
            disabled={busy || !account}
          >
            <Select.Trigger aria-label="Question model" />
            <Select.Content>
              {AVAILABLE_LLM_CONFIGS.map((config, index) => (
                <Select.Item
                  key={`${config[0]}-${config[1]}-${config[2] || ""}`}
                  value={String(index)}
                >
                  {getLlmConfigLabel(config)}
                  {config[3] ? " · recommended" : ""}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <p className="quiet-note">
            The selected posts are sent to the chosen AI provider when you ask.
          </p>
        </details>
      </section>

      <div className="question-suggestions" aria-label="Try a question">
        {FEATURED_QUERIES_SINGULAR.map((featuredQuery: FeaturedQuery) => {
          const query = replaceAccountName(
            featuredQuery.text ?? featuredQuery.title,
            account ? account.username : "this user",
          );
          return (
            <button
              key={featuredQuery.title}
              type="button"
              disabled={busy || !account}
              aria-pressed={selectedQuery === query}
              onClick={() => {
                setSelectedQuery(query);
                textareaRef.current?.focus();
              }}
            >
              {featuredQuery.title}
            </button>
          );
        })}
        <button
          type="button"
          disabled={busy || !account}
          className="more-questions"
          onClick={() => setExampleQueriesModalIsOpen(true)}
        >
          More ideas
        </button>
      </div>

      {errorMessage && (
        <Callout.Root color="red" mt="4" role="alert">
          <Callout.Text>{errorMessage}</Callout.Text>
        </Callout.Root>
      )}
      {fetchPostsProgress && (
        <div role="status" aria-live="polite">
          <ResultsBox>
            <Flex align="center" gap="2">
              <Spinner />
              <Text size="2" color="gray">
                {getFetchPostsProgressLabel(fetchPostsProgress)}
              </Text>
            </Flex>
          </ResultsBox>
        </div>
      )}
      {isProcessing && currentRunningQuery && (
        <div role="status" aria-live="polite">
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
        </div>
      )}
      {queryResult &&
        !isProcessing &&
        queryResult.queriedHandle?.toLowerCase() ===
          `@${account.username}`.toLowerCase() && (
          <ResultsBox>
            <QueryResultHeader result={queryResult} />
            <QueryResultMarkdown
              key={queryResult.id}
              content={queryResult.result}
              person={queryResult.queriedHandle}
              tweetsById={tweetsById}
              accountIdToUsername={accountIdToUsername}
            />
            <QueryResultActions
              resultText={queryResult.result}
              onShowEvidence={() => setSourcesOpen(!sourcesOpen)}
              sourcesOpen={sourcesOpen}
              sourcesId="answer-sources"
            />
            {sourcesOpen && (
              <SourceTweetsPanel
                key={queryResult.id}
                result={queryResult}
                id="answer-sources"
              />
            )}
          </ResultsBox>
        )}
      <ExampleQueriesModal
        queries={EXAMPLE_QUERIES_SINGULAR}
        isOpen={exampleQueriesModalIsOpen}
        onClose={() => setExampleQueriesModalIsOpen(false)}
        username={account?.username ?? ""}
        onSelectQuery={(query) => {
          setSelectedQuery(query);
          setExampleQueriesModalIsOpen(false);
        }}
      />
    </PageContent>
  );
}
