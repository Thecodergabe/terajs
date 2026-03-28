import { UINode, UINodeFlags, ComponentFn, Fragment } from "../ui/node";
import { mount } from "./mount";
import { setProp } from "./setProp";
import { bindText } from "./patch";


/**
 * Create a DOM node from a UINode.
 *
 * @param node - The UI node to convert into a DOM node.
 * @returns A DOM Node representing the UI node.
 */
export function createNode(node: UINode): Node {
    const flags = node.flags ?? 0;

    // Text node
    if (flags & UINodeFlags.TEXT) {
        // If the text is reactive (a function), bind it
        if (typeof node.children === "function") {
            const text = document.createTextNode("");
            bindText(text, node.children as any);
            return text;
        }

        return document.createTextNode(node.children as string);
    }

    // Component
    if (flags & UINodeFlags.COMPONENT) {
        const component = node.type as ComponentFn;
        const rendered = component(node.props ?? {});
        return createNode(rendered);
    }

    // Fragment
    if (flags & UINodeFlags.FRAGMENT || node.type === Fragment) {
        const frag = document.createDocumentFragment();
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                mount(child, frag);
            }
        }
        return frag;
    }

    // Element
    if (flags & UINodeFlags.ELEMENT && typeof node.type === "string") {
        const el = document.createElement(node.type);

        // Props (reactive or static)
        if (node.props) {
            for (const key in node.props) {
                const value = node.props[key];

                if (typeof value === "function") {
                    // Reactive prop
                    bindProp(el, key, value);
                } else {
                    setProp(el, key, value);
                }
            }
        }

        // Children
        if (Array.isArray(node.children)) {
            for (const child of node.children) {
                mount(child, el);
            }
        } else if (typeof node.children === "string") {
            el.textContent = node.children;
        } else if (typeof node.children === "function") {
            // Reactive text child
            const text = document.createTextNode("");
            bindText(text, node.children as any);
            el.appendChild(text);
        }

        return el;
    }

    throw new Error("Unsupported UINode type");
}

/**
 * Bind a reactive prop to a DOM element.
 */
function bindProp(el: HTMLElement, key: string, getter: () => any): void {
    bindText(document.createTextNode(""), () => {
        const value = getter();
        setProp(el, key, value);
        return "";
    });
}
