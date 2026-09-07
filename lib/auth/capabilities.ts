export type AppRole =
  | "SYSTEM_ADMIN"
  | "PRINCIPAL"
  | "SELF_ASSESSMENT_CHAIR"
  | "SECRETARY"
  | "MEMBER"
  | "TEACHER"
  | "VIEWER";

export type PageCapability =
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
  "page.dashboard": managementRoles,
  "page.work": [...managementRoles, "MEMBER", "TEACHER"],
  "page.standards": ["SYSTEM_ADMIN", ...managementRoles, "MEMBER", "TEACHER"],
  "page.evidence": evidenceRoles,
  "page.evidence.health": managementRoles,
  "page.evidence.verify": managementRoles,
  "page.assessment": [...managementRoles, "MEMBER"],
  "page.assessment.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "page.improvement": managementRoles,
  "page.council": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "page.reports": managementRoles,
  "page.approved_reports": [...managementRoles, "VIEWER"],
  "page.legal": managementRoles,
  "page.audit": ["PRINCIPAL"],
  "page.settings": ["SYSTEM_ADMIN", "PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.evidence.verify": managementRoles,
  "action.assessment.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.assessment.simulate": managementRoles,
  "action.council.manage": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
  "action.report.export": managementRoles,
  "action.report.approve": ["PRINCIPAL", "SELF_ASSESSMENT_CHAIR"],
};

const routeCapabilities: Array<{ match: RegExp; capability: PageCapability }> = [
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
