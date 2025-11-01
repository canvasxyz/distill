import { useNavigate, useParams } from "react-router";
import { useStore } from "../../state/store";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { stripThink } from "../../utils";
import { CopyButton } from "./ResultsBox";
import { BatchTweetsModal } from "./BatchTweetsModal";
import type { RangeSelection } from "./ai_utils";
import { db } from "../../db";

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

export function PastQueryDetailView() {
  const { queryId } = useParams<{ queryId: string }>();
  const { queryResults } = useStore();
  const navigate = useNavigate();
  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  const query = queryResults?.find((q) => q.id === queryId);

  if (!query) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "#fff",
            color: "#333",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back Home
        </button>
        <div style={{ color: "#888", fontSize: "16px" }}>Query not found</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "#fff",
            color: "#333",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
          }}
        >
          ← Back Home
        </button>

        <button
          aria-label="Delete this query"
          onClick={async () => {
            const ok = confirm("Delete this query? This cannot be undone.");
            if (!ok) return;
            try {
              await db.queryResults.delete(query.id);
            } finally {
              navigate("/");
            }
          }}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "#fff",
            color: "#333",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
          }}
        >
          Delete
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: "20px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          Query
        </h2>
        <div
          style={{
            padding: "12px 16px",
            background: "#f8f9fa",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "15px",
            color: "#333",
          }}
        >
          {query.query}
        </div>
      </div>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 600,
                color: "#333",
              }}
            >
              Result
            </h2>
            {query.queriedHandle && (
              <span style={{ color: "#666", fontSize: "12px", marginTop: 4 }}>
                {query.queriedHandle}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "10px",
            }}
          >
            <button
              style={{
                border: "1px solid rgb(150, 234, 153)",
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
              Evidence
            </button>
            <CopyButton text={query.result} />
          </div>
        </div>
        <div
          style={{
            fontFamily: "inherit",
            fontSize: "15px",
            color: "#0c254d",
            borderRadius: "4px",
            border: "1px solid #aaa",
            padding: "10px 12px",
            background: "#fff",
            minHeight: "32px",
          }}
        >
          <Markdown remarkPlugins={[remarkGfm]}>
            {stripThink(query.result)}
          </Markdown>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          background: "#f8f9fa",
          border: "1px solid #ddd",
          borderRadius: "6px",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#333",
          }}
        >
          Query Details
        </h3>
        <div
          style={{
            fontSize: "14px",
            color: "#555",
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
            <span style={{ color: "#4e52ba", fontWeight: 500 }}>Provider:</span>{" "}
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
          <span>
            <span style={{ color: "#888", fontWeight: 500 }}>Date:</span>{" "}
            {formatDateTime(query.id)}
          </span>
        </div>
      </div>

      <BatchTweetsModal
        isOpen={showBatchTweetsModal}
        queryResult={query}
        onClose={() => setShowBatchTweetsModal(false)}
      />
    </div>
  );
}
