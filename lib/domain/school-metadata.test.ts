import { describe, expect, it } from "vitest";
import { CAP_HOC_THEO_LOAI_HINH, capHocHopLoaiHinh, validateSchoolCreation } from "./school-metadata";

describe("metadata cơ sở giáo dục", () => {
  it("chỉ cung cấp cấp học phù hợp với từng loại hình", () => {
    expect(CAP_HOC_THEO_LOAI_HINH.mam_non).toEqual(["mam_non"]);
    expect(CAP_HOC_THEO_LOAI_HINH.pho_thong).toEqual(["tieu_hoc", "thcs", "thpt"]);
    expect(CAP_HOC_THEO_LOAI_HINH.gdtx).toEqual(["gdtx"]);
  });

  it("từ chối danh sách rỗng, trùng hoặc sai loại hình", () => {
    expect(capHocHopLoaiHinh("pho_thong", [])).toBe(false);
    expect(capHocHopLoaiHinh("pho_thong", ["thcs", "thcs"])).toBe(false);
    expect(capHocHopLoaiHinh("mam_non", ["thcs"])).toBe(false);
  });

  it("chấp nhận đơn vị phổ thông nhiều cấp hợp lệ", () => {
    expect(capHocHopLoaiHinh("pho_thong", ["tieu_hoc", "thcs"])).toBe(true);
  });

  it("kiểm tra tên, năm học và ngày trước khi gọi RPC", () => {
    expect(validateSchoolCreation({
      tenCoSo: "Trường A",
      maTruong: "TRUONG-A",
      tinhThanh: "Quảng Ninh",
      loaiHinh: "mam_non",
      capHoc: ["mam_non"],
      tenNamHoc: "2026-2027",
      ngayBatDau: "2026-09-01",
      ngayKetThuc: "2027-05-31",
    })).toBeNull();

    expect(validateSchoolCreation({
      tenCoSo: " ",
      maTruong: "TRUONG-A",
      tinhThanh: "Quảng Ninh",
      loaiHinh: "mam_non",
      capHoc: ["mam_non"],
      tenNamHoc: "2026-2027",
      ngayBatDau: "2026-09-01",
      ngayKetThuc: "2027-05-31",
    })).toContain("Tên cơ sở");

    expect(validateSchoolCreation({
      tenCoSo: "Trường A",
      maTruong: " ",
      tinhThanh: "Quảng Ninh",
      loaiHinh: "mam_non",
      capHoc: ["mam_non"],
      tenNamHoc: "2026-2027",
      ngayBatDau: "2026-09-01",
      ngayKetThuc: "2027-05-31",
    })).toContain("Mã trường");

    expect(validateSchoolCreation({
      tenCoSo: "Trường A",
      maTruong: "TRUONG-A",
      tinhThanh: "",
      loaiHinh: "mam_non",
      capHoc: ["mam_non"],
      tenNamHoc: "2026-2027",
      ngayBatDau: "2026-09-01",
      ngayKetThuc: "2027-05-31",
    })).toContain("Tỉnh/thành phố");
  });
});
