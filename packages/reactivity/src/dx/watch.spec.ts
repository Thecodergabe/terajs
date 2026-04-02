import { describe, it, expect } from "vitest";
import { state } from "../state";
import { watch } from "./watch";

describe("watch()", () => {
    it("runs callback only when source value changes (no initial call)", () => {
        const count = state(0);

        let calls = 0;
        let newVal: number | undefined;
        let oldVal: number | undefined;

        const stop = watch(
            () => count.get(),
            (n, o) => {
                calls++;
                newVal = n;
                oldVal = o;
            }
        );

        // No initial callback
        expect(calls).toBe(0);

        count.set(1);
        expect(calls).toBe(1);
        expect(newVal).toBe(1);
        expect(oldVal).toBe(0);

        count.set(2);
        expect(calls).toBe(2);
        expect(newVal).toBe(2);
        expect(oldVal).toBe(1);

        stop();
    });

    it("runs cleanup before each callback and on stop()", () => {
        const count = state(0);

        let cleanupCalls = 0;
        let callbackCalls = 0;

        const stop = watch(
            () => count.get(),
            (n, o, onCleanup) => {
                callbackCalls++;

                onCleanup(() => {
                    cleanupCalls++;
                });
            }
        );

        // No initial callback, no cleanup yet
        expect(callbackCalls).toBe(0);
        expect(cleanupCalls).toBe(0);

        count.set(1);
        // First change: callback runs, registers cleanup
        expect(callbackCalls).toBe(1);
        expect(cleanupCalls).toBe(0);

        count.set(2);
        // Second change: previous cleanup runs, then callback
        expect(callbackCalls).toBe(2);
        expect(cleanupCalls).toBe(1);

        stop();
        // stop() runs last pending cleanup
        expect(cleanupCalls).toBe(2);
    });
});
