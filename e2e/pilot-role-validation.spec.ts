import { expect, test } from "@playwright/test";
import { hasCredentials, loginAs, type TestRole } from "./helpers/auth";

const roles: Array<{ code: TestRole; label: string }> = [
  { code: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
  { code: "PRINCIPAL", label: "Hiệu trưởng" },
  { code: "SELF_ASSESSMENT_CHAIR", label: "Chủ tịch Hội đồng TĐG" },
  { code: "SECRETARY", label: "Thư ký Hội đồng" },
  { code: "MEMBER", label: "Ủy viên / Tổ trưởng" },
  { code: "TEACHER", label: "Giáo viên" },
  { code: "VIEWER", label: "Khách (chỉ đọc)" },
];

test.describe("Sprint 12 - xác nhận tài khoản thực tế của 7 vai trò", () => {
  test.skip(process.env.E2E_RELEASE_GATE !== "true", "Chỉ chạy trong release gate Sprint 12.");

  for (const role of roles) {
    test(`${role.label} đăng nhập và nhận đúng vai trò`, async ({ page }) => {
      expect(hasCredentials(role.code), `Thiếu tài khoản E2E_${role.code}.`).toBe(true);
      await loginAs(page, role.code);
      await expect(page.getByText(role.label, { exact: true })).toBeVisible();
    });
  }
});
