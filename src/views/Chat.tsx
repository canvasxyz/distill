import { useCallback, useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import type { ToolCall } from "openai/resources/beta/threads/runs.mjs";

import { supabase } from "../supabase";
import { AVAILABLE_LLM_CONFIGS, getGenuineTweetIds } from "../state/llm_query";
import {
  batchSystemPrompt,
  finalSystemPrompt,
  serverUrl,
  submitQuery,
} from "./query_view/ai_utils";
import { Header } from "../components/Header";
import { Button } from "@radix-ui/themes";
import {
  getSelectedProvider,
  getProviderUrl,
  getProviderApiKey,
} from "../utils/provider";
import { QUERY_BATCH_SIZE, type LLMQueryConfig } from "../constants";
import { mapKeysDeep, snakeToCamelCase } from "../utils";
import type { Account } from "../types";

const callOpenRouterOnce = async (
  openAiMessages: ChatCompletionMessageParam[],
  toolSchemas: ChatCompletionTool[],
) => {
  const body = {
    messages: openAiMessages,
    tools: toolSchemas,
    tool_choice: "auto",
    temperature: 0.2,
  };

  // Check if user has selected a provider to use directly
  const selectedProvider = getSelectedProvider();
  let json: ChatCompletion;

  if (selectedProvider && getProviderApiKey(selectedProvider)) {
    // Use direct provider API call
    const providerUrl = getProviderUrl(selectedProvider);
    const providerApiKey = getProviderApiKey(selectedProvider);

    const res = await fetch(`${providerUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Provider error ${res.status}: ${text}`);
    }
    json = (await res.json()) as ChatCompletion;
  } else {
    // Use proxy server (default behavior)
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
    json = (await res.json()) as ChatCompletion;
  }

  return json;
};

export type ToolHandler = (
  args: ReturnType<typeof JSON.parse>,
) => Promise<ReturnType<typeof JSON.parse>>;

const askQuestionSchema = {
  type: "function" as const,
  function: {
    name: "ask_question",
    description:
      "Try to generate a report that answers a question about a user's tweets",
    parameters: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description:
            "The username of the Twitter user that we want to ask a question about",
        },
        question: {
          type: "string",
          description: "The question itself",
        },
        includeRetweets: {
          type: "boolean",
          description: "Whether to include retweets",
        },
      },
      required: ["username", "question", "includeRetweets"],
    },
  },
};

const getTweetsSchema = {
  type: "function" as const,
  function: {
    name: "get_more_tweets",
    description:
      "Get additional tweets matching the given fields. Only use this if you really need more information.",
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
};

const toolHandlers: Record<string, ToolHandler> = {
  ask_question: async (args: {
    username: string;
    question: string;
    includeRetweets: boolean;
  }) => {
    const { username, question } = args;
    const query = question;

    const { data: accountData } = await supabase
      .schema("public")
      .from("account")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    const account = mapKeysDeep(accountData, snakeToCamelCase) as Account;

    // get the tweets to analyse
    const config: LLMQueryConfig = AVAILABLE_LLM_CONFIGS[0];

    const [model, provider, openrouterProvider] = config;

    const numBatches = 3;

    const collectedTweets = [];

    for (let i = 0; i < numBatches; i++) {
      const { data } = await supabase
        .schema("public")
        .from("tweets")
        .select(
          "tweet_id,account_id,full_text,created_at,favorite_count,retweet_count",
        )
        .eq("account_id", account.accountId)
        .not("full_text", "like", "RT %")
        .order("created_at", { ascending: false })
        .range(QUERY_BATCH_SIZE * i, QUERY_BATCH_SIZE * (i + 1));

      if (!data) {
        break;
      }

      const batch = data.map((tweet) => ({
        ...tweet,
        id: tweet.tweet_id,
        id_str: tweet.tweet_id,
      }));

      const queryResult = await submitQuery({
        tweetsSample: batch,
        query: { systemPrompt: batchSystemPrompt, prompt: query },
        account,
        model,
        provider,
        openrouterProvider: openrouterProvider,
        isBatchRequest: true,
      });

      const tweetIds = JSON.parse(queryResult.result).ids;
      const groundedTweets = getGenuineTweetIds(tweetIds, batch);

      collectedTweets.push(groundedTweets.genuine);
    }

    // submit query to create the final result based on the collected texts
    const finalQueryResult = await submitQuery({
      tweetsSample: collectedTweets.flat(),
      query: { systemPrompt: finalSystemPrompt, prompt: query },
      account,
      model,
      provider,
      openrouterProvider: openrouterProvider,
    });
    return finalQueryResult.result;
  },

  get_more_tweets: async (args: {
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
            setMessages(updatedMessages);
          }
        }
        setMessages(updatedMessages);
      }

      const toolSchemas = [askQuestionSchema, getTweetsSchema];

      const result = await callOpenRouterOnce(updatedMessages, toolSchemas);

      const responseMessage = result.choices[0].message;
      const responseMsgWithId = { ...responseMessage, id: crypto.randomUUID() };

      updatedMessages = [...updatedMessages, responseMsgWithId];
      setMessages(updatedMessages);
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
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Header
        leftContent={
          <div style={{ fontWeight: 600 }}>Archive Chat (Experimental)</div>
        }
        rightContent={
          <Button
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            title="Clear chat"
            size="2"
            variant="soft"
          >
            Clear
          </Button>
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
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          color="sky"
          size="2"
        >
          Send
        </Button>
      </footer>
    </div>
  );
}

export default Chat;
