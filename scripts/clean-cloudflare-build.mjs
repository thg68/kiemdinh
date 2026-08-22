import { rmSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const targets = [".open-next"];

for (const target of targets) {
  const path = join(cwd(), target);

  try {
    rmSync(path, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 250,
    });
  } catch (error) {
    console.error(`Khong the xoa ${target}. Hay dung preview/deploy dang chay roi thu lai.`);
    console.error(error instanceof Error ? error.message : error);
    exit(1);
  }
}
