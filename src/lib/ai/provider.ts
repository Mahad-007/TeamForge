import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface WorkspaceAISettings {
  ai_provider?: "openrouter" | "claude" | "openai" | "gemini";
  ai_api_key?: string;
  ai_model?: string;
  use_platform_key?: boolean;
}

export function getAIProvider(settings: WorkspaceAISettings) {
  const usePlatform = settings.use_platform_key !== false;
  const apiKey = usePlatform
    ? process.env.OPENROUTER_API_KEY
    : settings.ai_api_key;

  if (!apiKey) {
    // Fallback to OpenRouter platform key
    return createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
  }

  switch (settings.ai_provider) {
    case "claude":
      return createAnthropic({ apiKey });
    case "openai":
      return createOpenAI({ apiKey });
    case "gemini":
      return createGoogleGenerativeAI({ apiKey });
    case "openrouter":
    default:
      return createOpenRouter({ apiKey });
  }
}

export function getDefaultModel(settings: WorkspaceAISettings): string {
  if (settings.ai_model) return settings.ai_model;

  switch (settings.ai_provider) {
    case "claude":
      return "claude-sonnet-4-20250514";
    case "openai":
      return "gpt-4o";
    case "gemini":
      return "gemini-2.0-flash";
    case "openrouter":
    default:
      return "anthropic/claude-sonnet-4";
  }
}
