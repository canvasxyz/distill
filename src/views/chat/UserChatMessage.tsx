import type { ChatCompletionMessageParam } from "openai/resources";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const UserChatMessage = ({
  message,
}: {
  message: ChatCompletionMessageParam;
}) => (
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
    <Markdown remarkPlugins={[remarkGfm]}>{message.content as string}</Markdown>
  </div>
);
