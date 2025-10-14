import { useCallback, useState, useMemo } from "react";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";
import { useStore } from "../../store";
import { db } from "../../db";
import { finalSystemPrompt, submitQuery } from "./ai_utils";
import { useLiveQuery } from "dexie-react-hooks";

// Helper component to show tweet count in a range
export function SelectedTweetCount({
  tweetCounts,
  startDate,
  endDate,
}: {
  tweetCounts: { date: string; count: number }[];
  startDate: string;
  endDate: string;
}) {
  // Filter tweetCounts to only those within the selected date range (inclusive)
  const totalTweets = tweetCounts.reduce((sum, data) => {
    const date = new Date(data.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (date >= start && date <= end) {
      return sum + data.count;
    }
    return sum;
  }, 0);

  if (totalTweets === 0) return null;
  return (
    <div style={{ marginBottom: "8px", color: "#555", fontSize: "14px" }}>
      {totalTweets} tweet{totalTweets !== 1 ? "s" : ""} selected in range.
    </div>
  );
}

// Simple date range picker component
function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div>
        <label
          style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
        >
          From:
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          style={{
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
      <div>
        <label
          style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}
        >
          To:
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={minDate}
          max={maxDate}
          style={{
            padding: "6px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
      </div>
    </div>
  );
}

// Tweet frequency graph component
function TweetFrequencyGraph({
  tweetCounts,
  startDate,
  endDate,
  onRangeSelect,
}: {
  tweetCounts: { date: string; count: number }[];
  startDate: string;
  endDate: string;
  onRangeSelect: (start: string, end: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const maxCount = Math.max(...tweetCounts.map((d) => d.count), 1);
  const graphHeight = 120;
  const graphWidth = 600;

  const handleMouseDown = (_e: React.MouseEvent, index: number) => {
    setIsDragging(true);
    setDragStart(index);
    setDragEnd(index);
  };

  const handleMouseMove = (_e: React.MouseEvent, index: number) => {
    if (isDragging && dragStart !== null) {
      setDragEnd(index);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart !== null && dragEnd !== null) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      onRangeSelect(tweetCounts[start].date, tweetCounts[end].date);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isInSelectedRange = (date: string) => {
    return date >= startDate && date <= endDate;
  };

  const isInDragRange = (index: number) => {
    if (dragStart === null || dragEnd === null) return false;
    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd);
    return index >= start && index <= end;
  };

  console.log(tweetCounts);
  return (
    <div style={{ marginBottom: "20px" }}>
      <h4 style={{ marginBottom: "10px" }}>Tweet Frequency Over Time</h4>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        Click and drag to select a date range
      </p>
      <svg
        width={graphWidth}
        height={graphHeight + 40}
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "crosshair",
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tweetCounts.map((data, index) => {
          const barWidth = graphWidth / tweetCounts.length;
          const barHeight = (data.count / maxCount) * graphHeight;
          const x = index * barWidth;
          const y = graphHeight - barHeight + 20;

          let fillColor = "#e0e0e0";
          if (isInSelectedRange(data.date)) {
            fillColor = "#4CAF50";
          } else if (isDragging && isInDragRange(index)) {
            fillColor = "#81C784";
          }

          return (
            <g key={data.date}>
              <rect
                x={x}
                y={y}
                width={barWidth - 1}
                height={barHeight}
                fill={fillColor}
                onMouseDown={(e) => handleMouseDown(e, index)}
                onMouseMove={(e) => handleMouseMove(e, index)}
                style={{ cursor: "crosshair" }}
              />
              {index % Math.ceil(tweetCounts.length / 8) === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={graphHeight + 35}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#666"
                  style={{ userSelect: "none" }}
                >
                  {new Date(data.date).toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
        Selected range:{" "}
        {tweetCounts.length > 0
          ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
          : "No data"}
      </div>
      <SelectedTweetCount
        tweetCounts={tweetCounts}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}

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
