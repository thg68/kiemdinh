import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { capabilityForPath, capabilityRoles, hasCapability } from "./capabilities";

describe("capability registry", () => {
  it("ưu tiên route con trước route cha", () => {
    expect(capabilityForPath("/quan-tri/nguoi-tham-gia")).toBe("page.admin.participants");
    expect(capabilityForPath("/quan-tri")).toBe("page.admin.overview");
    expect(capabilityForPath("/minh-chung/xac-minh")).toBe("page.evidence.verify");
    expect(capabilityForPath("/bao-cao/cho-duyet")).toBe("page.report_approval");
    expect(capabilityForPath("/bao-cao/da-phe-duyet/123")).toBe("page.approved_reports");
  });

  it("tách quyền quản trị hệ thống khỏi nghiệp vụ nhà trường", () => {
    expect(hasCapability(["SYSTEM_ADMIN"], "page.admin.evidence")).toBe(true);
    expect(hasCapability(["PRINCIPAL"], "page.admin.evidence")).toBe(false);
    expect(hasCapability(["SYSTEM_ADMIN"], "page.standards")).toBe(false);
    expect(hasCapability(["SYSTEM_ADMIN"], "page.settings")).toBe(false);
  });

  it("chỉ người có thẩm quyền được mở hàng đợi báo cáo", () => {
    expect(hasCapability(["PRINCIPAL"], "page.report_approval")).toBe(true);
    expect(hasCapability(["SELF_ASSESSMENT_CHAIR"], "page.report_approval")).toBe(true);
    expect(hasCapability(["SECRETARY"], "page.report_approval")).toBe(false);
  });

  it("giáo viên không được xác minh minh chứng hoặc phê duyệt báo cáo", () => {
    expect(hasCapability(["TEACHER"], "action.evidence.verify")).toBe(false);
    expect(hasCapability(["TEACHER"], "action.report.approve")).toBe(false);
  });

  it("hiệu trưởng có các quyền phê duyệt trong đơn vị", () => {
    expect(hasCapability(["PRINCIPAL"], "action.evidence.verify")).toBe(true);
    expect(hasCapability(["PRINCIPAL"], "action.assessment.approve")).toBe(true);
    expect(hasCapability(["PRINCIPAL"], "action.report.approve")).toBe(true);
    expect(hasCapability(["PRINCIPAL"], "action.assessment.simulate")).toBe(true);
  });

  it("chỉ nhóm quản lý được mô phỏng lộ trình nâng mức", () => {
    expect(hasCapability(["SECRETARY"], "action.assessment.simulate")).toBe(true);
    expect(hasCapability(["MEMBER"], "action.assessment.simulate")).toBe(false);
    expect(hasCapability(["TEACHER"], "action.assessment.simulate")).toBe(false);
  });

  it("thư ký được xuất nhưng không được phê duyệt báo cáo", () => {
    expect(hasCapability(["SECRETARY"], "action.report.export")).toBe(true);
    expect(hasCapability(["SECRETARY"], "action.report.approve")).toBe(false);
  });

  it("khách chỉ truy cập kho báo cáo đã phê duyệt", () => {
    expect(hasCapability(["VIEWER"], "page.approved_reports")).toBe(true);
    expect(hasCapability(["VIEWER"], "page.reports")).toBe(false);
  });

  it("tài liệu ma trận quyền khớp capability registry", () => {
    const documentation = readFileSync(
      new URL("../../docs/MATRAN-NANG-LUC-VAI-TRO.md", import.meta.url),
      "utf8",
    );

    for (const [capability, roles] of Object.entries(capabilityRoles)) {
      expect(documentation).toContain(`| \`${capability}\` | ${roles.join(", ")} |`);
    }
  });
});
