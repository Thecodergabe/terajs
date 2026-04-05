/**
 * @file index.ts
 * @description
 * Vite plugin for Nebula SFC compilation + HMR.
 */

import fs from "node:fs";
import type { Plugin } from "vite";

import { parseSFC } from "@nebula/sfc";
import { sfcToComponent } from "@nebula/sfc";
import { Debug } from "@nebula/shared";

export default function nebulaPlugin(): Plugin {
  return {
    name: "nebula",

    enforce: "pre",

    resolveId(id) {
      if (id.endsWith(".nbl")) return id;
      return null;
    },

    load(id) {
      if (!id.endsWith(".nbl")) return null;

      const code = fs.readFileSync(id, "utf8");
      const sfc = parseSFC(code, id);

      Debug.emit("sfc:load", { scope: id });

      return sfcToComponent(sfc);
    },

    handleHotUpdate(ctx) {
      if (!ctx.file.endsWith(".nbl")) return;

      const code = fs.readFileSync(ctx.file, "utf8");
      const sfc = parseSFC(code, ctx.file);

      Debug.emit("sfc:hmr", { scope: ctx.file });

      const newModule = sfcToComponent(sfc);

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
