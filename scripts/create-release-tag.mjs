#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const shouldPush = process.argv.includes("--push");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();
}

async function main() {
  const rootManifest = JSON.parse(await readFile(resolve(repoRoot, "package.json"), "utf8"));
  const tagName = `v${rootManifest.version}`;
  const headCommit = git(["rev-parse", "HEAD"]);

  try {
    git(["merge-base", "--is-ancestor", headCommit, "origin/main"]);
  } catch {
    throw new Error(`Ref ${headCommit} is not merged into origin/main; release tags are only created from merged main history.`);
  }

  let taggedCommit = "";
  try {
    taggedCommit = git(["rev-list", "-n", "1", tagName]);
  } catch {
    taggedCommit = "";
  }

  if (!taggedCommit) {
    git(["tag", "-a", tagName, "-m", `release: ${rootManifest.version}`]);
    taggedCommit = headCommit;
    console.log(`Created annotated tag ${tagName} at ${headCommit}.`);
  } else if (taggedCommit !== headCommit) {
    throw new Error(`Tag ${tagName} already points at ${taggedCommit}, not ${headCommit}.`);
  } else {
    console.log(`Tag ${tagName} already points at ${headCommit}.`);
  }

  if (shouldPush) {
    git(["push", "origin", `refs/tags/${tagName}`]);
    console.log(`Pushed ${tagName} to origin.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});