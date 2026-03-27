import { pushEffect, popEffect, type ReactiveEffect } from './deps';
import { isServer } from '../dx/runtime';

/**
 * Creates a reactive effect that tracks dependencies and re-runs on changes.
 * * @param fn - The side-effect function to execute.
 * @param scheduler - An optional execution strategy. If provided, the effect 
 * is not run immediately and must be triggered manually 
 * (common for computed values or batched updates).
 * @returns The wrapped ReactiveEffect function.
 */
export function effect(fn: () => void, scheduler?: () => void): ReactiveEffect {
    /**
     * The internal wrapper that manages the lifecycle of a single execution.
     */
    const effectFn: ReactiveEffect = () => {
        // Server-side rendering (SSR) optimization: Skip tracking and execution if we're on the server.
        if (isServer()) {
            return;
        }

        // Cleanup before running to handle dynamic dependencies (e.g., if/else branches).
        if (effectFn.cleanups) {
            effectFn.cleanups.forEach(cleanup => cleanup());
            effectFn.cleanups.length = 0;
        }

        // 1. Important: Remove this effect from all existing dependency sets 
        // before re-running to ensure we only track what is currently accessed.
        cleanup(effectFn);
        
        // 2. Set the global 'currentEffect' context so 'state' getters 
        // can find this effect.
        pushEffect(effectFn);
        
        try {
            // 3. Execute the actual user-provided logic.
            fn(); 
        } finally {
            // 4. Always restore the previous effect context, even if the user 
            // code throws an error.
            popEffect();
        }
    }

    // Initialize tracking properties
    effectFn.deps = [];
    effectFn.cleanups = [];
    effectFn.scheduler = scheduler;

    // Standard effects run immediately on creation. 
    // Effects with schedulers (like those inside 'computed') wait for a trigger.
    if (!scheduler) {
        effectFn();
    }
    
    return effectFn;
}

/**
 * Unsubscribes an effect from all its reactive dependencies.
 * * This is called before every run of the effect to "reset the slate," 
 * allowing the system to handle dynamic conditional branches (e.g. if/else) 
 * without keeping stale subscriptions active.
 * * @param effectFn - The effect to clean up.
 */
function cleanup(effectFn: ReactiveEffect): void {
    const { deps } = effectFn;
    
    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            // Remove this effect from the Set inside the State/Computed object
            deps[i].delete(effectFn);
        }
        // Clear the internal array of references
        deps.length = 0;
    }
}