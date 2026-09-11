export type AppRole =
  | "SYSTEM_ADMIN"
  | "PRINCIPAL"
  | "SELF_ASSESSMENT_CHAIR"
  | "SECRETARY"
  | "MEMBER"
  | "TEACHER"
  | "VIEWER";

export type PageCapability =
  | "page.admin.overview"
  | "page.admin.schools"
  | "page.admin.participants"
  | "page.admin.evidence"
  | "page.admin.standards"
  | "page.admin.operations"
  | "page.dashboard"
  | "page.work"
  | "page.standards"
  | "page.evidence"
  | "page.evidence.health"
  | "page.evidence.verify"
  | "page.assessment"
  | "page.assessment.approve"
  | "page.improvement"
  | "page.council"
  | "page.reports"
  | "page.report_approval"
  | "page.approved_reports"
  | "page.legal"
  | "page.audit"
  | "page.settings";

export type ActionCapability =
  | "action.evidence.verify"
  | "action.assessment.approve"
  | "action.assessment.simulate"
  | "action.council.manage"
  | "action.report.export"
  | "action.report.approve";

export type Capability = PageCapability | ActionCapability;

const managementRoles: AppRole[] = ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR", "SECRETARY"];
const evidenceRoles: AppRole[] = [...managementRoles, "MEMBER", "TEACHER"];

export const capabilityRoles: Record<Capability, readonly AppRole[]> = {
  "page.admin.overview": ["SYSTEM_ADMIN"],
  "page.admin.schools": ["SYSTEM_ADMIN"],
  "page.admin.participants": ["SYSTEM_ADMIN"],
  "page.admin.evidence": ["SYSTEM_ADMIN"],
  "page.admin.standards": ["SYSTEM_ADMIN"],
  "page.admin.operations": ["SYSTEM_ADMIN"],
  "page.dashboard": managementRoles,
  "page.work": [...managementRoles, "MEMBER", "TEACHER"],
  "page.standards": [...managementRoles, "MEMBER", "TEACHER"],
  "page.evidence": evidenceRoles,
  "page.evidence.health": managementRoles,
  "page.evidence.verify": managementRoles,
  "page.assessment": [...managementRoles, "MEMBER"],
  "page.assessment.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "page.improvement": managementRoles,
  "page.council": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "page.reports": managementRoles,
  "page.report_approval": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "page.approved_reports": [...managementRoles, "VIEWER"],
  "page.legal": managementRoles,
  "page.audit": ["PRINCIPAL"],
  "page.settings": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.evidence.verify": managementRoles,
  "action.assessment.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.assessment.simulate": managementRoles,
  "action.council.manage": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.report.export": managementRoles,
  "action.report.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
};

const routeCapabilities: Array<{ match: RegExp; capability: PageCapability }> = [
  { match: /^\/quan-tri\/co-so(?:\/|$)/, capability: "page.admin.schools" },
  { match: /^\/quan-tri\/nguoi-tham-gia(?:\/|$)/, capability: "page.admin.participants" },
  { match: /^\/quan-tri\/minh-chung(?:\/|$)/, capability: "page.admin.evidence" },
  { match: /^\/quan-tri\/bo-tieu-chuan(?:\/|$)/, capability: "page.admin.standards" },
  { match: /^\/quan-tri\/van-hanh(?:\/|$)/, capability: "page.admin.operations" },
  { match: /^\/quan-tri(?:\/|$)/, capability: "page.admin.overview" },
  { match: /^\/bao-cao\/cho-duyet(?:\/|$)/, capability: "page.report_approval" },
  { match: /^\/bao-cao\/da-phe-duyet(?:\/|$)/, capability: "page.approved_reports" },
  { match: /^\/minh-chung\/suc-khoe(?:\/|$)/, capability: "page.evidence.health" },
  { match: /^\/minh-chung\/xac-minh(?:\/|$)/, capability: "page.evidence.verify" },
  { match: /^\/minh-chung(?:\/|$)/, capability: "page.evidence" },
  { match: /^\/tu-danh-gia\/cho-duyet(?:\/|$)/, capability: "page.assessment.approve" },
  { match: /^\/tu-danh-gia(?:\/|$)/, capability: "page.assessment" },
  { match: /^\/dashboard(?:\/|$)/, capability: "page.dashboard" },
  { match: /^\/viec-cua-toi(?:\/|$)/, capability: "page.work" },
  { match: /^\/bo-tieu-chuan(?:\/|$)/, capability: "page.standards" },
  { match: /^\/ke-hoach-cai-tien(?:\/|$)/, capability: "page.improvement" },
  { match: /^\/hoi-dong-tu-danh-gia(?:\/|$)/, capability: "page.council" },
  { match: /^\/bao-cao(?:\/|$)/, capability: "page.reports" },
  { match: /^\/van-ban-lien-quan(?:\/|$)/, capability: "page.legal" },
  { match: /^\/nhat-ky(?:\/|$)/, capability: "page.audit" },
  { match: /^\/thiet-lap(?:\/|$)/, capability: "page.settings" },
];

export function hasCapability(roleCodes: readonly string[], capability: Capability) {
  const acceptedRoles = capabilityRoles[capability];
  return roleCodes.some((role) => acceptedRoles.includes(role as AppRole));
}

export function capabilityForPath(pathname: string) {
  return routeCapabilities.find((route) => route.match.test(pathname))?.capability ?? null;
}
