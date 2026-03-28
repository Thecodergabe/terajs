import { describe, it, expect } from "vitest";
import { box } from "../src/reactivity/proxySignal";
import { effect } from "../src/reactivity/effect";

describe("box()", () => {
    it("reads and writes through .value", () => {
        const count = box(1);
        expect(count.value).toBe(1);

        count.value = 2;
        expect(count.value).toBe(2);
    });

    it("triggers effects when .value changes", () => {
        const count = box(0);
        let calls = 0;

        effect(() => {
            count.value;
            calls++;
        });

        expect(calls).toBe(1);

        count.value = 1;
        expect(calls).toBe(2);
    });

    it("does not trigger effects when value is unchanged", () => {
        const count = box(5);
        let calls = 0;

        effect(() => {
            count.value;
            calls++;
        });

        expect(calls).toBe(1);

        count.value = 5;
        expect(calls).toBe(1);
    });
});
