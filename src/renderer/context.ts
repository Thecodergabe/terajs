/**
 * @file renderer/context.ts
 * @description
 * Renderer integration with the unified ComponentContext.
 */

import { Debug } from "../debug/events";
import type { ComponentContext, Disposer } from "../runtime/component/context";

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
    instance: 0
  };

  Debug.emit("component:context:create", { context: ctx });

  return ctx;
}

export function onCleanup(fn: Disposer): void {
  if (currentContext) {
    Debug.emit("component:cleanup:register", {
      context: currentContext,
      disposer: fn
    });

    currentContext.disposers.push(fn);
  }
}
