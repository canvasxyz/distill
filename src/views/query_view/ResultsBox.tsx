import Markdown from "react-markdown";
import { useState } from "react";

export function ResultsBox({
  isProcessing,
  queryResult,
}: {
  isProcessing: boolean;
  queryResult: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(queryResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

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
      {queryResult && !isProcessing && (
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
      )}
      {isProcessing ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40px",
          }}
        >
          <span
            className="spinner"
            style={{
              width: "24px",
              height: "24px",
              border: "4px solid #ccc",
              borderTop: "4px solid #333",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>
            {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
          </style>
        </div>
      ) : queryResult ? (
        <Markdown>{queryResult}</Markdown>
      ) : (
        "Query result will appear here."
      )}
    </div>
  );
}
