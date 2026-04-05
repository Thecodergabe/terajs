/**
 * @file sfcTemplateTypes.ts
 * @description
 * Shared types for SFC template compilation.
 */

export interface CompiledTemplate {
  /**
   * JavaScript source for the render function.
   * Example: `function render(ctx) { ... }`
   */
  renderCode: string;

  /**
   * Identifiers from the template that must be provided
   * by the script (e.g. `count`, `items`, `onClick`).
   */
  bindings: string[];
}
