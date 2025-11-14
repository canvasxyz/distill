import { useNavigate, useParams } from "react-router";
import { useStore } from "../../state/store";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractTimestampFromUUIDv7, stripThink } from "../../utils";
import { CopyButton } from "./ResultsBox";
import { BatchTweetsModal } from "./BatchTweetsModal";
import type { RangeSelection } from "./ai_utils";
import { db } from "../../db";

function formatDateTime(d: Date) {
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
    ? `${formatDateTime(new Date(rangeSelection.startDate))} - ${formatDateTime(
        new Date(rangeSelection.endDate),
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
            border: "1px solid var(--gray-6)",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "var(--color-background)",
            color: "var(--gray-12)",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back Home
        </button>
        <div style={{ color: "var(--gray-9)", fontSize: "16px" }}>Query not found</div>
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
            border: "1px solid var(--gray-6)",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "var(--color-background)",
            color: "var(--gray-12)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--gray-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-background)";
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
            border: "1px solid var(--gray-6)",
            borderRadius: "4px",
            padding: "8px 16px",
            background: "var(--color-background)",
            color: "var(--gray-12)",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--gray-3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-background)";
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
            color: "var(--gray-12)",
          }}
        >
          Query
        </h2>
        <div
          style={{
            padding: "12px 16px",
            background: "var(--gray-2)",
            border: "1px solid var(--gray-6)",
            borderRadius: "6px",
            fontSize: "15px",
            color: "var(--gray-12)",
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
                color: "var(--gray-12)",
              }}
            >
              Result
            </h2>
            {query.queriedHandle && (
              <span style={{ color: "var(--gray-10)", fontSize: "12px", marginTop: 4 }}>
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
                border: "1px solid var(--green-6)",
                borderRadius: "4px",
                padding: "4px 8px",
                background: "var(--color-background)",
                color: "var(--green-11)",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--green-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-background)";
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
            color: "var(--gray-12)",
            borderRadius: "4px",
            border: "1px solid var(--gray-7)",
            padding: "10px 12px",
            background: "var(--color-background)",
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
            background: "var(--gray-2)",
            border: "1px solid var(--gray-6)",
            borderRadius: "6px",
          }}
        >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "var(--gray-12)",
          }}
        >
          Query Details
        </h3>
        <div
          style={{
            fontSize: "14px",
            color: "var(--gray-11)",
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <span>
            <span style={{ color: "var(--green-10)", fontWeight: 500 }}>
              Total Run Time:
            </span>{" "}
            {(query.totalRunTime / 1000).toFixed(2)}s
          </span>
          <span>
            <span style={{ color: "var(--yellow-10)", fontWeight: 500 }}>Range:</span>{" "}
            {formatRangeSelection(query.rangeSelection)}
          </span>
          <span>
            <span style={{ color: "var(--sky-11)", fontWeight: 500 }}>Provider:</span>{" "}
            {query.provider}
          </span>
          <span>
            <span style={{ color: "var(--red-10)", fontWeight: 500 }}>Model:</span>{" "}
            {query.model}
          </span>
          <span>
            <span style={{ color: "var(--red-10)", fontWeight: 500 }}>Tokens:</span>{" "}
            {query.totalTokens}
          </span>
          <span>
            <span style={{ color: "var(--gray-9)", fontWeight: 500 }}>Date:</span>{" "}
            {formatDateTime(extractTimestampFromUUIDv7(query.id))}
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
