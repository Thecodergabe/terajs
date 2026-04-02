/**
 * @file context.ts
 * Unified ComponentContext for Nebula.
 */

export type Disposer = () => void;

export interface ComponentContext {
  disposers: Disposer[];
  props: any;
  frame: any;
  name: string;
  instance: number;

  mounted?: Array<() => void>;
  updated?: Array<() => void>;
  unmounted?: Array<() => void>;
}

/**
 * Internal: tracks the currently executing component.
 */
let currentContext: ComponentContext | null = null;

export function getCurrentContext(): ComponentContext | null {
  return currentContext;
}

export function setCurrentContext(ctx: ComponentContext | null): void {
  currentContext = ctx;
}

export function createComponentContext(): ComponentContext {
  return {
    disposers: [],
    props: null,
    frame: null,
    name: "Unknown",
    instance: 0,
    mounted: [],
    updated: [],
    unmounted: []
  };
}

/**
 * Register a cleanup function for the current component.
 */
export function onCleanup(fn: Disposer): void {
  if (currentContext) {
    currentContext.disposers.push(fn);
  }
}
