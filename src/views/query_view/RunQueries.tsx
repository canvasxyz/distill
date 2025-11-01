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

  if (!account) return <></>;

  const totalPostsCount = (allTweets || []).length;
  const lastTweetsLabel =
    totalPostsCount < MAX_ARCHIVE_SIZE
      ? "All posts"
      : `Most recent ${formatCompact(MAX_ARCHIVE_SIZE)}`;

  return (
    <div className="flex flex-col gap-[10px] pb-5">
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
          className="w-full min-h-[60px] text-base p-2 rounded-md border border-gray-300 resize-y box-border"
          placeholder="Type your query here..."
        />
      </div>
      <div className="flex items-center gap-3 mb-[10px]">
        <RunQueryButton
          disabled={isProcessing}
          onClick={() => {
            handleRunQuery(selectedQuery);
          }}
          showShortcut
        />

        <div className="h-full flex flex-row items-center gap-[15px] ml-[10px] text-[90%]">
          <label className="flex items-center gap-[6px]">
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
              className="accent-blue-500 mt-[2px]"
            />
            {lastTweetsLabel}
          </label>
          <label className="flex items-center gap-[6px]">
            <input
              type="radio"
              disabled={isProcessing}
              name="archiveMode"
              checked={rangeSelection.type === "date-range"}
              onChange={(e) => {
                if (e.target.checked)
                  setRangeSelection({
                    type: "date-range",
                    startDate: "",
                    endDate: "",
                  });
              }}
              className="accent-blue-500 mt-[2px]"
            />
            Custom
          </label>
          <label className="flex items-center gap-[6px] ml-[3px]">
            <input
              type="checkbox"
              disabled={isProcessing || !hasReplies}
              checked={includeReplies}
              onChange={(e) => setIncludeReplies(e.target.checked)}
            />
            Replies
          </label>
          <label className="flex items-center gap-[6px]">
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
            className={`py-[6px] px-2 rounded-md border border-gray-300 ${
              isProcessing ? "bg-gray-100" : "bg-white"
            } w-[280px]`}
          >
            {AVAILABLE_LLM_CONFIGS.map(
              ([model, provider, openrouterProvider, recommended], idx) => (
                <option
                  key={`${model}-${provider}-${openrouterProvider || ""}`}
                  value={idx}
                >
                  {recommended && "??? "}
                  {openrouterProvider && "?? "}
                  {model} - {openrouterProvider ?? provider}{" "}
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
          className="bg-[#fde8e8] border border-[#f5c2c7] text-[#842029] p-[10px_12px] mt-[6px] rounded-md"
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
        <>
          <ResultsBox>
            <div className="flex flex-row -mb-[6px]">
              <div className="flex flex-col gap-1 flex-1">
                <h4 className="m-0">{queryResult.query}</h4>
                <span className="italic text-sm">
                  {" "}
                  completed in {(queryResult.totalRunTime / 1000).toFixed(
                    2,
                  )}{" "}
                  seconds, {queryResult.totalTokens} tokens
                </span>
              </div>
              <div className="ml-[6px]">
                <div className="flex gap-[6px] max-h-9">
                  <button
                    className="border border-[rgb(150,234,153)] rounded py-1 px-2 bg-white text-[#388e3c] text-xs font-bold cursor-pointer transition-all duration-200 hover:bg-[#e7f6e7]"
                    onClick={() => {
                      setShowBatchTweetsModal(true);
                    }}
                  >
                    Evidence
                  </button>
                  <CopyButton text={queryResult.result} />
                </div>
              </div>
            </div>
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(queryResult.result)}
            </Markdown>
          </ResultsBox>
        </>
      )}
      <div className="mt-[6px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 items-stretch">
        {FEATURED_QUERIES.map((baseQuery) => {
          const query = replaceAccountName(baseQuery, account.username);
          return (
            <div
              key={baseQuery}
              className={`p-4 bg-[#f8f9fa] text-[#212529] border border-gray-300 rounded-md text-[15px] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition-[background,color] duration-200 flex flex-col items-center justify-between text-center min-h-[140px] gap-3 ${
                isProcessing ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="text-[#0056b3] whitespace-pre-wrap break-words flex-1 flex items-center">
                {query}
              </div>
              <div className="flex justify-center w-full gap-2">
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
                  className={`border border-[#d0d5dd] rounded py-[6px] px-[10px] bg-gray-200 text-gray-600 ${
                    isProcessing ? "cursor-not-allowed" : "cursor-pointer hover:bg-[#e2e6ea]"
                  } transition-all duration-200`}
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
      <div className="my-[10px] text-center">
        <span
          className={`inline text-[#0056B3cc] text-base ${
            isProcessing ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:text-[#0056B3]"
          }`}
          onClick={() => {
            if (isProcessing) return;
            setExampleQueriesModalIsOpen(true);
          }}
        >
          More examples...
        </span>
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
