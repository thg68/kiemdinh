import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const NAM_HOC_ID = "11111111-1111-4111-8111-111111111111";
const TIEU_CHI_ID = "22222222-2222-4222-8222-222222222222";

const validBody = {
  requestKey: "33333333-3333-4333-8333-333333333333",
  namHocId: NAM_HOC_ID,
  tieuChiIds: [TIEU_CHI_ID],
  tieuChiGocId: TIEU_CHI_ID,
  ten: "Quyết định phân công",
  storagePath: `school-1/${NAM_HOC_ID}/file.pdf`,
  tenTepGoc: "quyet-dinh.pdf",
  duongDan: "",
  ngayBanHanh: "2026-08-20",
  ngayHetGiaTri: null,
};

function mockSupabase(options: {
  userError?: { message: string } | null;
  downloadData?: Blob | null;
  downloadError?: { message: string } | null;
  rpcData?: { id: string; created: boolean } | null;
  rpcError?: { code?: string; message: string } | null;
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
    data: options.rpcData === undefined ? { id: "evidence-1", created: true } : options.rpcData,
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
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("trả 400 với JSON không hợp lệ", async () => {
    mockSupabase();

    const response = await POST(
      new NextRequest("http://localhost/api/minh-chung/finalize", {
        method: "POST",
        headers: {
          authorization: "Bearer token",
          "content-type": "application/json",
        },
        body: "{",
      }),
    );
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(400);
    expect(body.code).toBe("BAD_REQUEST");
  });

  it("trả 422 và không đọc Storage khi UUID không hợp lệ", async () => {
    const { download, rpc } = mockSupabase();

    const response = await callRoute({
      ...validBody,
      namHocId: "year-1",
    });
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(422);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(download).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("tải lại object và chỉ gửi metadata tự tính vào RPC", async () => {
    const { download, rpc } = mockSupabase();

    const response = await callRoute();
    const body = (await response.json()) as { id?: string };

    expect(response.status).toBe(201);
    expect(body.id).toBe("evidence-1");
    expect(download).toHaveBeenCalledWith(validBody.storagePath);
    expect(rpc).toHaveBeenCalledWith(
      "fn_tao_minh_chung_idempotent",
      expect.objectContaining({
        p_finalize_key: validBody.requestKey,
        p_hash_tep: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_kich_thuoc: 18,
        p_loai_tep: "application/pdf",
      }),
    );
  });

  it("trả lại cùng minh chứng khi finalize được retry", async () => {
    mockSupabase({ rpcData: { id: "evidence-1", created: false } });

    const response = await callRoute();
    const body = (await response.json()) as { id?: string; idempotent?: boolean };

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: "evidence-1", idempotent: true });
  });

  it("từ chối tên tệp gốc không an toàn trước khi đọc Storage", async () => {
    const { download, rpc } = mockSupabase();

    const response = await callRoute({
      ...validBody,
      tenTepGoc: "../quyet-dinh.pdf",
    });
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(422);
    expect(body.code).toBe("UNPROCESSABLE_ENTITY");
    expect(download).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("từ chối object giả PDF và không tạo bản ghi nghiệp vụ", async () => {
    const { rpc } = mockSupabase({
      downloadData: new Blob(["noi dung gia"], { type: "application/pdf" }),
    });

    const response = await callRoute();
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(422);
    expect(body.code).toBe("UNPROCESSABLE_ENTITY");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("từ chối khi định dạng tên tệp gốc không khớp nội dung object", async () => {
    const { rpc } = mockSupabase();

    const response = await callRoute({
      ...validBody,
      tenTepGoc: "quyet-dinh.docx",
    });
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(422);
    expect(body.code).toBe("UNPROCESSABLE_ENTITY");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("không tạo bản ghi khi không tải lại được object", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockSupabase({
      downloadData: null,
      downloadError: { message: "Object not found" },
    });

    const response = await callRoute();
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      alertType: "STORAGE_FAILURE",
      event: "evidence_finalize_storage_download_failed",
    }));
    spy.mockRestore();
  });

  it("ánh xạ xung đột từ mã SQLSTATE thay vì nội dung lỗi", async () => {
    mockSupabase({
      rpcData: null,
      rpcError: { code: "23505", message: "duplicate" },
    });

    const response = await callRoute();
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(409);
    expect(body.code).toBe("CONFLICT");
  });

  it("không suy luận lỗi quyền từ một chuỗi thông báo", async () => {
    mockSupabase({
      rpcData: null,
      rpcError: { message: "Bạn không có quyền" },
    });

    const response = await callRoute();
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(500);
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
