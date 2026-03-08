// AI configuration — manages provider settings in localStorage
// All AI features are opt-in; disabled by default

/** Supported AI providers */
export type AIProvider = "anthropic" | "openai";

/** AI configuration stored in localStorage */
export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
}

/** Default configuration — AI disabled, no key stored */
export const DEFAULT_AI_CONFIG: AIConfig = {
  enabled: false,
  provider: "anthropic",
  apiKey: "",
  model: "claude-sonnet-4-20250514",
};

/** Default model per provider */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
};

/** Available models per provider */
export const AVAILABLE_MODELS: Record<AIProvider, string[]> = {
  anthropic: ["claude-sonnet-4-20250514", "claude-sonnet-4-5-20250514", "claude-haiku-4-20250414"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
};

/** localStorage key for AI config */
const STORAGE_KEY = "shd-planner-ai-config";

/** Load AI config from localStorage, falling back to defaults */
export function getAIConfig(): AIConfig {
  if (typeof window === "undefined") return { ...DEFAULT_AI_CONFIG };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(stored) as Partial<AIConfig>;
    return {
      enabled: parsed.enabled ?? DEFAULT_AI_CONFIG.enabled,
      provider: parsed.provider ?? DEFAULT_AI_CONFIG.provider,
      apiKey: parsed.apiKey ?? DEFAULT_AI_CONFIG.apiKey,
      model: parsed.model ?? DEFAULT_AI_CONFIG.model,
    };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

/** Save partial AI config updates to localStorage */
export function setAIConfig(config: Partial<AIConfig>): void {
  if (typeof window === "undefined") return;
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...config };
  // When switching providers, reset model to that provider's default
  if (config.provider && config.provider !== current.provider && !config.model) {
    updated.model = DEFAULT_MODELS[config.provider];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/** Remove all AI config from localStorage */
export function clearAIConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Check if AI is enabled and has a valid API key */
export function isAIEnabled(): boolean {
  const config = getAIConfig();
  return config.enabled && config.apiKey.length > 0;
}
