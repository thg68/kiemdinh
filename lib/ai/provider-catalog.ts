import type { AiProvider } from "@/lib/ai/types";

export type AiProviderDefinition = {
  id: AiProvider;
  label: string;
  keyLabel: string;
  description: string;
  defaultModel: string;
  models: string[];
};

export const AI_PROVIDER_CATALOG: AiProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    keyLabel: "API key OpenAI",
    description: "Dùng Responses API của OpenAI.",
    defaultModel: "gpt-5.4-mini",
    models: ["gpt-5.4-mini", "gpt-5.4", "gpt-5-mini"],
  },
  {
    id: "gemini",
    label: "Google Gemini",
    keyLabel: "API key Google Gemini",
    description: "Dùng Gemini API trực tiếp của Google.",
    defaultModel: "gemini-3.8-flash",
    models: ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-2.5-pro"],
  },
  {
    id: "claude",
    label: "Anthropic Claude",
    keyLabel: "API key Anthropic Claude",
    description: "Dùng Messages API trực tiếp của Anthropic.",
    defaultModel: "claude-sonnet-5",
    models: ["claude-sonnet-5", "claude-haiku-4-5-20251001", "claude-opus-5"],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyLabel: "API key DeepSeek",
    description: "Dùng Responses API của DeepSeek.",
    defaultModel: "deepseek-flash",
    models: ["deepseek-flash", "deepseek-v4-pro"],
  },
  {
    id: "qwen",
    label: "Alibaba Qwen",
    keyLabel: "API key Alibaba Model Studio",
    description: "Dùng Model Studio quốc tế tại Singapore.",
    defaultModel: "qwen3.8-flash",
    models: ["qwen3.8-flash", "qwen3.8-max", "qwen3.7-plus"],
  },
];

export const AI_PROVIDER_IDS = AI_PROVIDER_CATALOG.map((provider) => provider.id);

export function isAiProvider(value: unknown): value is AiProvider {
  return typeof value === "string" && AI_PROVIDER_IDS.includes(value as AiProvider);
}

export function getAiProviderDefinition(provider: AiProvider) {
  return AI_PROVIDER_CATALOG.find((item) => item.id === provider) ?? AI_PROVIDER_CATALOG[0];
}
