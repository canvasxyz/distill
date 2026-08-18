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

// Image generation (avatar) models. All are OpenRouter models that accept
// image input (reference avatar) and return image output.
export type ImageGenModel = { id: string; label: string };
export const IMAGE_GEN_MODELS: ImageGenModel[] = [
  { id: "google/gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image" },
  { id: "google/gemini-3-pro-image", label: "Gemini 3 Pro Image" },
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image" },
  { id: "openai/gpt-5-image", label: "GPT-5 Image" },
  { id: "openai/gpt-5-image-mini", label: "GPT-5 Image Mini" },
];
export const DEFAULT_IMAGE_GEN_MODEL = IMAGE_GEN_MODELS[0].id;

// Models that accept image_url content parts, so we can pass the user's
// avatar alongside their tweets when running a text query.
export const VISION_CAPABLE_MODELS = new Set<string>([
  "google/gemini-3-flash-preview",
  "google/gemini-2.0-flash-001",
]);
