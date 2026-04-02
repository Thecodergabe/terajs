/**
 * @file overlay.ts
 * @description
 * Mounts and manages the Nebula DevTools overlay iframe.
 */

import { subscribeDebug } from "@nebula/shared";
import type { DebugEvent } from "@nebula/shared";
import { initDevtoolsApp } from "./app";

let overlayEl: HTMLDivElement | null = null;
let iframeEl: HTMLIFrameElement | null = null;
let visible = false;

/**
 * HTML shell for the DevTools iframe.
 */
const DEVTOOLS_HTML_SHELL = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Nebula DevTools</title>
    <style>
      body {
        margin: 0;
        font-family: system-ui, sans-serif;
        background: #050509;
        color: #f5f5f5;
        overflow-x: hidden;
      }
      #nebula-devtools-root {
        height: 100vh;
        overflow-y: auto;
      }
      .event-row {
        padding: 4px 8px;
        border-bottom: 1px solid #222;
        font-size: 11px;
        display: flex;
        gap: 8px;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <div id="nebula-devtools-root"></div>
  </body>
</html>
`;

/**
 * Mounts the DevTools overlay iframe into the document.
 */
export function mountDevtoolsOverlay(): void {
  if (typeof document === 'undefined' || overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.id = "nebula-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.bottom = "20px";
  overlayEl.style.left = "20px";
  overlayEl.style.width = "400px";
  overlayEl.style.height = "50vh";
  overlayEl.style.background = "#0f172a";
  overlayEl.style.borderRadius = "12px";
  overlayEl.style.border = "1px solid #334155";
  overlayEl.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.5)";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.display = "none";
  overlayEl.style.overflow = "hidden";

  iframeEl = document.createElement("iframe");
  iframeEl.style.width = "100%";
  iframeEl.style.height = "100%";
  iframeEl.style.border = "none";

  overlayEl.appendChild(iframeEl);
  document.body.appendChild(overlayEl);

  iframeEl.srcdoc = DEVTOOLS_HTML_SHELL;

  iframeEl.addEventListener("load", () => {
    injectDevtoolsApp();
  });
}

/**
 * Toggles the visibility of the DevTools overlay.
 */
export function toggleDevtoolsOverlay(): void {
  if (!overlayEl) mountDevtoolsOverlay();
  visible = !visible;
  if (overlayEl) {
    overlayEl.style.display = visible ? "block" : "none";
  }
}

/**
 * Injects the UI logic into the iframe.
 */
function injectDevtoolsApp(): void {
  if (!iframeEl?.contentDocument) return;

  const script = iframeEl.contentDocument.createElement("script");
  script.type = "module";
  // Convert the function to a string and execute it immediately inside the iframe
  script.textContent = `
    (${initDevtoolsApp.toString()})();
  `;

  iframeEl.contentDocument.body.appendChild(script);
}

/**
 * Forwarding logic: Listen to the shared bus and push to the iframe
 */
subscribeDebug((event: DebugEvent) => {
  if (iframeEl?.contentWindow) {
    // Now TypeScript knows exactly what 'event' looks like
    iframeEl.contentWindow.postMessage(
      { 
        __nebula_debug: true, 
        event 
      },
      "*"
    );
  }
});