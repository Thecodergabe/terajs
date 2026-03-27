import { ReactiveEffect } from "../reactivity/deps";

/**
 * Disposes of a reactive effect, unsubscribing it from all dependencies and preventing future executions.
 * * This is useful for cleaning up effects that are no longer needed, such as when a component unmounts.
 * * @param effectFn - The ReactiveEffect to dispose.
 * * The disposal process involves:
 * 1. Running any registered cleanup functions to handle dynamic dependencies.
 * 2. Removing the effect from all dependency sets it is subscribed to, ensuring it won't be triggered by future state changes.
 * 3. Marking the effect as inactive to prevent any future executions.
 */
export function dispose(effectFn: ReactiveEffect): void {

    if (effectFn.cleanups.length) {
        effectFn.cleanups.forEach(cleanup => cleanup());
        effectFn.cleanups.length = 0;
    }

    if (effectFn.deps.length) {
        effectFn.deps.forEach(dep => dep.delete(effectFn));
        effectFn.deps.length = 0;
    }

    effectFn.active = false;
}