// Utility to allow user config for Nebula auto-imports
// This can be extended to read from nebula.config.js or vite.config.js
export function getAutoImportDirs() {
  // Default: devtools components dir
  return [require('path').resolve(process.cwd(), 'packages/devtools/src/components')];
}
