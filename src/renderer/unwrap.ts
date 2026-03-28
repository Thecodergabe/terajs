/**
 * @file unwrap.ts
 * @description
 * Central unwrapping logic for Nebula’s renderer.
 *
 * This function resolves:
 * - signals
 * - boxed signals
 * - reactive() properties
 * - functions returning values
 *
 * It ensures the renderer always receives plain values.
 */

export function unwrap(value: any): any {
    // Signal or boxed signal
    if (typeof value === "function" && "_dep" in value && "_value" in value) {
        return value();
    }

    // Accessor function
    if (typeof value === "function") {
        return value();
    }

    return value;
}
