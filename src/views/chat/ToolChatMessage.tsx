import type { ChatCompletionToolMessageParam } from "openai/resources";
import type { Tool } from "./tools/type";
import type { ToolCall } from "openai/resources/beta/threads/runs.mjs";

export const ToolChatMessage = ({
  message,
  toolsByName,
  toolCall,
}: {
  message: ChatCompletionToolMessageParam;
  toolCall: ToolCall;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolsByName: Record<string, Tool<any, any>>;
}) => (
  <>
    <div
      style={{
        fontSize: 12,
        color: "var(--gray-10)",
        margin: "0 0 4px 4px",
      }}
    >
      {toolCall.type === "function"
        ? toolsByName[toolCall.function.name].getLabel(
            JSON.parse(toolCall.function.arguments),
          )
        : // we don't need to handle any tool calls other than functions
          ""}
    </div>
    {message.content && (
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
        {message.content.slice(0, 1000) as string}{" "}
        {message.content.length > 1000 && "..."}
      </div>
    )}
  </>
);
