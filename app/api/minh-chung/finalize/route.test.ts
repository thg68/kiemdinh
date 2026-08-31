import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const validBody = {
  namHocId: "year-1",
  tieuChiIds: ["criterion-1"],
  tieuChiGocId: "criterion-1",
  ten: "Quyết định phân công",
  storagePath: "school-1/year-1/file.pdf",
  tenTepGoc: "quyet-dinh.pdf",
  duongDan: "",
  ngayBanHanh: "2026-08-20",
  ngayHetGiaTri: null,
};

function mockSupabase(options: {
  userError?: { message: string } | null;
  downloadData?: Blob | null;
  downloadError?: { message: string } | null;
  rpcData?: string | null;
  rpcError?: { message: string } | null;
} = {}) {
  const getUser = vi.fn().mockResolvedValue({
    data: options.userError ? { user: null } : { user: { id: "user-1" } },
    error: options.userError ?? null,
  });
  const download = vi.fn().mockResolvedValue({
    data:
      options.downloadData === undefined
        ? new Blob(["%PDF-1.7\nnoi dung!"], { type: "application/pdf" })
        : options.downloadData,
    error: options.downloadError ?? null,
  });
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpcData === undefined ? "evidence-1" : options.rpcData,
    error: options.rpcError ?? null,
  });
  const client = {
    auth: { getUser },
    storage: { from: vi.fn(() => ({ download })) },
    rpc,
  };
  vi.mocked(createClient).mockReturnValue(client as never);

  return { download, getUser, rpc };
}

function callRoute(body: Record<string, unknown> = validBody, withAuth = true) {
  return POST(
    new NextRequest("http://localhost/api/minh-chung/finalize", {
      method: "POST",
      headers: {
        ...(withAuth ? { authorization: "Bearer token" } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("API hoàn tất tệp minh chứng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("yêu cầu phiên đăng nhập hợp lệ", async () => {
    const response = await callRoute(validBody, false);

    expect(response.status).toBe(401);
  });

  it("tải lại object và chỉ gửi metadata tự tính vào RPC", async () => {
    const { download, rpc } = mockSupabase();

    const response = await callRoute();
    const body = (await response.json()) as { id?: string };

    expect(response.status).toBe(201);
    expect(body.id).toBe("evidence-1");
    expect(download).toHaveBeenCalledWith(validBody.storagePath);
    expect(rpc).toHaveBeenCalledWith(
      "fn_tao_minh_chung",
      expect.objectContaining({
        p_hash_tep: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_kich_thuoc: 18,
        p_loai_tep: "application/pdf",
      }),
    );
  });

  it("từ chối tên tệp gốc không an toàn trước khi đọc Storage", async () => {
    const { download, rpc } = mockSupabase();

    const response = await callRoute({
      ...validBody,
      tenTepGoc: "../quyet-dinh.pdf",
    });

    expect(response.status).toBe(400);
    expect(download).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("từ chối object giả PDF và không tạo bản ghi nghiệp vụ", async () => {
    const { rpc } = mockSupabase({
      downloadData: new Blob(["noi dung gia"], { type: "application/pdf" }),
    });

    const response = await callRoute();

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("từ chối khi định dạng tên tệp gốc không khớp nội dung object", async () => {
    const { rpc } = mockSupabase();

    const response = await callRoute({
      ...validBody,
      tenTepGoc: "quyet-dinh.docx",
    });

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("không tạo bản ghi khi không tải lại được object", async () => {
    mockSupabase({
      downloadData: null,
      downloadError: { message: "Object not found" },
    });

    const response = await callRoute();

    expect(response.status).toBe(400);
  });
});
