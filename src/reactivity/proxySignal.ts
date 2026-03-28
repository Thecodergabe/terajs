/**
 * @file proxySignal.ts
 * @description
 * Provides an ergonomic Proxy-based wrapper around Nebula's core `signal()`.
 *
 * This wrapper exposes a `.value` property that forwards to the underlying
 * signal’s getter and setter, enabling intuitive usage:
 *
 * ```ts
 * const count = box(0);
 * count.value++;       // triggers reactivity
 *
 * effect(() => {
 *   console.log(count.value);
 * });
 * ```
 *
 * This is a *shallow* ergonomic layer — it does not introduce deep reactivity.
 * It simply makes primitive signals feel more natural to use.
 */

import { signal, type Signal } from "./signal";

/**
 * A boxed signal with a `.value` property.
 *
 * @template T - The wrapped value type.
 */
export interface Box<T> {
  /** The underlying signal instance. */
  readonly _sig: Signal<T>;

  /**
   * Reactive getter/setter for the signal value.
   *
   * Accessing `.value` tracks dependencies.
   * Assigning to `.value` triggers effects.
   */
  value: T;
}

/**
 * Creates a Proxy wrapper around a core `signal()`.
 *
 * This does not replace the underlying signal implementation — it simply
 * exposes a more ergonomic `.value` interface.
 *
 * @param initial - Initial value for the signal.
 * @returns A boxed signal with `.value` access.
 */
export function box<T>(initial: T): Box<T> {
  const sig = signal(initial);

  return new Proxy({ _sig: sig } as Box<T>, {
    get(target, prop) {
      if (prop === "value") {
        return target._sig();
      }
      return (target as any)[prop];
    },

    set(target, prop, value) {
      if (prop === "value") {
        target._sig.set(value);
        return true;
      }
      (target as any)[prop] = value;
      return true;
    }
  });
}
