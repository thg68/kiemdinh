import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

function mockSupabase(options: {
  evidence?: { id: string; co_so_id: string; storage_path: string | null } | null;
  evidenceError?: { message: string } | null;
  signedUrl?: string | null;
  signedUrlError?: { message: string } | null;
  auditError?: { message: string } | null;
} = {}) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: options.evidence === undefined
        ? { id: "evidence-1", co_so_id: "school-1", storage_path: "school-1/year-1/file.pdf" }
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
  const rpc = vi.fn().mockResolvedValue({ error: options.auditError ?? null });
  const client = {
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
    rpc,
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  return { createSignedUrl, rpc };
}

function callRoute(withAuth = true) {
  const request = new NextRequest("http://localhost/api/minh-chung/evidence-1/signed-url", {
    method: "POST",
    headers: withAuth ? { authorization: "Bearer token" } : undefined,
  });
  return POST(request, { params: Promise.resolve({ id: "evidence-1" }) });
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
  });

  it("không làm lộ minh chứng không hiển thị qua RLS dù biết UUID", async () => {
    mockSupabase({ evidence: null });
    const response = await callRoute();

    expect(response.status).toBe(404);
  });

  it("không tạo URL cho bản ghi không có tệp Storage", async () => {
    mockSupabase({ evidence: { id: "evidence-1", co_so_id: "school-1", storage_path: null } });
    const response = await callRoute();

    expect(response.status).toBe(400);
  });

  it("tạo URL 10 phút và ghi audit trước khi trả về", async () => {
    const { createSignedUrl, rpc } = mockSupabase();
    const response = await callRoute();

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledWith("school-1/year-1/file.pdf", 600);
    expect(rpc).toHaveBeenCalledWith("fn_log_user_access", expect.objectContaining({
      p_hanh_dong: "EVIDENCE_FILE_SIGNED_URL_CREATED",
    }));
    expect(await response.json()).toEqual({ signedUrl: "https://storage.test/signed" });
  });

  it("không trả URL nếu ghi nhật ký thất bại", async () => {
    mockSupabase({ auditError: { message: "audit failed" } });
    const response = await callRoute();

    expect(response.status).toBe(500);
  });
});
