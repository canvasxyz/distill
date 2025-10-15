import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useState } from "react";
import type { QueryResult } from "./ai_utils";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        background: copied ? "#4CAF50" : "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: "12px",
        color: copied ? "#fff" : "#333",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.background = "#f0f0f0";
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

export function ResultsBox({
  title,
  currentProgress,
  totalProgress,
  isProcessing,
  queryResult,
}: {
  title: string | null;
  currentProgress: number;
  totalProgress: number;
  isProcessing: boolean;
  queryResult: QueryResult | null;
}) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "16px",
        background: "#f5f5f5",
        position: "relative",
      }}
    >
      {isProcessing ? (
        <div style={{ marginTop: "16px", marginBottom: "16px" }}>
          <h4>Currently processing "{title}"</h4>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "14px", color: "#666" }}>
              Processing batches...
            </span>
            <span style={{ fontSize: "14px", color: "#666" }}>
              {currentProgress} / {totalProgress}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(currentProgress / totalProgress) * 100}%`,
                height: "100%",
                backgroundColor: "#4CAF50",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      ) : queryResult ? (
        <>
          <CopyButton text={queryResult.result} />
          <h4>
            {title} (completed in {(queryResult.runTime / 1000).toFixed(2)}{" "}
            seconds)
          </h4>
          <Markdown remarkPlugins={[remarkGfm]}>{queryResult.result}</Markdown>
        </>
      ) : (
        "Query result will appear here."
      )}
    </div>
  );
}
