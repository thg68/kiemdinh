import { expect, test } from "@playwright/test";
import { hasCredentials, loginAs } from "./helpers/auth";

const viewports = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`landing và đăng nhập không tràn ngang tại ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const path of ["/", "/login"]) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    }
  });
}

test("đăng nhập có nhãn form và thao tác được hoàn toàn bằng bàn phím", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu")).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).not.toHaveCount(0);
});

test("menu giáo viên chỉ hiện các khu vực phù hợp với vai trò", async ({ page }) => {
  test.skip(!hasCredentials("TEACHER"), "Thiếu tài khoản Giáo viên staging.");
  await loginAs(page, "TEACHER");
  await page.goto("/minh-chung");

  await expect(page.getByRole("link", { name: "Việc của tôi" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Minh chứng", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nhật ký", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cài đặt", exact: true })).toHaveCount(0);
});
