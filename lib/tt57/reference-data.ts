import tt57All from "@/tt57_seed/tt57-all.json";

export type TT57LoaiHinh = "mam_non" | "pho_thong" | "gdtx";

export type TT57CriterionReference = {
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  muc_1: string;
  muc_2: string;
  minh_chung_goi_y: string;
  tieu_chuan: {
    so_thu_tu: number;
    ten: string;
  };
};

export type TT57StandardReference = {
  so_thu_tu: number;
  ten: string;
};

function normalizeLoaiHinh(value: string | null | undefined): TT57LoaiHinh {
  if (value === "pho_thong" || value === "gdtx") {
    return value;
  }

  return "mam_non";
}

function getAppendix(loaiHinh: string | null | undefined) {
  const normalized = normalizeLoaiHinh(loaiHinh);

  return tt57All.bo_tieu_chuan.find((item) => item.metadata.loai_hinh === normalized);
}

export function getTT57CriterionReference(
  loaiHinh: string | null | undefined,
  ma: string,
): TT57CriterionReference | null {
  const appendix = getAppendix(loaiHinh);

  if (!appendix) {
    return null;
  }

  for (const standard of appendix.tieu_chuan) {
    const criterion = standard.tieu_chi.find((item) => item.ma === ma);

    if (!criterion) {
      continue;
    }

    return {
      ma: criterion.ma,
      ten: criterion.ten,
      la_bat_buoc: criterion.la_bat_buoc,
      muc_1: criterion.muc_do.find((level) => level.muc === 1)?.noi_dung_yeu_cau ?? "",
      muc_2: criterion.muc_do.find((level) => level.muc === 2)?.noi_dung_yeu_cau ?? "",
      minh_chung_goi_y: criterion.thong_tin_minh_chung.minh_chung_goi_y,
      tieu_chuan: {
        so_thu_tu: standard.so_thu_tu,
        ten: standard.ten,
      },
    };
  }

  return null;
}

export function getTT57StandardReference(
  loaiHinh: string | null | undefined,
  soThuTu: number,
): TT57StandardReference | null {
  const appendix = getAppendix(loaiHinh);
  const standard = appendix?.tieu_chuan.find((item) => item.so_thu_tu === soThuTu);

  if (!standard) {
    return null;
  }

  return {
    so_thu_tu: standard.so_thu_tu,
    ten: standard.ten,
  };
}
