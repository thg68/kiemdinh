import { expect, test } from "@playwright/test";
import { hasCredentials, loginAs } from "./helpers/auth";

test.describe("trợ lý viết bằng AI", () => {
  test("chọn nhà cung cấp và chỉ hiện cấu hình tại Cài đặt", async ({ page }) => {
    test.setTimeout(120_000);
    test.skip(
      !hasCredentials("SELF_ASSESSMENT_CHAIR"),
      "Chưa cấu hình tài khoản E2E SELF_ASSESSMENT_CHAIR.",
    );
    await loginAs(page, "SELF_ASSESSMENT_CHAIR");

    await page.goto("/thiet-lap");
    await expect(page.getByRole("heading", { name: "Cấu hình trợ lý AI" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel("Nhà cung cấp AI")).toHaveValue("openai");
    await expect(page.getByLabel("API key OpenAI")).toBeVisible();
    await expect(page.getByLabel("Mô hình")).toHaveValue("gpt-5.4-mini");

    await page.getByLabel("Nhà cung cấp AI").selectOption("gemini");
    await expect(page.getByLabel("API key Google Gemini")).toBeVisible();
    await expect(page.getByLabel("Mô hình")).toHaveValue("gemini-3.8-flash");

    await page.getByLabel("Nhà cung cấp AI").selectOption("openai");
    await page.screenshot({ path: ".tmp/ai-settings.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel("Nhà cung cấp AI")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kiểm tra kết nối" })).toBeVisible();
    await page.screenshot({ path: ".tmp/ai-settings-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto("/bao-cao");
    await expect(page.getByLabel("Nhà cung cấp AI")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Xuất báo cáo" })).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: ".tmp/ai-report-assistant.png", fullPage: true });

    await page.goto("/ke-hoach-cai-tien");
    await expect(page.getByLabel("Nhà cung cấp AI")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Kế hoạch cải tiến" })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: ".tmp/ai-improvement-assistant.png", fullPage: true });
  });
});
