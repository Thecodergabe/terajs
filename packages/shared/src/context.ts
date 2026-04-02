/**
 * @file renderer/context.ts
 * @description
 * Renderer integration with the unified ComponentContext.
 */

import { Debug } from "@nebula/shared"; 
// Path updated to reach your central runtime types
import type { ComponentContext, Disposer } from "@nebula/runtime";
let currentContext: ComponentContext | null = null;

export function getCurrentContext(): ComponentContext | null {
  Debug.emit("component:context:get", { context: currentContext });
  return currentContext;
}

export function setCurrentContext(ctx: ComponentContext | null): void {
  Debug.emit("component:context:set", { context: ctx });
  currentContext = ctx;
}

export function createComponentContext(): ComponentContext {
  const ctx: ComponentContext = {
    disposers: [],
    props: null,
    frame: null,
    name: "Unknown",
    instance: 0,
    mounted: [],
    unmounted: []
  };

  Debug.emit("component:context:create", { context: ctx });

  return ctx;
}
