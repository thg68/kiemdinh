export type ApprovedReportRow = {
  id: string;
  loai_bao_cao: string;
  cap_hoc: string | null;
  version: number;
  trang_thai: string;
  storage_path: string | null;
  ten_tep_goc: string | null;
  mime_type: string | null;
  kich_thuoc: number | null;
  sha256: string | null;
  export_metadata: Record<string, unknown> | null;
  ngay_phe_duyet: string | null;
  created_at: string;
  nam_hoc?: { ten: string } | null;
  nguoi_tao?: { ho_ten: string | null; email: string | null } | null;
  nguoi_phe_duyet?: { ho_ten: string | null; email: string | null } | null;
};

export const reportTypeLabels: Record<string, string> = {
  mau_1_tu_danh_gia: "Mẫu 1 – Báo cáo tự đánh giá",
  mau_2_ke_hoach_cai_tien: "Mẫu 2 – Kế hoạch cải tiến",
  danh_muc_minh_chung: "Danh mục minh chứng",
  goi_minh_chung: "Gói minh chứng",
  du_lieu_nam_hoc_json: "Dữ liệu đầy đủ năm học",
};

export const schoolLevelLabels: Record<string, string> = {
  mam_non: "Mầm non",
  tieu_hoc: "Tiểu học",
  thcs: "THCS",
  thpt: "THPT",
  gdtx: "GDTX",
  khac: "Khác",
};

export function reportTypeLabel(value: string) {
  return reportTypeLabels[value] ?? value;
}

export function schoolLevelLabel(value: string | null) {
  if (!value) return "Toàn trường";
  return schoolLevelLabels[value] ?? value;
}

export function reportOwnerLabel(person: ApprovedReportRow["nguoi_tao"]) {
  return person?.ho_ten?.trim() || person?.email?.trim() || "Chưa xác định";
}

export function formatApprovedAt(value: string | null) {
  if (!value) return "Chưa có thời điểm phê duyệt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Thời điểm không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatFileSize(value: number | null) {
  if (value === null || value < 0 || !Number.isFinite(value)) return "Chưa xác định";
  if (value < 1024) return String(value) + " B";
  if (value < 1024 ** 2) return (value / 1024).toFixed(1) + " KB";
  return (value / 1024 ** 2).toFixed(1) + " MB";
}
