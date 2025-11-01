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

  const baseClasses =
    "rounded border px-2 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
  const activeClasses = copied
    ? "border-emerald-500 bg-emerald-500 text-white"
    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100";

  return (
    <button onClick={handleCopy} className={`${baseClasses} ${activeClasses}`}>
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
    <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
      <span>
        {allBatchesComplete
          ? "Summarizing results..."
          : "Processing batches..."}
      </span>
      <span>
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
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full bg-emerald-500 transition-all duration-300"
        style={{ width: `${widthFraction * 100}%` }}
      />
    </div>
  );
}

export function ResultsBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-md border border-slate-300 bg-slate-100 p-4">
      {children}
    </div>
  );
}
