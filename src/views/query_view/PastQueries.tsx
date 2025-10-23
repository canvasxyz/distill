import { useStore } from "../../state/store";

import { useState } from "react";
import type { QueryResult, RangeSelection } from "./ai_utils";
import { CopyButton } from "./ResultsBox";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripThink } from "../../utils";

function formatDateTime(dateStr?: string) {
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

function formatRangeSelection(rangeSelection: RangeSelection) {
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : rangeSelection.type === "random-sample"
      ? `random sample of ${rangeSelection.sampleSize} tweets`
      : `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#fff",
        overflow: "hidden",
        boxShadow: open ? "0px 2px 10px #eee" : undefined,
      }}
    >
      <div
        onClick={() => setOpen((open) => !open)}
        style={{
          cursor: "pointer",
          padding: "10px 18px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "12px",
          fontWeight: 500,
          transition: "background 0.12s",
        }}
      >
        <span style={{ flexGrow: 1, wordBreak: "break-word" }}>
          {query.query.length > 120
            ? query.query.slice(0, 120) + "…"
            : query.query}
        </span>
        <span
          style={{
            color: "#888",
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
            color: "#aaa",
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
      </div>
      {open && (
        <div
          onClick={() => setOpen((open) => !open)}
          style={{ padding: "20px" }}
        >
          <div
            style={{
              fontFamily: "inherit",
              fontSize: "15px",
              color: "#0c254d",
              borderRadius: "4px",
              border: "1px solid #aaa",
              padding: "10px 12px",
              position: "relative",
              marginBottom: "4px",
              minHeight: "32px",
            }}
          >
            <CopyButton text={query.result} />
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(query.result)}
            </Markdown>
          </div>
          <div
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#888",
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <span>
              <span style={{ color: "#62b47a", fontWeight: 500 }}>
                Total Run Time:
              </span>{" "}
              {(query.totalRunTime / 1000).toFixed(2)}s
            </span>
            <span>
              <span style={{ color: "#baac4e", fontWeight: 500 }}>Range:</span>{" "}
              {formatRangeSelection(query.rangeSelection)}
            </span>
            <span>
              <span style={{ color: "#4e52ba", fontWeight: 500 }}>
                Provider:
              </span>{" "}
              {query.provider}
            </span>
            <span>
              <span style={{ color: "#bf4962", fontWeight: 500 }}>Model:</span>{" "}
              {query.model}
            </span>
            <span>
              <span style={{ color: "#bf4962", fontWeight: 500 }}>Tokens:</span>{" "}
              {query.totalTokens}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function PastQueries() {
  const { account, queryResults } = useStore();

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
        <PastQueryItem query={query} />
      ))}
    </div>
  );
}
