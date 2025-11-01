import { useEffect, useState, type ReactNode } from "react";

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
      className={`${
        copied ? "bg-[#4CAF50] text-white" : "bg-white text-gray-800 hover:bg-gray-100"
      } border border-gray-300 rounded py-1 px-2 cursor-pointer text-xs transition-all duration-200`}
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
}) => {
  const allBatchesComplete =
    totalProgress > 0 && currentProgress >= totalProgress;

  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-gray-600">
        {allBatchesComplete
          ? "Summarizing results..."
          : "Processing batches..."}
      </span>
      <span className="text-sm text-gray-600">
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
      <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className="h-full bg-[#4CAF50] transition-[width] duration-300 ease-in-out"
          style={{ width: `${widthFraction * 100}%` }}
        />
      </div>
    </>
  );
}

export function ResultsBox({ children }: { children: ReactNode }) {
  return (
    <div className="border border-gray-300 rounded-md p-4 bg-gray-100 relative">
      {children}
    </div>
  );
}
