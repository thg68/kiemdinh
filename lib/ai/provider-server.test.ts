import { describe, expect, it } from "vitest";
import {
  buildProviderConnectionRequest,
  buildProviderDraftRequest,
  extractProviderOutputText,
} from "./provider-server";
import type { AiDraftRequest, AiProvider } from "./types";

const apiKey = "provider-secret-key";
const models: Record<AiProvider, string> = {
  openai: "gpt-5.4-mini",
  gemini: "gemini-3.8-flash",
  claude: "claude-sonnet-5",
  deepseek: "deepseek-flash",
  qwen: "qwen3.8-flash",
};

function draftRequest(provider: AiProvider): AiDraftRequest {
  return {
    kind: "report_standard",
    provider,
    namHocId: "10000000-0000-4000-8000-000000000001",
    capHoc: "mam_non",
    model: models[provider],
    standardId: "10000000-0000-4000-8000-000000000002",
  };
}

describe("AI provider adapters", () => {
  it.each([
    ["openai", "https://api.openai.com/v1/responses", "authorization"],
    ["gemini", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", "x-goog-api-key"],
    ["claude", "https://api.anthropic.com/v1/messages", "x-api-key"],
    ["deepseek", "https://api.deepseek.com/responses", "authorization"],
    ["qwen", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/responses", "authorization"],
  ] as const)("tạo yêu cầu %s tới endpoint cố định", (provider, url, keyHeader) => {
    const request = buildProviderDraftRequest(
      draftRequest(provider),
      { noi_dung: "Dữ liệu nghiệp vụ" },
      apiKey,
    );
    const headers = new Headers(request.init.headers);
    const serializedBody = String(request.init.body);

    expect(request.url).toBe(url);
    expect(headers.get(keyHeader)).toContain(apiKey);
    expect(serializedBody).not.toContain(apiKey);
  });

  it("giữ chế độ không lưu cho OpenAI", () => {
    const request = buildProviderDraftRequest(draftRequest("openai"), {}, apiKey);
    const body = JSON.parse(String(request.init.body)) as Record<string, unknown>;

    expect(body.store).toBe(false);
    expect(body.instructions).toContain("Không suy đoán");
  });

  it("tắt lưu phản hồi và suy luận sâu cho Qwen", () => {
    const request = buildProviderDraftRequest(draftRequest("qwen"), {}, apiKey);
    const body = JSON.parse(String(request.init.body)) as {
      reasoning: { effort: string };
      store: boolean;
    };

    expect(body.store).toBe(false);
    expect(body.reasoning.effort).toBe("none");
  });

  it("dùng JSON schema theo định dạng gốc của từng nhà cung cấp", () => {
    const gemini = JSON.parse(String(
      buildProviderDraftRequest(draftRequest("gemini"), {}, apiKey).init.body,
    )) as { generationConfig: { responseJsonSchema: unknown; responseMimeType: string } };
    const claude = JSON.parse(String(
      buildProviderDraftRequest(draftRequest("claude"), {}, apiKey).init.body,
    )) as { output_config: { format: { type: string; schema: unknown } } };
    const deepseek = JSON.parse(String(
      buildProviderDraftRequest(draftRequest("deepseek"), {}, apiKey).init.body,
    )) as { text: { format: { type: string; schema: unknown } } };

    expect(gemini.generationConfig.responseMimeType).toBe("application/json");
    expect(gemini.generationConfig.responseJsonSchema).toBeTruthy();
    expect(claude.output_config.format.type).toBe("json_schema");
    expect(claude.output_config.format.schema).toBeTruthy();
    expect(deepseek.text.format.type).toBe("json_schema");
    expect(deepseek.text.format.schema).toBeTruthy();
  });

  it.each([
    ["openai", { output: [{ content: [{ type: "output_text", text: "OpenAI" }] }] }, "OpenAI"],
    ["deepseek", { output: [{ content: [{ type: "output_text", text: "DeepSeek" }] }] }, "DeepSeek"],
    ["qwen", { output: [{ content: [{ type: "output_text", text: "Qwen" }] }] }, "Qwen"],
    ["gemini", { candidates: [{ content: { parts: [{ text: "Gemini" }] } }] }, "Gemini"],
    ["claude", { content: [{ type: "text", text: "Claude" }] }, "Claude"],
  ] as const)("đọc phản hồi %s", (provider, response, expected) => {
    expect(extractProviderOutputText(provider, response)).toBe(expected);
  });

  it.each(Object.keys(models) as AiProvider[])("tạo yêu cầu kiểm tra kết nối %s", (provider) => {
    const request = buildProviderConnectionRequest({ provider, model: models[provider] }, apiKey);

    expect(request.init.method).toBe("POST");
    expect(`${request.url} ${String(request.init.body)}`).toContain(models[provider]);
    expect(String(request.init.body)).not.toContain(apiKey);
  });
});
