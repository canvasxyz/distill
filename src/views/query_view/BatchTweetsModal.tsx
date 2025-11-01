import { useMemo } from "react";
import { type QueryResult } from "./ai_utils";
import { Dialog, Tabs } from "@radix-ui/themes";

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

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: 768 }}>
        <Dialog.Title>Evidence</Dialog.Title>
        <Dialog.Description>
          To generate the query result, Twitter Archive Explorer first extracts
          the most relevant tweets from the user's archive using a large
          language model. The retrieved tweets are then checked against the
          archive itself for "hallucinations". Only tweets that are actually
          present in the archive are used to generate the final result.
        </Dialog.Description>
        <p>
          Model: {queryResult?.model} on {queryResult?.provider}
        </p>

        <Tabs.Root defaultValue="evidence">
          <Tabs.List>
            <Tabs.Trigger value="evidence">
              Evidence ({batchTweets.length})
            </Tabs.Trigger>
            <Tabs.Trigger value="hallucinations">
              Possible Hallucinations ({batchHallucinations.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="evidence">
            <div
              style={{
                maxHeight: "54vh",
                overflowY: "auto",
              }}
            >
              <ul
                style={{
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                }}
              >
                {batchTweets.map((batchTweet, idx) => {
                  return (
                    <li
                      key={idx}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          idx !== batchTweets.length - 1
                            ? "1px solid #eee"
                            : undefined,
                      }}
                    >
                      {batchTweet.full_text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Tabs.Content>

          <Tabs.Content value="hallucinations">
            <div
              style={{
                maxHeight: "54vh",
                overflowY: "auto",
              }}
            >
              <ul
                style={{
                  padding: 0,
                  margin: 0,
                  listStyle: "none",
                }}
              >
                {batchHallucinations.map((batchTweet, idx) => {
                  return (
                    <li
                      key={idx}
                      style={{
                        padding: "10px 0",
                        borderBottom:
                          idx !== batchTweets.length - 1
                            ? "1px solid #eee"
                            : undefined,
                      }}
                    >
                      {batchTweet.full_text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </Dialog.Content>
    </Dialog.Root>
  );
}
