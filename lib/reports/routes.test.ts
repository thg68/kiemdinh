import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collectReportData, createRequestSupabaseClient, enforceRateLimit, rpc } = vi.hoisted(() => ({
  collectReportData: vi.fn(),
  rpc: vi.fn(),
  createRequestSupabaseClient: vi.fn(() => ({ rpc })),
  enforceRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 9,
    retryAfterSeconds: 300,
  }),
}));

vi.mock("./data", () => ({
  collectReportData,
  createRequestSupabaseClient,
}));

vi.mock("@/lib/api/rate-limit", () => ({
  enforceRateLimit,
}));

import { ApiError } from "@/lib/api/errors";
import { isRequestId } from "@/lib/observability/request-context";
import { EvidenceZipStorageError } from "./errors";
import { downloadResponse, withReportData } from "./routes";

const yearId = "8f6f40d1-e3fe-4eb0-a576-801367e1d9b1";

function request(query = `?namHocId=${yearId}&capHoc=mam_non`, withAuth = true) {
  return new NextRequest(`http://localhost/api/bao-cao/mau-1${query}`, {
    headers: withAuth ? { authorization: "Bearer token" } : undefined,
  });
}

describe("API xuất báo cáo", () => {
  beforeEach(() => {
    collectReportData.mockReset();
    createRequestSupabaseClient.mockClear();
    enforceRateLimit.mockClear();
    rpc.mockReset();
    enforceRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 300,
    });
  });

  it("từ chối request không có token", async () => {
    const response = await withReportData(request(undefined, false), vi.fn());

    expect(response.status).toBe(401);
    expect(isRequestId(response.headers.get("x-request-id"))).toBe(true);
    expect(createRequestSupabaseClient).not.toHaveBeenCalled();
  });

  it("từ chối request thiếu năm học hoặc cấp học", async () => {
    const response = await withReportData(request(`?namHocId=${yearId}`), vi.fn());

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "BAD_REQUEST" });
    expect(collectReportData).not.toHaveBeenCalled();
  });

  it("trả 422 khi UUID hoặc cấp học không qua schema", async () => {
    const invalidUuidResponse = await withReportData(
      request("?namHocId=year-1&capHoc=mam_non"),
      vi.fn(),
    );
    const invalidLevelResponse = await withReportData(
      request(`?namHocId=${yearId}&capHoc=trung_hoc`),
      vi.fn(),
    );

    expect(invalidUuidResponse.status).toBe(422);
    expect(invalidLevelResponse.status).toBe(422);
    expect(collectReportData).not.toHaveBeenCalled();
  });

  it("trả 403 khi lớp dữ liệu phát sinh lỗi quyền có mã rõ ràng", async () => {
    collectReportData.mockRejectedValue(
      new ApiError(403, "FORBIDDEN", "Bạn không có quyền xuất báo cáo này."),
    );

    const response = await withReportData(request(), vi.fn());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "FORBIDDEN" });
  });

  it("trả 403 khi RPC niêm phong từ chối quyền xuất báo cáo", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });

    const response = await withReportData(request(), vi.fn(), {
      reportType: "du_lieu_nam_hoc_json",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "FORBIDDEN" });
    expect(collectReportData).not.toHaveBeenCalled();
  });

  it("không suy luận 403 từ nội dung câu tiếng Việt", async () => {
    collectReportData.mockRejectedValue(
      new Error("Bạn chưa có quyền xuất báo cáo của cơ sở giáo dục này."),
    );

    const response = await withReportData(request(), vi.fn());
    expect(response.status).toBe(500);
  });

  it("phát cảnh báo có request ID khi xuất báo cáo lỗi phía máy chủ", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    collectReportData.mockRejectedValue(new Error("database unavailable"));

    const response = await withReportData(request(), vi.fn());
    const alert = spy.mock.calls
      .map(([entry]) => entry as Record<string, unknown>)
      .find((entry) => entry.alertType === "REPORT_EXPORT_FAILURE");

    expect(response.status).toBe(500);
    expect(alert).toMatchObject({
      event: "report_export_failed",
      route: "/api/bao-cao/mau-1",
      status: 500,
    });
    expect(alert?.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    spy.mockRestore();
  });

  it("chỉ phát cảnh báo Storage khi ZIP lỗi tại lớp Storage", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    collectReportData.mockResolvedValue({ year: { id: yearId }, capHoc: "mam_non" });

    await withReportData(
      request(),
      vi.fn().mockRejectedValue(new EvidenceZipStorageError("signed URL failed")),
      { rateLimitAction: "evidence_zip" },
    );

    expect(spy.mock.calls.some(
      ([entry]) => (entry as Record<string, unknown>).alertType === "STORAGE_FAILURE",
    )).toBe(true);

    spy.mockClear();
    await withReportData(
      request(),
      vi.fn().mockRejectedValue(new Error("document generation failed")),
      { rateLimitAction: "evidence_zip" },
    );

    expect(spy.mock.calls.some(
      ([entry]) => (entry as Record<string, unknown>).alertType === "STORAGE_FAILURE",
    )).toBe(false);
    spy.mockRestore();
  });

  it("không làm lộ chi tiết khi nhận giá trị lỗi không chuẩn", async () => {
    collectReportData.mockRejectedValue("database unavailable");

    const response = await withReportData(request(), vi.fn());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      code: "INTERNAL_ERROR",
      error: "Không xuất được báo cáo. Vui lòng thử lại.",
    });
  });

  it("truyền dữ liệu theo năm học và cấp học vào handler", async () => {
    const reportData = { year: { id: yearId }, capHoc: "mam_non" };
    collectReportData.mockResolvedValue(reportData);
    const handler = vi.fn().mockResolvedValue(new Response("ok"));

    const response = await withReportData(request(), handler);

    expect(enforceRateLimit).toHaveBeenCalledWith(expect.anything(), "report_export");
    expect(collectReportData).toHaveBeenCalledWith(expect.anything(), yearId, "mam_non");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ data: reportData }));
    expect(isRequestId(response.headers.get("x-request-id"))).toBe(true);
    expect(await response.text()).toBe("ok");
  });

  it("gắn digest nguồn vào file khi dữ liệu không đổi trong lúc xuất", async () => {
    const reportData = { year: { id: yearId }, capHoc: "mam_non" };
    const digest = "a".repeat(64);
    collectReportData.mockResolvedValue(reportData);
    rpc.mockResolvedValue({
      data: { digest, manifest: { schema_version: 1 } },
      error: null,
    });

    const response = await withReportData(
      request(),
      vi.fn().mockResolvedValue(new Response("file")),
      { reportType: "mau_1_tu_danh_gia" },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-report-source-digest")).toBe(digest);
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it("trả 409 nếu nguồn thay đổi trong lúc tạo file", async () => {
    collectReportData.mockResolvedValue({ year: { id: yearId }, capHoc: "mam_non" });
    rpc
      .mockResolvedValueOnce({ data: { digest: "a".repeat(64), manifest: {} }, error: null })
      .mockResolvedValueOnce({ data: { digest: "b".repeat(64), manifest: {} }, error: null });

    const response = await withReportData(
      request(),
      vi.fn().mockResolvedValue(new Response("file")),
      { reportType: "mau_1_tu_danh_gia" },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "CONFLICT" });
  });

  it("trả 429 trước khi tải dữ liệu khi hết lượt xuất", async () => {
    enforceRateLimit.mockRejectedValue(
      new ApiError(
        429,
        "RATE_LIMITED",
        "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
        undefined,
        { "Retry-After": "45" },
      ),
    );

    const response = await withReportData(request(), vi.fn(), {
      rateLimitAction: "evidence_zip",
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("45");
    expect(collectReportData).not.toHaveBeenCalled();
  });

  it("thiết lập header tải xuống và không cache file nhạy cảm", () => {
    const response = downloadResponse(new Uint8Array([1, 2, 3]), "Báo cáo.docx", "application/test");

    expect(response.headers.get("content-type")).toBe("application/test");
    expect(decodeURIComponent(response.headers.get("content-disposition") ?? "")).toContain("Bao cao.docx");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

});
