import { useState } from "react";

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
