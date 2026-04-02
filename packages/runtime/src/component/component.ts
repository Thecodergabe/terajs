/**
 * @file component.ts
 * @description
 * High-level component wrapper for Nebula.
 */

import { emitDebug as emit, Debug } from "@nebula/shared";
import { getCurrentEffect } from "@nebula/reactivity";
import {
  pushContextFrame,
  popContextFrame,
  contextStack
} from "../context/contextStack";
import {
  type Disposer,
  type ComponentContext,
  getCurrentContext,
  setCurrentContext
} from "./context";

/** Global instance counter per component name */
const instanceCounters = new Map<string, number>();

/**
 * Register a cleanup function to run when the component unmounts.
 */
export function onCleanup(fn: Disposer): void {
  const effect = getCurrentEffect();
  const context = getCurrentContext();

  if (effect) {
    // If we're inside a watch/memo/effect
    effect.cleanups.push(fn);
    return;
  }

  if (context) {
    // If we're in the setup phase of a component
    context.disposers.push(fn);
    return;
  }

  // Fallback for development debugging
  Debug.emit("lifecycle:warn", { message: "onCleanup called without context" });
}
/**
 * Create a Nebula component wrapper.
 */
export function component<P = any>(
  options: { name?: string; meta?: any },
  setup: (props: P) => Node | (() => Node)
) {
  const name = options.name ?? "AnonymousComponent";

  return function ComponentWrapper(props?: P) {
    const instance = (instanceCounters.get(name) ?? 0) + 1;
    instanceCounters.set(name, instance);

    // Instrumentation for the Debugger UI
    emit({
      type: "component:mounted",
      scope: name,
      instance,
      timestamp: Date.now()
    });

    pushContextFrame();

    const ctx: ComponentContext = {
      disposers: [],
      props,
      frame: contextStack[contextStack.length - 1],
      name,
      instance
    };

    setCurrentContext(ctx);

    let out: any;
    try {
      out = setup(props as P);
    } catch (err) {
      // Catch and report setup errors to the devtools
      console.error(`[Nebula] Error in component <${name} />:`, err);
      
      setCurrentContext(null);
      popContextFrame();
      throw err;
    }

    setCurrentContext(null);
    popContextFrame();

    return out;
  };
}