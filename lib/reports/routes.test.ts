import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collectReportData, createRequestSupabaseClient } = vi.hoisted(() => ({
  collectReportData: vi.fn(),
  createRequestSupabaseClient: vi.fn(() => ({ rpc: vi.fn() })),
}));

vi.mock("./data", () => ({
  collectReportData,
  createRequestSupabaseClient,
}));

import { downloadResponse, logReportExport, withReportData } from "./routes";

function request(query = "?namHocId=year-1&capHoc=mam_non", withAuth = true) {
  return new NextRequest(`http://localhost/api/bao-cao/mau-1${query}`, {
    headers: withAuth ? { authorization: "Bearer token" } : undefined,
  });
}

describe("API xuất báo cáo", () => {
  beforeEach(() => {
    collectReportData.mockReset();
    createRequestSupabaseClient.mockClear();
  });

  it("từ chối request không có token", async () => {
    const response = await withReportData(request(undefined, false), vi.fn());

    expect(response.status).toBe(401);
    expect(createRequestSupabaseClient).not.toHaveBeenCalled();
  });

  it("từ chối request thiếu năm học hoặc cấp học", async () => {
    const response = await withReportData(request("?namHocId=year-1"), vi.fn());

    expect(response.status).toBe(400);
    expect(collectReportData).not.toHaveBeenCalled();
  });

  it("trả 403 khi vai trò không có quyền xuất", async () => {
    collectReportData.mockRejectedValue(new Error("Bạn chưa có quyền xuất báo cáo của cơ sở giáo dục này."));

    const response = await withReportData(request(), vi.fn());

    expect(response.status).toBe(403);
  });

  it("trả 401 khi token hết hạn trong lúc đọc hồ sơ", async () => {
    collectReportData.mockRejectedValue(new Error("Bạn cần đăng nhập để xuất báo cáo."));

    const response = await withReportData(request(), vi.fn());

    expect(response.status).toBe(401);
  });

  it("không làm lộ chi tiết khi nhận giá trị lỗi không chuẩn", async () => {
    collectReportData.mockRejectedValue("database unavailable");

    const response = await withReportData(request(), vi.fn());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Không xuất được báo cáo." });
  });

  it("truyền dữ liệu theo năm học và cấp học vào handler", async () => {
    const reportData = { year: { id: "year-1" }, capHoc: "mam_non" };
    collectReportData.mockResolvedValue(reportData);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));

    const response = await withReportData(request(), handler);

    expect(collectReportData).toHaveBeenCalledWith(expect.anything(), "year-1", "mam_non");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ data: reportData }));
    expect(await response.text()).toBe("ok");
  });

  it("thiết lập header tải xuống và không cache file nhạy cảm", () => {
    const response = downloadResponse(new Uint8Array([1, 2, 3]), "Báo cáo.docx", "application/test");

    expect(response.headers.get("content-type")).toBe("application/test");
    expect(decodeURIComponent(response.headers.get("content-disposition") ?? "")).toContain("Bao cao.docx");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("ghi nhật ký với loại báo cáo, năm học và cấp học", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await logReportExport({
      data: { year: { id: "year-1" }, capHoc: "mam_non" },
      supabase: { rpc },
    } as never, "mau_1_tu_danh_gia");

    expect(rpc).toHaveBeenCalledWith("fn_log_user_access", {
      p_hanh_dong: "REPORT_EXPORTED",
      p_doi_tuong_id: "year-1",
      p_du_lieu_moi: {
        loai_bao_cao: "mau_1_tu_danh_gia",
        nam_hoc_id: "year-1",
        cap_hoc: "mam_non",
      },
    });
  });

  it("không coi xuất báo cáo là thành công khi audit thất bại", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: { message: "audit failed" } });

    await expect(logReportExport({
      data: { year: { id: "year-1" }, capHoc: "mam_non" },
      supabase: { rpc },
    } as never, "mau_1_tu_danh_gia")).rejects.toThrow("Không ghi được nhật ký");
  });
});
