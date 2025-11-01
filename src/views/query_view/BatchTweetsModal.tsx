import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Dialog,
  Flex,
  IconButton,
  ScrollArea,
  Tabs,
  Text,
} from "@radix-ui/themes";
import { Cross2Icon } from "@radix-ui/react-icons";
import { type QueryResult } from "./ai_utils";

export function BatchTweetsModal({
  queryResult,
  isOpen,
  onClose,
}: {
  queryResult: QueryResult | null;
  isOpen: boolean;
  onClose: () => void;
}) {

  const batchTweets = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweetTexts.genuine)
      .flat()
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const batchHallucinations = useMemo(() => {
    if (!queryResult) return [];
    return Object.values(queryResult?.batchStatuses)
      .filter((batchStatus) => batchStatus.status === "done")
      .map((batchStatus) => batchStatus.groundedTweetTexts.hallucinated)
      .flat()
      .map((tweetText) => ({ full_text: tweetText }));
  }, [queryResult]);

  const TABS = [
    { label: "Evidence", key: "evidence", count: batchTweets.length },
    {
      label: "Possible Hallucinations",
      key: "hallucinations",
      count: batchHallucinations.length,
    },
  ];
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  if (!isOpen) return null;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content size="4" maxWidth="720px">
        <Flex align="start" justify="between" mb="3">
          <Dialog.Title>Evidence</Dialog.Title>
          <IconButton
            variant="ghost"
            color="gray"
            size="2"
            aria-label="Close modal"
            onClick={onClose}
          >
            <Cross2Icon />
          </IconButton>
        </Flex>
        <Dialog.Description size="2" color="gray" mb="3">
          To generate the query result, Twitter Archive Explorer first extracts
          the most relevant tweets from the user's archive using a large language
          model. The retrieved tweets are then checked against the archive itself
          for "hallucinations". Only tweets that are actually present in the archive
          are used to generate the final result.
        </Dialog.Description>
        <Text size="2" color="gray" mb="3">
          Model: {queryResult?.model} on {queryResult?.provider}
        </Text>
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List mb="3">
            {TABS.map((tab) => (
              <Tabs.Trigger key={tab.key} value={tab.key}>
                <Flex align="center" gap="2">
                  <Text>{tab.label}</Text>
                  <Badge radius="full" variant="soft">{tab.count}</Badge>
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Tabs.Content value="evidence">
            <ScrollArea type="auto" style={{ maxHeight: "54vh" }}>
              <Flex direction="column">
                {batchTweets.map((batchTweet, idx) => (
                  <Box
                    key={idx}
                    py="2"
                    style={{
                      borderBottom:
                        idx !== batchTweets.length - 1
                          ? "1px solid var(--gray-a5)"
                          : undefined,
                    }}
                  >
                    <Text size="2">{batchTweet.full_text}</Text>
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          </Tabs.Content>
          <Tabs.Content value="hallucinations">
            <ScrollArea type="auto" style={{ maxHeight: "54vh" }}>
              <Flex direction="column">
                {batchHallucinations.map((batchTweet, idx) => (
                  <Box
                    key={idx}
                    py="2"
                    style={{
                      borderBottom:
                        idx !== batchHallucinations.length - 1
                          ? "1px solid var(--gray-a5)"
                          : undefined,
                    }}
                  >
                    <Text size="2">{batchTweet.full_text}</Text>
                  </Box>
                ))}
              </Flex>
            </ScrollArea>
          </Tabs.Content>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
