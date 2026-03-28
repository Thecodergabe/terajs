import { UINode, ComponentFn } from "./node";

/**
 * Defines a Nebula component.
 *
 * @remarks
 * A unit is simply a function that:
 * - receives props
 * - returns a `UINode`
 *
 * Nebula components do not own reactive scopes.
 * Effects attach to signals, not components.
 *
 * @param renderFn - The component's render function.
 *
 * @returns A component instance function that produces a `UINode`.
 *
 * @example
 * ```ts
 * const Counter = unit((props) => {
 *   return ui("div", null, "Hello");
 * });
 * ```
 */
export function unit(renderFn: ComponentFn) {
    return function UnitInstance(props: any): UINode {
        return renderFn(props);
    };
}
