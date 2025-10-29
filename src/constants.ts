export const QUERY_BATCH_SIZE = 1000;
export const MAX_ARCHIVE_SIZE = 10000;

export type LLMQueryProvider =
  | "cerebras"
  | "deepinfra"
  | "openrouter"
  | "groq"
  | "fireworks";
export type LLMQueryConfig = [string, LLMQueryProvider, string | null];
