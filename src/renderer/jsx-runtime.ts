/**
 * @file jsx-runtime.ts
 * @description
 * Nebula’s JSX runtime — the bridge between JSX and the fine‑grained DOM renderer.
 *
 * JSX elements are turned directly into:
 * - DOM nodes
 * - reactive bindings
 * - nested component executions
 *
 * No virtual DOM. No diffing. No component re-renders.
 */

import { unwrap } from "./unwrap";
import {
    createElement,
    createText,
    createFragment,
    insert,
    setStyle,
} from "./dom";

import {
    bindText,
    bindProp,
    bindClass,
    bindStyle,
    bindEvent,
} from "./bindings";

/**
 * Fragment symbol used by JSX.
 */
export const Fragment = Symbol("Nebula.Fragment");

/**
 * Normalize a JSX child into a DOM node.
 *
 * @param child - Any JSX child value.
 * @returns A DOM node.
 */
function normalizeChild(child: any): Node {
    child = unwrap(child);

    if (child == null || child === false || child === true) {
        return createText("");
    }

    if (typeof child === "string" || typeof child === "number") {
        return createText(String(child));
    }

    if (child instanceof Node) {
        return child;
    }

    if (typeof child === "function") {
        return normalizeChild(child());
    }

    throw new Error("Unsupported JSX child: " + child);
}

/**
 * Apply props to an element.
 *
 * @param el - The element to update.
 * @param props - The props object from JSX.
 */
function applyProps(el: HTMLElement, props: Record<string, any>) {
    for (const key in props) {
        const value = props[key];

        if (key === "children") continue;

        // Event handlers: onClick → click
        if (key.startsWith("on") && typeof value === "function") {
            const event = key.slice(2).toLowerCase();
            bindEvent(el, event, value);
            continue;
        }

        // Class
        if (key === "class" || key === "className") {
            if (typeof value === "function") bindClass(el, value);
            else el.className = unwrap(value);
            continue;
        }

        // Style
        if (key === "style") {
            if (typeof value === "function") bindStyle(el, value);
            else setStyle(el, unwrap(value));
            continue;
        }

        // Dynamic prop
        if (typeof value === "function") {
            bindProp(el, key, value);
        } else {
            el.setAttribute(key, unwrap(value));
        }
    }
}

/**
 * Create a DOM node from JSX.
 */
export function jsx(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * Same as `jsx` but used when JSX has multiple children.
 */
export function jsxs(type: any, props: any): Node {
    return createVNode(type, props);
}

/**
 * Core JSX → DOM conversion.
 */
function createVNode(type: any, props: any): Node {
    props = props || {};

    // Fragment
    if (type === Fragment) {
        const frag = createFragment();
        const children = props.children;

        if (Array.isArray(children)) {
            for (const child of children) insert(frag, normalizeChild(child));
        } else if (children != null) {
            insert(frag, normalizeChild(children));
        }

        return frag;
    }

    // Component
    if (typeof type === "function") {
        return type(props);
    }

    // Native DOM element
    const el = createElement(type);

    applyProps(el, props);

    const children = props.children;

    if (Array.isArray(children)) {
        for (const child of children) insert(el, normalizeChild(child));
    } else if (children != null) {
        insert(el, normalizeChild(children));
    }

    return el;
}
