import { useState } from "react";
import { useStore } from "../store";
import { ShowIfTweetsLoaded } from "./ShowIfTweetsLoaded";

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
  const { account } = useStore();
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
            <RunQueryButton
              onClick={() => {
                console.log("running query ", query);
              }}
            />
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
        {queryResult ? queryResult : "Query result will appear here."}
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
