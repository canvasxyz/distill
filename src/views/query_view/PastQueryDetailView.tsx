import { useNavigate, useParams } from "react-router";
import { useStore } from "../../state/store";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { extractTimestampFromUUIDv7, stripThink } from "../../utils";
import { CopyButton, ResultsBox } from "./ResultsBox";
import { BatchTweetsModal } from "./BatchTweetsModal";
import type { RangeSelection } from "./ai_utils";
import { db } from "../../db";
import { Button, Text, Heading } from "@radix-ui/themes";

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
          margin: "auto",
          width: "100%",
        }}
      >
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          size="2"
          style={{ marginBottom: "20px" }}
        >
          ← Back Home
        </Button>
        <Text size="3" color="gray">
          Query not found
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "auto",
        width: "100%",
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
        <Button onClick={() => navigate("/")} variant="outline" size="2">
          ← Back Home
        </Button>

        <Button
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
          variant="outline"
          size="2"
          color="red"
        >
          Delete
        </Button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <Heading size="5" mb="3">
          Query
        </Heading>
        <div
          style={{
            padding: "12px 16px",
            background: "var(--gray-2)",
            border: "1px solid var(--gray-6)",
            borderRadius: "6px",
          }}
        >
          <Text size="3">{query.query}</Text>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Heading size="5" mb="0">
              Result
            </Heading>
            {query.queriedHandle && (
              <Text size="1" color="gray" style={{ marginTop: 4 }}>
                {query.queriedHandle}
              </Text>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            <Button
              className="button-hover-green-3"
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
              onClick={() => {
                setShowBatchTweetsModal(true);
              }}
              size="1"
            >
              Evidence
            </Button>
            <CopyButton text={query.result} />
          </div>
        </div>
        <ResultsBox>
          <Markdown remarkPlugins={[remarkGfm]}>
            {stripThink(query.result)}
          </Markdown>
        </ResultsBox>
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
        <Heading size="4" mb="3">
          Query Details
        </Heading>
        <div style={{ display: "flex", gap: "2px 20px", flexWrap: "wrap" }}>
          <span>
            <span style={{ color: "var(--green-10)", fontWeight: 500 }}>
              Total Run Time:
            </span>{" "}
            {(query.totalRunTime / 1000).toFixed(2)}s
          </span>
          <span>
            <span style={{ color: "var(--red-10)", fontWeight: 500 }}>
              Range:
            </span>{" "}
            {formatRangeSelection(query.rangeSelection)}
          </span>
          <span>
            <span style={{ color: "var(--sky-11)", fontWeight: 500 }}>
              Provider:
            </span>{" "}
            {query.provider}
          </span>
          <span>
            <span style={{ color: "var(--red-10)", fontWeight: 500 }}>
              Model:
            </span>{" "}
            {query.model}
          </span>
          <span>
            <span style={{ color: "var(--red-10)", fontWeight: 500 }}>
              Tokens:
            </span>{" "}
            {query.totalTokens}
          </span>
          <span>
            <span style={{ color: "var(--gray-9)", fontWeight: 500 }}>
              Date:
            </span>{" "}
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
