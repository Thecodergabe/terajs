import type { Router, RouterNavigationState } from "@terajs/router";
import type { TemplateFn } from "./template.js";
import { useNavigationState } from "./routerContext.js";

/**
 * Props for the `RoutePending` helper component.
 */
export interface RoutePendingProps {
  /** Optional router instance override. */
  router?: Router;
  /** Optional predicate used to decide whether the pending branch should render. */
  when?: (state: RouterNavigationState) => boolean;
  /** Content rendered while navigation is pending. */
  children?: any | ((state: RouterNavigationState) => any);
  /** Content rendered when navigation is not pending. */
  fallback?: any | ((state: RouterNavigationState) => any);
}

function resolveRenderable<T>(value: T | ((state: RouterNavigationState) => T), state: RouterNavigationState): T {
  return typeof value === "function"
    ? (value as (currentState: RouterNavigationState) => T)(state)
    : value;
}

function normalizePendingContent(value: any): Node {
  if (value == null || value === false || value === true) {
    return document.createTextNode("");
  }

  if (value instanceof Node) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    return document.createTextNode(String(value));
  }

  throw new Error("Terajs RoutePending: unsupported child content.");
}

/**
 * Returns a derived accessor indicating whether the router is currently navigating.
 *
 * @param router - Optional router instance override.
 * @returns A reactive accessor that reports the current pending navigation state.
 */
export function useIsNavigating(router?: Router): () => boolean {
  const navigationState = useNavigationState(router);
  return () => navigationState().pending;
}

/**
 * Returns a derived accessor for the current pending navigation target.
 *
 * @param router - Optional router instance override.
 * @returns A reactive accessor for the pending destination path, or `null`.
 */
export function usePendingTarget(router?: Router): () => string | null {
  const navigationState = useNavigationState(router);
  return () => navigationState().to;
}

/**
 * Renders content conditionally from the router's pending navigation state.
 *
 * The helper chooses between `children` and `fallback` based on the current
 * navigation state, optionally filtered through a custom `when` predicate.
 *
 * @param props - Route-pending rendering configuration.
 * @returns A template function that reacts to navigation state changes.
 */
export function RoutePending(props: RoutePendingProps): TemplateFn {
  const navigationState = useNavigationState(props.router);

  return () => {
    const state = navigationState();
    const shouldRender = props.when ? props.when(state) : state.pending;
    const content = shouldRender ? props.children : props.fallback;
    return normalizePendingContent(resolveRenderable(content, state));
  };
}