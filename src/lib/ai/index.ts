// AI integration layer — re-export all modules

export type { AIConfig, AIProvider } from "./config";
export {
  DEFAULT_AI_CONFIG,
  DEFAULT_MODELS,
  AVAILABLE_MODELS,
  getAIConfig,
  setAIConfig,
  clearAIConfig,
  isAIEnabled,
} from "./config";

export { AIError, sendAIMessage, testAIConnection } from "./client";

export {
  buildAnalysisPrompt,
  buildOptimizationPrompt,
  buildExplanationPrompt,
  smartSearchPrompt,
} from "./prompts";

export { serializeBuildForAI } from "./build-serializer";
