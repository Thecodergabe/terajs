/**
 * @file hydrate.ts
 * @description
 * Client-side hydration entry for Nebula.
 *
 * Responsibilities:
 * - read SSR hydration marker
 * - determine hydration mode
 * - schedule hydration using runtime's scheduler
 * - call renderer-web's mount() at the correct time
 */

import { scheduleHydration } from "@terajs/runtime";
import type { HydrationMode } from "@terajs/shared";
import { mount } from "./mount";
import type { FrameworkComponent } from "./render";

/**
 * Parse the SSR hydration marker.
 */
function readHydrationMarker(): HydrationMode | "ai" {
  const script = document.querySelector<HTMLScriptElement>(
    'script[type="application/nebula-hydration"]'
  );

  if (!script || !script.textContent) return "eager";

  try {
    const payload = JSON.parse(script.textContent);
    return payload.mode ?? "eager";
  } catch {
    return "eager";
  }
}

/**
 * Hydrate the root component into the given root element.
 *
 * @param component - The root component to hydrate.
 * @param root - The DOM element containing SSR HTML.
 * @param props - Optional props for the root component.
 */
export function hydrateRoot(
  component: FrameworkComponent,
  root: HTMLElement,
  props?: any
): void {
  const mode = readHydrationMarker();

  scheduleHydration(
    mode,
    () => {
      // Replace SSR HTML with a fresh client-side mount
      mount(component, root, props);
    },
    root
  );
}

