import { describe, it, expect } from "vitest";
import { effect } from "../src/reactivity/effect";
import { state } from "../src/reactivity/state";
import { computed } from "../src/reactivity/computed";

/**
 * @group Reactivity
 * @description
 * This suite validates the core reactive engine. The engine follows a 
 * "Fine-Grained" reactivity model where dependencies are tracked 
 * automatically during execution.
 */
describe("Reactivity Core", () => {
    
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

    /**
     * @test Automatic Dependency Tracking
     * @description Verifies that the global 'effect' stack correctly 
     * captures state reads and re-triggers the provided callback 
     * whenever those specific dependencies notify an update.
     */
    it("effect runs when state changes", () => {
        const count = state<number>(0);
        let dummy: number = 0;

        effect(() => {
            // Getter registers this effect in the 'count' subscriber set
            dummy = count.get();
        });

        expect(dummy).toBe(0);

        count.set(5);
        expect(dummy).toBe(5);
    });

    /**
     * @test Memoization and Lazy Evaluation
     * @description 
     * 1. 'computed' should not execute until .get() is called (Lazy).
     * 2. 'computed' should return a cached value if dependencies haven't changed (Memoized).
     * 3. 'computed' should invalidate and re-run only when a dependency notifies a change.
     */
    it("computed caches value and updates when dependencies change", () => {
        const count = state<number>(0);
        let computeRuns = 0;

        const double = computed(() => {
            computeRuns++;
            return count.get() * 2;
        });

        // Verify Lazy Evaluation: No runs until accessed
        expect(computeRuns).toBe(0);

        // First read: cache miss, executes logic
        expect(double.get()).toBe(0);
        expect(computeRuns).toBe(1);

        // State update: invalidates cache but shouldn't re-run yet (lazy)
        count.set(5);
        expect(computeRuns).toBe(1);

        // Second read: cache miss, re-evaluates
        expect(double.get()).toBe(10);
        expect(computeRuns).toBe(2);
        
        // Third read: cache hit, returns memoized value
        double.get();
        expect(computeRuns).toBe(2); 
    });

    /**
     * @test Dynamic Dependency Branching (Cleanup)
     * @description 
     * Tests the "Conditional Dependency" problem. An effect must 
     * purge its dependency list before every re-run to ensure it 
     * doesn't remain subscribed to state that is no longer being read.
     * * This prevents "Ghost Updates" and memory leaks in complex logic.
     */
    it("effect cleanup removes old dependencies", () => {
        const toggle = state<boolean>(true);
        const count = state<number>(0);
        let calls = 0;

        effect(() => {
            calls++;
            // Branch A: Depends on 'toggle' AND 'count'
            // Branch B: Depends ONLY on 'toggle'
            if (toggle.get()) {
                count.get();
            }
        });

        expect(calls).toBe(1);

        // Verify count is tracked in Branch A
        count.set(1);
        expect(calls).toBe(2);

        // Switch to Branch B
        toggle.set(false);
        expect(calls).toBe(3); 

        // Verify count is NO LONGER tracked (Unsubscribed during Branch B run)
        count.set(2);
        expect(calls).toBe(3); // Should NOT increment if cleanup is working
    });

});