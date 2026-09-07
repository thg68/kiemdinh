import { expect, test } from "@playwright/test";
import { hasCredentials, loginAs } from "./helpers/auth";

test.describe("Mô phỏng lộ trình nâng mức", () => {
  test.skip(
    !hasCredentials("PRINCIPAL") || !hasCredentials("MEMBER"),
    "Cần tài khoản E2E của hiệu trưởng và ủy viên.",
  );

  test("hiệu trưởng mở, điều chỉnh và đóng mô phỏng mà không lưu dữ liệu", async ({ page }) => {
    await loginAs(page, "PRINCIPAL");
    await page.goto("/tu-danh-gia");

    const openButton = page.getByRole("button", { name: "Mô phỏng phương án" });
    await expect(openButton).toBeVisible();
    await openButton.click();

    const drawer = page.getByRole("dialog", { name: "Mô phỏng lộ trình nâng mức" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/hoàn toàn không lưu dữ liệu/i)).toBeVisible();
    await expect(drawer.getByText("Sau mô phỏng", { exact: true })).toBeVisible();

    const checkboxes = drawer.getByRole("checkbox");
    if (await checkboxes.count()) {
      const first = checkboxes.first();
      await first.setChecked(!(await first.isChecked()));
    }

    await drawer.getByRole("button", { name: "Đóng mô phỏng" }).click();
    await expect(drawer).toBeHidden();

    await page.reload();
    await expect(openButton).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Mô phỏng lộ trình nâng mức" })).toHaveCount(0);
  });

  test("ủy viên không thấy công cụ mô phỏng dành cho quản lý", async ({ page }) => {
    await loginAs(page, "MEMBER");
    await page.goto("/tu-danh-gia");

    await expect(page.getByRole("button", { name: "Mô phỏng phương án" })).toHaveCount(0);
  });
});
