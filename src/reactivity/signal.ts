import { currentEffect } from "./deps";
import type { ReactiveEffect } from "./deps";
import { scheduleEffect } from "./effect";

/**
 * A reactive signal holding a value of type T.
 */
export interface Signal<T> {
    (): T;
    set(value: T): void;
    update(fn: (value: T) => T): void;
    _value: T;
    _dep: Set<ReactiveEffect>;
}

/**
 * Create a reactive signal.
 *
 * @param value - The initial value.
 */
export function signal<T>(value: T): Signal<T> {
    const sig = function () {
        if (currentEffect) {
            sig._dep.add(currentEffect);
            if (!currentEffect.deps.includes(sig._dep)) {
                currentEffect.deps.push(sig._dep);
            }
        }
        return sig._value;
    } as Signal<T>;


    sig._value = value;
    sig._dep = new Set<ReactiveEffect>();

    sig.set = (v: T) => {
        if (Object.is(v, sig._value)) return;
        sig._value = v;

        const subs = Array.from(sig._dep); // snapshot
        for (const eff of subs) {
            scheduleEffect(eff);
        }
    };

    sig.update = (fn) => sig.set(fn(sig._value));

    return sig;
}
