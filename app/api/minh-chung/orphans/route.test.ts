import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "./route";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

const orphanRows = [
  {
    storage_path: "school-1/year-1/orphan.pdf",
    nam_hoc_id: "year-1",
    created_at: "2026-08-20T00:00:00.000Z",
    kich_thuoc: 128,
    loai_tep: "application/pdf",
  },
];

function mockSupabase(options: {
  listError?: { message: string } | null;
  removeError?: { message: string } | null;
  auditError?: { message: string } | null;
} = {}) {
  const getUser = vi.fn().mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === "fn_liet_ke_object_minh_chung_mo_coi") {
      return { data: orphanRows, error: options.listError ?? null };
    }

    return { data: null, error: options.auditError ?? null };
  });
  const remove = vi.fn().mockResolvedValue({
    data: options.removeError ? null : orphanRows,
    error: options.removeError ?? null,
  });
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser },
    rpc,
    storage: { from: vi.fn(() => ({ remove })) },
  } as never);

  return { remove, rpc };
}

function request(method: "GET" | "DELETE", withAuth = true, minutes = "60") {
  return new NextRequest(
    `http://localhost/api/minh-chung/orphans?olderThanMinutes=${minutes}`,
    {
      method,
      headers: withAuth ? { authorization: "Bearer token" } : undefined,
    },
  );
}

describe("API object minh chứng mồ côi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("yêu cầu đăng nhập khi dò object mồ côi", async () => {
    const response = await GET(request("GET", false));

    expect(response.status).toBe(401);
  });

  it("trả danh sách object đã quá thời gian chờ", async () => {
    mockSupabase();

    const response = await GET(request("GET"));
    const body = (await response.json()) as { items: typeof orphanRows };

    expect(response.status).toBe(200);
    expect(body.items).toEqual(orphanRows);
  });

  it("xóa qua Storage API rồi ghi nhật ký thay đổi", async () => {
    const { remove, rpc } = mockSupabase();

    const response = await DELETE(request("DELETE"));

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith([orphanRows[0].storage_path]);
    expect(rpc).toHaveBeenCalledWith(
      "fn_ghi_nhat_ky_don_storage_mo_coi",
      { p_storage_paths: [orphanRows[0].storage_path] },
    );
  });

  it("không ghi nhật ký thành công khi Storage API xóa lỗi", async () => {
    const { rpc } = mockSupabase({
      removeError: { message: "Storage unavailable" },
    });

    const response = await DELETE(request("DELETE"));

    expect(response.status).toBe(500);
    expect(rpc).not.toHaveBeenCalledWith(
      "fn_ghi_nhat_ky_don_storage_mo_coi",
      expect.anything(),
    );
  });

  it("từ chối thời gian chờ ngoài giới hạn", async () => {
    const response = await GET(request("GET", true, "2"));

    expect(response.status).toBe(400);
  });
});
