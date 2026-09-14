import { CAP_HOC_VALUES, LOAI_HINH_VALUES, isoDateSchema, namHocSchema } from "@/lib/api/validation";

export type LoaiHinh = (typeof LOAI_HINH_VALUES)[number];
export type CapHocValue = (typeof CAP_HOC_VALUES)[number];

export const CAP_HOC_THEO_LOAI_HINH: Record<LoaiHinh, readonly CapHocValue[]> = {
  mam_non: ["mam_non"],
  pho_thong: ["tieu_hoc", "thcs", "thpt"],
  gdtx: ["gdtx"],
};

export function capHocHopLoaiHinh(loaiHinh: LoaiHinh, capHoc: readonly string[]) {
  const allowed = new Set<string>(CAP_HOC_THEO_LOAI_HINH[loaiHinh]);
  return capHoc.length > 0 && new Set(capHoc).size === capHoc.length && capHoc.every((item) => allowed.has(item));
}

export function validateSchoolCreation(input: {
  tenCoSo: string;
  maTruong: string;
  loaiHinh: LoaiHinh;
  capHoc: readonly string[];
  tenNamHoc: string;
  ngayBatDau: string;
  ngayKetThuc: string;
}) {
  if (!input.tenCoSo.trim()) return "Tên cơ sở giáo dục không được để trống.";
  if (!input.maTruong.trim()) return "Mã trường không được để trống.";
  if (!capHocHopLoaiHinh(input.loaiHinh, input.capHoc)) return "Cấp học chưa phù hợp với loại hình đơn vị.";

  try {
    namHocSchema.parse(input.tenNamHoc, "Năm học");
    isoDateSchema.parse(input.ngayBatDau, "Ngày bắt đầu");
    isoDateSchema.parse(input.ngayKetThuc, "Ngày kết thúc");
  } catch (error) {
    return error instanceof Error ? error.message : "Thông tin năm học không hợp lệ.";
  }

  if (input.ngayKetThuc <= input.ngayBatDau) return "Ngày kết thúc phải sau ngày bắt đầu.";
  return null;
}
