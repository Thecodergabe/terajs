/**
 * Props for the runtime `Suspense` component.
 */
export interface SuspenseProps {
  fallback?: any;
  children?: any;
}

/**
 * Minimal suspense placeholder for runtime-level composition.
 *
 * The current runtime implementation forwards children directly and leaves
 * fallback coordination to higher renderer-level integrations.
 *
 * @param props - Suspense content and optional fallback content.
 * @returns The current child content.
 */
export function Suspense(props: SuspenseProps) {
  return props.children;
}
