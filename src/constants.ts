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
// `modalities` is what we request from OpenRouter; image-only models reject
// requests that also ask for text.
export type ImageGenModel = {
  id: string;
  label: string;
  modalities: ("image" | "text")[];
};
export const IMAGE_GEN_MODELS: ImageGenModel[] = [
  { id: "google/gemini-3.1-flash-image", label: "Gemini 3.1 Flash Image", modalities: ["image", "text"] },
  { id: "google/gemini-3-pro-image", label: "Gemini 3 Pro Image", modalities: ["image", "text"] },
  { id: "google/gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image", modalities: ["image", "text"] },
  { id: "openai/gpt-5-image", label: "GPT-5 Image", modalities: ["image", "text"] },
  { id: "openai/gpt-5-image-mini", label: "GPT-5 Image Mini", modalities: ["image", "text"] },
  { id: "x-ai/grok-imagine-image-2.0", label: "Grok Imagine 2.0", modalities: ["image"] },
];
export const getImageGenModel = (id: string): ImageGenModel | undefined =>
  IMAGE_GEN_MODELS.find((m) => m.id === id);
export const DEFAULT_IMAGE_GEN_MODEL = IMAGE_GEN_MODELS[0].id;

// Models that accept image_url content parts, so we can pass the user's
// avatar alongside their tweets when running a text query.
export const VISION_CAPABLE_MODELS = new Set<string>([
  "google/gemini-3-flash-preview",
  "google/gemini-2.0-flash-001",
]);
