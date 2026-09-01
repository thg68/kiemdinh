import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const evidenceId = "8f6f40d1-e3fe-4eb0-a576-801367e1d9b1";

function mockSupabase(options: {
  evidence?: { id: string; co_so_id: string; storage_path: string | null } | null;
  evidenceError?: { message: string } | null;
  signedUrl?: string | null;
  signedUrlError?: { message: string } | null;
  auditError?: { message: string } | null;
  rateLimited?: boolean;
  userError?: { message: string } | null;
} = {}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.evidence === undefined
        ? { id: evidenceId, co_so_id: "school-1", storage_path: "school-1/year-1/file.pdf" }
        : options.evidence,
      error: options.evidenceError ?? null,
    }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);

  const createSignedUrl = vi.fn().mockResolvedValue({
    data: options.signedUrl === null ? null : { signedUrl: options.signedUrl ?? "https://storage.test/signed" },
    error: options.signedUrlError ?? null,
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === "fn_kiem_tra_gioi_han_api") {
      return {
        data: [{
          duoc_phep: !options.rateLimited,
          con_lai: options.rateLimited ? 0 : 59,
          thu_lai_sau_giay: 60,
        }],
        error: null,
      };
    }

    return { data: null, error: options.auditError ?? null };
  });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: options.userError ? { user: null } : { user: { id: "user-1" } },
        error: options.userError ?? null,
      }),
    },
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
    rpc,
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  return { createSignedUrl, rpc };
}

function callRoute(withAuth = true, id = evidenceId) {
  const request = new NextRequest(`http://localhost/api/minh-chung/${id}/signed-url`, {
    method: "POST",
    headers: withAuth ? { authorization: "Bearer token" } : undefined,
  });
  return POST(request, { params: Promise.resolve({ id }) });
}

describe("API signed URL minh chứng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("yêu cầu đăng nhập", async () => {
    const response = await callRoute(false);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("từ chối id không phải UUID trước khi truy vấn", async () => {
    const response = await callRoute(true, "evidence-1");

    expect(response.status).toBe(422);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("không làm lộ minh chứng không hiển thị qua RLS dù biết UUID", async () => {
    mockSupabase({ evidence: null });
    const response = await callRoute();

    expect(response.status).toBe(404);
  });

  it("không tạo URL cho bản ghi không có tệp Storage", async () => {
    mockSupabase({ evidence: { id: evidenceId, co_so_id: "school-1", storage_path: null } });
    const response = await callRoute();

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BAD_REQUEST" });
  });

  it("tạo URL 10 phút và ghi audit trước khi trả về", async () => {
    const { createSignedUrl, rpc } = mockSupabase();
    const response = await callRoute();

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledWith("school-1/year-1/file.pdf", 600);
    expect(rpc).toHaveBeenCalledWith("fn_log_user_access", expect.objectContaining({
      p_hanh_dong: "EVIDENCE_FILE_SIGNED_URL_CREATED",
    }));
    expect(rpc).toHaveBeenCalledWith("fn_kiem_tra_gioi_han_api", {
      p_hanh_dong: "evidence_signed_url",
    });
    expect(await response.json()).toEqual({ signedUrl: "https://storage.test/signed" });
  });

  it("trả 429 và không tạo signed URL khi vượt giới hạn", async () => {
    const { createSignedUrl } = mockSupabase({ rateLimited: true });
    const response = await callRoute();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("không trả URL nếu ghi nhật ký thất bại", async () => {
    mockSupabase({ auditError: { message: "audit failed" } });
    const response = await callRoute();

    expect(response.status).toBe(500);
  });

  it("phát cảnh báo Storage nhưng không ghi signed URL hoặc lỗi gốc", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockSupabase({
      signedUrl: null,
      signedUrlError: { message: "token=secret at https://storage.test/file" },
    });

    const response = await callRoute();
    const alert = spy.mock.calls
      .map(([entry]) => entry as Record<string, unknown>)
      .find((entry) => entry.alertType === "STORAGE_FAILURE");
    const serialized = JSON.stringify(alert);

    expect(response.status).toBe(403);
    expect(alert).toMatchObject({
      event: "evidence_signed_url_storage_failed",
      operation: "create_signed_url",
    });
    expect(serialized).not.toContain("storage.test");
    expect(serialized).not.toContain("token=secret");
    spy.mockRestore();
  });
});
