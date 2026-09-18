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
  | "settings"
  | "profile";

import { hasCapability, type PageCapability } from "./capabilities";

export type { AppRole } from "./capabilities";

export type NavigationItem = {
  key: ActiveNav;
  label: string;
  href: string;
  capability: PageCapability;
};

export const primaryNavigation: NavigationItem[] = [
  { key: "dashboard", label: "Tổng quan", href: "/dashboard", capability: "page.dashboard" },
  { key: "work", label: "Việc của tôi", href: "/viec-cua-toi", capability: "page.work" },
  { key: "standards", label: "Bộ tiêu chuẩn", href: "/bo-tieu-chuan", capability: "page.standards" },
  { key: "evidence", label: "Minh chứng", href: "/minh-chung", capability: "page.evidence" },
  { key: "assessment", label: "Tự đánh giá", href: "/tu-danh-gia", capability: "page.assessment" },
  { key: "improvement", label: "Kế hoạch cải tiến", href: "/ke-hoach-cai-tien", capability: "page.improvement" },
  { key: "council", label: "Hội đồng TĐG", href: "/hoi-dong-tu-danh-gia", capability: "page.council" },
  { key: "reports", label: "Báo cáo", href: "/bao-cao", capability: "page.reports" },
  { key: "legal", label: "Văn bản liên quan", href: "/van-ban-lien-quan", capability: "page.legal" },
  { key: "audit", label: "Nhật ký", href: "/nhat-ky", capability: "page.audit" },
  { key: "settings", label: "Cài đặt", href: "/thiet-lap", capability: "page.settings" },
];

const viewerReport: NavigationItem = {
  key: "reports",
  label: "Báo cáo đã phê duyệt",
  href: "/bao-cao/da-phe-duyet",
  capability: "page.approved_reports",
};

export function navigationForRoles(roleCodes: string[]) {
  const roles = new Set(roleCodes);
  const items = primaryNavigation.filter((item) => hasCapability(roleCodes, item.capability));

  if (roles.has("VIEWER") && !items.some((item) => item.key === "reports")) {
    items.push(viewerReport);
  }

  return items;
}

export function firstRouteForRoles(roleCodes: string[]) {
  if (roleCodes.includes("SYSTEM_ADMIN")) {
    return "/quan-tri";
  }

  return firstSchoolRouteForRoles(roleCodes);
}

export function firstSchoolRouteForRoles(roleCodes: string[]) {
  const schoolRoleCodes = roleCodes.filter((roleCode) => roleCode !== "SYSTEM_ADMIN");
  return navigationForRoles(schoolRoleCodes)[0]?.href ?? "/thiet-lap";
}
