#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { computeNextRepoVersion } from "./releaseVersioning.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
const packagesRoot = join(repoRoot, "packages");
const rootPackageJsonPath = join(repoRoot, "package.json");
const baseRef = "HEAD";

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJsonAtRef(ref, relativePath) {
  try {
    const content = execFileSync("git", ["show", `${ref}:${relativePath.replace(/\\/g, "/")}`], {
      cwd: repoRoot,
      encoding: "utf8"
    });

    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function collectPublicPackages() {
  const entries = await readdir(packagesRoot, { withFileTypes: true });
  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const relativePath = join("packages", entry.name, "package.json");
    const packageJsonPath = join(repoRoot, relativePath);
    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = await readJson(packageJsonPath);
    if (manifest.private === true) {
      continue;
    }

    packages.push({
      name: manifest.name,
      version: manifest.version,
      relativePath
    });
  }

  return packages.sort((left, right) => left.name.localeCompare(right.name));
}

async function main() {
  const rootManifest = await readJson(rootPackageJsonPath);
  const previousRootManifest = readJsonAtRef(baseRef, "package.json") ?? rootManifest;
  const publicPackages = await collectPublicPackages();
  const versionChanges = [];

  for (const currentPackage of publicPackages) {
    const previousManifest = readJsonAtRef(baseRef, currentPackage.relativePath);
    if (!previousManifest || typeof previousManifest.version !== "string") {
      continue;
    }

    if (previousManifest.version === currentPackage.version) {
      continue;
    }

    versionChanges.push({
      name: currentPackage.name,
      previousVersion: previousManifest.version,
      nextVersion: currentPackage.version
    });
  }

  if (versionChanges.length === 0) {
    console.log("No publishable package version changes detected; leaving the repo release version unchanged.");
    return;
  }

  const nextRepoVersion = computeNextRepoVersion({
    previousRepoVersion: previousRootManifest.version,
    currentPublicVersions: publicPackages.map((pkg) => pkg.version),
    versionChanges
  });

  if (!nextRepoVersion) {
    console.log("No repo release version update was required.");
    return;
  }

  const currentRootVersion = rootManifest.version;
  const previousRootVersion = previousRootManifest.version;
  if (currentRootVersion !== previousRootVersion && currentRootVersion !== nextRepoVersion) {
    throw new Error(
      `Root package version must still be ${previousRootVersion} before sync or already be ${nextRepoVersion}; found ${currentRootVersion}.`
    );
  }

  if (currentRootVersion === nextRepoVersion) {
    console.log(`Repo release version is already synced at ${nextRepoVersion}.`);
    return;
  }

  rootManifest.version = nextRepoVersion;
  await writeJson(rootPackageJsonPath, rootManifest);

  console.log(`Synced repo release version ${previousRootVersion} -> ${nextRepoVersion}.`);
  for (const change of versionChanges) {
    console.log(`- ${change.name}: ${change.previousVersion} -> ${change.nextVersion}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});