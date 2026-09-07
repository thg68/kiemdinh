import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const roleCodes = [
  "SYSTEM_ADMIN",
  "PRINCIPAL",
  "SELF_ASSESSMENT_CHAIR",
  "SECRETARY",
  "MEMBER",
  "TEACHER",
  "VIEWER",
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const name = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if (
          value.length >= 2
          && ((value.startsWith('"') && value.endsWith('"'))
            || (value.startsWith("'") && value.endsWith("'")))
        ) {
          value = value.slice(1, -1);
        }
        return [name, value];
      }),
  );
}

function required(values, name) {
  const value = values[name]?.trim();
  if (!value) throw new Error(`Thiếu biến ${name} trong cấu hình staging.`);
  return value;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: options.env ?? process.env,
    shell: options.shell ?? false,
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture ? result.stderr?.trim() : "";
    throw new Error(`${options.label ?? command} thất bại.${detail ? ` ${detail}` : ""}`);
  }

  return result.stdout ?? "";
}

const stagingPath = resolve(".env.staging.local");
const e2ePath = resolve(".env.e2e.local");
const staging = parseEnvFile(stagingPath);
const existing = parseEnvFile(e2ePath);
const stagingUrl = required(staging, "NEXT_PUBLIC_SUPABASE_URL");
const productionUrl = required(staging, "PRODUCTION_SUPABASE_URL");

if (new URL(stagingUrl).origin === new URL(productionUrl).origin) {
  throw new Error("Từ chối chạy role gate vì Supabase staging trùng production.");
}

const e2e = {
  ...existing,
  STAGING_SUPABASE_URL: stagingUrl,
  NEXT_PUBLIC_SUPABASE_URL: stagingUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required(staging, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  PRODUCTION_SUPABASE_URL: productionUrl,
  E2E_BASE_URL: required(staging, "NEXT_PUBLIC_APP_URL"),
  E2E_ALLOW_STAGING_PROVISION: "true",
  E2E_RELEASE_GATE: "true",
};

for (const roleCode of roleCodes) {
  const slug = roleCode.toLowerCase().replaceAll("_", "-");
  e2e[`E2E_${roleCode}_EMAIL`] ||= `e2e-${slug}@staging.kdclgd.io.vn`;
  e2e[`E2E_${roleCode}_PASSWORD`] ||= `${randomBytes(24).toString("base64url")}Aa1!`;
}

const persistedNames = [
  "STAGING_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "PRODUCTION_SUPABASE_URL",
  "E2E_BASE_URL",
  "E2E_ALLOW_STAGING_PROVISION",
  "E2E_RELEASE_GATE",
  ...roleCodes.flatMap((roleCode) => [
    `E2E_${roleCode}_EMAIL`,
    `E2E_${roleCode}_PASSWORD`,
  ]),
];
writeFileSync(
  e2ePath,
  `${persistedNames.map((name) => `${name}=${e2e[name]}`).join("\n")}\n`,
  { encoding: "utf8", mode: 0o600 },
);

const projectRef = new URL(stagingUrl).hostname.split(".")[0];
const cliEnv = {
  ...process.env,
  SUPABASE_TELEMETRY_DISABLED: "1",
  DO_NOT_TRACK: "1",
};
const apiKeyOutput = run(
  "npx",
  [
    "supabase",
    "projects",
    "api-keys",
    "--project-ref",
    projectRef,
    "--reveal",
    "--output",
    "json",
  ],
  {
    capture: true,
    env: cliEnv,
    label: "Lấy API key staging",
    shell: process.platform === "win32",
  },
);
const jsonStart = apiKeyOutput.indexOf("[");
const jsonEnd = apiKeyOutput.lastIndexOf("]");
if (jsonStart < 0 || jsonEnd < jsonStart) {
  throw new Error("Supabase CLI không trả về danh sách API key hợp lệ.");
}
const apiKeys = JSON.parse(apiKeyOutput.slice(jsonStart, jsonEnd + 1));
const serviceRoleKey = apiKeys.find((key) => key.name === "service_role")?.api_key;
if (!serviceRoleKey) throw new Error("Không lấy được service-role key của staging.");

const outputPath = join(tmpdir(), `kiemdinh-e2e-${process.pid}-${Date.now()}.txt`);
try {
  const gateEnv = {
    ...process.env,
    ...staging,
    ...e2e,
    STAGING_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    GITHUB_OUTPUT: outputPath,
  };

  console.log("Đang provision tenant và 7 tài khoản UAT trên staging...");
  run(process.execPath, ["scripts/provision-staging-e2e.mjs"], {
    env: gateEnv,
    label: "Provision staging E2E",
  });

  const outputs = parseEnvFile(outputPath);
  gateEnv.E2E_YEAR_ID = required(outputs, "year_id");
  gateEnv.E2E_CAP_HOC = required(outputs, "cap_hoc");

  console.log("Đang kiểm tra mô phỏng lộ trình trên staging...");
  run(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", "e2e/assessment-simulation.spec.ts", "--workers=1"],
    { env: gateEnv, label: "Playwright assessment simulation" },
  );

  console.log("Đang chạy role gate Sprint 12 trên staging...");
  run(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", "--grep", "Sprint 12"],
    { env: gateEnv, label: "Playwright staging role gate" },
  );
} finally {
  rmSync(outputPath, { force: true });
}

console.log("Role gate staging đã hoàn tất; credential chỉ lưu trong .env.e2e.local.");
