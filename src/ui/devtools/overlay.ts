/**
 * @file overlay.ts
 * @description
 * Mounts and manages the Nebula DevTools overlay iframe.
 * Injects a no-build, inline DevTools UI and forwards debug events
 * from the application into the iframe via postMessage.
 */

import { subscribeDebug } from "../../debug/core/eventBus";
import type { DebugEvent } from "../../debug/types/events";
import { initDevtoolsApp } from "./devtoolsApp";

let overlayEl: HTMLDivElement | null = null;
let iframeEl: HTMLIFrameElement | null = null;
let visible = false;

/**
 * HTML shell for the DevTools iframe.
 * The inline script is injected after the iframe loads.
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
      }
      .event-row {
        padding: 4px 8px;
        border-bottom: 1px solid #222;
        font-size: 12px;
        display: flex;
        gap: 8px;
      }
      .event-type {
        color: #7dd3fc;
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
 * Safe to call multiple times; only mounts once.
 */
export function mountDevtoolsOverlay(): void {
  if (overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.style.position = "fixed";
  overlayEl.style.inset = "0 auto auto 0";
  overlayEl.style.width = "480px";
  overlayEl.style.height = "60vh";
  overlayEl.style.background = "#111";
  overlayEl.style.borderTopRightRadius = "8px";
  overlayEl.style.border = "1px solid #333";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.display = "none";

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
 * Injects the inline DevTools UI script into the iframe.
 */
function injectDevtoolsApp(): void {
  if (!iframeEl?.contentDocument) return;

  const script = iframeEl.contentDocument.createElement("script");
  script.type = "module";

  // Inline the devtools app
  script.textContent = `
    (${initDevtoolsApp.toString()})();
  `;

  iframeEl.contentDocument.body.appendChild(script);
}



/**
 * Forwards debug events from the main app into the iframe.
 */
subscribeDebug((event: DebugEvent) => {
  if (iframeEl?.contentWindow) {
    iframeEl.contentWindow.postMessage(
      { __nebula_debug: true, event },
      "*"
    );
  }
});

/**
 * Inline DevTools UI code injected into the iframe.
 * Written as a string to avoid requiring a bundler.
 */
const DEVTOOLS_APP_INLINE = `
  ${/* This will be replaced by devtoolsApp.ts content */""}
`;
