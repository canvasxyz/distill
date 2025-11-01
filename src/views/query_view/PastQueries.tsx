import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge, Box, Button, Card, Flex, Grid, Text } from "@radix-ui/themes";
import {
  CalendarIcon,
  ClockIcon,
  LightningBoltIcon,
} from "@radix-ui/react-icons";
import { useStore } from "../../state/store";
import type { QueryResult, RangeSelection } from "./ai_utils";
import { CopyButton } from "./ResultsBox";
import { stripThink } from "../../utils";
import { BatchTweetsModal } from "./BatchTweetsModal";

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "";
  // dateStr could be an ISO datetime or undefined
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return (
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatRangeSelection(rangeSelection?: RangeSelection) {
  if (!rangeSelection) return "latest tweets";
  return rangeSelection.type === "date-range"
    ? `${formatDateTime(rangeSelection.startDate)} - ${formatDateTime(
        rangeSelection.endDate,
      )}`
    : `latest ${rangeSelection.numTweets} tweets`;
}

function PastQueryItem({ query }: { query: QueryResult }) {
  const [open, setOpen] = useState(false);
  const [showBatchTweetsModal, setShowBatchTweetsModal] = useState(false);

  return (
    <Card
      variant="surface"
      role="group"
      style={{ borderColor: open ? "var(--indigo-a6)" : undefined }}
    >
      <Box
        onClick={() => setOpen((current) => !current)}
        style={{ cursor: "pointer", padding: "16px" }}
      >
        <Flex align="center" gap="3" wrap="wrap">
          <Text weight="medium" style={{ flex: 1, minWidth: "180px" }}>
            {query.query.length > 120
              ? `${query.query.slice(0, 120)}…`
              : query.query}
          </Text>
          <Badge color="gray" variant="soft">
            {formatRangeSelection(query.rangeSelection)}
          </Badge>
          <Flex align="center" gap="2">
            <CalendarIcon aria-hidden />
            <Text size="1" color="gray">
              {formatDateTime(query.id)}
            </Text>
          </Flex>
        </Flex>
      </Box>
      {open && (
        <Box px="4" pb="4">
          <Box
            px="3"
            py="3"
            style={{
              borderRadius: "var(--radius-3)",
              border: "1px solid var(--gray-a5)",
              backgroundColor: "var(--gray-2)",
            }}
          >
            <Flex justify="end" gap="2" mb="2">
              <Button
                variant="outline"
                size="2"
                color="green"
                onClick={() => setShowBatchTweetsModal(true)}
              >
                Evidence
              </Button>
              <CopyButton text={query.result} />
            </Flex>
            <Markdown remarkPlugins={[remarkGfm]}>
              {stripThink(query.result)}
            </Markdown>
          </Box>
          <Grid columns={{ initial: "1", sm: "2" }} gap="3" mt="3">
            <Flex align="center" gap="2">
              <ClockIcon aria-hidden />
              <Text size="2" color="gray">
                <Text as="span" weight="medium" color="green">
                  Total Run Time:
                </Text>{" "}
                {(query.totalRunTime / 1000).toFixed(2)}s
              </Text>
            </Flex>
            <Text size="2" color="gray">
              <Text as="span" weight="medium" color="gold">
                Range:
              </Text>{" "}
              {formatRangeSelection(query.rangeSelection)}
            </Text>
            <Text size="2" color="gray">
              <Text as="span" weight="medium" color="indigo">
                Provider:
              </Text>{" "}
              {query.provider}
            </Text>
            <Text size="2" color="gray">
              <Text as="span" weight="medium" color="crimson">
                Model:
              </Text>{" "}
              {query.model}
            </Text>
            <Flex align="center" gap="2">
              <LightningBoltIcon aria-hidden />
              <Text size="2" color="gray">
                <Text as="span" weight="medium" color="crimson">
                  Tokens:
                </Text>{" "}
                {query.totalTokens}
              </Text>
            </Flex>
          </Grid>
        </Box>
      )}
      <BatchTweetsModal
        isOpen={showBatchTweetsModal}
        queryResult={query}
        onClose={() => setShowBatchTweetsModal(false)}
      />
    </Card>
  );
}

export function PastQueries() {
  const { account, queryResults } = useStore();

  if (!account) return <></>;

  return (
    <Flex direction="column" gap="3">
      {(queryResults || []).map((query) => (
        <PastQueryItem key={query.id} query={query} />
      ))}
    </Flex>
  );
}
