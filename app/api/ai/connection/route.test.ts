import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createRequestSupabaseClient } from "@/lib/reports/data";
import { POST } from "./route";

vi.mock("@/lib/reports/data", () => ({ createRequestSupabaseClient: vi.fn() }));
vi.mock("@/lib/api/rate-limit", () => ({ enforceRateLimit: vi.fn() }));

function request(options: {
  withAuth?: boolean;
  withKey?: boolean;
  provider?: string;
  model?: string;
} = {}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: "http://localhost",
  });
  if (options.withAuth !== false) headers.set("Authorization", "Bearer user-token");
  if (options.withKey !== false) headers.set("X-User-AI-Key", "user-provider-secret");

  return new NextRequest("http://localhost/api/ai/connection", {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: options.provider ?? "gemini",
      model: options.model ?? "gemini-3.8-flash",
    }),
  });
}

describe("API kiểm tra kết nối AI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(createRequestSupabaseClient).mockReturnValue({} as never);
    vi.mocked(enforceRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 11,
      retryAfterSeconds: 300,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("yêu cầu đăng nhập và API key", async () => {
    expect((await POST(request({ withAuth: false }))).status).toBe(401);
    expect((await POST(request({ withKey: false }))).status).toBe(422);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("từ chối nhà cung cấp ngoài danh sách cho phép", async () => {
    const response = await POST(request({ provider: "custom-provider" }));

    expect(response.status).toBe(422);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("kiểm tra Gemini qua endpoint cố định mà không đưa key vào body", async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "OK" }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(request());
    const [url, init] = providerFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);

    expect(response.status).toBe(200);
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    );
    expect(headers.get("x-goog-api-key")).toBe("user-provider-secret");
    expect(String(init.body)).not.toContain("user-provider-secret");
    expect(await response.json()).toEqual({
      ok: true,
      provider: "gemini",
      model: "gemini-3.8-flash",
    });
  });

  it("chuẩn hóa lỗi model của nhà cung cấp", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));

    const response = await POST(request({ provider: "claude", model: "model-khong-ton-tai" }));
    const body = await response.json() as { code: string };

    expect(response.status).toBe(422);
    expect(body.code).toBe("UNPROCESSABLE_ENTITY");
  });
});
