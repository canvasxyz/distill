import { useMemo, useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useStore } from "../../state/store";
import { stripThink } from "../../utils";
import { BatchTweetsModal } from "./BatchTweetsModal";
import { CopyButton, ResultsBox } from "./ResultsBox";
import { formatDateTime, formatRangeSelection } from "./PastQueries";
import { LoadingView } from "../LoadingView";

export function PastQueryDetailView() {
  const navigate = useNavigate();
  const { queryId } = useParams<{ queryId: string }>();
  const { appIsReady, queryResults } = useStore();
  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  const selectedQuery = useMemo(
    () => queryResults.find((result) => result.id === queryId),
    [queryResults, queryId],
  );

  if (!appIsReady) {
    return <LoadingView />;
  }

  const handleBackClick = () => navigate("/");

  if (!selectedQuery) {
    return (
      <div
        style={{
          padding: "40px 20px",
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <button
          type="button"
          onClick={handleBackClick}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Back to Run Query
        </button>
        <div
          style={{
            background: "#fff8e1",
            border: "1px solid #ffecb3",
            borderRadius: 8,
            padding: "24px",
            color: "#8a6d3b",
            fontSize: 16,
          }}
        >
          Unable to find that past query. It may have been deleted or the link is
          invalid.
        </div>
      </div>
    );
  }

  const metadataStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px 24px",
    fontSize: "14px",
    color: "#444",
    marginTop: "18px",
  };

  const metadataItemLabelStyle: CSSProperties = {
    fontWeight: 600,
    color: "#1d4ed8",
    marginRight: "6px",
  };

  return (
    <div
      style={{
        padding: "40px 24px",
        maxWidth: "960px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <button
        type="button"
        onClick={handleBackClick}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Back to Run Query
      </button>

      <div>
        <h1
          style={{
            marginBottom: "8px",
            fontSize: 28,
            color: "#0c254d",
          }}
        >
          Past Query Details
        </h1>
        <p style={{ margin: 0, color: "#555", fontSize: 15 }}>
          Ran on {formatDateTime(selectedQuery.id)}
        </p>
      </div>

      <ResultsBox>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{selectedQuery.query}</h2>
            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                fontStyle: "italic",
                fontSize: "13px",
                color: "#666",
              }}
            >
              Completed in {(selectedQuery.totalRunTime / 1000).toFixed(2)} s,
              {" "}
              {selectedQuery.totalTokens} tokens
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
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
                height: "fit-content",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e7f6e7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
              onClick={() => setShowBatchTweetsModal(true)}
            >
              Evidence
            </button>
            <CopyButton text={selectedQuery.result} />
          </div>
        </div>
        <Markdown remarkPlugins={[remarkGfm]}>
          {stripThink(selectedQuery.result)}
        </Markdown>
      </ResultsBox>

      <div style={metadataStyle}>
        <span>
          <span style={metadataItemLabelStyle}>Range:</span>
          {formatRangeSelection(selectedQuery.rangeSelection)}
        </span>
        <span>
          <span style={metadataItemLabelStyle}>Provider:</span>
          {selectedQuery.provider}
        </span>
        <span>
          <span style={metadataItemLabelStyle}>Model:</span>
          {selectedQuery.model}
        </span>
        <span>
          <span style={metadataItemLabelStyle}>Estimated Cost:</span>{" "}
          ${selectedQuery.totalEstimatedCost.toFixed(4)}
        </span>
      </div>

      <BatchTweetsModal
        isOpen={showBatchTweetsModal}
        queryResult={selectedQuery}
        onClose={() => setShowBatchTweetsModal(false)}
      />
    </div>
  );
}
