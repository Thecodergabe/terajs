import { startBatch, endBatch } from "../reactivity/effect";

/**
 * Batches multiple reactive updates together to optimize performance.
 * * When `batch` is called, it starts a batch context where any effects scheduled via `scheduleEffect`
 * will be collected and only executed once at the end of the batch when `endBatch` is called. This is useful for reducing redundant computations and side effects when multiple state changes occur in quick succession.
 * * @template T - The return type of the provided function.
 * @param fn - A function that contains reactive updates. Any effects scheduled within this function will be batched together.
 * @return The return value of the provided function `fn`.
 * @example
 * batch(() => {
 *   stateA.set(1);
 *   stateB.set(2);
 * });
 * // Both stateA and stateB updates will trigger their effects only once after the batch completes.
 */
export function batch<T>(fn: () => T): T {
    startBatch();

    try {
        return fn();
    } finally {
        endBatch();
    }
}
