import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import * as prettier from "prettier";

const git = (args, options) =>
  spawnSync("git", ["-c", `safe.directory=${process.cwd()}`, ...args], options);
const requestedBase = process.env.FORMAT_BASE || "HEAD^";
const validBase =
  /^[a-zA-Z0-9_/.^~-]+$/.test(requestedBase) &&
  !/^0+$/.test(requestedBase) &&
  git(["cat-file", "-e", `${requestedBase}^{commit}`]).status === 0;
const args = validBase
  ? ["diff", "--name-only", "--diff-filter=ACMR", requestedBase, "HEAD"]
  : ["ls-files"];
const result = git(args, { encoding: "utf8" });
if (result.status !== 0) throw new Error("Could not enumerate files for formatting.");
const files = result.stdout.trim().split(/\r?\n/).filter(Boolean);
const invalid = [];
for (const filename of files) {
  if (!existsSync(filename)) continue;
  const info = await prettier.getFileInfo(filename, { ignorePath: ".prettierignore" });
  if (info.ignored || !info.inferredParser) continue;
  const config = await prettier.resolveConfig(filename);
  if (!(await prettier.check(readFileSync(filename, "utf8"), { ...config, filepath: filename }))) {
    invalid.push(filename);
  }
}
if (invalid.length) {
  console.error(`Format these changed files with Prettier:\n${invalid.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Changed-file formatting passed.");
}
