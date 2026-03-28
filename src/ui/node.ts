/**
 * Represents a Nebula UI node — a static description of UI structure.
 *
 * @remarks
 * A `UINode` is not a DOM node and not a virtual DOM node.
 * It is a pure data structure consumed by the compiler and renderer.
 */
export interface UINode {
    /**
     * The type of UI node.
     *
     * - `string` → DOM element tag (e.g., `"div"`)
     * - `ComponentFn` → a Nebula component
     * - `Fragment` → a group of children with no wrapper
     */
    type: string | ComponentFn | typeof Fragment;

    /**
     * Props/attributes/event handlers passed to this node.
     * `null` when no props exist.
     */
    props: Record<string, any> | null;

    /**
     * Children of this node.
     *
     * - `UINode[]` → nested UI nodes
     * - `string` → text node
     * - `null` → no children
     */
    children: UINode[] | string | null;

    /**
     * Optional stable identity for component instances in lists.
     * Used for preserving component state — not for diffing.
     */
    key?: string | number;

    /**
     * Optimization flags used by the renderer.
     */
    flags?: UINodeFlags;

    /**
     * Optional debug metadata.
     * Useful for devtools and error overlays.
     */
    source?: {
        file: string;
        line: number;
        column: number;
    };
}

/**
 * A Nebula component — a function that receives props and returns a `UINode`.
 */
export type ComponentFn = (props: any) => UINode;

/**
 * Fragment symbol — represents a group of children with no wrapper element.
 */
export const Fragment = Symbol("Fragment");

/**
 * Flags describing the type and characteristics of a `UINode`.
 */
export enum UINodeFlags {
    ELEMENT   = 1 << 0,
    TEXT      = 1 << 1,
    COMPONENT = 1 << 2,
    FRAGMENT  = 1 << 3,
    STATIC    = 1 << 4
}
