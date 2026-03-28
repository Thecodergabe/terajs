/**
 * @file dom.ts
 * @description
 * Platform‑specific DOM operations for Nebula’s renderer.
 *
 * These are the lowest‑level primitives used by bindings and JSX runtime.
 * Nebula does NOT use a virtual DOM — these operations directly mutate the DOM.
 */

import { unwrap } from "./unwrap";

/**
 * Create a DOM element node.
 */
export function createElement(type: string): HTMLElement {
    return document.createElement(type);
}

/**
 * Create a DOM text node.
 */
export function createText(value: string): Text {
    return document.createTextNode(value);
}

/**
 * Create a DocumentFragment.
 */
export function createFragment(): DocumentFragment {
    return document.createDocumentFragment();
}

/**
 * Insert a child node into a parent before an optional anchor.
 */
export function insert(parent: Node, child: Node, anchor: Node | null = null): void {
    parent.insertBefore(child, anchor);
}

/**
 * Remove a DOM node from its parent.
 */
export function remove(node: Node): void {
    const parent = node.parentNode;
    if (parent) parent.removeChild(node);
}

/**
 * Update the text content of a Text node.
 */
export function setText(node: Text, value: any): void {
    node.data = String(unwrap(value));
}

/**
 * Set or update a property on an HTMLElement.
 */
export function setProp(el: HTMLElement, name: string, value: any): void {
    const v = unwrap(value);

    if (v == null) {
        el.removeAttribute(name);
        return;
    }

    if (typeof v === "boolean") {
        if (v) el.setAttribute(name, "");
        else el.removeAttribute(name);
        return;
    }

    el.setAttribute(name, String(v));
}

/**
 * Apply a style object to an HTMLElement.
 */
export function setStyle(el: HTMLElement, style: Record<string, string>): void {
    for (const key in style) {
        el.style[key as any] = style[key];
    }
}

/**
 * Set the class attribute on an element.
 */
export function setClass(el: HTMLElement, className: string): void {
    el.className = className;
}

/**
 * Add an event listener to an element.
 */
export function addEvent(el: HTMLElement, name: string, handler: EventListener): void {
    el.addEventListener(name, handler);
}

/**
 * Remove an event listener from an element.
 */
export function removeEvent(el: HTMLElement, name: string, handler: EventListener): void {
    el.removeEventListener(name, handler);
}
