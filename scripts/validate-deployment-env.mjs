import { existsSync } from "node:fs";
import { resolve } from "node:path";

const environment = process.argv[2];

if (!["staging", "production"].includes(environment)) {
  console.error("Cách dùng: node scripts/validate-deployment-env.mjs <staging|production>");
  process.exit(1);
}

// Script Node thuần không tự nạp file môi trường như Next.js.
// Nạp file ưu tiên cao trước vì process.loadEnvFile không ghi đè biến đã có.
for (const envFile of [
  `.env.${environment}.local`,
  ".env.local",
  `.env.${environment}`,
  ".env",
]) {
  const envPath = resolve(process.cwd(), envFile);

  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Thiếu biến môi trường bắt buộc: ${missing.join(", ")}.`);
  process.exit(1);
}

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);

if (appUrl.protocol !== "https:" || supabaseUrl.protocol !== "https:") {
  console.error("Môi trường triển khai phải dùng HTTPS cho ứng dụng và Supabase.");
  process.exit(1);
}

if (appUrl.hostname === "localhost" || appUrl.hostname === "127.0.0.1") {
  console.error("NEXT_PUBLIC_APP_URL không được trỏ về máy local khi triển khai.");
  process.exit(1);
}

if (
  environment === "production"
  && (
    appUrl.origin !== "https://kdclgd.io.vn"
    || appUrl.pathname !== "/"
    || appUrl.search
    || appUrl.hash
  )
) {
  console.error("NEXT_PUBLIC_APP_URL production phải là chính xác https://kdclgd.io.vn.");
  process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Không đưa SUPABASE_SERVICE_ROLE_KEY vào build hoặc runtime của ứng dụng.");
  process.exit(1);
}

if (environment === "staging") {
  const productionUrl = process.env.PRODUCTION_SUPABASE_URL?.trim();
  if (!productionUrl) {
    console.error("Thiếu PRODUCTION_SUPABASE_URL để xác nhận staging không dùng cơ sở dữ liệu production.");
    process.exit(1);
  }

  if (supabaseUrl.href.replace(/\/$/, "") === productionUrl.replace(/\/$/, "")) {
    console.error("Supabase staging đang trùng với production. Dừng triển khai.");
    process.exit(1);
  }
}

console.log(`Cấu hình ${environment} hợp lệ; không phát hiện service role key hoặc URL local.`);
