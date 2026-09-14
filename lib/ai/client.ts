import type {
  AiConnectionRequest,
  AiConnectionResponse,
  AiDraftRequest,
  AiDraftResponse,
} from "@/lib/ai/types";
import {
  activeAiProviderConfig,
  loadAiSessionConfig,
} from "@/lib/ai/session-config";

type ErrorBody = {
  error?: unknown;
};

export async function requestAiDraft(
  accessToken: string,
  request: Omit<AiDraftRequest, "model" | "provider">,
): Promise<AiDraftResponse> {
  const config = activeAiProviderConfig(loadAiSessionConfig());

  if (!config.apiKey) {
    throw new Error("Hãy nhập API key trước khi dùng trợ lý AI.");
  }

  const response = await fetch("/api/ai/draft", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-User-AI-Key": config.apiKey,
    },
    body: JSON.stringify({
      ...request,
      provider: config.provider,
      model: config.model,
    }),
  });

  const body = await response.json().catch(() => ({})) as AiDraftResponse | ErrorBody;

  if (!response.ok) {
    const message = "error" in body && typeof body.error === "string"
      ? body.error
      : "Không tạo được bản nháp AI. Vui lòng thử lại.";
    throw new Error(message);
  }

  return body as AiDraftResponse;
}

export async function requestAiConnectionTest(
  accessToken: string,
  request: AiConnectionRequest & { apiKey: string },
): Promise<AiConnectionResponse> {
  const response = await fetch("/api/ai/connection", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-User-AI-Key": request.apiKey,
    },
    body: JSON.stringify({ provider: request.provider, model: request.model }),
  });

  const body = await response.json().catch(() => ({})) as AiConnectionResponse | ErrorBody;

  if (!response.ok) {
    const message = "error" in body && typeof body.error === "string"
      ? body.error
      : "Không kiểm tra được kết nối AI. Vui lòng thử lại.";
    throw new Error(message);
  }

  return body as AiConnectionResponse;
}
