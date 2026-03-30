/**
 * @file contextStack.ts
 * @description
 * Internal context stack used by Nebula's runtime to support
 * provide() / inject() without prop drilling or compiler magic.
 *
 * Each component pushes a frame before executing its setup function,
 * and pops it afterward. Nested components inherit values from
 * ancestor frames.
 */

import { Debug } from "../../debug/events";

/**
 * Allowed key types for context entries.
 */
export type ContextKey = string | symbol | object | Function;

/**
 * A single context frame associated with a component boundary.
 */
export interface ContextFrame {
  map: Map<ContextKey, unknown>;
}

/**
 * Global stack of context frames.
 *
 * The top of the stack represents the currently executing component.
 */
export const contextStack: ContextFrame[] = [];

/**
 * Push a new context frame onto the stack.
 */
export function pushContextFrame(): void {
  const frame: ContextFrame = { map: new Map() };
  contextStack.push(frame);

  Debug.emit("component:context:create", {
    depth: contextStack.length,
    frame
  });
}

/**
 * Pop the current context frame.
 */
export function popContextFrame(): void {
  const frame = contextStack.pop();

  Debug.emit("component:context:cleanup", {
    depth: contextStack.length,
    frame
  });
}
