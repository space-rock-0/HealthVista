import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

// ZIP downloads have no Git metadata; hook setup is optional for installation.
if (!existsSync(new URL("../.git", import.meta.url))) {
  console.log("Skipping Git hooks: this project is not a Git checkout.");
} else {
  const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    console.warn("Skipping Git hooks: Git configuration could not be updated.");
  }
}
