export type ActiveNav =
  | "dashboard"
  | "work"
  | "standards"
  | "evidence"
  | "assessment"
  | "improvement"
  | "council"
  | "reports"
  | "legal"
  | "audit"
  | "settings";

export type AppRole =
  | "SYSTEM_ADMIN"
  | "PRINCIPAL"
  | "SELF_ASSESSMENT_CHAIR"
  | "SECRETARY"
  | "MEMBER"
  | "TEACHER"
  | "VIEWER";

export type NavigationItem = {
  key: ActiveNav;
  label: string;
  href: string;
  roles: AppRole[];
};

const managementRoles: AppRole[] = ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR", "SECRETARY"];

export const primaryNavigation: NavigationItem[] = [
  { key: "dashboard", label: "Tổng quan", href: "/dashboard", roles: managementRoles },
  { key: "work", label: "Việc của tôi", href: "/viec-cua-toi", roles: [...managementRoles, "MEMBER", "TEACHER"] },
  { key: "standards", label: "Bộ tiêu chuẩn", href: "/bo-tieu-chuan", roles: ["SYSTEM_ADMIN", ...managementRoles, "MEMBER", "TEACHER"] },
  { key: "evidence", label: "Minh chứng", href: "/minh-chung", roles: [...managementRoles, "MEMBER", "TEACHER"] },
  { key: "assessment", label: "Tự đánh giá", href: "/tu-danh-gia", roles: [...managementRoles, "MEMBER"] },
  { key: "improvement", label: "Kế hoạch cải tiến", href: "/ke-hoach-cai-tien", roles: managementRoles },
  { key: "council", label: "Hội đồng TĐG", href: "/hoi-dong-tu-danh-gia", roles: managementRoles },
  { key: "reports", label: "Báo cáo", href: "/bao-cao", roles: managementRoles },
  { key: "legal", label: "Văn bản liên quan", href: "/van-ban-lien-quan", roles: managementRoles },
  { key: "audit", label: "Nhật ký", href: "/nhat-ky", roles: ["PRINCIPAL"] },
  { key: "settings", label: "Cài đặt", href: "/thiet-lap", roles: ["SYSTEM_ADMIN", "PRINCIPAL", "SELF_ASSESSMENT_CHAIR"] },
];

const viewerReport: NavigationItem = {
  key: "reports",
  label: "Báo cáo đã phê duyệt",
  href: "/bao-cao/da-phe-duyet",
  roles: ["VIEWER"],
};

export function navigationForRoles(roleCodes: string[]) {
  const roles = new Set(roleCodes);

  const items = primaryNavigation.filter((item) =>
    item.roles.some((role) => roles.has(role)),
  );

  if (roles.has("VIEWER") && !items.some((item) => item.key === "reports")) {
    items.push(viewerReport);
  }

  return items;
}
