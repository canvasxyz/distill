import { useCallback, useState } from "react";
import { RunQueryButton } from "./RunQueryButton";
import { ResultsBox } from "./ResultsBox";
import { useStore } from "../../store";
import { db } from "../../db";
import { defaultSystemPrompt, submitQuery } from "./ai_utils";

export function CustomQuery() {
  const [queryResult, setQueryResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [commandPrompt, setCommandPrompt] = useState("");

  const { account } = useStore();

  const clickSubmitQuery = useCallback(async () => {
    if (!account) return;

    setIsProcessing(true);

    // get a sample of the latest tweets
    const tweetsSample = await db.tweets.limit(1000).toArray();

    const query = {
      systemPrompt: systemPrompt,
      prompt: commandPrompt,
    };

    const result = await submitQuery(tweetsSample, query, account);
    setQueryResult(result!);
    setIsProcessing(false);
  }, [account, systemPrompt, commandPrompt]);

  if (!account) return <></>;

  return (
    <>
      <h3>Edit custom query</h3>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="system-prompt"
          style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}
        >
          System prompt
        </label>
        <textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            minHeight: "80px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          placeholder="Enter the system prompt here..."
        />
      </div>
      <div>
        <label
          htmlFor="command-prompt"
          style={{ display: "block", fontWeight: "bold", marginBottom: "6px" }}
        >
          Command prompt
        </label>
        <textarea
          id="command-prompt"
          value={commandPrompt}
          onChange={(e) => setCommandPrompt(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            minHeight: "80px",
            fontSize: "16px",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          placeholder="Enter the command prompt here..."
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <RunQueryButton onClick={() => clickSubmitQuery()} />
      </div>

      <h3>Results</h3>
      <ResultsBox isProcessing={isProcessing} queryResult={queryResult} />
    </>
  );
}
