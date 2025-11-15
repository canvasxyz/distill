import { useEffect, useState, type ReactNode } from "react";
import { Button, Flex, Text, Progress, Box, Card } from "@radix-ui/themes";

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
      variant={copied ? "solid" : "soft"}
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
    <Flex justify="between" align="center" mb="2">
      <Text size="2" color="gray">
        {allBatchesComplete
          ? "Summarizing results..."
          : "Processing batches..."}
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
    <Card>
      <Box px="3">{children}</Box>
    </Card>
  );
}
