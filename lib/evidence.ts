export type Profile = {
  id: string;
  co_so_id: string;
  ho_ten: string;
};

export type SchoolYear = {
  id: string;
  ten: string;
  trang_thai: string;
};

export type Criterion = {
  id: string;
  ma: string;
  ten: string;
  la_bat_buoc: boolean;
  loai_hinh_ap_dung?: string;
  tieu_chuan_id: string;
  tieu_chuan?: {
    so_thu_tu: number;
    ten: string;
  };
};

export type Evidence = {
  id: string;
  co_so_id: string;
  nam_hoc_id: string;
  ma: string;
  ten: string;
  loai_tep: string | null;
  duong_dan: string | null;
  storage_path: string | null;
  hash_tep: string | null;
  kich_thuoc: number | null;
  ngay_ban_hanh: string | null;
  ngay_het_gia_tri: string | null;
  trang_thai_xac_minh: string;
  nguoi_tai_len: string | null;
  created_at: string;
};

export type EvidenceCriterionLink = {
  minh_chung_id: string;
  tieu_chi_id: string;
  la_tieu_chi_goc: boolean;
  tieu_chi?: Criterion;
};

export async function sha256File(file: File) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function storagePathForEvidence(coSoId: string, namHocId: string, file: File) {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";

  return `${coSoId}/${namHocId}/${crypto.randomUUID()}.${extension}`;
}

export function formatEvidenceStatus(status: string) {
  const labels: Record<string, string> = {
    cho_xac_minh: "Chờ xác minh",
    da_xac_minh: "Đã xác minh",
    tu_choi: "Từ chối",
    het_hieu_luc: "Hết hiệu lực",
  };

  return labels[status] ?? status;
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
