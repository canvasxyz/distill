import Markdown from "react-markdown";

export function ResultsBox({
  isProcessing,
  queryResult,
}: {
  isProcessing: boolean;
  queryResult: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "16px",
        background: "#f5f5f5",
      }}
    >
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
