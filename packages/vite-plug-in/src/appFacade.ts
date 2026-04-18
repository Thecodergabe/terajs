import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export const APP_FACADE_PACKAGE = "@terajs/app";
export const APP_DEVTOOLS_SUBPATH = `${APP_FACADE_PACKAGE}/devtools`;

function toViteFsSpecifier(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("/")
    ? `/@fs${normalized}`
    : `/@fs/${normalized}`;
}

function findWorkspaceFacadeDir(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "packages", "terajs", "src"),
    path.resolve(process.cwd(), "..", "terajs", "src")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "index.ts"))) {
      return candidate;
    }
  }

  return null;
}

export function resolveAppFacadeSpecifier(specifier: string, command?: string): string {
  if (command === "build") {
    return specifier;
  }

  if (specifier !== APP_FACADE_PACKAGE && specifier !== APP_DEVTOOLS_SUBPATH) {
    return specifier;
  }

  try {
    const requireFromCwd = createRequire(path.join(process.cwd(), "package.json"));
    const resolvedPath = requireFromCwd.resolve(specifier);
    return toViteFsSpecifier(resolvedPath);
  } catch {
    const workspaceDir = findWorkspaceFacadeDir();
    if (!workspaceDir) {
      return specifier;
    }

    const sourceEntry = specifier === APP_DEVTOOLS_SUBPATH
      ? path.join(workspaceDir, "devtools.ts")
      : path.join(workspaceDir, "index.ts");

    return fs.existsSync(sourceEntry)
      ? toViteFsSpecifier(sourceEntry)
      : specifier;
  }
}