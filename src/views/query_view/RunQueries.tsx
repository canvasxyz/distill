import {
  type RangeSelectionType,
  replaceAccountName,
  selectSubset,
} from "./ai_utils";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
import { QUERY_BATCH_SIZE } from "../../constants";

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
    currentRunningQuery,
    queryResult,
  } = useStore();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const [rangeSelectionType, setRangeSelectionType] =
    useState<RangeSelectionType>("whole-archive");

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
    submit(filteredTweetsToAnalyse, queryText, rangeSelectionType, {
      startDate,
      endDate,
    });
  };

  const tweetsSelectedForQuery = useMemo(() => {
    if (rangeSelectionType === "date-range" && (!startDate || !endDate)) {
      return [];
    }
    return selectSubset(filteredTweetsToAnalyse, rangeSelectionType, {
      startDate,
      endDate,
    });
  }, [filteredTweetsToAnalyse, rangeSelectionType, startDate, endDate]);

  const batchCount = useMemo(() => {
    if (tweetsSelectedForQuery.length === 0) return 0;
    return Math.ceil(tweetsSelectedForQuery.length / QUERY_BATCH_SIZE);
  }, [tweetsSelectedForQuery]);

  const shouldShowBatchCount = batchCount > 1;

  const featuredQueryCardStyle: CSSProperties = {
    padding: "16px",
    background: "#f8f9fa",
    color: "#212529",
    border: "1px solid #007bff",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 500,
    cursor: isProcessing ? "not-allowed" : "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    transition: "background 0.2s, color 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "center",
    minHeight: "140px",
    gap: "12px",
    opacity: isProcessing ? 0.6 : 1,
  };

  const browseMoreButtonStyle: CSSProperties = {
    padding: "12px 20px",
    background: "#f8f9fa",
    color: "#0056B3",
    border: "1px solid #007bff",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: isProcessing ? "not-allowed" : "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
    transition: "background 0.2s, color 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    minHeight: "52px",
    opacity: isProcessing ? 0.6 : 1,
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!account) return;
    if (!selectedQuery) return;
    textareaRef.current?.focus();
  }, [account, selectedQuery]);

  if (!account) return <></>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingBottom: "20px",
      }}
    >
      <div
        style={{
          marginTop: "24px",
        }}
      >
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
          style={{
            width: "100%",
            minHeight: "60px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          placeholder="Type your query here..."
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            disabled={isProcessing}
            checked={includeReplies}
            onChange={(e) => setIncludeReplies(e.target.checked)}
          />
          Include replies
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            disabled={isProcessing}
            checked={includeRetweets}
            onChange={(e) => setIncludeRetweets(e.target.checked)}
          />
          Include retweets
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="radio"
            disabled={isProcessing}
            name="archiveMode"
            checked={rangeSelectionType === "whole-archive"}
            onChange={(e) => {
              if (e.target.checked) {
                setRangeSelectionType("whole-archive");
                setStartDate("");
                setEndDate("");
              }
            }}
            style={{ accentColor: "#007bff", marginTop: "2px" }}
          />
          Whole Archive (
          {filteredTweetsToAnalyse ? filteredTweetsToAnalyse.length : "-"}{" "}
          tweets)
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="radio"
            disabled={isProcessing}
            name="archiveMode"
            checked={rangeSelectionType === "date-range"}
            onChange={(e) => {
              if (e.target.checked) setRangeSelectionType("date-range");
            }}
            style={{ accentColor: "#007bff", marginTop: "2px" }}
          />
          Select Range
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <input
            type="radio"
            disabled={isProcessing}
            name="archiveMode"
            checked={rangeSelectionType === "random-sample"}
            onChange={(e) => {
              if (e.target.checked) {
                setRangeSelectionType("random-sample");
                setStartDate("");
                setEndDate("");
              }
            }}
            style={{ marginTop: "2px" }}
          />
          Random Sample
        </label>
      </div>
      {rangeSelectionType === "date-range" && (
        <TweetFrequencyGraph
          tweetCounts={tweetCounts}
          startDate={startDate}
          endDate={endDate}
          onRangeSelect={(newStartDate, newEndDate) => {
            setStartDate(newStartDate);
            setEndDate(newEndDate);
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <RunQueryButton
          disabled={isProcessing}
          onClick={() => {
            handleRunQuery(selectedQuery);
          }}
          showShortcut
        />
        {shouldShowBatchCount && (
          <span
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginTop: "7px",
            }}
          >
            {batchCount} batches
          </span>
        )}
      </div>

      {isProcessing && currentRunningQuery && (
        <ResultsBox>
          <h4 style={{ marginTop: "0px" }}>
            Currently processing "{currentRunningQuery}"
          </h4>
          <ProgressLabel
            currentProgress={currentProgress}
            totalProgress={totalProgress}
          />
          <ProgressBar
            currentProgress={currentProgress}
            totalProgress={totalProgress}
          />
        </ResultsBox>
      )}
      {queryResult && (
        <>
          <h3 style={{ marginBottom: "10px" }}>Results</h3>
          <ResultsBox>
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                style={{
                  border: "1px solidrgb(150, 234, 153)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  background: "#fff",
                  color: "#388e3c",
                  fontSize: "12px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e7f6e7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                }}
                onClick={() => {
                  setShowBatchTweetsModal(true);
                }}
              >
                Show Evidence
              </button>
              <CopyButton text={queryResult.result} />
            </div>
            <h4 style={{ marginTop: "0px" }}>
              {queryResult.query} (completed in{" "}
              {(queryResult.runTime / 1000).toFixed(2)} seconds)
            </h4>
            <Markdown remarkPlugins={[remarkGfm]}>
              {queryResult.result}
            </Markdown>
          </ResultsBox>
        </>
      )}
      <div
        style={{
          marginTop: "32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        {FEATURED_QUERIES.map((baseQuery) => {
          const query = replaceAccountName(baseQuery, account.username);
          return (
            <div
              role="button"
              key={baseQuery}
              tabIndex={isProcessing ? -1 : 0}
              aria-disabled={isProcessing}
              style={featuredQueryCardStyle}
              onClick={() => {
                if (isProcessing) return;
                setSelectedQuery(query);
                textareaRef.current?.focus();
              }}
              onKeyDown={(e) => {
                if (isProcessing) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedQuery(query);
                  textareaRef.current?.focus();
                }
              }}
              onMouseEnter={(e) => {
                if (isProcessing) return;
                e.currentTarget.style.background = "#e2e6ea";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f8f9fa";
              }}
            >
              <div
                style={{
                  color: "#0056b3",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {query}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <RunQueryButton
                  disabled={isProcessing}
                  onClick={() => {
                    if (isProcessing) return;
                    setSelectedQuery(query);
                    handleRunQuery(query);
                    textareaRef.current?.focus();
                  }}
                />
              </div>
            </div>
          );
        })}
        <button
          type="button"
          disabled={isProcessing}
          style={browseMoreButtonStyle}
          onClick={() => {
            if (isProcessing) return;
            setExampleQueriesModalIsOpen(true);
          }}
          onMouseEnter={(e) => {
            if (isProcessing) return;
            e.currentTarget.style.background = "#e2e6ea";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8f9fa";
          }}
        >
          Browse more examples...
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
