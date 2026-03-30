/**
 * @file context.ts
 * @description
 * Unified ComponentContext for Nebula.
 *
 * This merges:
 *  - renderer context (disposers)
 *  - component runtime context (name, instance, props, lifecycle)
 *  - context frame (provide/inject)
 */

export type Disposer = () => void;

export interface ComponentContext {
  /** Cleanup functions registered via onCleanup() */
  disposers: Disposer[];

  /** Props passed to this component instance */
  props: any;

  /** Context frame for provide/inject */
  frame: any;

  /** Component name */
  name: string;

  /** Component instance number */
  instance: number;

  /** Lifecycle hooks */
  mounted?: Array<() => void>;
  updated?: Array<() => void>;
  unmounted?: Array<() => void>;
}

/**
 * Tracks the currently executing component during setup().
 */
export namespace ComponentContext {
  export let current: ComponentContext | null = null;
}
