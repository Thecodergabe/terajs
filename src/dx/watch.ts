import { watchEffect } from "./watchEffect";
import { onCleanup } from "./cleanup";

/**
 * Registers a reactive watcher that tracks the value returned by a source getter
 * and invokes a callback whenever that value changes.
 *
 * ## How it works
 * - The `source` function is executed inside a `watchEffect`, so any reactive
 *   reads inside it are automatically tracked.
 * - The callback is **not** invoked on initial registration. The first run is
 *   used only to capture the initial value.
 * - On subsequent changes:
 *   - The previous cleanup (if any) runs first.
 *   - The `source` getter re-evaluates.
 *   - The callback receives `(newValue, oldValue, onCleanup)`.
 *   - Any cleanup registered via `onCleanup()` runs before the next callback
 *     and again when the watcher is stopped.
 *
 * ## Cleanup behavior
 * Cleanup functions registered via `onCleanup(fn)` behave exactly like those in
 * `watchEffect` and `effect`:
 *
 * - They run **before** the next callback execution.
 * - They run **when `stop()` is called**.
 * - Only one cleanup is active at a time; registering a new one replaces the previous.
 *
 * ## Example
 * ```ts
 * const count = state(0);
 *
 * const stop = watch(
 *   () => count.get(),
 *   (newVal, oldVal, onCleanup) => {
 *     console.log("changed:", oldVal, "→", newVal);
 *
 *     onCleanup(() => {
 *       console.log("cleanup before next change");
 *     });
 *   }
 * );
 *
 * count.set(1); // logs: cleanup → callback
 * count.set(2); // logs: cleanup → callback
 *
 * stop();       // final cleanup runs
 * ```
 *
 * @typeParam T - The type returned by the `source` getter.
 *
 * @param source - A getter function whose reactive dependencies should be watched.
 * @param callback - A function invoked whenever the source value changes.
 *                   Receives:
 *                   - `newValue`: the updated value
 *                   - `oldValue`: the previous value
 *                   - `onCleanup(fn)`: registers a cleanup function
 *
 * @returns A `stop()` function that disposes the watcher and runs the final cleanup.
 */

export function watch<T>(
    source: () => T,
    callback: (
        newValue: T,
        oldValue: T,
        onCleanup: (fn: () => void) => void
    ) => void
): () => void {
    let oldValue: T;
    let initialized = false;

    const stop = watchEffect(() => {
        const newValue = source();

        if (!initialized) {
            initialized = true;
            oldValue = newValue;
            return;
        }

        callback(newValue, oldValue, onCleanup);
        oldValue = newValue;
    });

    return stop;
}
