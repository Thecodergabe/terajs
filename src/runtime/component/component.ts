/**
 * @file component.ts
 * @description
 * High-level component wrapper for Nebula.
 *
 * Adds:
 * - context frame push/pop
 * - lifecycle registration
 * - cleanup registration
 * - debug events
 */

import { Debug } from "../../debug/events";
import {
  pushContextFrame,
  popContextFrame,
  contextStack
} from "../context/contextStack";

import { ComponentContext } from "./context";

/** Global instance counter per component name */
const instanceCounters = new Map<string, number>();

/**
 * Register a cleanup function to run when the component unmounts.
 */
export function onCleanup(fn: () => void): void {
  const ctx = ComponentContext.current;
  if (!ctx) {
    throw new Error("onCleanup() called outside of component setup.");
  }

  ctx.disposers.push(fn);

  Debug.emit("component:cleanup:register", {
    name: ctx.name,
    instance: ctx.instance
  });
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
    const instance =
      (instanceCounters.get(name) ?? 0) + 1;
    instanceCounters.set(name, instance);

    Debug.emit("component:create", {
      name,
      instance,
      props
    });

    Debug.emit("component:setup:start", {
      name,
      instance,
      props
    });

    pushContextFrame();

    const ctx: ComponentContext = {
      disposers: [],
      props,
      frame: contextStack[contextStack.length - 1],
      name,
      instance
    };

    ComponentContext.current = ctx;

    let out: any;
    try {
      out = setup(props as P);
    } catch (err) {
      Debug.emit("error:component", {
        name,
        instance,
        error: err
      });
      ComponentContext.current = null;
      popContextFrame();
      throw err;
    }

    ComponentContext.current = null;

    popContextFrame();

    Debug.emit("component:setup:end", {
      name,
      instance
    });

    return out;
  };
}
