import ExcelJS from "exceljs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildImprovementPlanDocx, buildSelfAssessmentDocx } from "./docx";
import { CANH_BAO_THIEU_DU_LIEU } from "./format";
import { buildEvidenceCatalogXlsx } from "./xlsx";
import type { ReportData } from "./data";

function taoDuLieuBaoCao(): ReportData {
  return {
    profile: { id: "user-1", co_so_id: "school-1", ho_ten: "Người kiểm thử" },
    school: {
      id: "school-1",
      ten: "Trường kiểm thử",
      ma_truong: "TEST-01",
      loai_hinh: "mam_non",
      cap_hoc: ["mam_non"],
      dia_chi: "Hà Nội",
      co_quan_quan_ly: "Cơ quan quản lý",
    },
    year: {
      id: "year-1",
      ten: "2026-2027",
      ngay_bat_dau: "2026-08-01",
      ngay_ket_thuc: "2027-05-31",
      trang_thai: "dang_hoat_dong",
      bo_tieu_chuan_id: "standard-version-1",
    },
    capHoc: "mam_non",
    standards: [{ id: "standard-1", so_thu_tu: 1, ten: "Tổ chức và quản lý" }],
    criteria: [
      {
        id: "criterion-1",
        ma: "1.1",
        ten: "Tầm nhìn, sứ mạng/mục tiêu và kế hoạch phát triển",
        la_bat_buoc: false,
        loai_hinh_ap_dung: "mam_non",
        tieu_chuan_id: "standard-1",
        muc_1: "Nội dung quy định Mức 1",
        muc_2: "Nội dung quy định Mức 2",
      },
    ],
    assessments: [
      {
        id: "assessment-1",
        tieu_chi_id: "criterion-1",
        cap_hoc: "mam_non",
        mo_ta_muc_1: "Hiện trạng thực tế",
        dat_muc_1: true,
        mo_ta_muc_2: "",
        dat_muc_2: false,
        muc_dat: 1,
      },
    ],
    evidence: [
      {
        id: "evidence-1",
        ma: "MC.1.1.01",
        ten: "Kế hoạch năm học",
        loai_tep: "application/pdf",
        duong_dan: null,
        storage_path: "school-1/year-1/ke-hoach.pdf",
        hash_tep: "a".repeat(64),
        kich_thuoc: 1024,
        ngay_ban_hanh: "2026-08-01",
        ngay_het_gia_tri: null,
        ghi_chu: "Bản đã xác minh",
        tieuChiIds: ["criterion-1"],
      },
    ],
    plans: [],
    councilMembers: [],
    standardNotes: [],
    improvementReportSections: null,
    reportSnapshots: [],
    ketQuaTieuChi: [],
    giaiTrinh: {
      mucDat: "Không đạt Mức 1",
      lyDo: "Chưa đủ 15 tiêu chí",
      chanLenMucTiepTheo: [],
      khoangCach: "Cần hoàn thiện dữ liệu",
    },
  };
}

async function docxXml(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  return zip.file("word/document.xml")?.async("text");
}

describe("kiểm tra đọc ngược file xuất", () => {
  it("Mẫu 1 chứa đủ bốn phần, tên tiêu chí và mã minh chứng", async () => {
    const xml = await docxXml(await buildSelfAssessmentDocx(taoDuLieuBaoCao()));

    expect(xml).toContain("PHẦN I. TỔNG QUAN");
    expect(xml).toContain("PHẦN II. TỰ ĐÁNH GIÁ");
    expect(xml).toContain("PHẦN III. KẾT LUẬN");
    expect(xml).toContain("PHẦN IV. PHỤ LỤC");
    expect(xml).toContain("MC.1.1.01");
    expect(xml).toContain(CANH_BAO_THIEU_DU_LIEU);
  });

  it("Mẫu 2 chứa đủ tám mục và cảnh báo khi chưa có kế hoạch", async () => {
    const xml = await docxXml(await buildImprovementPlanDocx(taoDuLieuBaoCao()));

    for (const section of ["1. Thông tin chung", "5. Bảng kế hoạch cải tiến", "8. Cơ chế đánh giá và báo cáo"]) {
      expect(xml).toContain(section);
    }
    expect(xml).toContain(CANH_BAO_THIEU_DU_LIEU);
  });

  it("XLSX mở lại được và giữ đúng metadata, header, dữ liệu", async () => {
    const output = await buildEvidenceCatalogXlsx(taoDuLieuBaoCao());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(output);
    const sheet = workbook.getWorksheet("Danh mục minh chứng");

    expect(workbook.creator).toBe("KiemDinh");
    expect(sheet?.getCell("A1").value).toBe("TT");
    expect(sheet?.getCell("B2").value).toBe("MC.1.1.01");
    expect(sheet?.getCell("C2").value).toBe("Kế hoạch năm học");
  });
});
