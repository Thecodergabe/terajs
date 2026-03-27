import { getCurrentEffect } from '../reactivity/deps';


/** * Registers a cleanup function to be called before the next execution of the current effect.
 * * This is essential for handling dynamic dependencies, such as those created by conditional logic (e.g., if/else).
 * It ensures that effects don't remain subscribed to state that is no longer being accessed, preventing "ghost updates" and memory leaks.
 * @param fn - The cleanup function to register. This will be called before the next run of the current effect.
 */
export function onCleanup(fn: () => void): void {
    const currentEffect = getCurrentEffect();

    if (currentEffect) currentEffect.cleanups.push(fn);

}