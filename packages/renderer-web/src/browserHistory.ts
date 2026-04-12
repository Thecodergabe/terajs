import type { RouterHistory } from "@terajs/router";

/**
 * Creates a browser history implementation backed by window.history.
 */
export function createBrowserHistory(browserWindow: Window = window): RouterHistory {
  const getLocation = () =>
    `${browserWindow.location.pathname}${browserWindow.location.search}${browserWindow.location.hash}`;

  return {
    getLocation,
    push: (path) => {
      browserWindow.history.pushState(null, "", path);
    },
    replace: (path) => {
      browserWindow.history.replaceState(null, "", path);
    },
    listen: (listener) => {
      const onPopState = () => {
        listener(getLocation());
      };

      browserWindow.addEventListener("popstate", onPopState);
      return () => {
        browserWindow.removeEventListener("popstate", onPopState);
      };
    }
  };
}