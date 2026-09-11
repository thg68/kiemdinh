type StatusTone = "danger" | "default" | "info" | "success" | "warning";

type StatusBadgeProps = {
  children?: React.ReactNode;
  className?: string;
  status?: string | null;
  tone?: StatusTone;
};

const toneClassName: Record<StatusTone, string> = {
  danger: "status-badge-danger",
  default: "status-badge-default",
  info: "status-badge-info",
  success: "status-badge-success",
  warning: "status-badge-warning",
};

const statusLabelMap: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: "Đang hoạt động", tone: "success" },
  cho_duyet: { label: "Chờ duyệt", tone: "warning" },
  cho_xac_minh: { label: "Chờ xác minh", tone: "warning" },
  chua_nhap: { label: "Chưa nhập", tone: "default" },
  chua_tao: { label: "Chưa tạo", tone: "default" },
  da_duyet: { label: "Đã duyệt", tone: "success" },
  da_phe_duyet: { label: "Đã phê duyệt", tone: "success" },
  da_xac_minh: { label: "Đã xác minh", tone: "success" },
  da_khoa: { label: "Đã khóa", tone: "default" },
  dang_ap_dung: { label: "Đang áp dụng", tone: "success" },
  dang_nhap: { label: "Đang nhập", tone: "info" },
  dang_ra_soat: { label: "Đang rà soát", tone: "info" },
  du_thao: { label: "Dự thảo", tone: "warning" },
  het_hieu_luc: { label: "Hết hiệu lực", tone: "danger" },
  inactive: { label: "Tạm ngừng", tone: "default" },
  invited: { label: "Đang chờ tham gia", tone: "warning" },
  ke_thua_cho_cap_nhat: { label: "Kế thừa, chờ cập nhật", tone: "warning" },
  khong_dat: { label: "Chưa đạt", tone: "danger" },
  mau_1_tu_danh_gia: { label: "Mẫu 1", tone: "info" },
  mau_2_ke_hoach_cai_tien: { label: "Mẫu 2", tone: "info" },
  nhap: { label: "Bản nháp", tone: "default" },
  locked: { label: "Đã khóa", tone: "danger" },
  tra_lai: { label: "Trả lại", tone: "danger" },
  tu_choi: { label: "Từ chối", tone: "danger" },
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/-/g, "_");
}

export function statusMeta(status?: string | null, fallbackTone: StatusTone = "default") {
  if (!status) {
    return { label: "Chưa xác định", tone: fallbackTone };
  }

  const normalized = normalizeStatus(status);

  return statusLabelMap[normalized] ?? {
    label: status,
    tone: fallbackTone,
  };
}

export function StatusBadge({
  children,
  className = "",
  status,
  tone,
}: StatusBadgeProps) {
  const meta = statusMeta(status, tone);
  const effectiveTone = tone ?? meta.tone;

  return (
    <span className={`status-badge ${toneClassName[effectiveTone]} ${className}`}>
      {children ?? meta.label}
    </span>
  );
}
