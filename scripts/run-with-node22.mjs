import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const portableNodeDir = "C:\\Users\\Name\\.nodejs\\node-v22.22.0-win-x64";
const portableNodeExe = join(portableNodeDir, "node.exe");

if (!existsSync(portableNodeExe)) {
  console.error(
    `Khong tim thay Node 22 portable tai ${portableNodeExe}. Hay cai Node 22 truoc khi chay lenh nay.`,
  );
  process.exit(1);
}

const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("Thieu lenh can chay voi Node 22.");
  process.exit(1);
}

const env = {
  ...process.env,
  PATH: `${portableNodeDir};${process.env.PATH ?? ""}`,
  Path: `${portableNodeDir};${process.env.Path ?? ""}`,
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
