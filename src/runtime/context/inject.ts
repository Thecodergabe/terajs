/**
 * @file inject.ts
 * @description
 * Retrieves a value from the nearest ancestor context frame.
 */

import { Debug } from "../../debug/events";
import { contextStack, type ContextKey } from "./contextStack";

/**
 * Inject a value previously provided by an ancestor component.
 */
export function inject<T>(key: ContextKey, fallback?: T): T {
  for (let i = contextStack.length - 1; i >= 0; i--) {
    const frame = contextStack[i];
    if (frame.map.has(key)) {
      const value = frame.map.get(key) as T;

      Debug.emit("component:context:get", {
        key,
        value,
        depth: i + 1,
        hit: true
      });

      return value;
    }
  }

  Debug.emit("component:context:get", {
    key,
    fallback,
    hit: false
  });

  if (arguments.length === 2) {
    return fallback as T;
  }

  throw new Error(
    `Nebula inject(): no provider found for key. ` +
      `Either supply a fallback or ensure a matching provide() exists.`
  );
}
