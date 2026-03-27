/**
 * Represents the current execution environment for the reactive runtime.
 *
 * Nebula uses a simple runtime mode switch to determine whether certain
 * operations—such as reactive effects or DOM updates—should execute.
 *
 * - `"client"`: Normal browser execution. Effects run immediately and DOM
 *               operations are enabled.
 * - `"server"`: Server-side rendering mode. Effects are registered but not
 *               executed, ensuring deterministic SSR output without side effects.
 */
export type RuntimeMode = "client" | "server";

let runtimeMode: RuntimeMode = "client";

/**
 * Sets the current runtime mode.
 *
 * This is typically called by the framework during initialization, depending
 * on whether the code is running in a browser environment or during server-side
 * rendering. Switching to `"server"` mode prevents reactive effects from
 * executing, while still allowing dependency tracking for hydration.
 *
 * @param mode - The runtime mode to activate.
 */
export function setRuntimeMode(mode: RuntimeMode): void {
    runtimeMode = mode;
}

/**
 * Returns `true` when the runtime is operating in server-side rendering mode.
 *
 * In `"server"` mode:
 * - reactive effects should not execute
 * - DOM operations should be disabled
 * - dependency tracking may still occur for hydration
 *
 * This function is used internally by the reactive system and renderer to
 * ensure consistent behavior across client and server environments.
 *
 * @returns Whether the runtime is currently in server mode.
 */
export function isServer(): boolean {
    return runtimeMode === "server";
}