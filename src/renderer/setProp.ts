/**
 * Set a prop or event handler on a DOM element.
 *
 * @param el - The DOM element to modify.
 * @param key - The prop name.
 * @param value - The prop value.
 */
export function setProp(el: HTMLElement, key: string, value: any): void {
    // Class
    if (key === "class" || key === "className") {
        el.className = value ?? "";
        return;
    }

    // Style object
    if (key === "style" && typeof value === "object") {
        for (const styleName in value) {
            // @ts-expect-error: index style is fine here
            el.style[styleName] = value[styleName];
        }
        return;
    }

    // Event handler
    if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, value);
        return;
    }

    // Attribute
    if (value == null) {
        el.removeAttribute(key);
    } else {
        el.setAttribute(key, String(value));
    }
}
