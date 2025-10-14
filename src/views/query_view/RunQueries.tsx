import {
  batchSystemPrompt,
  finalSystemPrompt,
  replaceAccountName,
  submitQuery,
} from "./ai_utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../../db";
import { useStore } from "../../store";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";
import PQueue from "p-queue";
import type { Tweet } from "../../types";

const PRESET_QUERIES = [
  "What kinds of topics does {account} post about?",
  "Based on these tweets, what Enneagram type is {account}? If you're unsure, list multiple options.",
  "Based on these tweets, what MBTI is {account}? If you're unsure, list multiple options.",
  "How do I seem to see myself based on my tweets?",
  "What kind of person would someone imagine me to be if they only read my tweets?",
  "What adjectives best describe my online personality?",
  "What are the consistent themes or archetypes I embody (e.g., thinker, rebel, nurturer)?",
  "How authentic do I seem to be in my tweets — do I sound curated or spontaneous?",
  "What kind of reputation might I have built unconsciously over time?",
  "If my tweets were a mirror, what kind of self-image would they reflect?",
  "What emotions do I express most often — and which do I avoid?",
  "What topics or events tend to trigger strong emotional reactions?",
  "Do I tend to seek connection, validation, or expression through tweeting?",
  "How does my emotional tone change over months or years?",
  "When do I sound most alive, passionate, or inspired?",
  "What might my tweets reveal about my coping mechanisms or stress responses?",
  "Is there evidence of emotional growth or healing in my timeline?",
  "What seems to drive me to tweet — attention, reflection, humor, advocacy, curiosity?",
  "What needs (belonging, recognition, control, freedom, etc.) are most visible in my writing?",
  "What am I searching for or trying to prove through my online presence?",
  "What topics make me feel most purposeful or fulfilled?",
  "What ambitions or longings show up between the lines of my tweets?",
  "What do I appear to believe about people, society, or myself?",
  "What moral or philosophical positions do I return to again and again?",
  "Do I come across as idealistic, skeptical, pragmatic, or ironic?",
  "How do I express disagreement or conviction — gently, humorously, or forcefully?",
  "What implicit assumptions or worldviews shape my language?",
  "How do my values seem to evolve over time?",
  "How have I changed as a person since I started tweeting?",
  "What were the main “eras” or turning points in my Twitter life?",
  "Which events or ideas seem to have shifted my perspective most?",
  "Do I show increasing maturity, self-awareness, or openness over time?",
  "What parts of me have stayed consistent despite the years?",
  "What contradictions exist between what I say and how I act?",
  "What fears or insecurities show up indirectly in my tweets?",
  "Are there emotional tones I avoid expressing publicly?",
  "What do I criticize in others that I might also wrestle with myself?",
  "What biases, assumptions, or defensiveness patterns do I reveal?",
  "What kind of inner narrator do I sound like — critic, philosopher, comedian, dreamer?",
  "How does my tone toward myself differ from my tone toward others?",
  "What metaphors or storylines do I unconsciously use to describe life?",
  "If my tweets were chapters of a memoir, what would the chapters be called?",
  "What’s the “thesis statement” of my Twitter presence — the message beneath everything?",
  "Which corner of the internet would claim me as one of their own?",
];

type BatchStatus =
  | { status: "done"; result: string[] }
  | { status: "pending" }
  | { status: "queued" };

async function getBatches(tweetsToAnalyse: Tweet[], batchSize: number) {
  let offset = 0;

  let i = 0;
  const batches = [];
  let batch: Tweet[];
  do {
    batch = tweetsToAnalyse.slice(offset, offset + batchSize);

    batches.push(batch);

    offset += batchSize;
    i++;
  } while (batch.length === batchSize);

  return batches;
}

export function RunQueries() {
  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
      setCurrentRunningQuery(query);

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
          const result = await submitQuery(
            batch,
            { systemPrompt: batchSystemPrompt, prompt: query },
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
          // const batchEndTime = performance.now();

          // console.log(
          //   `Batch ${i} processed in ${batchEndTime - batchStartTime} ms`
          // );
          setBatchStatuses((oldBatchStatuses) => ({
            ...oldBatchStatuses,
            [batchId]: { status: "done", result: tweetTexts },
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
            <span>{replaceAccountName(query, account.username)}</span>
            <RunQueryButton onClick={() => clickSubmitQuery(query)} />
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: "10px" }}>Results</h3>
      <ResultsBox
        title={currentRunningQuery}
        isProcessing={isProcessing}
        queryResult={queryResult}
        currentProgress={currentProgress}
        totalProgress={totalProgress}
      />
    </div>
  );
}
