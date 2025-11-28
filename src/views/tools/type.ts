import type { ChatCompletionTool } from "openai/resources";

export type Tool<A, R> = {
  name: string;
  schema: ChatCompletionTool;
  handler: (...args: A[]) => R;
  getLabel: (...args: A[]) => string;
};
