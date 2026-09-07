export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ACTIVE_SCHOOL_YEAR_CHANGED: "Đổi năm học đang hoạt động",
  ASSESSMENT_SAVED_ATOMIC: "Lưu nội dung tự đánh giá",
  ASSESSMENT_STATUS_UPDATED: "Cập nhật trạng thái tự đánh giá",
  ASSIGNMENT_UPDATED: "Cập nhật phân công tiêu chí",
  DEMO_SPRINT4_CREATED: "Tạo dữ liệu thử nghiệm cũ",
  EVIDENCE_CREATED: "Tạo minh chứng",
  EVIDENCE_LINKED: "Gắn minh chứng vào tiêu chí",
  EVIDENCE_ORPHAN_STORAGE_CLEANED: "Dọn tệp minh chứng mồ côi",
  EVIDENCE_STATUS_UPDATED: "Xác minh minh chứng",
  IMPORT_COMMITTED: "Hoàn tất nhập dữ liệu",
  IMPROVEMENT_PLAN_ARCHIVED: "Lưu trữ kế hoạch cải tiến",
  IMPROVEMENT_PLAN_CREATED: "Tạo kế hoạch cải tiến",
  IMPROVEMENT_PLAN_RESTORED: "Khôi phục kế hoạch cải tiến",
  IMPROVEMENT_PLAN_UPDATED: "Cập nhật kế hoạch cải tiến",
  MEMBER_INVITATION_ACCEPTED: "Chấp nhận lời mời tham gia đơn vị",
  MEMBER_INVITATION_CANCELLED: "Hủy lời mời tham gia đơn vị",
  MEMBER_INVITED: "Mời người dùng vào đơn vị",
  RELATED_DOCUMENT_ARCHIVED: "Lưu trữ văn bản liên quan",
  RELATED_DOCUMENT_CREATED: "Tạo văn bản liên quan",
  RELATED_DOCUMENT_RESTORED: "Khôi phục văn bản liên quan",
  RELATED_DOCUMENT_UPDATED: "Cập nhật văn bản liên quan",
  REPORT_STATUS_UPDATED: "Cập nhật trạng thái báo cáo",
  SCHOOL_CREATED_BY_SYSTEM_ADMIN: "Tạo đơn vị giáo dục",
  SYSTEM_ADMIN_BOOTSTRAPPED: "Khởi tạo quản trị hệ thống đầu tiên",
  SCHOOL_YEAR_CREATED_WITH_INHERITANCE: "Tạo năm học và kế thừa dữ liệu",
  SELF_ASSESSMENT_STATUS_UPDATED: "Cập nhật trạng thái tự đánh giá",
  USER_ROLE_ASSIGNED: "Gán vai trò người dùng",
  USER_ROLE_UPDATED: "Cập nhật vai trò người dùng",
  USER_ROLES_UPDATED: "Cập nhật vai trò người dùng",
};

export const AUDIT_OBJECT_LABELS: Record<string, string> = {
  bao_cao: "Báo cáo",
  co_so_giao_duc: "Cơ sở giáo dục",
  dot_import: "Đợt nhập dữ liệu",
  hoi_dong_tu_danh_gia: "Hội đồng tự đánh giá",
  ke_hoach_cai_tien: "Kế hoạch cải tiến",
  loi_moi_thanh_vien: "Lời mời thành viên",
  minh_chung: "Minh chứng",
  nam_hoc: "Năm học",
  nguoi_dung: "Người dùng",
  nguoi_dung_vai_tro: "Vai trò người dùng",
  phan_cong_tieu_chi: "Phân công tiêu chí",
  "storage.objects": "Tệp lưu trữ",
  tieu_chi: "Tiêu chí",
  tu_danh_gia: "Tự đánh giá",
  van_ban_lien_quan: "Văn bản liên quan",
};

export const LEGACY_NON_MUTATION_AUDIT_ACTIONS = [
  "EVIDENCE_LIST_READ",
  "EVIDENCE_DETAIL_READ",
  "EVIDENCE_HEALTH_READ",
  "EVIDENCE_FILE_SIGNED_URL_CREATED",
  "REPORT_EXPORTED",
] as const;

export function auditActionLabel(action: string) {
  return AUDIT_ACTION_LABELS[action] ?? "Thao tác hệ thống";
}

export function auditObjectLabel(objectName: string) {
  return AUDIT_OBJECT_LABELS[objectName] ?? "Dữ liệu hệ thống";
}
