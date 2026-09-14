import { expect, test } from "@playwright/test";
import { hasCredentials, loginAs } from "./helpers/auth";

const adminRoutes = [
  { path: "/quan-tri", heading: "Tổng quan hệ thống" },
  { path: "/quan-tri/co-so", heading: "Cơ sở giáo dục" },
  { path: "/quan-tri/nguoi-tham-gia", heading: "Người tham gia" },
  { path: "/quan-tri/minh-chung", heading: "Quản trị minh chứng" },
  { path: "/quan-tri/bo-tieu-chuan", heading: "Bộ tiêu chuẩn" },
  { path: "/quan-tri/van-hanh", heading: "Vận hành hệ thống" },
] as const;

test.beforeEach(() => {
  test.skip(!hasCredentials("SYSTEM_ADMIN"), "Thiếu tài khoản quản trị hệ thống E2E.");
});

test("workspace quản trị có đủ các khu vực và không tràn ngang", async ({ page }) => {
  test.setTimeout(120_000);
  await loginAs(page, "SYSTEM_ADMIN");

  for (const route of adminRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });

    const desktop = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(desktop.scrollWidth).toBeLessThanOrEqual(desktop.clientWidth);
  }

  await page.setViewportSize({ width: 375, height: 812 });

  for (const route of adminRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[role="status"]')).toHaveCount(0, { timeout: 15_000 });

    const mobile = await page.evaluate(() => {
      const clientWidth = document.documentElement.clientWidth;
      const overflowingElements = Array.from(document.querySelectorAll<HTMLElement>("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            className: element.className.toString().slice(0, 100),
            clientWidth: element.clientWidth,
            right: Math.round(rect.right),
            scrollWidth: element.scrollWidth,
            tag: element.tagName.toLowerCase(),
            width: Math.round(rect.width),
          };
        })
        .filter((element) => element.right > clientWidth + 1)
        .slice(0, 12);

      return {
        clientWidth,
        overflowingElements,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(
      mobile.scrollWidth,
      `${route.path}: ${JSON.stringify(mobile.overflowingElements)}`,
    ).toBeLessThanOrEqual(mobile.clientWidth);
  }
});

test("quản trị minh chứng được chia theo kho của từng trường", async ({ page }) => {
  await loginAs(page, "SYSTEM_ADMIN");
  await page.goto("/quan-tri/minh-chung");

  await expect(page.getByRole("heading", { name: "Kho minh chứng theo cơ sở" })).toBeVisible();
  await expect(page.getByText("Hello World", { exact: true })).toHaveCount(0);
  await expect(page.getByText("MC.1.1.02", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Mở kho", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Metadata trong kho" })).toBeVisible();
  await expect(page.getByText("Tên nội dung", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /tải|xem.*tệp/i })).toHaveCount(0);
});

test("tạo trường và cấp quyền Hiệu trưởng là hai thao tác độc lập", async ({ page }) => {
  await loginAs(page, "SYSTEM_ADMIN");
  await page.goto("/quan-tri/co-so");

  await page.getByRole("button", { name: "Thêm cơ sở" }).click();
  await expect(page.getByLabel("Tên cơ sở giáo dục")).toBeVisible();
  await expect(page.getByLabel("Mã trường")).toBeVisible();
  await expect(page.getByLabel("Email Hiệu trưởng")).toHaveCount(0);
  await expect(page.getByLabel("Họ và tên Hiệu trưởng")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tạo cơ sở giáo dục" })).toBeVisible();

  await page.goto("/quan-tri/nguoi-tham-gia");
  await expect(page.getByRole("button", { name: /^Cài đặt / }).first()).toBeVisible();
});

test("cài đặt người dùng chỉ hiện nút lưu sau khi có thay đổi", async ({ page }) => {
  await loginAs(page, "SYSTEM_ADMIN");
  await page.goto("/quan-tri/nguoi-tham-gia");

  await page.getByRole("button", { name: /^Cài đặt / }).first().click();
  const dialog = page.getByRole("dialog", { name: "Cài đặt người dùng" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Trường đang tham gia")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Lưu thay đổi" })).toHaveCount(0);

  const principal = dialog.getByLabel("Đặt làm Hiệu trưởng");
  await principal.setChecked(!(await principal.isChecked()));
  await expect(dialog.getByRole("button", { name: "Lưu thay đổi" })).toBeVisible();
});

test("tài khoản kiêm nhiệm chuyển được giữa hai workspace", async ({ page }) => {
  await loginAs(page, "SYSTEM_ADMIN");

  const switcher = page.getByLabel("Vai trò đang sử dụng");
  await expect(switcher).toBeVisible();
  await switcher.selectOption("school");
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);

  const schoolRoles = page.getByLabel("Vai trò hiện tại");
  await expect(schoolRoles.getByText("Quản trị hệ thống", { exact: true })).toHaveCount(0);

  await page.getByLabel("Vai trò đang sử dụng").selectOption("admin");
  await expect(page).toHaveURL(/\/quan-tri(?:[/?#]|$)/);
});
