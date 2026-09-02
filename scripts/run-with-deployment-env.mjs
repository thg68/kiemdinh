import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [environment, ...commandParts] = process.argv.slice(2);

if (!["staging", "production"].includes(environment) || commandParts.length === 0) {
  console.error(
    "Usage: node scripts/run-with-deployment-env.mjs <staging|production> <command>",
  );
  process.exit(1);
}

const envFiles = [
  ".env." + environment + ".local",
  ".env.local",
  ".env." + environment,
  ".env",
].map((envFile) => resolve(process.cwd(), envFile));

// A local environment file must override stale deployment variables inherited
// from the parent shell. CI deployments without files keep their injected values.
if (envFiles.some((envFile) => existsSync(envFile))) {
  for (const name of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
    "PRODUCTION_SUPABASE_URL",
  ]) {
    delete process.env[name];
  }
}

for (const envFile of envFiles) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

const child = spawn(commandParts.join(" "), {
  env: process.env,
  shell: true,
  stdio: "inherit",
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
