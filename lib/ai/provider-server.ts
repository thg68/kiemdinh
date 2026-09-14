import { ApiError, apiErrors } from "@/lib/api/errors";
import { getAiProviderDefinition } from "@/lib/ai/provider-catalog";
import {
  buildAiInstructions,
  buildOpenAiRequest,
  extractOpenAiOutputText,
  jsonSchemaFor,
} from "@/lib/ai/server";
import type { AiConnectionRequest, AiDraftRequest, AiProvider } from "@/lib/ai/types";

type ProviderHttpRequest = {
  url: string;
  init: RequestInit;
};

const PROVIDER_ENDPOINTS: Record<AiProvider, string> = {
  openai: "https://api.openai.com/v1/responses",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  claude: "https://api.anthropic.com/v1/messages",
  deepseek: "https://api.deepseek.com/responses",
  qwen: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/responses",
};

function bearerHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function responseCompatibleBody(request: AiDraftRequest, context: unknown) {
  return {
    model: request.model,
    max_output_tokens: 1_600,
    instructions: buildAiInstructions(request.kind),
    input: JSON.stringify(context),
    text: {
      format: {
        type: "json_schema",
        name: request.kind === "report_standard"
          ? "report_standard_draft"
          : "improvement_task_draft",
        schema: jsonSchemaFor(request.kind),
      },
    },
  };
}

function geminiDraftBody(request: AiDraftRequest, context: unknown) {
  return {
    systemInstruction: {
      parts: [{ text: buildAiInstructions(request.kind) }],
    },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(context) }] }],
    generationConfig: {
      maxOutputTokens: 1_600,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchemaFor(request.kind),
    },
  };
}

function claudeDraftBody(request: AiDraftRequest, context: unknown) {
  return {
    model: request.model,
    max_tokens: 1_600,
    system: buildAiInstructions(request.kind),
    messages: [{ role: "user", content: JSON.stringify(context) }],
    output_config: {
      format: {
        type: "json_schema",
        schema: jsonSchemaFor(request.kind),
      },
    },
  };
}

export function buildProviderDraftRequest(
  request: AiDraftRequest,
  context: unknown,
  apiKey: string,
): ProviderHttpRequest {
  if (request.provider === "gemini") {
    return {
      url: `${PROVIDER_ENDPOINTS.gemini}/${encodeURIComponent(request.model)}:generateContent`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-Api-Client": "pdt-quality/1.0",
        },
        body: JSON.stringify(geminiDraftBody(request, context)),
      },
    };
  }

  if (request.provider === "claude") {
    return {
      url: PROVIDER_ENDPOINTS.claude,
      init: {
        method: "POST",
        headers: {
          "Anthropic-Version": "2023-06-01",
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify(claudeDraftBody(request, context)),
      },
    };
  }

  const compatibleBody = responseCompatibleBody(request, context);
  const body = request.provider === "openai"
    ? buildOpenAiRequest(request, context)
    : request.provider === "qwen"
      ? { ...compatibleBody, reasoning: { effort: "none" }, store: false }
      : { ...compatibleBody, reasoning: { effort: "none" } };

  return {
    url: PROVIDER_ENDPOINTS[request.provider],
    init: {
      method: "POST",
      headers: {
        ...bearerHeaders(apiKey),
        ...(request.provider === "qwen" ? { "X-DashScope-Session-Cache": "disable" } : {}),
      },
      body: JSON.stringify(body),
    },
  };
}

export function buildProviderConnectionRequest(
  request: AiConnectionRequest,
  apiKey: string,
): ProviderHttpRequest {
  if (request.provider === "gemini") {
    return {
      url: `${PROVIDER_ENDPOINTS.gemini}/${encodeURIComponent(request.model)}:generateContent`,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-Api-Client": "pdt-quality/1.0",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Chỉ trả lời OK." }] }],
          generationConfig: { maxOutputTokens: 16 },
        }),
      },
    };
  }

  if (request.provider === "claude") {
    return {
      url: PROVIDER_ENDPOINTS.claude,
      init: {
        method: "POST",
        headers: {
          "Anthropic-Version": "2023-06-01",
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: 16,
          messages: [{ role: "user", content: "Chỉ trả lời OK." }],
        }),
      },
    };
  }

  return {
    url: PROVIDER_ENDPOINTS[request.provider],
    init: {
      method: "POST",
      headers: {
        ...bearerHeaders(apiKey),
        ...(request.provider === "qwen" ? { "X-DashScope-Session-Cache": "disable" } : {}),
      },
      body: JSON.stringify({
        model: request.model,
        input: "Chỉ trả lời OK.",
        max_output_tokens: 16,
        ...(["openai", "qwen"].includes(request.provider) ? { store: false } : {}),
        ...(["deepseek", "qwen"].includes(request.provider)
          ? { reasoning: { effort: "none" } }
          : {}),
      }),
    },
  };
}

function extractGeminiOutputText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return "";

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== "object") continue;
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }

  return "";
}

function extractClaudeOutputText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const content = (value as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";

  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const candidate = part as { type?: unknown; text?: unknown };
    if (candidate.type === "text" && typeof candidate.text === "string") {
      return candidate.text;
    }
  }

  return "";
}

export function extractProviderOutputText(provider: AiProvider, value: unknown) {
  if (provider === "gemini") return extractGeminiOutputText(value);
  if (provider === "claude") return extractClaudeOutputText(value);
  return extractOpenAiOutputText(value);
}

export function providerApiError(provider: AiProvider, status: number) {
  const label = getAiProviderDefinition(provider).label;
  if (status === 401 || status === 403) {
    return apiErrors.unauthorized(`API key ${label} không hợp lệ hoặc không có quyền dùng mô hình đã chọn.`);
  }
  if (status === 402) {
    return apiErrors.unprocessable(`Tài khoản ${label} không đủ hạn mức hoặc số dư để gọi mô hình.`);
  }
  if (status === 429) {
    return new ApiError(429, "AI_PROVIDER_RATE_LIMITED", `${label} đang giới hạn tần suất. Vui lòng thử lại sau.`);
  }
  if (status === 400 || status === 404 || status === 422) {
    return apiErrors.unprocessable(`Mô hình hoặc cấu hình ${label} không hợp lệ.`);
  }
  return apiErrors.internal(`${label} đang không khả dụng. Vui lòng thử lại sau.`);
}
