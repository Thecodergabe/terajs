import { effect } from "../reactivity/effect";

/**
 * Bind a reactive value to a DOM text node.
 *
 * @remarks
 * This attaches an effect that updates the text node whenever
 * the reactive value changes.
 *
 * @param node - The text DOM node to update.
 * @param value - A function or signal getter returning the text.
 */
export function bindText(node: Text, value: () => any): void {
    effect(() => {
        const v = value();
        node.textContent = v == null ? "" : String(v);
    });
}
