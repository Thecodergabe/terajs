#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function collectExportTargets(exportsField) {
  const targets = [];

  function visit(value) {
    if (!value) {
      return;
    }

    if (typeof value === "string") {
      targets.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    if (typeof value === "object") {
      for (const key of Object.keys(value)) {
        visit(value[key]);
      }
    }
  }

  visit(exportsField);
  return [...new Set(targets)];
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}

function validatePath(pkgName, packageDir, fieldName, relPath, issues) {
  if (typeof relPath !== "string" || relPath.length === 0) {
    return;
  }

  const absPath = join(packageDir, relPath);
  if (!existsSync(absPath)) {
    issues.push(`${pkgName}: missing ${fieldName} target ${relPath}`);
  }
}

async function main() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const issues = [];
  let checkedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDir = join(packagesRoot, entry.name);
    const packageJsonPath = join(packageDir, "package.json");
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = await readJson(packageJsonPath);
    const pkgName = typeof manifest.name === "string" ? manifest.name : entry.name;

    checkedCount += 1;

    validatePath(pkgName, packageDir, "main", manifest.main, issues);
    validatePath(pkgName, packageDir, "types", manifest.types, issues);

    if (manifest.exports) {
      const targets = collectExportTargets(manifest.exports)
        .filter((target) => target.startsWith("./"));

      for (const target of asArray(targets)) {
        validatePath(pkgName, packageDir, "exports", target, issues);
      }
    }
  }

  if (issues.length > 0) {
    console.error("[audit-exports] FAILED");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[audit-exports] OK (${checkedCount} packages validated)`);
}

main().catch((error) => {
  console.error("[audit-exports] Fatal error");
  console.error(error);
  process.exitCode = 1;
});
