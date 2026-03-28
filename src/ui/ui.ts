import { UINode, UINodeFlags, Fragment, ComponentFn } from "./node";

/**
 * Creates a `UINode` — Nebula's fundamental UI description object.
 *
 * @remarks
 * This function performs no diffing, reconciliation, or DOM operations.
 * It simply normalizes props/children and assigns the correct flags.
 *
 * @param type - The node type: DOM tag, component function, or `Fragment`.
 * @param props - Optional props object. `null` when omitted.
 * @param children - Zero or more child nodes or strings.
 *
 * @returns A normalized `UINode` ready for compilation or rendering.
 *
 * @example
 * ```ts
 * ui("div", { class: "box" }, "Hello");
 * ```
 */
export function ui(
    type: string | ComponentFn | typeof Fragment,
    props?: Record<string, any> | null,
    ...children: any[]
): UINode {
    const normalizedProps = props ?? null;

    let normalizedChildren: UINode[] | string | null = null;

    // Single text child → treat as text node
    if (children.length === 1 && typeof children[0] === "string") {
        normalizedChildren = children[0];
    }
    // Multiple children → flatten and filter
    else if (children.length > 0) {
        const flat = children.flat(Infinity).filter(c => c != null);
        normalizedChildren = flat.length > 0 ? flat : null;
    }

    // Determine flags
    let flags = 0;

    if (typeof type === "string") {
        flags |= UINodeFlags.ELEMENT;
    } else if (typeof type === "function") {
        flags |= UINodeFlags.COMPONENT;
    } else if (type === Fragment) { // <-- FIXED
        flags |= UINodeFlags.FRAGMENT;
    }

    if (typeof normalizedChildren === "string") {
        flags |= UINodeFlags.TEXT;
    }

    return {
        type,
        props: normalizedProps,
        children: normalizedChildren,
        flags
    };
}
