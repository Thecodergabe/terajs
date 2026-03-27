import { ReactiveEffect } from "../reactivity/deps";
import { effect } from "../reactivity/effect";
import { onCleanup } from "./cleanup";

/**
 * Creates a reactive side-effect that automatically re-runs whenever any of its
 * accessed reactive dependencies change.
 *
 * `watchEffect` is a higher-level convenience wrapper around the low-level
 * `effect()` primitive. It tracks all reactive reads performed during the
 * execution of `fn`, and schedules a re-run whenever those dependencies update.
 *
 * Cleanup functions registered via `onCleanup()` inside the effect callback
 * will run before each subsequent execution, allowing teardown of resources
 * such as event listeners, intervals, subscriptions, or async operations.
 *
 * The returned function can be used to manually stop the watcher. Stopping a
 * watcher:
 * - executes any remaining cleanup callbacks
 * - removes the effect from all dependency sets
 * - prevents any future re-execution
 *
 * @param fn - The reactive side-effect to execute. This function will run
 *             immediately (unless SSR prevents execution) and then re-run
 *             whenever its tracked dependencies change.
 *
 * @returns A `stop()` function that disposes the watcher and prevents further
 *          re-execution.
 *
 * @example
 * ```ts
 * const count = state(0);
 *
 * const stop = watchEffect(() => {
 *   console.log("count is", count.value);
 *
 *   onCleanup(() => {
 *     console.log("cleanup before next run");
 *   });
 * });
 *
 * count.value++; // triggers re-run
 *
 * stop(); // stops the watcher and runs final cleanup
 * ```
 */
export function watchEffect(fn: () => void): () => void {
    const runner: ReactiveEffect = effect(() => {
        onCleanup(() => {
            // no-op by default, but can be used to perform cleanup tasks before the next execution of the effect
        })

        fn();
    })

    return () => {
        if (runner.cleanups.length) {
            runner.cleanups.forEach(cleanup => cleanup());
            runner.cleanups.length = 0; // Clear the cleanups after executing them
        }

        if (runner.deps.length) {
            runner.deps.forEach(dep => dep.delete(runner));
            runner.deps.length = 0; // Clear the dependencies after removing the effect from them
        }
    }
}