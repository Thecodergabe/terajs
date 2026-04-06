import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Utility to allow user config for Terajs auto-imports
// Reads from terajs.config.js when present.
export function getAutoImportDirs() {
  const cwd = process.cwd();
  const configPath = path.resolve(cwd, "terajs.config.js");
  const defaultDirs = [path.resolve(cwd, "packages/devtools/src/components")];

  if (!fs.existsSync(configPath)) {
    return defaultDirs;
  }

  const config = require(configPath);
  const configuredDirs = Array.isArray(config?.autoImportDirs) ? config.autoImportDirs : [];
  if (configuredDirs.length === 0) {
    return defaultDirs;
  }

  return configuredDirs.map((dir) => path.resolve(cwd, dir));
}
