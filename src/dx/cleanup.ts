import { getCurrentEffect } from '../reactivity/deps';

/**
 * Registers a cleanup function to be executed before the next run of the
 * currently active reactive effect.
 *
 * Cleanup functions are essential for managing dynamic dependencies created
 * through conditional logic (e.g., `if`/`else`) or iterative structures.
 * They ensure that effects do not remain subscribed to reactive state that
 * is no longer accessed, preventing "ghost updates" and memory leaks.
 *
 * The cleanup function will run:
 * - before the effect re-executes
 * - when the effect is manually stopped
 * - when the owning component or watcher is disposed
 *
 * @param fn - The cleanup function to register. It will be invoked before the
 *             next execution of the current effect.
 */
export function onCleanup(fn: () => void): void {
    const currentEffect = getCurrentEffect();

    if (currentEffect) {
        currentEffect.cleanups.push(fn);
    }
}