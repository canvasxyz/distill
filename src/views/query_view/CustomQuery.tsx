import { useCallback, useState } from "react";
import { RunQueryButton } from "./RunQueryButton";
import { CopyButton, ResultsBox } from "./ResultsBox";
import { useStore } from "../../store";
import { db } from "../../db";
import { finalSystemPrompt, submitQuery, type QueryResult } from "./ai_utils";
import { useLiveQuery } from "dexie-react-hooks";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTweetCounts } from "./useTweetCounts";

export function CustomQuery() {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(finalSystemPrompt);
  const [commandPrompt, setCommandPrompt] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const allTweets = useLiveQuery(() =>
    db.tweets
      .filter(
        (tweet) =>
          // !tweet.in_reply_to_status_id &&
          !tweet.full_text.startsWith("RT")
      )
      .toArray()
  );

  const isLoadingGraph = !allTweets;

  const { account } = useStore();

  const tweetCounts = useTweetCounts(allTweets);

  const clickSubmitQuery = useCallback(async () => {
    if (!account) return;

    setIsProcessing(true);
    const startTime = performance.now();

    try {
      // Filter tweets by date range
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      endDateTime.setMonth(endDateTime.getMonth() + 1); // Include the entire end month

      const tweetsSample = await db.tweets
        .filter((tweet) => {
          if (tweet.in_reply_to_status_id || tweet.full_text.startsWith("RT")) {
            return false;
          }

          const tweetDate = new Date(tweet.created_at);
          return tweetDate >= startDateTime && tweetDate < endDateTime;
        })
        .toArray();

      const result = await submitQuery(
        tweetsSample,
        {
          systemPrompt: systemPrompt,
          prompt: commandPrompt,
        },
        account
      );

      const endTime = performance.now();
      const totalRunTime = endTime - startTime;
      setQueryResult({ ...result, totalRunTime });
    } catch (error) {
      console.error("Error submitting query:", error);
      // setQueryResult("Error processing query. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [account, startDate, endDate, systemPrompt, commandPrompt]);

  const handleRangeSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

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
      <h3 style={{ marginBottom: "5px" }}>Edit custom query</h3>

      {/* Tweet Range Selection */}
      <div
        style={{
          paddingLeft: "15px",
          paddingRight: "15px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {isLoadingGraph ? (
          <p>Loading tweet data...</p>
        ) : tweetCounts.length > 0 ? (
          <>
            <TweetFrequencyGraph
              tweetCounts={tweetCounts}
              startDate={startDate}
              endDate={endDate}
              onRangeSelect={handleRangeSelect}
            />
          </>
        ) : (
          <div>No tweets found in your database.</div>
        )}
      </div>

      <div>
        <label
          htmlFor="system-prompt"
          style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}
        >
          System prompt
        </label>
        <textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            minHeight: "80px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          placeholder="Enter the system prompt here..."
        />
      </div>
      <div>
        <label
          htmlFor="command-prompt"
          style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}
        >
          Command prompt
        </label>
        <textarea
          id="command-prompt"
          value={commandPrompt}
          onChange={(e) => setCommandPrompt(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            minHeight: "80px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          placeholder="Enter the command prompt here..."
        />
      </div>

      <div>
        <RunQueryButton onClick={() => clickSubmitQuery()} />
      </div>

      {isProcessing && (
        <ResultsBox>
          <h4>Currently processing "{commandPrompt}"</h4>
        </ResultsBox>
      )}
      {queryResult && (
        <>
          <h3 style={{ marginBottom: "10px" }}>Results</h3>
          <ResultsBox>
            <CopyButton text={queryResult.result} />
            <h4>
              {queryResult.query} (completed in{" "}
              {(queryResult.runTime / 1000).toFixed(2)} seconds)
            </h4>
            <Markdown remarkPlugins={[remarkGfm]}>
              {queryResult.result}
            </Markdown>
          </ResultsBox>
        </>
      )}
    </div>
  );
}
