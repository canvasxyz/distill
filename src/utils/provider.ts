import type { LLMQueryProvider } from "../constants";

const API_KEY_STORAGE_KEYS: Record<LLMQueryProvider, string> = {
  cerebras: "cerebras_api_key",
  deepinfra: "deepinfra_api_key",
  openrouter: "openrouter_api_key",
  groq: "groq_api_key",
  fireworks: "fireworks_api_key",
};

const PROVIDER_URLS: Record<LLMQueryProvider, string> = {
  cerebras: "https://api.cerebras.ai/v1",
  deepinfra: "https://api.deepinfra.com/v1/openai",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  fireworks: "https://api.fireworks.ai/inference/v1",
};

const SELECTED_PROVIDER_STORAGE_KEY = "selected_llm_provider";

export function getStoredApiKey(provider: LLMQueryProvider): string {
  try {
    const key = localStorage.getItem(API_KEY_STORAGE_KEYS[provider]);
    return key || "";
  } catch {
    return "";
  }
}

export function setStoredApiKey(provider: LLMQueryProvider, value: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEYS[provider], value);
  } catch {
    // ignore
  }
}

export function getSelectedProvider(): LLMQueryProvider | null {
  try {
    const stored = localStorage.getItem(SELECTED_PROVIDER_STORAGE_KEY);
    if (stored && (stored === "cerebras" || stored === "deepinfra" || stored === "openrouter" || stored === "groq" || stored === "fireworks")) {
      return stored as LLMQueryProvider;
    }
  } catch {
    // ignore
  }
  return null;
}

export function setSelectedProvider(provider: LLMQueryProvider | null): void {
  try {
    if (provider === null) {
      localStorage.removeItem(SELECTED_PROVIDER_STORAGE_KEY);
    } else {
      localStorage.setItem(SELECTED_PROVIDER_STORAGE_KEY, provider);
    }
  } catch {
    // ignore
  }
}

export function getProviderUrl(provider: LLMQueryProvider): string {
  return PROVIDER_URLS[provider];
}

export function getProviderApiKey(provider: LLMQueryProvider): string {
  return getStoredApiKey(provider);
}

export function hasProviderApiKey(provider: LLMQueryProvider): boolean {
  return getStoredApiKey(provider).length > 0;
}
