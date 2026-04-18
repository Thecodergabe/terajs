# @terajs/devtools

Leaf-package entrypoint for the Terajs DevTools overlay, structured bridge session APIs, and VS Code live-attach helpers.

Most applications can import the same surface through `@terajs/app/devtools`. Use `@terajs/devtools` directly when you are composing tooling or working at the leaf-package level.

## What it provides

- overlay mounting for in-browser diagnostics
- component inspection and drill-down
- router, queue, issues, logs, performance, and AI diagnostics panels
- structured bridge session APIs for custom tooling
- development-only VS Code auto-attach helpers

## Mount the overlay

```ts
import {
  autoAttachVsCodeDevtoolsBridge,
  mountDevtoolsOverlay
} from "@terajs/devtools";

mountDevtoolsOverlay({ startOpen: false });
autoAttachVsCodeDevtoolsBridge();
```

`mountDevtoolsOverlay(...)` is a development-only no-op in production builds.

## Common overlay behavior

The overlay supports layout and shell options such as:

- `startOpen`
- `position`
- `panelSize`
- `persistPreferences`

Repeated calls reuse the existing overlay instead of creating duplicates.

## VS Code live bridge

The bridge flow is structured and same-origin. It does not depend on scraping arbitrary DOM.

- `autoAttachVsCodeDevtoolsBridge(...)` polls the development manifest route and connects when the companion VS Code tooling is available.
- `stopAutoAttachVsCodeDevtoolsBridge()` stops that polling behavior.
- bridge session helpers such as `readDevtoolsBridgeSession(...)`, `subscribeToDevtoolsBridge(...)`, and `waitForDevtoolsBridge(...)` are exported for custom integrations.

## Advanced usage

If you want to embed the DevTools UI in a custom shell instead of the floating overlay, this package also exports `mountDevtoolsApp` and the bridge session types/events used by the overlay.

## Notes

- App-facing docs should generally reference `@terajs/app/devtools`.
- The overlay is part of the shipped Terajs experience, not a separate styling demo.
- Production builds do not expose the development bridge manifest route.

