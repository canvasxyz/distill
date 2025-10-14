import { useCallback, useState, useMemo } from "react";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";
import { useStore } from "../../store";
import { db } from "../../db";
import { finalSystemPrompt, submitQuery } from "./ai_utils";
import { useLiveQuery } from "dexie-react-hooks";
import { TweetFrequencyGraph } from "../../components/TweetFrequencyGraph";
import { DateRangePicker } from "../../components/DateRangePicker";

export function CustomQuery() {
  const [queryResult, setQueryResult] = useState("");
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

  const tweetCounts = useMemo(() => {
    if (!allTweets) return [];

    // Group tweets by month
    const monthCounts = new Map<string, number>();
    let minDate = new Date();
    let maxDate = new Date(0);

    allTweets.forEach((tweet) => {
      const date = new Date(tweet.created_at);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;

      // Group by month (YYYY-MM format)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    // Create array of all months in range
    const counts: { date: string; count: number }[] = [];
    if (allTweets.length > 0) {
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
        counts.push({
          date: `${monthKey}-01`, // Use first day of month for date input compatibility
          count: monthCounts.get(monthKey) || 0,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }

    return counts;
  }, [allTweets]);

  // Get date bounds for date picker
  const dateBounds = useMemo(() => {
    if (tweetCounts.length === 0) return { min: "", max: "" };
    return {
      min: tweetCounts[0].date,
      max: tweetCounts[tweetCounts.length - 1].date,
    };
  }, [tweetCounts]);

  const clickSubmitQuery = useCallback(async () => {
    if (!account) return;

    setIsProcessing(true);

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
      setQueryResult(result!);
    } catch (error) {
      console.error("Error submitting query:", error);
      setQueryResult("Error processing query. Please try again.");
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
    <>
      <h3>Edit custom query</h3>

      {/* Tweet Range Selection */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h4 style={{ marginTop: "0", marginBottom: "15px" }}>
          Select Tweet Range
        </h4>

        {isLoadingGraph ? (
          <div>Loading tweet data...</div>
        ) : tweetCounts.length > 0 ? (
          <>
            <TweetFrequencyGraph
              tweetCounts={tweetCounts}
              startDate={startDate}
              endDate={endDate}
              onRangeSelect={handleRangeSelect}
            />
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              minDate={dateBounds.min}
              maxDate={dateBounds.max}
            />
          </>
        ) : (
          <div>No tweets found in your database.</div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
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

      <div style={{ marginTop: "12px" }}>
        <RunQueryButton onClick={() => clickSubmitQuery()} />
      </div>

      <h3>Results</h3>
      <ResultsBox isProcessing={isProcessing} queryResult={queryResult} />
    </>
  );
}
