import { UINode, UINodeFlags, Fragment } from "../ui/node";
import { createNode } from "./createNode";

/**
 * Mount a UINode into a DOM parent.
 *
 * @param node - The UI node to mount.
 * @param parent - The DOM parent element or fragment.
 */
export function mount(
    node: UINode,
    parent: HTMLElement | DocumentFragment
): void {
    const dom = createNode(node);
    parent.appendChild(dom);
}
