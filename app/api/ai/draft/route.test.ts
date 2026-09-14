import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectReportData, createRequestSupabaseClient } from "@/lib/reports/data";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { ApiError } from "@/lib/api/errors";
import { POST } from "./route";

vi.mock("@/lib/reports/data", () => ({
  collectReportData: vi.fn(),
  createRequestSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({ enforceRateLimit: vi.fn() }));

const yearId = "10000000-0000-4000-8000-000000000001";
const standardId = "10000000-0000-4000-8000-000000000002";
const criterionId = "10000000-0000-4000-8000-000000000003";

const reportData = {
  profile: { id: "p1", co_so_id: "s1", ho_ten: "Nguyễn Văn A" },
  school: { id: "s1", ten: "Trường thử nghiệm", ma_truong: "QN-001" },
  year: { id: yearId, ten: "2026-2027" },
  capHoc: "mam_non",
  standards: [{ id: standardId, so_thu_tu: 1, ten: "Tổ chức và quản lý" }],
  criteria: [{
    id: criterionId,
    ma: "1.1",
    ten: "Phương hướng và chiến lược",
    la_bat_buoc: true,
    tieu_chuan_id: standardId,
    muc_1: "Có kế hoạch phù hợp.",
    muc_2: "Rà soát và cải tiến kế hoạch.",
  }],
  assessments: [],
  evidence: [],
  plans: [],
};

function request(options: { withAuth?: boolean; withKey?: boolean } = {}) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: "http://localhost",
  });
  if (options.withAuth !== false) headers.set("Authorization", "Bearer user-token");
  if (options.withKey !== false) headers.set("X-User-AI-Key", "sk-user-secret-key");

  return new NextRequest("http://localhost/api/ai/draft", {
    method: "POST",
    headers,
    body: JSON.stringify({
      kind: "report_standard",
      provider: "openai",
      namHocId: yearId,
      capHoc: "mam_non",
      model: "gpt-5-mini",
      standardId,
    }),
  });
}

describe("API tạo bản nháp AI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.mocked(createRequestSupabaseClient).mockReturnValue({} as never);
    vi.mocked(enforceRateLimit).mockResolvedValue({ allowed: true, remaining: 11, retryAfterSeconds: 300 });
    vi.mocked(collectReportData).mockResolvedValue(reportData as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("yêu cầu đăng nhập và API key do người dùng cung cấp", async () => {
    expect((await POST(request({ withAuth: false }))).status).toBe(401);
    expect((await POST(request({ withKey: false }))).status).toBe(422);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rate limit trước khi gọi nhà cung cấp AI", async () => {
    vi.mocked(enforceRateLimit).mockRejectedValueOnce(
      new ApiError(429, "RATE_LIMITED", "Thao tác quá nhanh.", undefined, { "Retry-After": "60" }),
    );

    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("không lưu phản hồi tại nhà cung cấp và trả bản nháp có cấu trúc", async () => {
    const providerFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{ content: [{ type: "output_text", text: JSON.stringify({
        diem_manh_noi_bat: "Có kế hoạch phù hợp.",
        han_che_trong_tam: "[CẦN BỔ SUNG] kết quả rà soát.",
        dinh_huong_cai_tien: "Tổ chức rà soát định kỳ.",
      }) }] }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", providerFetch);

    const response = await POST(request());
    const providerRequest = providerFetch.mock.calls[0][1] as RequestInit;
    const providerBody = JSON.parse(providerRequest.body as string) as { store: boolean };

    expect(response.status).toBe(200);
    expect(providerBody.store).toBe(false);
    expect(providerRequest.headers).toMatchObject({ Authorization: "Bearer sk-user-secret-key" });
    expect(await response.json()).toMatchObject({
      kind: "report_standard",
      draft: { diem_manh_noi_bat: "Có kế hoạch phù hợp." },
    });
  });
});
