import JSZip from "jszip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildEvidenceZip, buildSchoolYearJson } from "./export";
import type { ReportData, ReportSupabaseClient } from "./data";

function reportFixture(): ReportData {
  return {
    profile: { id: "user-1", co_so_id: "school-1", ho_ten: "Người kiểm thử" },
    school: {
      id: "school-1",
      ten: "Trường kiểm thử",
      ma_truong: "TEST-01",
      loai_hinh: "mam_non",
      cap_hoc: ["mam_non"],
      dia_chi: null,
      co_quan_quan_ly: null,
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
    standards: [],
    criteria: [],
    assessments: [],
    evidence: [
      {
        id: "evidence-1",
        ma: "MC.1.1.01",
        ten: "Kế hoạch năm học",
        loai_tep: "text/plain",
        duong_dan: null,
        storage_path: "school-1/year-1/ke-hoach.txt",
        hash_tep: "a".repeat(64),
        kich_thuoc: 12,
        ngay_ban_hanh: null,
        ngay_het_gia_tri: null,
        ghi_chu: null,
        tieuChiIds: ["criterion-1"],
      },
    ],
    plans: [],
    councilMembers: [],
    standardNotes: [],
    improvementReportSections: {
      can_cu_xay_dung: "Căn cứ",
      muc_dich_yeu_cau: "Mục đích",
      tom_tat_van_de_trong_tam: "Vấn đề",
      theo_doi_danh_gia: "Theo dõi",
      to_chuc_thuc_hien: "Tổ chức",
      co_che_danh_gia_bao_cao: "Cơ chế",
    },
    reportSnapshots: [],
    ketQuaTieuChi: [],
    giaiTrinh: {
      mucDat: "Không đạt Mức 1",
      lyDo: "Chưa có dữ liệu",
      chanLenMucTiepTheo: [],
      khoangCach: "Chưa có dữ liệu",
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("xuất dữ liệu năm học", () => {
  it("giữ metadata phiên bản và các phần cần để tái dựng", () => {
    const output = buildSchoolYearJson(reportFixture());
    expect(output.schema_version).toBe("1.0");
    expect(output.export_metadata.bo_tieu_chuan_id).toBe("standard-version-1");
    expect(output.noi_dung_mau_2?.can_cu_xay_dung).toBe("Căn cứ");
    expect(output.minh_chung[0].tieuChiIds).toEqual(["criterion-1"]);
  });

  it("tạo ZIP dạng stream từ signed URL và file ZIP mở lại được", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.test/evidence" },
      error: null,
    });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    } as unknown as ReportSupabaseClient;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("noi-dung-tep", { status: 200 })));

    const stream = await buildEvidenceZip(reportFixture(), supabase);
    const archive = await JSZip.loadAsync(await new Response(stream).arrayBuffer());

    expect(createSignedUrl).toHaveBeenCalledWith("school-1/year-1/ke-hoach.txt", 300);
    expect(archive.file("danh-muc-minh-chung.xlsx")).not.toBeNull();
    expect(await archive.file("minh-chung/MC.1.1.01 - Ke hoach nam hoc.txt")?.async("text")).toBe("noi-dung-tep");
  });

  it("ghi file hướng dẫn cho minh chứng chỉ có liên kết điện tử", async () => {
    const fixture = reportFixture();
    fixture.evidence[0].storage_path = null;
    fixture.evidence[0].duong_dan = "https://example.test/minh-chung";
    const supabase = {
      storage: { from: vi.fn() },
    } as unknown as ReportSupabaseClient;

    const stream = await buildEvidenceZip(fixture, supabase);
    const archive = await JSZip.loadAsync(await new Response(stream).arrayBuffer());
    const note = await archive.file("minh-chung/MC.1.1.01 - khong-co-tep.txt")?.async("text");

    expect(note).toContain("https://example.test/minh-chung");
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it("dừng xuất ZIP khi Storage không tạo được signed URL", async () => {
    const supabase = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "storage denied" },
          }),
        })),
      },
    } as unknown as ReportSupabaseClient;

    await expect(buildEvidenceZip(reportFixture(), supabase)).rejects.toThrow("storage denied");
  });
});
