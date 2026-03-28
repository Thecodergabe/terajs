import { UINode } from "../ui/node";
import { mount } from "./mount";

/**
 * Render a UINode tree into a DOM container.
 *
 * @remarks
 * This is the public entry point for Nebula's web renderer.
 * It clears the container and mounts the provided UI tree.
 *
 * @param node - The root UINode to render.
 * @param container - The DOM element to mount into.
 */
export function render(node: UINode, container: HTMLElement): void {
    container.innerHTML = "";
    mount(node, container);
}
