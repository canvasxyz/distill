import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources";
import type { ToolCall } from "openai/resources/beta/threads/runs.mjs";

import { AVAILABLE_LLM_CONFIGS } from "../../state/llm_query";
import { serverUrl } from "../query_view/ai_utils";
import { Header } from "../../components/Header";
import { Button } from "@radix-ui/themes";
import {
  getSelectedProvider,
  getProviderUrl,
  getProviderApiKey,
} from "../../utils/provider";
import { AskQuestion } from "./tools/AskQuestion";
import { GetMoreTweets } from "./tools/GetMoreTweets";
import { UserChatMessage } from "./UserChatMessage";
import { ToolChatMessage } from "./ToolChatMessage";
import { AssistantChatMessage } from "./AssistantChatMessage";

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

const tools = [AskQuestion, GetMoreTweets];
const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

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
            const tool = toolsByName[toolCall.function.name];
            const result = await tool.handler(
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

      const result = await callOpenRouterOnce(
        updatedMessages,
        tools.map((tool) => tool.schema),
      );

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
                // tool response component
                const toolCall = toolCalls[m.tool_call_id];
                content = (
                  <ToolChatMessage
                    message={m}
                    toolCall={toolCall}
                    toolsByName={toolsByName}
                  />
                );
              } else if (m.role === "user") {
                content = <UserChatMessage message={m} />;
              } else if (m.role === "assistant") {
                content = (
                  <AssistantChatMessage message={m} toolsByName={toolsByName} />
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
