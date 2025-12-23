export const DEFAULT_QUERY_BATCH_SIZE = 2000;
export const GEMINI_FLASH_QUERY_BATCH_SIZE = 15000;

export type LLMQueryProvider =
  | "cerebras"
  | "deepinfra"
  | "openrouter"
  | "groq"
  | "fireworks";
export type LLMQueryConfig = [
  string,
  LLMQueryProvider,
  string | null,
  boolean,
  number,
];

export type PromptPlacement = "prompt-before" | "prompt-after";

export const getBatchSizeForConfig = (config?: LLMQueryConfig) =>
  config?.[4] ?? DEFAULT_QUERY_BATCH_SIZE;
