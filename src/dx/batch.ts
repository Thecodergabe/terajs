/**
 * Nebula batching system.
 */

import type { ReactiveEffect } from "../reactivity/deps";
import { scheduleEffect } from "../reactivity/effect";

let batchDepth = 0;
const batchQueue = new Set<ReactiveEffect>();

export function startBatch(): void {
    batchDepth++;
}

export function endBatch(): void {
    batchDepth--;

    if (batchDepth === 0) {
        const effects = Array.from(batchQueue);
        batchQueue.clear();

        for (const eff of effects) {
            scheduleEffect(eff);
        }
    }
}

export function batch<T>(fn: () => T): T {
    startBatch();
    try {
        return fn();
    } finally {
        endBatch();
    }
}

export function shouldBatch(): boolean {
    return batchDepth > 0;
}

export function queueEffect(eff: ReactiveEffect): void {
    batchQueue.add(eff);
}
