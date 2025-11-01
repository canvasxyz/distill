import { useStore } from "../../state/store";
import { useNavigate, useLocation } from "react-router";
import type { QueryResult, RangeSelection } from "./ai_utils";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = location.pathname === `/query/${query.id}`;

  return (
    <div
      onClick={() => navigate(`/query/${query.id}`)}
      style={{
        cursor: "pointer",
        padding: "10px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        transition: "background 0.12s",
        background: isActive ? "#e3f2fd" : undefined,
        borderLeft: isActive ? "3px solid #1976d2" : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "#f7faff";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "";
        }
      }}
    >
      <span
        style={{
          fontWeight: isActive ? 600 : 500,
          fontSize: "13px",
          wordBreak: "break-word",
          color: isActive ? "#1976d2" : "#333",
        }}
      >
        {query.query.length > 80 ? query.query.slice(0, 80) + "…" : query.query}
      </span>
      <span
        style={{
          color: "#888",
          fontSize: "11px",
          fontWeight: 400,
        }}
      >
        {formatDateTime(query.id)}
      </span>
    </div>
  );
}

export function PastQueries() {
  const { account, queryResults } = useStore();

  if (!account) return <></>;

  if (!queryResults || queryResults.length === 0) {
    return (
      <div
        style={{
          padding: "20px 18px",
          color: "#888",
          fontSize: "13px",
          fontStyle: "italic",
        }}
      >
        No past queries yet
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {queryResults.map((query) => (
        <PastQueryItem key={query.id} query={query} />
      ))}
    </div>
  );
}
