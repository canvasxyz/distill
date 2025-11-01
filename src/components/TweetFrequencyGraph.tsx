import { useState } from "react";
import { sumNumbers } from "../utils";

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
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const totalTweets = sumNumbers(
    tweetCounts
      .filter((entry) => {
        const entryDateObj = new Date(entry.date);
        return entryDateObj >= startDateObj && entryDateObj <= endDateObj;
      })
      .map((entry) => entry.count),
  );

  if (totalTweets === 0) return null;
  return (
    <span>
      {totalTweets} tweet{totalTweets !== 1 ? "s" : ""}
    </span>
  );
}

const LOG_FUNC = Math.log;

// Tweet frequency graph component
export function TweetFrequencyGraph({
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

  const maxCount = LOG_FUNC(Math.max(...tweetCounts.map((d) => d.count), 1));
  const graphHeight = 100;
  const graphWidth = 760;

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

  const endDateObj = new Date(endDate);
  const endDateLastDayOfMonth = new Date(
    endDateObj.getFullYear(),
    endDateObj.getMonth() + 1,
    0,
  );

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        background: "#fafbfc",
        marginBottom: "12px",
      }}
    >
      <div style={{ fontSize: "16px", color: "#222", marginBottom: 16 }}>
        {tweetCounts.length === 0 || !startDate || !endDate ? (
          "Click and drag to select a date range"
        ) : (
          <>
            Selected{" "}
            <SelectedTweetCount
              tweetCounts={tweetCounts}
              startDate={startDate}
              endDate={endDate}
            />{" "}
            from {new Date(startDate).toLocaleDateString()} -{" "}
            {endDateLastDayOfMonth.toLocaleDateString()}
          </>
        )}
      </div>
      <svg
        width={graphWidth}
        height={graphHeight + 40}
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          cursor: "crosshair",
          background: "#fff",
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {tweetCounts.map((data, index) => {
          const barWidth = graphWidth / tweetCounts.length;
          const barHeight = (LOG_FUNC(data.count) / maxCount) * graphHeight;
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
    </div>
  );
}
