import { replaceAccountName, submitQuery, type Query } from "./ai_utils";
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
      const tweetsSample = await db.tweets.limit(1000).toArray();

      const result = await submitQuery(tweetsSample, query, account);
      setQueryResult(result!);
      setIsProcessing(false);
    },
    [account]
  );

  if (!account) return <></>;

  return (
    <>
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
      <h3>Results</h3>
      <ResultsBox isProcessing={isProcessing} queryResult={queryResult} />
    </>
  );
}
