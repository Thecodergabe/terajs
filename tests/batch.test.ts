import { describe, it, expect } from "vitest";
import { state } from "../src/reactivity/state";
import { effect } from "../src/reactivity/effect";
import { computed } from "../src/reactivity/computed";
import { batch } from "../src/dx/batch";

describe("batch()", () => {
    it("collapses multiple updates into one effect run", () => {
        const count = state(0);
        let calls = 0;

        effect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        batch(() => {
            count.set(1);
            count.set(2);
            count.set(3);
        });

        expect(calls).toBe(2); // initial + one batched update
    });

    it("nested batches still flush once", () => {
        const count = state(0);
        let calls = 0;

        effect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        batch(() => {
            batch(() => {
                count.set(1);
                count.set(2);
            });
            count.set(3);
        });

        expect(calls).toBe(2);
    });

    it("batch works with computed", () => {
        const count = state(1);
        const double = computed(() => count.get() * 2);

        let calls = 0;
        effect(() => {
            calls++;
            double.get();
        });

        expect(calls).toBe(1);
        expect(double.get()).toBe(2);

        batch(() => {
            count.set(2);
            count.set(3);
        });

        expect(double.get()).toBe(6);
        expect(calls).toBe(2);
    });
});
