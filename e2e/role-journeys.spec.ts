import { expect, test } from "@playwright/test";
import { accessToken, hasCredentials, loginAs, type TestRole } from "./helpers/auth";

const roleLabels: Record<TestRole, string> = {
  SYSTEM_ADMIN: "Quản trị hệ thống",
  PRINCIPAL: "Hiệu trưởng",
  SELF_ASSESSMENT_CHAIR: "Chủ tịch Hội đồng TĐG",
  SECRETARY: "Thư ký Hội đồng",
  MEMBER: "Ủy viên / Tổ trưởng",
  TEACHER: "Giáo viên",
  VIEWER: "Khách (chỉ đọc)",
};

function requireRole(role: TestRole) {
  const configured = hasCredentials(role);
  test.skip(!configured && !process.env.CI, `Chưa cấu hình tài khoản E2E ${role}.`);
  if (!configured && process.env.CI) {
    throw new Error(`Thiếu E2E_${role}_EMAIL hoặc E2E_${role}_PASSWORD.`);
  }
}

test.describe("luồng Hiệu trưởng", () => {
  test("xem dashboard, báo cáo và nhật ký trong đơn vị", async ({ page }) => {
    requireRole("PRINCIPAL");
    await loginAs(page, "PRINCIPAL");
    await page.goto("/dashboard");
    await expect(page.getByText(roleLabels.PRINCIPAL, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Báo cáo", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Xuất báo cáo" })).toBeVisible();
    await page.getByRole("link", { name: "Nhật ký", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Nhật ký thao tác" })).toBeVisible();
  });

  test("đăng xuất xóa phiên cục bộ và chặn quay lại trang nghiệp vụ", async ({ page }) => {
    requireRole("PRINCIPAL");
    await loginAs(page, "PRINCIPAL");
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  });
});

test.describe("luồng Thư ký Hội đồng", () => {
  test("tổng hợp minh chứng và mở khu vực xuất báo cáo", async ({ page }) => {
    requireRole("SECRETARY");
    await loginAs(page, "SECRETARY");
    await page.goto("/minh-chung");
    await expect(page.getByText(roleLabels.SECRETARY, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kho minh chứng" })).toBeVisible();

    await page.goto("/bao-cao");
    await expect(page.getByRole("heading", { name: "Xuất báo cáo" })).toBeVisible();
  });
});

test.describe("luồng Giáo viên", () => {
  test("tạo minh chứng và không đọc được nhật ký qua REST", async ({ page, request }) => {
    requireRole("TEACHER");
    await loginAs(page, "TEACHER");
    await page.goto("/minh-chung");
    await expect(page.getByText(roleLabels.TEACHER, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Tạo minh chứng" }).click();
    await expect(page.getByRole("heading", { name: "Thêm minh chứng" })).toBeVisible();

    const token = await accessToken(page);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(token).toBeTruthy();
    expect(supabaseUrl).toBeTruthy();
    expect(anonKey).toBeTruthy();

    const response = await request.get(`${supabaseUrl}/rest/v1/nhat_ky_truy_cap?select=id&limit=1`, {
      headers: {
        apikey: anonKey!,
        authorization: `Bearer ${token}`,
      },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test("API chặn xuất báo cáo khi không có quyền", async ({ page, request }) => {
    requireRole("TEACHER");
    test.skip(!process.env.E2E_YEAR_ID, "Thiếu E2E_YEAR_ID để kiểm tra API báo cáo.");
    await loginAs(page, "TEACHER");
    const token = await accessToken(page);
    const response = await request.get(
      `/api/bao-cao/export-json?namHocId=${process.env.E2E_YEAR_ID}&capHoc=${process.env.E2E_CAP_HOC ?? "mam_non"}`,
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(response.status()).toBe(403);
  });
});
