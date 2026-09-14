import {
  AI_PROVIDER_CATALOG,
  getAiProviderDefinition,
  isAiProvider,
} from "@/lib/ai/provider-catalog";
import type { AiProvider } from "@/lib/ai/types";

export type AiProviderSessionConfig = {
  apiKey: string;
  model: string;
};

export type AiSessionConfig = {
  provider: AiProvider;
  providers: Record<AiProvider, AiProviderSessionConfig>;
};

export const DEFAULT_AI_MODEL = getAiProviderDefinition("openai").defaultModel;
export const AI_SESSION_STORAGE_KEY = "pdt-quality:ai-session-config";

function emptyProviderConfigs() {
  return Object.fromEntries(
    AI_PROVIDER_CATALOG.map((provider) => [
      provider.id,
      { apiKey: "", model: provider.defaultModel },
    ]),
  ) as Record<AiProvider, AiProviderSessionConfig>;
}

export function emptyAiSessionConfig(): AiSessionConfig {
  return { provider: "openai", providers: emptyProviderConfigs() };
}

function readProviderConfig(value: unknown, provider: AiProvider): AiProviderSessionConfig {
  const fallback = getAiProviderDefinition(provider).defaultModel;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { apiKey: "", model: fallback };
  }

  const candidate = value as Partial<AiProviderSessionConfig>;
  return {
    apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey : "",
    model: typeof candidate.model === "string" && candidate.model.trim()
      ? candidate.model.trim()
      : fallback,
  };
}

export function loadAiSessionConfig(): AiSessionConfig {
  if (typeof window === "undefined") return emptyAiSessionConfig();

  try {
    const raw = window.sessionStorage.getItem(AI_SESSION_STORAGE_KEY);
    if (!raw) return emptyAiSessionConfig();
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Tự chuyển cấu hình OpenAI của phiên bản trước sang định dạng nhiều nhà cung cấp.
    if (!("providers" in parsed)) {
      const migrated = emptyAiSessionConfig();
      migrated.providers.openai = readProviderConfig(parsed, "openai");
      return migrated;
    }

    const provider = isAiProvider(parsed.provider) ? parsed.provider : "openai";
    const storedProviders = parsed.providers && typeof parsed.providers === "object"
      ? parsed.providers as Record<string, unknown>
      : {};
    const providers = emptyProviderConfigs();

    for (const definition of AI_PROVIDER_CATALOG) {
      providers[definition.id] = readProviderConfig(
        storedProviders[definition.id],
        definition.id,
      );
    }

    return { provider, providers };
  } catch {
    return emptyAiSessionConfig();
  }
}

export function activeAiProviderConfig(config: AiSessionConfig) {
  return {
    provider: config.provider,
    ...config.providers[config.provider],
  };
}

export function saveAiSessionConfig(config: AiSessionConfig) {
  const normalized = emptyAiSessionConfig();
  normalized.provider = config.provider;

  for (const definition of AI_PROVIDER_CATALOG) {
    const candidate = config.providers[definition.id];
    normalized.providers[definition.id] = {
      apiKey: candidate.apiKey.trim(),
      model: candidate.model.trim() || definition.defaultModel,
    };
  }

  window.sessionStorage.setItem(AI_SESSION_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearAiSessionConfig() {
  window.sessionStorage.removeItem(AI_SESSION_STORAGE_KEY);
}
