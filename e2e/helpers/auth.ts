import { expect, type Page } from "@playwright/test";

export type TestRole = "PRINCIPAL" | "SECRETARY" | "TEACHER";

export function credentialsFor(role: TestRole) {
  return {
    email: process.env[`E2E_${role}_EMAIL`] ?? "",
    password: process.env[`E2E_${role}_PASSWORD`] ?? "",
  };
}

export function hasCredentials(role: TestRole) {
  const credentials = credentialsFor(role);
  return Boolean(credentials.email && credentials.password);
}

export async function loginAs(page: Page, role: TestRole) {
  const credentials = credentialsFor(role);
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/(thiet-lap|dashboard)/, { timeout: 20_000 });
}

export async function accessToken(page: Page) {
  return page.evaluate(() => {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed.access_token) return parsed.access_token;
    }
    return null;
  });
}
