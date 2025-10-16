import { type RangeSelectionType } from "./ai_utils";
import { useCallback, useMemo, useState } from "react";
import { useStore } from "../../state/store";
import { RunQueryButton } from "./RunQueryButton";
import {
  CopyButton,
  ProgressBar,
  ProgressLabel,
  ResultsBox,
} from "./ResultsBox";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import { EXAMPLE_QUERIES } from "./example_queries";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTweetCounts } from "./useTweetCounts";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";

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
    [allTweets, includeReplies, includeRetweets]
  );

  const tweetCounts = useTweetCounts(filteredTweetsToAnalyse);

  const [rangeSelectionType, setRangeSelectionType] =
    useState<RangeSelectionType>("whole-archive");

  const clickSubmitQuery = useCallback(
    (query: string) => {
      if (!filteredTweetsToAnalyse) {
        return;
      }

      submit(filteredTweetsToAnalyse, query, rangeSelectionType, {
        startDate,
        endDate,
      });
    },
    [filteredTweetsToAnalyse, rangeSelectionType, startDate, endDate, submit]
  );

  const [currentProgress, totalProgress] = useMemo(() => {
    if (batchStatuses === null) return [0, 1];
    const currentProgress = Object.values(batchStatuses).filter(
      (status) => status.status === "done"
    ).length;
    const totalProgress = Object.values(batchStatuses).length;
    return [currentProgress, totalProgress];
  }, [batchStatuses]);

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
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <textarea
          value={selectedQuery}
          disabled={isProcessing}
          onChange={(e) => setSelectedQuery(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            minHeight: "60px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            flex: 1,
            boxSizing: "border-box",
          }}
          placeholder="Type your query here..."
        />
        <button
          onClick={() => setExampleQueriesModalIsOpen(true)}
          disabled={isProcessing}
          style={{
            padding: "0 18px",
            background: "#f8f9fa",
            color: "#007bff",
            border: "1px solid #007bff",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            transition: "background 0.2s, color 0.2s",
            display: "flex",
            alignItems: "center",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#e2e6ea";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fa";
          }}
        >
          Browse Examples
        </button>
      </div>
      {/* Checkboxes for includeReplies and includeRetweets */}
      <div style={{ display: "flex", gap: "24px" }}>
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
          Select date range
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
      <div>
        <RunQueryButton onClick={() => clickSubmitQuery(selectedQuery)} />
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
            <CopyButton text={queryResult.result} />
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
    </div>
  );
}
