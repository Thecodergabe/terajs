import { describe, it, expect } from "vitest";
import { parseSFC } from "@nebula/sfc";
import { sfcToComponent } from "./sfcToComponent";

describe("sfcToComponent (integration)", () => {
  it("generates a runnable component module with setup + IR", () => {
    const sfc = parseSFC(
      `
      <template>Hello</template>
      <script>
        export function setup() {
          return { msg: "Hello" }
        }
      </script>
      `,
      "/components/Test.nbl"
    );

    const out = sfcToComponent(sfc);

    // Should contain setup() function
    expect(out).toContain("function setup(");

    // Should contain IR JSON
    expect(out).toContain(`"template":`);

    // Should contain component wrapper
    expect(out).toContain("component(");

    // Should contain HMR accept block
    expect(out).toContain("import.meta.hot.accept");
  });
});
/**
 * @file compileTemplate.ts
 * @description
 * SFC‑aware template compiler entry point for Nebula.
 *
 * This is a thin wrapper around `generateIRModule`, which:
 * - parses the `<template>` block into an AST
 * - normalizes it into renderer‑agnostic IR
 * - attaches meta, ai, and route overrides from the SFC
 *
 * The result is an `IRModule` that can be consumed by:
 * - DOM renderer (`renderIRModuleToFragment`)
 * - SSR renderer
 * - router
 * - meta system
 * - devtools
 */

import type { ParsedSFC } from "@nebula/sfc";
import type { IRModule } from "@nebula/compiler";
import { generateIRModule } from "@nebula/compiler";

/**
 * Compiles a Nebula SFC's `<template>` (plus meta/ai/route)
 * into a full `IRModule`.
 *
 * @param sfc - The parsed SFC structure (from `parseSFC`).
 * @returns An `IRModule` ready for rendering and analysis.
 */
export function compileTemplateFromSFC(sfc: ParsedSFC): IRModule {
  return generateIRModule(sfc);
}
