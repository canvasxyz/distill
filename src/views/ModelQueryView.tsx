import { useCallback, useState } from "react";
import { useStore } from "../store";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";
import { db } from "../db";

const systemPrompt =
  "You will be given a prompt, followed by a list of tweets. Review the tweets and provide an answer to the prompt.";

const queries = [
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

function replaceAccountName(text: string, accountName: string) {
  return text.replace("{account}", `@${accountName}`);
}

function RunQueryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      style={{
        marginLeft: "20px",
        padding: "6px 16px",
        borderRadius: "5px",
        border: "1px solid #007bff",
        background: "#007bff",
        color: "white",
        fontWeight: 500,
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#0056b3")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#007bff")}
      // onClick handler to be implemented
    >
      Run query
    </button>
  );
}

function ModelQueryViewInner() {
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { account } = useStore();

  const submitQuery = useCallback(
    async (query: (typeof queries)[0]) => {
      if (!account) return;

      setIsProcessing(true);

      // get a sample of the latest tweets
      const tweetsSample = await db.tweets.limit(1000).toArray();

      const messages = [
        {
          role: "system",
          content: `${systemPrompt}

        ${replaceAccountName(query.prompt, account.username)}`,
        },
        {
          role: "user",
          content: tweetsSample
            .map((tweet) => `<Tweet>${tweet.full_text}</Tweet>`)
            .join("\n"),
        },
      ];

      console.log(messages);

      setIsProcessing(false);
    },
    [account]
  );

  if (!account) return <></>;

  return (
    <div
      style={{
        maxHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingLeft: "10px",
        paddingRight: "10px",
        margin: "0 auto",
        width: "100%",
        maxWidth: "1200px", // limit width for readability on large screens
        boxSizing: "border-box",
      }}
    >
      <h1>Run Queries</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {queries.map((query, idx) => (
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
            <RunQueryButton onClick={() => submitQuery(query)} />
          </div>
        ))}
      </div>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "6px",
          padding: "16px",
          marginTop: "24px",
          background: "#f5f5f5",
        }}
      >
        {isProcessing ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "40px",
            }}
          >
            <span
              className="spinner"
              style={{
                width: "24px",
                height: "24px",
                border: "4px solid #ccc",
                borderTop: "4px solid #333",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 1s linear infinite",
              }}
            />
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg);}
                  100% { transform: rotate(360deg);}
                }
              `}
            </style>
          </div>
        ) : queryResult ? (
          queryResult
        ) : (
          "Query result will appear here."
        )}
      </div>
    </div>
  );
}

export function ModelQueryView() {
  return (
    <ShowIfTweetsLoaded>
      <ModelQueryViewInner />
    </ShowIfTweetsLoaded>
  );
}
