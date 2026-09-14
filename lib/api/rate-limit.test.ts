import { describe, expect, it, vi } from "vitest";
import { enforceRateLimit } from "./rate-limit";

describe("rate limit dùng PostgreSQL", () => {
  it("gọi RPC nguyên tử với hành động đã khai báo", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ duoc_phep: true, con_lai: 9, thu_lai_sau_giay: 300 }],
      error: null,
    });

    await expect(enforceRateLimit({ rpc }, "report_export")).resolves.toEqual({
      allowed: true,
      remaining: 9,
      retryAfterSeconds: 300,
    });
    expect(rpc).toHaveBeenCalledWith("fn_kiem_tra_gioi_han_api", {
      p_hanh_dong: "report_export",
    });
  });

  it("dùng bộ đếm riêng cho lượt tạo bản nháp AI", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ duoc_phep: true, con_lai: 11, thu_lai_sau_giay: 300 }],
      error: null,
    });

    await expect(enforceRateLimit({ rpc }, "ai_generate")).resolves.toMatchObject({
      allowed: true,
      remaining: 11,
    });
    expect(rpc).toHaveBeenCalledWith("fn_kiem_tra_gioi_han_api", {
      p_hanh_dong: "ai_generate",
    });
  });

  it("trả lỗi 429 có Retry-After khi hết lượt", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ duoc_phep: false, con_lai: 0, thu_lai_sau_giay: 42 }],
      error: null,
    });

    await expect(enforceRateLimit({ rpc }, "evidence_zip")).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
      headers: { "Retry-After": "42" },
    });
  });

  it("không bỏ qua khi RPC kiểm tra giới hạn bị lỗi", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "57014", message: "timeout" },
    });

    await expect(enforceRateLimit({ rpc }, "evidence_signed_url")).rejects.toMatchObject({
      status: 500,
      code: "RATE_LIMIT_CHECK_FAILED",
    });
  });

  it("giữ đúng lỗi 401 khi JWT bị PostgREST từ chối", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST301", message: "invalid JWT" },
    });

    await expect(enforceRateLimit({ rpc }, "report_export")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });
});
