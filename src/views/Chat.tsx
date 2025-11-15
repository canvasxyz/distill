import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources";
import type { ToolCall } from "openai/resources/beta/threads/runs.mjs";

import { supabase } from "../supabase";
import { AVAILABLE_LLM_CONFIGS } from "../state/llm_query";
import { serverUrl } from "./query_view/ai_utils";
import { Header } from "../components/Header";

const callOpenRouterOnce = async (
  openAiMessages: ChatCompletionMessageParam[],
  toolSchemas: ToolSchema[],
) => {
  const body = {
    messages: openAiMessages,
    tools: toolSchemas,
    tool_choice: "auto",
    temperature: 0.2,
  };

  const llmConfigs = AVAILABLE_LLM_CONFIGS;

  const res = await fetch(serverUrl, {
    method: "POST",
    body: JSON.stringify({ params: body, llmConfigs }),
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json as ChatCompletion;
};

// TODO: replace these types with whatever the OpenAI library provides
type ToolSchema = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolHandler = (
  args: ReturnType<typeof JSON.parse>,
) => Promise<ReturnType<typeof JSON.parse>>;

const toolSchemas: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "get_tweets",
      description: "Get tweets matching the given fields",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description:
              "The username of the Twitter users whose tweets are being requested",
          },
          textSearch: {
            type: "string",
            description:
              "A search term for the tweet text, this uses the Postgres FTS feature",
          },
          offset: {
            type: "number",
            description: "An offset which is used to paginate results.",
          },
        },
        required: [],
      },
    },
  },
];

const toolHandlers: Record<string, ToolHandler> = {
  get_tweets: async (args: {
    username?: string;
    textSearch?: string;
    offset?: number;
  }) => {
    const offset = args.offset || 0;
    const limit = 100;

    let queryObj = supabase
      .schema("public")
      .from("tweets")
      .select("tweet_id,full_text,created_at,favorite_count,retweet_count")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);

    if (args.username) {
      const accountIdResponse = await supabase
        .schema("public")
        .from("account")
        .select("account_id")
        .eq("username", args.username)
        .limit(1)
        .maybeSingle();

      const accountId = accountIdResponse.data?.account_id;

      queryObj = queryObj.eq("account_id", accountId);
    }

    if (args.textSearch) {
      queryObj = queryObj.textSearch(
        "full_text",
        args.textSearch.replaceAll(" ", "+"),
      );
    }

    const response = await queryObj;

    return response.data;
  },
};

function Chat() {
  const [messages, setMessages] = useState<
    (ChatCompletionMessageParam & { id: string })[]
  >([]);

  const [toolCalls, setToolCalls] = useState<Record<string, ToolCall>>({});
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Optionally re-focus input when sending (e.g., after pressing 'Send')
  useEffect(() => {
    if (input === "") {
      inputRef.current?.focus();
    }
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    const userMsg: ChatCompletionMessageParam & { id: string } = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    let updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    let lastMsg = updatedMessages[updatedMessages.length - 1];
    do {
      if (lastMsg.role === "assistant" && lastMsg.tool_calls) {
        // compute the tool calls and add them to updatedMessages
        for (const toolCall of lastMsg.tool_calls) {
          // @ts-expect-error the one missing field is 'output' and we don't care about displaying that
          setToolCalls((oldToolCalls) => ({
            ...oldToolCalls,
            [toolCall.id]: { ...toolCall },
          }));
          if (toolCall.type === "function") {
            const toolFunction = toolHandlers[toolCall.function.name];
            const result = await toolFunction(
              JSON.parse(toolCall.function.arguments),
            );

            // construct the response message
            updatedMessages = [
              ...updatedMessages,
              {
                id: crypto.randomUUID(),
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              },
            ];
          }
        }
        setMessages(updatedMessages);
      }

      const result = await callOpenRouterOnce(updatedMessages, toolSchemas);

      const responseMessage = result.choices[0].message;
      const responseMsgWithId = { ...responseMessage, id: crypto.randomUUID() };

      updatedMessages = [...updatedMessages, responseMsgWithId];
      lastMsg = updatedMessages[updatedMessages.length - 1];
    } while (
      lastMsg.role === "user" ||
      (lastMsg.role === "assistant" && lastMsg.tool_calls)
    );

    setMessages(updatedMessages);
  }, [input, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100dvh",
      }}
    >
      <Header
        leftContent={<div style={{ fontWeight: 600 }}>Community Archive Chat</div>}
        rightContent={
          <button
            style={{
              padding: "6px 10px",
              borderRadius: 6,
            }}
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            title="Clear chat"
          >
            Clear
          </button>
        }
      />

      <main style={{ overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            overflowY: "auto",
            padding: 16,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
          ref={listRef}
        >
          {messages.length === 0 ? (
            <div
              style={{ opacity: 0.6, textAlign: "center", marginTop: "10vh" }}
            >
              Ask me something about the Community Archive.
            </div>
          ) : (
            messages.map((m) => {
              let content;
              if (m.role === "tool") {
                const toolCall = toolCalls[m.tool_call_id];
                if (toolCall.type === "function") {
                  content = (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--gray-10)",
                          margin: "0 0 4px 4px",
                        }}
                      >
                        tool: {toolCall.function.name}, args:{" "}
                        {toolCall.function.arguments}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          padding: "10px 12px",
                          borderRadius: 10,
                          lineHeight: 1.35,
                          background: "var(--color-background)",
                          border: "1px solid var(--gray-6)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                          color: "inherit",
                        }}
                      >
                        {m.content.slice(0, 1000) as string}{" "}
                        {m.content.length > 1000 && "..."}
                      </div>
                    </>
                  );
                }
              } else if (m.role === "user") {
                content = (
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 12px",
                      borderRadius: 10,
                      lineHeight: 1.35,
                      background: "var(--sky-9)",
                      color: "var(--sky-12)",
                      border: "1px solid var(--sky-10)",
                    }}
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {m.content as string}
                    </Markdown>
                  </div>
                );
              } else if (m.role === "assistant") {
                content = (
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 12px",
                      borderRadius: 10,
                      lineHeight: 1.35,
                      background: "var(--color-background)",
                      border: "1px solid var(--gray-6)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                      color: "inherit",
                    }}
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {m.content as string}
                    </Markdown>
                    {(m.tool_calls || []).map((toolCall) => {
                      if (toolCall.type === "function") {
                        return (
                          <span key={toolCall.id}>
                            tool: {toolCall.function.name}, args:{" "}
                            {toolCall.function.arguments}
                          </span>
                        );
                      }
                    })}
                  </div>
                );
              }
              if (content) {
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: 800,
                      ...(m.role === "user" || m.role === "tool"
                        ? { alignSelf: "flex-end", textAlign: "right" }
                        : { alignSelf: "flex-start", textAlign: "left" }),
                    }}
                  >
                    {content}
                  </div>
                );
              }
            })
          )}
        </div>
      </main>

      <footer
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          padding: 10,
          background: "var(--gray-3)",
          borderTop: "1px solid var(--gray-6)",
        }}
      >
        <input
          ref={inputRef}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--gray-7)",
            outline: "none",
            background: "var(--color-background)",
            color: "var(--gray-12)",
          }}
          placeholder="Type a message and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid var(--sky-10)",
            background: "var(--sky-9)",
            color: "var(--sky-12)",
            cursor: input.trim() ? "pointer" : "not-allowed",
            opacity: input.trim() ? 1 : 0.5,
          }}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Send
        </button>
      </footer>
    </div>
  );
}

export default Chat;
