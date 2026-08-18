export const DEFAULT_QUERY_BATCH_SIZE = 1500;
export const GEMINI_FLASH_QUERY_BATCH_SIZE = 7500;

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

// Image generation (avatar) models, tried in order. All are OpenRouter models
// that accept image input (reference avatar) and return image output.
export const IMAGE_GEN_MODELS: string[] = [
  "google/gemini-3.1-flash-image",
  "google/gemini-2.5-flash-image",
];

// Models that accept image_url content parts, so we can pass the user's
// avatar alongside their tweets when running a text query.
export const VISION_CAPABLE_MODELS = new Set<string>([
  "google/gemini-3-flash-preview",
  "google/gemini-2.0-flash-001",
]);
