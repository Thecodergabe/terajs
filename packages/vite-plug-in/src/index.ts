/**
 * @file index.ts
 * @description
 * Vite plugin for Terajs SFC compilation + HMR.
 */

import fs from "node:fs";
import path from "node:path";
import { getAutoImportDirs } from './autoImportDirs.js';
import type { Plugin } from "vite";

import { parseSFC } from "@terajs/sfc";
import { sfcToComponent } from "@terajs/sfc";
import { Debug } from "@terajs/shared";


function terajsPlugin(): Plugin {
  // Virtual module id for auto-imports
  const VIRTUAL_ID = 'virtual:terajs-auto-imports';
  const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID;

  // Support multiple auto-import roots
  const autoImportDirs = getAutoImportDirs();

  function pascalCase(str: string) {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  function generateAutoImports() {
    let code = '';
    for (const dir of autoImportDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.nbl'));
      for (const f of files) {
        const name = pascalCase(f.replace(/\.nbl$/, ''));
        const rel = './' + f;
        code += `export { default as ${name} } from '${rel}';\n`;
      }
    }
    return code;
  }

  return {
    name: "terajs",
    enforce: "pre",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      if (id.endsWith(".nbl")) return id;
      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return generateAutoImports();
      }
      if (!id.endsWith(".nbl")) return null;

      const code = fs.readFileSync(id, "utf8");
      const sfc = parseSFC(code, id);

      Debug.emit("sfc:load", { scope: id });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from 'virtual:terajs-auto-imports';\n`;
      let compiled = sfcToComponent(sfc);
      compiled = autoImport + compiled;
      return compiled;
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith(".nbl")) return;

      const code = fs.readFileSync(ctx.file, "utf8");
      const sfc = parseSFC(code, ctx.file);

      Debug.emit("sfc:hmr", { scope: ctx.file });

      // Inject auto-imports at the top of every SFC
      const autoImport = `import * as TerajsAutoImports from 'virtual:terajs-auto-imports';\n`;
      let newModule = sfcToComponent(sfc);
      newModule = autoImport + newModule;

      // Replace the module in Vite's graph
      const mod = ctx.server.moduleGraph.getModuleById(ctx.file)!;
      ctx.server.moduleGraph.invalidateModule(mod);

      // Send updated code to the client
      ctx.read = () => newModule;

      // Tell Vite which modules should be reloaded
      return [mod];
    }
  };
}

export default terajsPlugin;
