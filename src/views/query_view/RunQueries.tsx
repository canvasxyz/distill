import {
  batchSystemPrompt,
  finalSystemPrompt,
  replaceAccountName,
  submitQuery,
  type Query,
} from "./ai_utils";
import { useCallback, useState } from "react";
import { db } from "../../db";
import { useStore } from "../../store";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";

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
export function RunQueries() {
  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeRetweets, setIncludeRetweets] = useState(true);
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { account } = useStore();

  const clickSubmitQuery = useCallback(
    async (query: Query) => {
      if (!account) return;

      setIsProcessing(true);
      setProgress({ current: 0, total: 1 });

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

      const batches = [];
      let offset = 0;
      let batch = [];
      const batchSize = 1000;
      let i = 0;
      do {
        batch = tweetsToAnalyse.slice(offset, offset + batchSize);
        batches.push(batch);
        offset += batchSize;
        i++;
      } while (batch.length === batchSize && i < 5);

      // Set total batches for progress tracking
      setProgress({ current: 0, total: batches.length + 1 });

      const allTweetTexts: string[] = [];
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        const result = await submitQuery(
          batch,
          { systemPrompt: batchSystemPrompt, prompt: query.prompt },
          account
        );
        const tweetMatches = result.match(/<Tweet>([\s\S]*?)<\/Tweet>/g) || [];
        const tweetTexts = tweetMatches.map((m) =>
          m
            .replace(/^<Tweet>/, "")
            .replace(/<\/Tweet>$/, "")
            .trim()
        );

        for (const tweetText of tweetTexts) {
          allTweetTexts.push(tweetText);
        }

        // Update progress
        setProgress({ current: batchIndex + 1, total: batches.length + 1 });
      }

      // submit query to create the final result based on the collected texts
      const result = await submitQuery(
        allTweetTexts.map((tweetText) => ({ full_text: tweetText })),
        { systemPrompt: finalSystemPrompt, prompt: query.prompt },
        account
      );

      setQueryResult(result);
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    },
    [account, includeReplies, includeRetweets]
  );

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
        currentProgress={progress.current}
        totalProgress={progress.total}
      />
    </div>
  );
}
