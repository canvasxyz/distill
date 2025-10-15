import {
  batchSystemPrompt,
  finalSystemPrompt,
  submitQuery,
  type QueryResult,
} from "./ai_utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../../db";
import { useStore } from "../../store";
import { RunQueryButton } from "./RunQueryButton";
import { CopyButton, ProcessingInfo, ResultsBox } from "./ResultsBox";
import PQueue from "p-queue";
import type { Tweet } from "../../types";
import { ExampleQueriesModal } from "./ExampleQueriesModal";
import { EXAMPLE_QUERIES } from "./example_queries";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BatchStatus =
  | { status: "done"; result: string[]; runTime: number }
  | { status: "pending" }
  | { status: "queued" };

async function getBatches(tweetsToAnalyse: Tweet[], batchSize: number) {
  let offset = 0;

  const batches = [];
  let batch: Tweet[];
  do {
    batch = tweetsToAnalyse.slice(offset, offset + batchSize);

    batches.push(batch);

    offset += batchSize;
  } while (batch.length === batchSize);

  return batches;
}

export function RunQueries() {
  const [exampleQueriesModalIsOpen, setExampleQueriesModalIsOpen] =
    useState(false);
  const [selectedQuery, setSelectedQuery] = useState("");

  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startedProcessingTime, setStartedProcessingTime] = useState<
    null | number
  >(null);

  const [currentRunningQuery, setCurrentRunningQuery] = useState<string | null>(
    null
  );
  const [batchStatuses, setBatchStatuses] = useState<Record<
    string,
    BatchStatus
  > | null>(null);

  const { account } = useStore();

  const clickSubmitQuery = useCallback(
    async (query: string) => {
      if (!account) return;

      setIsProcessing(true);
      setCurrentRunningQuery(query);

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
      const concurrency = 30;
      const queue = new PQueue({ concurrency });

      const batchSize = 1000;
      const batches = await getBatches(tweetsToAnalyse, batchSize);

      const initialBatchStatuses = Object.fromEntries(
        batches.map((_tweets, idx) => [idx, { status: "queued" as const }])
      );

      setBatchStatuses(initialBatchStatuses);
      setStartedProcessingTime(performance.now());

      console.log(
        `Starting LLM query with concurrency=${concurrency}, n=${tweetsToAnalyse.length}, batchSize=${batchSize}`
      );
      console.log(`Prompt: "${query}"`);

      for (let i = 0; i < batches.length; i++) {
        const batchId = i;
        const batch = batches[batchId];

        queue.add(async () => {
          // console.log(`Processing batch ${i}`);
          setBatchStatuses((oldBatchStatuses) => ({
            ...oldBatchStatuses,
            [batchId]: { status: "pending" },
          }));

          // const batchStartTime = performance.now();
          const queryResult = await submitQuery(
            batch,
            { systemPrompt: batchSystemPrompt, prompt: query },
            account
          );
          const tweetMatches =
            queryResult.result.match(/<Tweet>([\s\S]*?)<\/Tweet>/g) || [];
          const tweetTexts = tweetMatches.map((m) =>
            m
              .replace(/^<Tweet>/, "")
              .replace(/<\/Tweet>$/, "")
              .trim()
          );
          // const batchEndTime = performance.now();

          // console.log(
          //   `Batch ${i} processed in ${batchEndTime - batchStartTime} ms`
          // );
          setBatchStatuses((oldBatchStatuses) => ({
            ...oldBatchStatuses,
            [batchId]: {
              status: "done",
              result: tweetTexts,
              runTime: queryResult.runTime,
            },
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

    console.log(`LLM query finished!`);
    const allTweetTexts = Object.values(
      batchStatuses as unknown as { result: string }[]
    )
      .map((batchStatus) => batchStatus.result)
      .flat();

    // submit query to create the final result based on the collected texts
    submitQuery(
      allTweetTexts.map((tweetText) => ({ full_text: tweetText })),
      { systemPrompt: finalSystemPrompt, prompt: currentRunningQuery },
      account
    ).then((result) => {
      const finalTime = performance.now();
      const totalRunTime = finalTime - startedProcessingTime!;
      setQueryResult({ ...result, totalRunTime });
      setIsProcessing(false);
      setBatchStatuses(null);
    });
  }, [batchStatuses, account, currentRunningQuery, startedProcessingTime]);

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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <textarea
          value={selectedQuery}
          onChange={(e) => setSelectedQuery(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            minHeight: "60px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            flex: 1,
            boxSizing: "border-box",
          }}
          placeholder="Type your query here..."
        />
        <button
          onClick={() => setExampleQueriesModalIsOpen(true)}
          style={{
            padding: "0 18px",
            background: "#f8f9fa",
            color: "#007bff",
            border: "1px solid #007bff",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            transition: "background 0.2s, color 0.2s",
            display: "flex",
            alignItems: "center",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#e2e6ea";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#f8f9fa";
          }}
        >
          Browse Examples
        </button>
      </div>
      {/* Checkboxes for includeReplies and includeRetweets */}
      <div style={{ display: "flex", gap: "24px" }}>
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
          flexDirection: "row",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="radio"
            name="archiveMode"
            checked={true}
            disabled
            readOnly
            style={{ accentColor: "#007bff" }}
          />
          Whole Archive
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: 0.48,
          }}
        >
          <input
            type="radio"
            name="archiveMode"
            checked={false}
            disabled
            readOnly
          />
          Random Sample (not implemented yet)
        </label>
      </div>
      <div>
        <RunQueryButton onClick={() => clickSubmitQuery(selectedQuery)} />
      </div>

      {isProcessing && (
        <ResultsBox>
          <ProcessingInfo
            title={currentRunningQuery!}
            currentProgress={currentProgress}
            totalProgress={totalProgress}
          />
        </ResultsBox>
      )}
      {queryResult && (
        <>
          <h3 style={{ marginBottom: "10px" }}>Results</h3>
          <ResultsBox>
            <CopyButton text={queryResult.result} />
            <h4>
              {queryResult.query} (completed in{" "}
              {(queryResult.runTime / 1000).toFixed(2)} seconds)
            </h4>
            <Markdown remarkPlugins={[remarkGfm]}>
              {queryResult.result}
            </Markdown>
          </ResultsBox>
        </>
      )}
      <ExampleQueriesModal
        queries={EXAMPLE_QUERIES}
        isOpen={exampleQueriesModalIsOpen}
        onClose={() => {
          setExampleQueriesModalIsOpen(false);
        }}
        onSelectQuery={(query) => {
          console.log(`query "${query}" was selected`);
          setSelectedQuery(query);
          setExampleQueriesModalIsOpen(false);
        }}
      />
    </div>
  );
}
