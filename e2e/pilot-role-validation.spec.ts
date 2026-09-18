import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessToken,
  credentialsFor,
  loginAs,
  recoveryLinkFor,
  requireE2ECredentials,
  type TestRole,
} from "./helpers/auth";

const roles: Array<{ code: TestRole; label: string }> = [
  { code: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
  { code: "PRINCIPAL", label: "Hiệu trưởng" },
  { code: "SELF_ASSESSMENT_CHAIR", label: "Chủ tịch Hội đồng TĐG" },
  { code: "SECRETARY", label: "Thư ký Hội đồng" },
  { code: "MEMBER", label: "Ủy viên / Tổ trưởng" },
  { code: "TEACHER", label: "Giáo viên" },
  { code: "VIEWER", label: "Khách (chỉ đọc)" },
];

const permissionMatrix: Array<{
  role: TestRole;
  allowed: string;
  denied: string;
}> = [
  { role: "PRINCIPAL", allowed: "report.approve", denied: "standard.write" },
  { role: "SELF_ASSESSMENT_CHAIR", allowed: "assessment.approve", denied: "standard.write" },
  { role: "SECRETARY", allowed: "report.export", denied: "report.approve" },
  { role: "MEMBER", allowed: "assessment.write", denied: "report.export" },
  { role: "TEACHER", allowed: "evidence.create", denied: "report.read" },
  { role: "VIEWER", allowed: "report.read", denied: "evidence.read" },
];

async function permissionFor(
  request: APIRequestContext,
  token: string,
  permission: string,
) {
  const response = await request.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/fn_has_permission`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        authorization: `Bearer ${token}`,
      },
      data: { p_permission: permission },
    },
  );
  expect(response.ok()).toBe(true);
  return response.json() as Promise<boolean>;
}

test.describe("Sprint 12 - xác nhận tài khoản thực tế của 7 vai trò", () => {
  test.skip(process.env.E2E_RELEASE_GATE !== "true", "Chỉ chạy trong release gate Sprint 12.");

  test.beforeAll(() => {
    requireE2ECredentials(roles.map((role) => role.code));
  });

  for (const role of roles) {
    test(`${role.label} đăng nhập và nhận đúng vai trò`, async ({ page }) => {
      await loginAs(page, role.code);
      await expect(page.getByLabel("Vai trò hiện tại").getByText(role.label, { exact: true })).toBeVisible();
    });
  }

  for (const entry of permissionMatrix) {
    test(`${entry.role} có đúng capability tại tầng cơ sở dữ liệu`, async ({ page, request }) => {
      await loginAs(page, entry.role);
      const token = await accessToken(page);
      expect(token).toBeTruthy();
      expect(await permissionFor(request, token!, entry.allowed)).toBe(true);
      expect(await permissionFor(request, token!, entry.denied)).toBe(false);
    });
  }

  test("SYSTEM_ADMIN được xác nhận bằng vai trò hệ thống, không nhận quyền dữ liệu đơn vị", async ({ page, request }) => {
    await loginAs(page, "SYSTEM_ADMIN");
    const token = await accessToken(page);
    const response = await request.post(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/fn_has_role`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          authorization: `Bearer ${token}`,
        },
        data: { p_role: "SYSTEM_ADMIN" },
      },
    );
    expect(response.ok()).toBe(true);
    expect(await response.json()).toBe(true);
    expect(await permissionFor(request, token!, "report.read")).toBe(false);
  });

  test("Giáo viên bị chặn khi gọi trực tiếp API xuất báo cáo", async ({ page, request }) => {
    await loginAs(page, "TEACHER");
    const token = await accessToken(page);
    const response = await request.get(
      `/api/bao-cao/export-json?namHocId=${process.env.E2E_YEAR_ID}&capHoc=${process.env.E2E_CAP_HOC}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(403);
  });

  test("Hiệu trưởng xuất được dữ liệu năm học dạng JSON", async ({ page, request }) => {
    await loginAs(page, "PRINCIPAL");
    const token = await accessToken(page);
    const response = await request.get(
      `/api/bao-cao/export-json?namHocId=${process.env.E2E_YEAR_ID}&capHoc=${process.env.E2E_CAP_HOC}`,
      { headers: { authorization: `Bearer ${token}` } },
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["content-disposition"]).toContain("attachment");
  });

  test("Khách chỉ đọc mở được kho báo cáo đã phê duyệt", async ({ page }) => {
    await loginAs(page, "VIEWER");
    await page.goto("/bao-cao/da-phe-duyet");
    await expect(page.getByRole("heading", { name: "Báo cáo đã phê duyệt" })).toBeVisible();
  });

  test("Hiệu trưởng tải được các màn hình nghiệp vụ chính sau đăng nhập", async ({ page }) => {
    await loginAs(page, "PRINCIPAL");

    const pages = [
      { path: "/viec-cua-toi", heading: "Việc của tôi" },
      { path: "/ke-hoach-cai-tien", heading: "Kế hoạch cải tiến" },
      { path: "/van-ban-lien-quan", heading: "Văn bản liên quan" },
      { path: "/tu-danh-gia", heading: "Tự đánh giá" },
    ];

    for (const destination of pages) {
      await page.goto(destination.path);
      await expect(page.getByRole("heading", { name: destination.heading, exact: true })).toBeVisible();
      await expect(page.getByText(/Không tải được dữ liệu/i)).toHaveCount(0);
    }
  });

  test("liên kết recovery thật đặt lại được mật khẩu rồi kết thúc phiên", async ({ page }) => {
    const recoveryLink = await recoveryLinkFor("PRINCIPAL");
    const { password } = credentialsFor("PRINCIPAL");
    const replacementPassword = `${password}R2!`;

    await page.goto(recoveryLink);
    await expect(page.getByRole("heading", { name: "Đặt mật khẩu mới" })).toBeVisible({ timeout: 20_000 });
    await page.getByLabel("Mật khẩu mới").fill(replacementPassword);
    await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
    await expect(page.getByText("Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.")).toBeVisible();
  });

  test("Ủy viên không đọc được nhật ký qua REST", async ({ page, request }) => {
    await loginAs(page, "MEMBER");
    const token = await accessToken(page);
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/nhat_ky_truy_cap?select=id&limit=1`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test("Quản trị hệ thống không đọc được minh chứng đơn vị qua REST", async ({ page, request }) => {
    await loginAs(page, "SYSTEM_ADMIN");
    const token = await accessToken(page);
    const response = await request.get(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/minh_chung?select=id&limit=1`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, authorization: `Bearer ${token}` } },
    );
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });
});
