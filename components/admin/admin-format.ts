export const schoolTypeLabels: Record<string, string> = {
  gdtx: "Giáo dục thường xuyên",
  mam_non: "Mầm non",
  pho_thong: "Phổ thông",
};

export const schoolLevelLabels: Record<string, string> = {
  gdtx: "GDTX",
  khac: "Khác",
  mam_non: "Mầm non",
  thcs: "THCS",
  thpt: "THPT",
  tieu_hoc: "Tiểu học",
};

export const roleLabels: Record<string, string> = {
  MEMBER: "Ủy viên / Tổ trưởng",
  PRINCIPAL: "Hiệu trưởng / Giám đốc",
  SECRETARY: "Thư ký Hội đồng",
  SELF_ASSESSMENT_CHAIR: "Chủ tịch Hội đồng TĐG",
  SYSTEM_ADMIN: "Quản trị hệ thống PDT",
  TEACHER: "Giáo viên",
  VIEWER: "Khách chỉ đọc",
};

export function formatDate(value?: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatFileSize(value?: number | null) {
  if (value === null || value === undefined) return "Chưa ghi nhận";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
