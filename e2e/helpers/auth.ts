import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export type TestRole =
  | "SYSTEM_ADMIN"
  | "PRINCIPAL"
  | "SELF_ASSESSMENT_CHAIR"
  | "SECRETARY"
  | "MEMBER"
  | "TEACHER"
  | "VIEWER";

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

export function requireE2ECredentials(roles: TestRole[]) {
  const missing = roles.flatMap((role) => {
    const credentials = credentialsFor(role);
    const names: string[] = [];
    if (!credentials.email) names.push(`E2E_${role}_EMAIL`);
    if (!credentials.password) names.push(`E2E_${role}_PASSWORD`);
    return names;
  });

  if (missing.length > 0) {
    throw new Error(`Thiếu cấu hình E2E bắt buộc: ${missing.join(", ")}.`);
  }
}

export async function loginAs(page: Page, role: TestRole) {
  const credentials = credentialsFor(role);
  const expectedRoutes: Record<TestRole, string> = {
    SYSTEM_ADMIN: "/bo-tieu-chuan",
    PRINCIPAL: "/dashboard",
    SELF_ASSESSMENT_CHAIR: "/dashboard",
    SECRETARY: "/dashboard",
    MEMBER: "/viec-cua-toi",
    TEACHER: "/viec-cua-toi",
    VIEWER: "/bao-cao/da-phe-duyet",
  };
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.locator("form").getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedRoutes[role]}(?:[/?#]|$)`), { timeout: 20_000 });
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

export async function recoveryLinkFor(role: TestRole) {
  const supabaseUrl = process.env.STAGING_SUPABASE_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    ?? "";
  const serviceRoleKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY ?? "";
  const redirectBase = process.env.E2E_BASE_URL ?? "http://localhost:3000";
  const credentials = credentialsFor(role);

  if (!supabaseUrl || !serviceRoleKey || !credentials.email) {
    throw new Error("Thiếu cấu hình staging để tạo liên kết recovery E2E.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: credentials.email,
    options: { redirectTo: `${redirectBase.replace(/\/$/, "")}/quen-mat-khau` },
  });
  const tokenHash = data.properties?.hashed_token;

  if (error || !tokenHash) {
    throw new Error("Không tạo được liên kết recovery E2E trên staging.");
  }

  const resetUrl = new URL("/quen-mat-khau", redirectBase);
  resetUrl.searchParams.set("token_hash", tokenHash);
  resetUrl.searchParams.set("type", "recovery");
  return resetUrl.toString();
}
