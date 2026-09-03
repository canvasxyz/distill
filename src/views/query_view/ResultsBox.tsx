import { useEffect, useState, type ReactNode } from "react";
import { Flex, Text, Progress } from "@radix-ui/themes";

export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setFailed(true);
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button onClick={handleCopy} className="plain-button" aria-live="polite">
      {copied
        ? "Copied!"
        : failed
          ? "Couldn’t copy. Try again?"
          : "Copy answer"}
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
    <Flex justify="between" align="center" mb="2">
      <Text size="2" color="gray">
        {allBatchesComplete
          ? "Putting the answer together…"
          : "Looking through the tweets…"}
      </Text>
      <Text size="2" color="gray">
        {currentProgress} / {totalProgress}
      </Text>
    </Flex>
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
    <Progress
      value={widthFraction * 100}
      style={{
        height: "8px",
        transition: "width 0.3s ease",
      }}
    />
  );
}

export function ResultsBox({ children }: { children: ReactNode }) {
  return (
    <section className="result-box" aria-label="Answer">
      {children}
    </section>
  );
}

export function QueryResultHeader({
  query,
  subtitle,
}: {
  query: string;
  subtitle?: string;
}) {
  return (
    <header className="result-header">
      <span className="result-kicker">You asked</span>
      <p className="result-question">{query}</p>
      {subtitle && <span className="result-subtitle">{subtitle}</span>}
      <p className="result-caveat">A guess, not a verdict.</p>
    </header>
  );
}

export function QueryResultActions({
  resultText,
  onShowEvidence,
}: {
  resultText: string;
  onShowEvidence: () => void;
}) {
  return (
    <div className="result-actions">
      <button className="plain-button" onClick={onShowEvidence}>
        The tweets behind this ↗
      </button>
      <CopyButton text={resultText} />
    </div>
  );
}
