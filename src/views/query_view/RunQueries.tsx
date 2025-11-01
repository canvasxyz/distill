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
} from "react";
import { useStore } from "../../state/store";
import { RunQueryButton } from "./RunQueryButton";
import {
  CopyButton,
  ProgressBar,
  ProgressLabel,
  ResultsBox,
} from "./ResultsBox";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import { EXAMPLE_QUERIES, FEATURED_QUERIES } from "./example_queries";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTweetCounts } from "./useTweetCounts";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import { BatchTweetsModal } from "./BatchTweetsModal";
import { MAX_ARCHIVE_SIZE, QUERY_BATCH_SIZE } from "../../constants";
import { stripThink } from "../../utils";
import { AVAILABLE_LLM_CONFIGS } from "../../state/llm_query";

export function RunQueries() {
  const [exampleQueriesModalIsOpen, setExampleQueriesModalIsOpen] =
    useState(false);
  const [selectedQuery, setSelectedQuery] = useState("");

  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);

  const {
    account,
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

  const hasReplies = useMemo(
    () => (allTweets || []).some((t) => Boolean(t.in_reply_to_user_id)),
    [allTweets],
  );
  const hasRetweets = useMemo(
    () => (allTweets || []).some((t) => t.full_text.startsWith("RT ")),
    [allTweets],
  );

  useEffect(() => {
    if (!hasReplies && includeReplies) setIncludeReplies(false);
  }, [hasReplies]);
  useEffect(() => {
    if (!hasRetweets && includeRetweets) setIncludeRetweets(false);
  }, [hasRetweets]);

  const filteredTweetsToAnalyse = useMemo(
    () =>
      (allTweets || []).filter((tweet) => {
        if (!includeReplies && tweet.in_reply_to_user_id) {
          return false;
        }
        if (!includeRetweets && tweet.full_text.startsWith("RT ")) {
          return false;
        }
        return true;
      }),
    [allTweets, includeReplies, includeRetweets],
  );

  const tweetCounts = useTweetCounts(filteredTweetsToAnalyse);

  const formatCompact = (n: number) => {
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
    if (queryText === "" || queryText.trim() === "") return;

    submit(filteredTweetsToAnalyse, queryText, rangeSelection);
  };

  const tweetsSelectedForQuery = useMemo(() => {
    return selectSubset(filteredTweetsToAnalyse, rangeSelection);
  }, [filteredTweetsToAnalyse, rangeSelection]);

  const batchCount = useMemo(() => {
    if (tweetsSelectedForQuery.length === 0) return 0;
    return Math.ceil(tweetsSelectedForQuery.length / QUERY_BATCH_SIZE);
  }, [tweetsSelectedForQuery]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!account) return;
    if (!selectedQuery) return;
    textareaRef.current?.focus();
  }, [account, selectedQuery]);

  const shouldPersistQuery = (text: string, currentHandle: string) => {
    if (!text) return true;
    const handles = (text.match(/@[A-Za-z0-9_]{1,15}/g) || []).map((h) =>
      h.toLowerCase(),
    );
    if (handles.length === 0) return true;
    const uniq = new Set(handles);
    uniq.delete(currentHandle.toLowerCase());
    return uniq.size === 0;
  };

  useEffect(() => {
    if (!account) return;
    try {
      const saved = localStorage.getItem("llm:lastQuery");
      const currentHandle = `@${account.username}`.toLowerCase();
      if (saved && shouldPersistQuery(saved, currentHandle)) {
        setSelectedQuery((prev) => (prev ? prev : saved));
      }
    } catch {
      // noop
    }
  }, [account]);

  useEffect(() => {
    if (!account) return;
    try {
      const currentHandle = `@${account.username}`.toLowerCase();
      if (shouldPersistQuery(selectedQuery, currentHandle)) {
        localStorage.setItem("llm:lastQuery", selectedQuery || "");
      }
    } catch {
      // noop
    }
  }, [selectedQuery, account]);

  if (!account) return <></>;

  const totalPostsCount = (allTweets || []).length;
  const lastTweetsLabel =
    totalPostsCount < MAX_ARCHIVE_SIZE
      ? "All posts"
      : `Most recent ${formatCompact(MAX_ARCHIVE_SIZE)}`;

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="mt-6">
        <textarea
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
          rows={3}
          className="w-full min-h-[60px] resize-y rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
          placeholder="Type your query here..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <RunQueryButton
          disabled={isProcessing}
          onClick={() => handleRunQuery(selectedQuery)}
          showShortcut
        />

        <div className="ml-2.5 flex flex-wrap items-center gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              disabled={isProcessing}
              name="archiveMode"
              checked={rangeSelection.type === "last-tweets"}
              onChange={(e) => {
                if (e.target.checked) {
                  setRangeSelection({
                    type: "last-tweets",
                    numTweets: MAX_ARCHIVE_SIZE,
                  });
                }
              }}
              className="accent-indigo-500"
            />
            {lastTweetsLabel}
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              disabled={isProcessing}
              name="archiveMode"
              checked={rangeSelection.type === "date-range"}
              onChange={(e) => {
                if (e.target.checked) {
                  setRangeSelection({
                    type: "date-range",
                    startDate: "",
                    endDate: "",
                  });
                }
              }}
              className="accent-indigo-500"
            />
            Custom
          </label>
          <label className="ml-1 flex items-center gap-1.5">
            <input
              type="checkbox"
              disabled={isProcessing || !hasReplies}
              checked={includeReplies}
              onChange={(e) => setIncludeReplies(e.target.checked)}
            />
            Replies
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              disabled={isProcessing || !hasRetweets}
              checked={includeRetweets}
              onChange={(e) => setIncludeRetweets(e.target.checked)}
            />
            Retweets
          </label>
        </div>

        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <select
            id="model-select"
            disabled={isProcessing}
            value={selectedConfigIndex}
            onChange={(e) => setSelectedConfigIndex(Number(e.target.value))}
            className="w-72 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {AVAILABLE_LLM_CONFIGS.map(
              ([model, provider, openrouterProvider, recommended], idx) => (
                <option
                  key={`${model}-${provider}-${openrouterProvider || ""}`}
                  value={idx}
                >
                  {recommended ? "?? " : ""}
                  {openrouterProvider ? "?? " : ""}
                  {model} - {openrouterProvider ?? provider}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

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
        <div
          role="alert"
          className="mt-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {errorMessage}
        </div>
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
        <ResultsBox>
          <div className="mb-[-6px] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-1 flex-col gap-1">
              <h4 className="text-lg font-semibold text-slate-900">
                {queryResult.query}
              </h4>
              <span className="text-xs italic text-slate-600">
                completed in {(queryResult.totalRunTime / 1000).toFixed(2)}
                seconds, {queryResult.totalTokens} tokens
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                onClick={() => setShowBatchTweetsModal(true)}
              >
                Evidence
              </button>
              <CopyButton text={queryResult.result} />
            </div>
          </div>
          <div className="prose prose-sm prose-slate max-w-none">
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(queryResult.result)}
            </Markdown>
          </div>
        </ResultsBox>
      )}

      <div className="mt-1.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_QUERIES.map((baseQuery) => {
          const query = replaceAccountName(baseQuery, account.username);
          const cardDisabled = isProcessing;
          return (
            <div
              key={baseQuery}
              className={`flex min-h-[140px] flex-col items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-base font-medium shadow-sm transition ${
                cardDisabled ? "opacity-60" : "hover:bg-slate-100"
              }`}
            >
              <div className="flex flex-1 items-center text-indigo-600">
                <span className="whitespace-pre-wrap break-words">{query}</span>
              </div>
              <div className="flex w-full justify-center gap-2">
                <RunQueryButton
                  disabled={isProcessing}
                  onClick={() => {
                    if (isProcessing) return;
                    setSelectedQuery(query);
                    handleRunQuery(query);
                    textareaRef.current?.focus();
                  }}
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  className="rounded border border-slate-300 bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-80"
                  onClick={() => {
                    if (isProcessing) return;
                    setSelectedQuery(query);
                    textareaRef.current?.focus();
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <button
          type="button"
          disabled={isProcessing}
          className="text-base font-medium text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:text-indigo-300"
          onClick={() => {
            if (isProcessing) return;
            setExampleQueriesModalIsOpen(true);
          }}
        >
          More examples...
        </button>
      </div>

      <ExampleQueriesModal
        queries={EXAMPLE_QUERIES}
        isOpen={exampleQueriesModalIsOpen}
        onClose={() => {
          setExampleQueriesModalIsOpen(false);
        }}
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
    </div>
  );
}
