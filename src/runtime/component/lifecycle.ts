/**
 * @file lifecycle.ts
 * @description
 * Lifecycle registration utilities for Nebula components.
 *
 * These functions register callbacks that run at specific points in the
 * component lifecycle:
 *
 * - onMounted:    after the component's DOM node is inserted
 * - onUpdated:    after the component re-renders (template update)
 * - onUnmounted:  when the component is destroyed
 *
 * Lifecycle callbacks are stored on the ComponentContext and executed
 * by the renderer or mount/unmount pipeline.
 */

import { Debug } from "../../debug/events";
import { ComponentContext } from "./context";

/**
 * Internal helper to ensure lifecycle arrays exist.
 */
function ensureLifecycleArrays(ctx: ComponentContext) {
  if (!ctx.mounted) ctx.mounted = [];
  if (!ctx.updated) ctx.updated = [];
  if (!ctx.unmounted) ctx.unmounted = [];
}

/**
 * Register a callback to run after the component is mounted.
 */
export function onMounted(fn: () => void): void {
  const ctx = ComponentContext.current;
  if (!ctx) {
    throw new Error("onMounted() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.mounted!.push(fn);

  Debug.emit("component:cleanup:register", {
    name: ctx.name,
    instance: ctx.instance,
    hook: "mounted"
  });
}

/**
 * Register a callback to run after the component updates.
 */
export function onUpdated(fn: () => void): void {
  const ctx = ComponentContext.current;
  if (!ctx) {
    throw new Error("onUpdated() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.updated!.push(fn);

  Debug.emit("component:cleanup:register", {
    name: ctx.name,
    instance: ctx.instance,
    hook: "updated"
  });
}

/**
 * Register a callback to run when the component unmounts.
 */
export function onUnmounted(fn: () => void): void {
  const ctx = ComponentContext.current;
  if (!ctx) {
    throw new Error("onUnmounted() called outside of component setup.");
  }

  ensureLifecycleArrays(ctx);
  ctx.unmounted!.push(fn);

  Debug.emit("component:cleanup:register", {
    name: ctx.name,
    instance: ctx.instance,
    hook: "unmounted"
  });
}
