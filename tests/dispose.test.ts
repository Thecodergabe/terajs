import { describe, it, expect } from "vitest";
import { state } from "../src/reactivity/state";
import { effect } from "../src/reactivity/effect";
import { dispose } from "../src/dx/dispose";
import { onCleanup } from "../src/dx/cleanup";

describe("dispose()", () => {
    it("stops an effect from running again", () => {
        const count = state(0);
        let calls = 0;

        const runner = effect(() => {
            calls++;
            count.get();
        });

        expect(calls).toBe(1);

        dispose(runner);

        count.set(1);
        expect(calls).toBe(1); // no re-run
    });

    it("runs cleanup functions on dispose", () => {
        const count = state(0);
        let cleanupCalls = 0;

        const runner = effect(() => {
            onCleanup(() => cleanupCalls++);
            count.get();
        });

        expect(cleanupCalls).toBe(0);

        dispose(runner);

        expect(cleanupCalls).toBe(1);
    });
});
