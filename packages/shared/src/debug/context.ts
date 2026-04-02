/**
 * Allowed key types for context entries (provide/inject).
 */
export type ContextKey = string | symbol | object | Function;

/**
 * Cleanup function signature.
 */
export type Disposer = () => void;