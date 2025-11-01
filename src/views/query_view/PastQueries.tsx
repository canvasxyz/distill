import { useStore } from "../../state/store";

import { useNavigate, useMatch } from "react-router";
import type { QueryResult, RangeSelection } from "./ai_utils";

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  // dateStr could be an ISO datetime or undefined
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

export function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({
  query,
  isActive,
  onSelect,
}: {
  query: QueryResult;
  isActive: boolean;
  onSelect: () => void;
}) {
  const truncatedQuery =
    query.query.length > 120 ? `${query.query.slice(0, 120)}…` : query.query;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? "page" : undefined}
      style={{
        border: "1px solid #d8dee4",
        borderRadius: "6px",
        background: isActive ? "#e7f0ff" : "#fff",
        boxShadow: isActive ? "0 2px 8px rgba(29, 78, 216, 0.18)" : "none",
        cursor: "pointer",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: 500,
        fontSize: "14px",
        width: "100%",
        textAlign: "left",
        color: "#0c254d",
        transition: "background 0.12s ease, box-shadow 0.12s ease",
        outlineOffset: 2,
      }}
      title={query.query}
    >
      <span style={{ flexGrow: 1, wordBreak: "break-word" }}>
        {truncatedQuery}
      </span>
      <span
        style={{
          color: "#666",
          fontSize: "12px",
          fontWeight: 400,
          paddingLeft: "10px",
          marginLeft: "auto",
        }}
      >
        {formatRangeSelection(query.rangeSelection)}
      </span>
      <span
        style={{
          color: "#888",
          fontSize: "11px",
          fontWeight: 400,
          paddingLeft: "12px",
          flexShrink: 0,
          minWidth: "90px",
          textAlign: "right",
        }}
      >
        {formatDateTime(query.id)}
      </span>
    </button>
  );
}

export function PastQueries() {
  const { account, queryResults } = useStore();
  const navigate = useNavigate();
  const match = useMatch("/queries/:queryId");
  const activeQueryId = match?.params?.queryId;

  if (!account) return <></>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingBottom: "20px",
        paddingTop: "20px",
      }}
    >
      {(queryResults || []).map((query) => (
        <PastQueryItem
          key={query.id}
          query={query}
          isActive={query.id === activeQueryId}
          onSelect={() => navigate(`/queries/${query.id}`)}
        />
      ))}
    </div>
  );
}
