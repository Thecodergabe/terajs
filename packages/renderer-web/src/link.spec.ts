import { describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter, type RouteDefinition } from "@terajs/router";

import { Link } from "./link";
import { mount, unmount } from "./mount";

function route(overrides: Partial<RouteDefinition>): RouteDefinition {
  return {
    id: "index",
    path: "/",
    filePath: "/pages/index.nbl",
    component: async () => ({ default: () => document.createTextNode("home") }),
    layout: null,
    middleware: [],
    prerender: true,
    hydrate: "eager",
    edge: false,
    meta: {},
    layouts: [],
    ...overrides
  };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Link", () => {
  it("navigates with the router on normal left click", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    mount(() => Link({ router, to: "/docs", children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(router.getCurrentRoute()?.fullPath).toBe("/docs");

    unmount(root);
  });

  it("uses replace navigation when requested", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    const replaceSpy = vi.spyOn(router, "replace");
    mount(() => Link({ router, to: "/docs", replace: true, children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    await flush();

    expect(replaceSpy).toHaveBeenCalledWith("/docs");

    unmount(root);
  });

  it("falls back to normal anchor behavior for non-primary clicks and preserves external hrefs", async () => {
    const root = document.createElement("div");
    const router = createRouter([
      route({ path: "/" }),
      route({ id: "docs", path: "/docs" })
    ], {
      history: createMemoryHistory("/")
    });

    await router.start();
    const navigateSpy = vi.spyOn(router, "navigate");
    mount(() => Link({ router, to: "/docs", children: "Docs" }), root);

    const anchor = root.querySelector("a") as HTMLAnchorElement;
    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 }));
    await flush();

    expect(navigateSpy).not.toHaveBeenCalled();

    unmount(root);

    const externalRoot = document.createElement("div");
    mount(() => Link({ router, to: "https://example.com", children: "External" }), externalRoot);
    const externalAnchor = externalRoot.querySelector("a") as HTMLAnchorElement;
    expect(externalAnchor.getAttribute("href")).toBe("https://example.com");

    unmount(externalRoot);
  });
});