import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("Thieu lenh can chay voi Node 22.");
  process.exit(1);
}

const currentMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
const userNodeRoot = process.env.USERPROFILE
  ? join(process.env.USERPROFILE, ".nodejs")
  : null;
const discoveredNode22Dirs = userNodeRoot && existsSync(userNodeRoot)
  ? readdirSync(userNodeRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith("node-v22."))
      .map((entry) => join(userNodeRoot, entry.name))
      .sort()
      .reverse()
  : [];
const candidates = [
  process.env.NODE22_HOME,
  ...discoveredNode22Dirs,
].filter((directory) => typeof directory === "string" && directory.length > 0);

const node22Dir = currentMajor === 22
  ? null
  : candidates.find((directory) => existsSync(join(directory, "node.exe"))) ?? null;

if (currentMajor !== 22 && !node22Dir) {
  console.error(
    "Can Node.js 22 de build Cloudflare. Hay chay bang Node 22 hoac dat NODE22_HOME den thu muc cai Node 22.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  ...(node22Dir
    ? {
        PATH: `${node22Dir};${process.env.PATH ?? ""}`,
        Path: `${node22Dir};${process.env.Path ?? ""}`,
      }
    : {}),
};

const child = spawn(command, {
  env,
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
