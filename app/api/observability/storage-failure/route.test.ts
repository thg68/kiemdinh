import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOperationalAlertAllowed } from "@/lib/observability/edge-rate-limit";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/observability/edge-rate-limit", () => ({
  isOperationalAlertAllowed: vi.fn().mockResolvedValue(true),
}));

function mockAuthenticatedClient() {
  vi.mocked(createClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
  } as never);
}

describe("POST /api/observability/storage-failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(isOperationalAlertAllowed).mockResolvedValue(true);
  });

  it("chỉ ghi mã thao tác Storage trong danh sách cho phép", async () => {
    mockAuthenticatedClient();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          authorization: "Bearer session-token",
          "content-type": "application/json",
          origin: "https://app.test",
          "x-request-id": "123e4567-e89b-42d3-a456-426614174000",
        },
        body: JSON.stringify({ operation: "evidence_upload" }),
      },
    ));

    expect(response.status).toBe(204);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      alertType: "STORAGE_FAILURE",
      event: "client_storage_failed",
      operation: "evidence_upload",
    }));
  });

  it("từ chối payload có đường dẫn hoặc signed URL", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          authorization: "Bearer session-token",
          "content-type": "application/json",
          origin: "https://app.test",
        },
        body: JSON.stringify({
          operation: "evidence_upload",
          signedUrl: "https://storage.test/file?token=secret",
        }),
      },
    ));

    expect(response.status).toBe(422);
    expect(spy).not.toHaveBeenCalled();
  });

  it("yêu cầu phiên đăng nhập hợp lệ", async () => {
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://app.test",
        },
        body: JSON.stringify({ operation: "evidence_upload" }),
      },
    ));

    expect(response.status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("trả 429 và không ghi alert khi người dùng vượt giới hạn", async () => {
    mockAuthenticatedClient();
    vi.mocked(isOperationalAlertAllowed).mockResolvedValue(false);
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await POST(new NextRequest(
      "https://app.test/api/observability/storage-failure",
      {
        method: "POST",
        headers: {
          authorization: "Bearer session-token",
          "content-type": "application/json",
          origin: "https://app.test",
        },
        body: JSON.stringify({ operation: "evidence_upload" }),
      },
    ));

    expect(response.status).toBe(429);
    expect(spy).not.toHaveBeenCalled();
  });
});
