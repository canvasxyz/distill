import {
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
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { account } = useStore();

  const clickSubmitQuery = useCallback(
    async (query: Query) => {
      if (!account) return;

      setIsProcessing(true);

      // get a sample of the latest tweets
      // Query all tweets in db.tweets in batches of `batchSize`
      const batches = [];
      let offset = 0;
      let batch = [];
      const batchSize = 1000;
      let i = 0;
      do {
        batch = await db.tweets.offset(offset).limit(batchSize).toArray();
        batches.push(batch);
        offset += batchSize;
        i++;
      } while (batch.length === batchSize && i < 5);

      // TODO: progress indicator
      const allTweetTexts: string[] = [];
      for (const batch of batches) {
        const result = await submitQuery(batch, query, account);
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
      }

      // submit query to create the final result based on the collected texts

      const result = await submitQuery(
        allTweetTexts.map((tweetText) => ({ full_text: tweetText })),
        { systemPrompt: finalSystemPrompt, prompt: query.prompt },
        account
      );

      setQueryResult(result);
      setIsProcessing(false);
    },
    [account]
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
      <ResultsBox isProcessing={isProcessing} queryResult={queryResult} />
    </div>
  );
}
