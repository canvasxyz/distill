export const DEFAULT_QUERY_BATCH_SIZE = 2500;
export const GEMINI_FLASH_QUERY_BATCH_SIZE = 20000;
export const MAX_ARCHIVE_SIZE = 10000;

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

export const getBatchSizeForConfig = (config?: LLMQueryConfig) =>
  config?.[4] ?? DEFAULT_QUERY_BATCH_SIZE;
