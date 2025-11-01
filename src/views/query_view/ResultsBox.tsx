import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@radix-ui/themes";

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
    <Button
      onClick={handleCopy}
      variant="outline"
      color={copied ? "green" : "gray"}
      size="1"
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
};

export const ProgressLabel = ({
  currentProgress,
  totalProgress,
}: {
  currentProgress: number;
  totalProgress: number;
}) => {
  const allBatchesComplete =
    totalProgress > 0 && currentProgress >= totalProgress;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
      }}
    >
      <span style={{ fontSize: "14px", color: "#666" }}>
        {allBatchesComplete
          ? "Summarizing results..."
          : "Processing batches..."}
      </span>
      <span style={{ fontSize: "14px", color: "#666" }}>
        {currentProgress} / {totalProgress}
      </span>
    </div>
  );
};

export function ProgressBar({
  currentProgress,
  totalProgress,
  startedAtMs,
  numBatches,
  isProcessing,
}: {
  currentProgress: number;
  totalProgress: number;
  startedAtMs?: number | null;
  numBatches?: number;
  isProcessing?: boolean;
}) {
  const [nowMs, setNowMs] = useState<number>(0);

  const shouldEase = Boolean(isProcessing) && Boolean(startedAtMs);
  useEffect(() => {
    if (!shouldEase) return;
    const timer = setInterval(() => setNowMs(performance.now()), 20);
    return () => clearInterval(timer);
  }, [shouldEase]);

  let easedFraction = 0;
  if (shouldEase) {
    const EASING_DURATION_MS = 90000; // 90s
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const t = Math.max(
      0,
      Math.min(1, (nowMs - (startedAtMs as number)) / EASING_DURATION_MS),
    );
    const eased = easeOutCubic(t);
    const divisor = numBatches && numBatches > 0 ? numBatches : totalProgress;
    const maxEaseFrac = divisor > 0 ? 1 / divisor : 0;
    easedFraction = eased * maxEaseFrac;
  }

  const baseFraction = totalProgress > 0 ? currentProgress / totalProgress : 0;
  const widthFraction = Math.min(1, baseFraction + easedFraction);

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
            width: `${widthFraction * 100}%`,
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
