import type { ChatCompletionAssistantMessageParam } from "openai/resources";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Tool } from "./tools/type";

export const AssistantChatMessage = ({
  message,
  toolsByName,
}: {
  message: ChatCompletionAssistantMessageParam;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolsByName: Record<string, Tool<any, any>>;
}) => (
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
    <Markdown remarkPlugins={[remarkGfm]}>{message.content as string}</Markdown>
    {(message.tool_calls || []).map((toolCall) => {
      if (toolCall.type === "function") {
        const tool = toolsByName[toolCall.function!.name];
        return (
          <span key={toolCall.id}>
            {tool.getLabel(JSON.parse(toolCall.function.arguments))}
          </span>
        );
      }
    })}
  </div>
);
