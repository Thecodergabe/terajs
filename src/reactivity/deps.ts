/**
 * Represents a reactive side-effect function.
 * * @property {Set<ReactiveEffect>[]} deps - An array of dependency sets (usually from Signals/State) 
 * that this effect is currently subscribed to. This is used for cleanup during re-runs.
 * @property {() => void} [scheduler] - An optional bypass for the default execution logic, 
 * useful for batching updates or integrating with framework render loops.
 * @property {() => void} [cleanups] - An array of cleanup functions that should be called before the next run of this effect.
 * * Cleanup functions are used to handle dynamic dependencies, such as those created by conditional logic (e.g., if/else).
 * They ensure that effects don't remain subscribed to state that is no longer being accessed, preventing "ghost updates" and memory leaks.
 */
export type ReactiveEffect = {
    (): void;
    deps: Set<ReactiveEffect>[];
    cleanups: (() => void)[];
    scheduler?: () => void;
    activie?: boolean;
};

/**
 * The Global Effect Stack.
 * * Tracks the execution context of effects. Using a stack allows the system 
 * to handle nested effects (e.g., an effect that modifies state which 
 * triggers a computed value, which in turn has its own internal tracking).
 */
const effectStack: ReactiveEffect[] = [];

/**
 * The currently active effect context. 
 * * Any reactive 'state' accessed while this is non-null will automatically 
 * register this effect as a subscriber.
 */
export let currentEffect: ReactiveEffect | null = null;

/**
 * Places an effect onto the tracking stack and sets it as the active context.
 * Call this before executing the effect's internal function.
 * * @param effect - The ReactiveEffect to begin tracking.
 */
export function pushEffect(effect: ReactiveEffect): void {
    effectStack.push(effect);
    currentEffect = effect;
}

/**
 * Removes the top effect from the stack and restores the previous context.
 * Call this immediately after the effect's internal function finishes execution.
 * * This ensures that state reads performed outside of the effect (or in parent effects) 
 * do not incorrectly attribute dependencies to the finished effect.
 */
export function popEffect(): void {
    effectStack.pop();
    currentEffect = effectStack[effectStack.length - 1] || null;
}

/**
 * Provides access to the currently active effect context.
 * * This is useful for utilities like 'onCleanup' that need to register logic on the current effect without direct access to it.
 * @return The currently active ReactiveEffect, or null if no effect is active.
 */
export function getCurrentEffect(): ReactiveEffect | null {
    return currentEffect;
}