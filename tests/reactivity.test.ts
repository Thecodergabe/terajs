import { describe, it, expect } from "vitest";
import { effect } from "../src/reactivity/effect";
import { state } from "../src/reactivity/state";
import { computed } from "../src/reactivity/computed";
import { onCleanup } from "../src/dx/cleanup";
import { watchEffect } from "../src/dx/watchEffect";
import { setRuntimeMode } from "../src/dx/runtime";

/**
 * @group Reactivity
 * @description
 * Comprehensive test suite validating Nebula’s fine‑grained reactivity engine.
 * Covers signals, effects, cleanup, batching, computed values, watchers,
 * SSR mode, and nested effect behavior.
 */
describe("Reactivity Core", () => {

    // ---------------------------------------------------------------------
    // 1. STATE BASICS
    // ---------------------------------------------------------------------

    /**
     * @test State basic integrity
     * @description Ensures the Signal-like 'state' primitive maintains
     * synchronous value consistency.
     */
    it("state get/set works", () => {
        const count = state<number>(0);
        expect(count.get()).toBe(0);

        count.set(1);
        expect(count.get()).toBe(1);
    });

    // ---------------------------------------------------------------------
    // 2. EFFECT BASIC TRACKING
    // ---------------------------------------------------------------------

    /**
     * @test Automatic Dependency Tracking
     * @description Verifies that the global 'effect' stack correctly
     * captures state reads and re-triggers the provided callback
     * whenever those specific dependencies notify an update.
     */
    it("effect runs when state changes", () => {
        const count = state<number>(0);
        let dummy = 0;

        effect(() => {
            dummy = count.get();
        });

        expect(dummy).toBe(0);

        count.set(5);
        expect(dummy).toBe(5);
    });

    // ---------------------------------------------------------------------
    // 3. COMPUTED VALUES
    // ---------------------------------------------------------------------

    /**
     * @test Memoization and Lazy Evaluation
     * @description
     * 1. 'computed' should not execute until .get() is called (Lazy).
     * 2. 'computed' should return a cached value if dependencies haven't changed.
     * 3. 'computed' should invalidate and re-run only when a dependency changes.
     */
    it("computed caches value and updates when dependencies change", () => {
        const count = state<number>(0);
        let computeRuns = 0;

        const double = computed(() => {
            computeRuns++;
            return count.get() * 2;
        });

        expect(computeRuns).toBe(0);

        expect(double.get()).toBe(0);
        expect(computeRuns).toBe(1);

        count.set(5);
        expect(computeRuns).toBe(1);

        expect(double.get()).toBe(10);
        expect(computeRuns).toBe(2);

        double.get();
        expect(computeRuns).toBe(2);
    });

    // ---------------------------------------------------------------------
    // 4. EFFECT CLEANUP
    // ---------------------------------------------------------------------

    /**
     * @test Dynamic Dependency Branching (Cleanup)
     * @description
     * Ensures effects correctly unsubscribe from stale dependencies when
     * switching branches, preventing ghost updates.
     */
    it("effect cleanup removes old dependencies", () => {
        const toggle = state<boolean>(true);
        const count = state<number>(0);
        let calls = 0;

        effect(() => {
            calls++;
            if (toggle.get()) {
                count.get();
            }
        });

        expect(calls).toBe(1);

        count.set(1);
        expect(calls).toBe(2);

        toggle.set(false);
        expect(calls).toBe(3);

        count.set(2);
        expect(calls).toBe(3);
    });

    /**
     * @test Cleanup Execution Order
     * @description
     * Ensures that `onCleanup()` callbacks run before the next execution
     * of an effect.
     */
    it("onCleanup runs before next effect execution", () => {
        const count = state<number>(0);
        let cleanupCalls = 0;

        effect(() => {
            onCleanup(() => cleanupCalls++);
            count.get();
        });

        expect(cleanupCalls).toBe(0);

        count.set(1);
        expect(cleanupCalls).toBe(1);

        count.set(2);
        expect(cleanupCalls).toBe(2);
    });

    // ---------------------------------------------------------------------
    // 5. WATCH EFFECT
    // ---------------------------------------------------------------------

    /**
     * @test watchEffect Re-Execution
     * @description
     * Validates that `watchEffect()` automatically tracks dependencies and
     * re-runs whenever those dependencies change.
     */
    it("watchEffect re-runs when dependencies change", () => {
        const count = state<number>(0);
        let calls = 0;

        watchEffect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        count.set(1);
        expect(calls).toBe(2);
    });

    /**
     * @test watchEffect Disposal
     * @description
     * Ensures that the stop function returned by `watchEffect()` correctly
     * disposes the watcher.
     */
    it("watchEffect stop function prevents further re-runs", () => {
        const count = state<number>(0);
        let calls = 0;

        const stop = watchEffect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        stop();
        count.set(1);

        expect(calls).toBe(1);
    });

    // ---------------------------------------------------------------------
    // 6. SSR MODE
    // ---------------------------------------------------------------------

    /**
     * @test SSR Mode Behavior
     * @description
     * Effects should NOT run in server mode.
     */
    it("effects do not run in server mode", () => {
        setRuntimeMode("server");

        const count = state<number>(0);
        let calls = 0;

        effect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(0);

        setRuntimeMode("client");
    });

    // ---------------------------------------------------------------------
    // 8. NESTED EFFECTS
    // ---------------------------------------------------------------------

    /**
     * @test Nested Effects
     * @description
     * Validates that nested effects track dependencies independently and
     * re-run in the correct order.
     */
    it("nested effects track correctly", () => {
        const a = state<number>(1);
        const b = state<number>(2);

        let outer = 0;
        let inner = 0;

        effect(() => {
            a.get();
            outer++;

            effect(() => {
                b.get();
                inner++;
            });
        });

        expect(outer).toBe(1);
        expect(inner).toBe(1);

        a.set(3);
        expect(outer).toBe(2);
        expect(inner).toBe(2);

        b.set(4);
        expect(inner).toBe(3);
    });

});
