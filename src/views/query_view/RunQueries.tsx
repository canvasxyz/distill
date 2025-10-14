import {
  batchSystemPrompt,
  finalSystemPrompt,
  replaceAccountName,
  submitQuery,
  type Query,
} from "./ai_utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../../db";
import { useStore } from "../../store";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";
import PQueue from "p-queue";
import type { Tweet } from "../../types";

const PRESET_QUERIES = [
  { prompt: "What kinds of topics does {account} post about?" },
  {
    prompt:
      "Based on these tweets, what Enneagram type is {account}? If you're unsure, list multiple options.",
  },
  {
    prompt:
      "Based on these tweets, what MBTI is {account}? If you're unsure, list multiple options.",
  },
];

type BatchStatus =
  | { status: "done"; result: string[] }
  | { status: "pending" }
  | { status: "queued" };

export function RunQueries() {
  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentRunningQuery, setCurrentRunningQuery] = useState<Query | null>(
    null
  );
  const [batchStatuses, setBatchStatuses] = useState<Record<
    string,
    BatchStatus
  > | null>(null);

  const { account } = useStore();

  const clickSubmitQuery = useCallback(
    async (query: Query) => {
      if (!account) return;

      setIsProcessing(true);

      // get a sample of the latest tweets
      // Query all tweets in db.tweets in batches of `batchSize`
      const tweetsToAnalyse = await db.tweets
        .filter((tweet) => {
          if (!includeReplies && tweet.in_reply_to_user_id) {
            return false;
          }
          if (!includeRetweets && tweet.full_text.startsWith("RT ")) {
            return false;
          }
          return true;
        })
        .toArray();

      // make a pqueue
      const queue = new PQueue({ concurrency: 10 });

      let offset = 0;
      const batchSize = 1000;
      let i = 0;
      const batches = [];
      let batch: Tweet[];
      const initialBatchStatuses: Record<string, BatchStatus> = {};
      do {
        initialBatchStatuses[`${i}`] = { status: "queued" };
        batch = tweetsToAnalyse.slice(offset, offset + batchSize);

        batches.push(batch);

        offset += batchSize;
        i++;
      } while (batch.length === batchSize);

      setBatchStatuses(initialBatchStatuses);
      setCurrentRunningQuery(query);

      for (let i = 0; i < batches.length; i++) {
        queue.add(async () => {
          setBatchStatuses((oldBatchStatuses) => ({
            ...oldBatchStatuses,
            [i]: { status: "pending" },
          }));

          const result = await submitQuery(
            batch,
            { systemPrompt: batchSystemPrompt, prompt: query.prompt },
            account
          );
          const tweetMatches =
            result.match(/<Tweet>([\s\S]*?)<\/Tweet>/g) || [];
          const tweetTexts = tweetMatches.map((m) =>
            m
              .replace(/^<Tweet>/, "")
              .replace(/<\/Tweet>$/, "")
              .trim()
          );

          setBatchStatuses((oldBatchStatuses) => ({
            ...oldBatchStatuses,
            [i]: { status: "done", result: tweetTexts },
          }));
        });
      }
    },
    [account, includeReplies, includeRetweets]
  );

  useEffect(() => {
    if (batchStatuses === null) return;
    if (!account) return;
    if (!currentRunningQuery) return;

    for (const batchStatus of Object.values(batchStatuses)) {
      if (batchStatus.status !== "done") return;
    }

    const allTweetTexts = Object.values(
      batchStatuses as unknown as { result: string }[]
    )
      .map((batchStatus) => batchStatus.result)
      .flat();

    // submit query to create the final result based on the collected texts
    submitQuery(
      allTweetTexts.map((tweetText) => ({ full_text: tweetText })),
      { systemPrompt: finalSystemPrompt, prompt: currentRunningQuery.prompt },
      account
    ).then((result) => {
      setQueryResult(result);
      setIsProcessing(false);
      setBatchStatuses(null);
    });
  }, [batchStatuses, account, currentRunningQuery]);

  const [currentProgress, totalProgress] = useMemo(() => {
    if (batchStatuses === null) return [0, 1];
    const currentProgress = Object.values(batchStatuses).filter(
      (status) => status.status === "done"
    ).length;
    const totalProgress = Object.values(batchStatuses).length;
    return [currentProgress, totalProgress];
  }, [batchStatuses]);

  if (!account) return <></>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingBottom: "20px",
      }}
    >
      {/* Checkboxes for includeReplies and includeRetweets */}
      <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={includeReplies}
            onChange={(e) => setIncludeReplies(e.target.checked)}
          />
          Include replies
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={includeRetweets}
            onChange={(e) => setIncludeRetweets(e.target.checked)}
          />
          Include retweets
        </label>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        {PRESET_QUERIES.map((query, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "10px",
              background: "#fafbfc",
            }}
          >
            <span>{replaceAccountName(query.prompt, account.username)}</span>
            <RunQueryButton onClick={() => clickSubmitQuery(query)} />
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: "10px" }}>Results</h3>
      <ResultsBox
        isProcessing={isProcessing}
        queryResult={queryResult}
        currentProgress={currentProgress}
        totalProgress={totalProgress}
      />
    </div>
  );
}
