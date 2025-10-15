import { useState, type ReactNode } from "react";

export const CopyButton = ({ text }: { text: string }) => {
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

export const ProgressLabel = ({
  currentProgress,
  totalProgress,
}: {
  currentProgress: number;
  totalProgress: number;
}) => (
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
);

export function ProgressBar({
  currentProgress,
  totalProgress,
}: {
  currentProgress: number;
  totalProgress: number;
}) {
  return (
    <>
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
    </>
  );
}

export function ResultsBox({ children }: { children: ReactNode }) {
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
      {children}
    </div>
  );
}
