/**
 * @file provide.ts
 * @description
 * Registers a value in the current component's context frame.
 */

import { Debug } from "../../debug/events";
import { contextStack, type ContextKey } from "./contextStack";

/**
 * Provide a value to the current context frame.
 */
export function provide<T>(key: ContextKey, value: T): void {
  const frame = contextStack[contextStack.length - 1];

  if (!frame) {
    const root = { map: new Map<ContextKey, unknown>() };
    root.map.set(key, value);
    contextStack.push(root);

    Debug.emit("component:context:set", {
      key,
      value,
      depth: contextStack.length,
      root: true
    });

    return;
  }

  frame.map.set(key, value);

  Debug.emit("component:context:set", {
    key,
    value,
    depth: contextStack.length,
    root: false
  });
}
