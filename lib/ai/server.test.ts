import { describe, expect, it } from "vitest";
import type { ReportData } from "@/lib/reports/data";
import {
  buildAiDraftContext,
  buildOpenAiRequest,
  extractOpenAiOutputText,
  parseAiDraftRequest,
  parseAiDraftResponse,
} from "./server";

const yearId = "10000000-0000-4000-8000-000000000001";
const standardId = "10000000-0000-4000-8000-000000000002";
const criterionId = "10000000-0000-4000-8000-000000000003";

const reportData: ReportData = {
  profile: { id: "p1", co_so_id: "s1", ho_ten: "Nguyễn Văn A" },
  school: {
    id: "s1",
    ten: "Trường thử nghiệm",
    ma_truong: "QN-001",
    loai_hinh: "mam_non",
    cap_hoc: ["mam_non"],
    dia_chi: null,
    co_quan_quan_ly: null,
  },
  year: {
    id: yearId,
    ten: "2026-2027",
    ngay_bat_dau: "2026-08-01",
    ngay_ket_thuc: "2027-07-31",
    trang_thai: "dang_hoat_dong",
    bo_tieu_chuan_id: "b1",
  },
  capHoc: "mam_non",
  standards: [{ id: standardId, so_thu_tu: 1, ten: "Tổ chức và quản lý" }],
  criteria: [{
    id: criterionId,
    ma: "1.1",
    ten: "Phương hướng và chiến lược",
    la_bat_buoc: true,
    loai_hinh_ap_dung: "mam_non",
    tieu_chuan_id: standardId,
    muc_1: "Có kế hoạch phù hợp.",
    muc_2: "Rà soát và cải tiến kế hoạch.",
  }],
  assessments: [{
    id: "a1",
    tieu_chi_id: criterionId,
    cap_hoc: "mam_non",
    mo_ta_muc_1: "Nhà trường đã ban hành kế hoạch.",
    dat_muc_1: true,
    mo_ta_muc_2: null,
    dat_muc_2: false,
    muc_dat: 1,
  }],
  evidence: [{
    id: "e1",
    ma: "MC.1.1.01",
    ten: "Kế hoạch năm học",
    loai_tep: "application/pdf",
    duong_dan: null,
    storage_path: "s1/e1.pdf",
    hash_tep: null,
    kich_thuoc: 100,
    ngay_ban_hanh: "2026-08-20",
    ngay_het_gia_tri: null,
    ghi_chu: null,
    tieuChiIds: [criterionId],
  }],
  plans: [],
  councilMembers: [],
  standardNotes: [],
  improvementReportSections: null,
  reportSnapshots: [],
  ketQuaTieuChi: [],
  giaiTrinh: {
    mucDat: "Không đạt Mức 1",
    lyDo: "Chưa đủ dữ liệu.",
    chanLenMucTiepTheo: [],
    khoangCach: "Chưa đủ dữ liệu.",
  },
};

describe("AI drafting server helpers", () => {
  it("chỉ nhận loại tác vụ, UUID, cấp học và model hợp lệ", () => {
    expect(parseAiDraftRequest({
      kind: "report_standard",
      provider: "openai",
      namHocId: yearId,
      capHoc: "mam_non",
      model: "gpt-5-mini",
      standardId,
    })).toMatchObject({ kind: "report_standard", standardId });

    expect(() => parseAiDraftRequest({
      kind: "report_standard",
      provider: "openai",
      namHocId: yearId,
      capHoc: "mam_non",
      model: "https://example.com",
      standardId,
    })).toThrow();
  });

  it("chỉ đưa dữ liệu đúng tiêu chuẩn và mã minh chứng vào ngữ cảnh", () => {
    const request = parseAiDraftRequest({
      kind: "report_standard",
      provider: "openai",
      namHocId: yearId,
      capHoc: "mam_non",
      model: "gpt-5-mini",
      standardId,
    });
    const context = buildAiDraftContext(reportData, request);

    expect(JSON.stringify(context)).toContain("MC.1.1.01");
    expect(JSON.stringify(context)).toContain("Nhà trường đã ban hành kế hoạch.");
  });

  it("buộc mô hình không suy đoán và không lưu phản hồi tại nhà cung cấp", () => {
    const request = parseAiDraftRequest({
      kind: "improvement_task",
      provider: "openai",
      namHocId: yearId,
      capHoc: "mam_non",
      model: "gpt-5-mini",
      criterionId,
    });
    const payload = buildOpenAiRequest(request, buildAiDraftContext(reportData, request));

    expect(payload.store).toBe(false);
    expect(payload.instructions).toContain("[CẦN BỔ SUNG]");
    expect(payload.instructions).toContain("Không suy đoán");
  });

  it("đọc output_text và kiểm tra đủ trường có cấu trúc", () => {
    const text = JSON.stringify({
      diem_manh_noi_bat: "Có kế hoạch và minh chứng MC.1.1.01.",
      han_che_trong_tam: "[CẦN BỔ SUNG] kết quả rà soát.",
      dinh_huong_cai_tien: "Tổ chức rà soát theo học kỳ.",
    });
    const output = extractOpenAiOutputText({
      output: [{ content: [{ type: "output_text", text }] }],
    });

    expect(parseAiDraftResponse("report_standard", output)).toMatchObject({
      kind: "report_standard",
      draft: { diem_manh_noi_bat: "Có kế hoạch và minh chứng MC.1.1.01." },
    });
  });
});
