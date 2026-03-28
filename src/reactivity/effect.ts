import { pushEffect, popEffect, type ReactiveEffect, currentEffect } from "./deps";
import { isServer } from "../dx/runtime";
import { shouldBatch, queueEffect } from "../dx/batch";

/**
 * Creates a reactive effect that automatically tracks dependencies and
 * re-runs whenever those dependencies change.
 *
 * Effects form the backbone of Nebula’s fine‑grained reactivity system.
 * They:
 * - collect dependencies during execution
 * - re-run when those dependencies update
 * - clean up stale subscriptions before each run
 * - support nested hierarchical effects (children disposed on parent re-run)
 * - respect SSR mode (no execution on the server)
 *
 * @param fn - The user-provided function to execute reactively.
 * @param scheduler - Optional custom scheduler. If provided, the effect
 *                    will not run immediately and must be triggered manually.
 *
 * @returns The wrapped `ReactiveEffect` function.
 *
 * @example
 * const count = state(0);
 * effect(() => {
 *   console.log(count.get());
 * });
 */
export function effect(fn: () => void, scheduler?: () => void): ReactiveEffect {
    /**
     * The internal reactive wrapper. This function:
     * - cleans up stale deps
     * - disposes nested child effects
     * - sets up tracking context
     * - executes the user function
     */
    const effectFn: ReactiveEffect = () => {
        // SSR: skip execution entirely
        if (isServer()) return;

        // Run user-registered cleanup callbacks
        if (effectFn.cleanups.length) {
            for (const cleanup of effectFn.cleanups) cleanup();
            effectFn.cleanups.length = 0;
        }

        // Remove this effect from all dependency sets
        cleanup(effectFn);

        // Dispose nested child effects from previous run
        if (effectFn.children && effectFn.children.length) {
            for (const child of effectFn.children) {
                disposeEffect(child);
            }
            effectFn.children.length = 0;
        }

        // Establish this effect as the active tracking context
        pushEffect(effectFn);

        try {
            fn();
        } finally {
            // Restore previous effect context
            popEffect();
        }
    };

    // Initialize tracking metadata
    effectFn.deps = [];
    effectFn.cleanups = [];
    effectFn.children = [];
    effectFn.scheduler = scheduler;
    effectFn.active = true;

    // Run immediately unless a scheduler is provided
    if (!scheduler) {
        effectFn();
    }

    return effectFn;
}

/**
 * Removes an effect from all dependency sets it is currently subscribed to.
 *
 * This is called before every re-run to ensure the effect only tracks
 * dependencies accessed during the *current* execution.
 *
 * @param effectFn - The effect to clean up.
 */
function cleanup(effectFn: ReactiveEffect): void {
    const { deps } = effectFn;

    if (deps.length) {
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effectFn);
        }
        deps.length = 0;
    }
}

/**
 * Fully disposes an effect:
 * - unsubscribes it from all dependencies
 * - runs cleanup callbacks
 * - recursively disposes nested child effects
 *
 * This is used internally for nested effect disposal.
 *
 * @param effectFn - The effect to dispose.
 */
function disposeEffect(effectFn: ReactiveEffect): void {
    // Remove from dependency sets
    cleanup(effectFn);

    // Run cleanup callbacks
    if (effectFn.cleanups.length) {
        for (const fn of effectFn.cleanups) fn();
        effectFn.cleanups.length = 0;
    }

    // Recursively dispose children
    if (effectFn.children && effectFn.children.length) {
        for (const child of effectFn.children) {
            disposeEffect(child);
        }
        effectFn.children.length = 0;
    }

    effectFn.active = false;
}

/**
 * Schedules an effect to run.
 *
 * If batching is active, the effect is queued and will run once the batch
 * completes. Otherwise, it executes immediately.
 *
 * @param effectFn - The effect to schedule.
 */
export function scheduleEffect(effectFn: ReactiveEffect): void {
    // Prevent infinite loops (effect triggering itself)
    if (effectFn === currentEffect) return;

    if (shouldBatch()) {
        queueEffect(effectFn);
    } else {
        effectFn();
    }
}
