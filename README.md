# Terajs

Terajs is a compiler-native UI framework for route-first, local-first web applications.

It combines fine-grained reactivity, direct DOM bindings from compiler output, a renderer-agnostic core, and first-party diagnostics. The web-first launch surface centers on `@terajs/app`, while lower-level packages remain public for teams that want tighter control over the stack.

Status note (April 2026): this README is intended to be the release-facing overview of the full shipped Terajs surface. If you only read one file before evaluating the release, read this one. Use `API_REFERENCE.md` for canonical API signatures and exact exported symbols. Use `VISION.md` and the roadmap documents for directional work.

## How to read the root docs

The root docs should not feel partial or force you into package-level archaeology.

- `README.md`: the full launch overview, feature map, and package map
- `API_REFERENCE.md`: the canonical shipped API surface and public package reference
- `COMPONENTS.md`: the component model, `.tera` block system, TSX/JSX authoring, and integration seams
- `Core_Philosophy.md`: architecture rules and package-boundary rationale
- the other root docs: release tracking, style guidance, vision, roadmaps, brand/legal, and directional design notes

Not every root markdown file should repeat every feature verbatim. The release rule is simpler: `README.md` and `API_REFERENCE.md` must make the full shipped product obvious, and the other root docs must deepen specific areas instead of hiding them.

## Why Terajs

Terajs is strongest where these pieces reinforce each other:

- **Compiler-native rendering:** templates compile to IR and bind directly to DOM updates. No VDOM diff loop.
- **Route-first application model:** `.tera` pages, layout chains, route metadata, and middleware are assembled through the Vite pipeline instead of scattered through app glue.
- **Local-first runtime primitives:** actions, resources, invalidation, mutation queues, retry policy, and conflict handling live in the runtime rather than in ad hoc app utilities.
- **Transport choice without forking your app model:** first-party SignalR, Socket.IO, and WebSockets adapters all plug into the same server-function transport contract.
- **Integrated diagnostics:** DevTools can inspect components, router activity, queue health, performance, and structured AI/debug context, with an optional live bridge into the companion VS Code tooling.
- **Framework-agnostic core:** neutral packages stay neutral, while React and Vue wrappers exist as integration seams rather than as design centers.

## Start with `@terajs/app`

For most apps, the default entrypoint is the app-facing facade package.

```bash
npm install @terajs/app vite
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import terajsPlugin from "@terajs/app/vite";

export default defineConfig({
  plugins: [terajsPlugin()]
});
```

```js
// terajs.config.cjs
module.exports = {
  autoImportDirs: ["src/components"],
  routeDirs: ["src/pages"],
  router: {
    rootTarget: "app",
    middlewareDir: "src/middleware",
    applyMeta: true,
    keepPreviousDuringLoading: true
  }
};
```

```tera
<template>
  <section>
    <h1>{{ title() }}</h1>
    <p>{{ summary() }}</p>
  </section>
</template>

<script>
import { signal } from "@terajs/app";

const title = signal("Hello Terajs");
const summary = signal("Route-first apps with compiler-native rendering.");
</script>

<meta>
  title: Hello Terajs
  description: First page for a Terajs app.
</meta>

<ai>
  summary: Home page for the Terajs launch example
  audience: developers
  keywords: terajs, docs, local-first, devtools
</ai>

<route>
  path: /
</route>
```

If `index.html` contains `#app` and no module entry script, the plugin can auto-bootstrap the app through `virtual:terajs-app`. The same build surface also exposes `virtual:terajs-auto-imports` and `virtual:terajs-routes` for route-aware application assembly.

## Full shipped release surface

### 1. App entry and build integration

The release starts with three app-facing paths:

- `@terajs/app`: the main web-first facade
- `@terajs/app/vite`: the default Vite integration
- `@terajs/app/devtools`: the app-facing DevTools and bridge path

The build layer currently ships:

- `.tera` compilation
- route, layout, and middleware discovery
- component auto-import directory support
- virtual modules for auto imports, routes, and app bootstrap
- auto-bootstrap when an app uses `#app` without a separate module entry script
- direct route-manifest helpers through `@terajs/router-manifest` when you need that layer explicitly

### 2. Component authoring and route files

Terajs supports both authored component styles that exist in the repo today:

- `.tera` single-file components for route-facing work
- TSX/JSX components for explicit programmatic composition

The shipped `.tera` block model includes:

- `<template>`
- `<script>`
- `<style>`
- `<meta>`
- `<ai>`
- `<route>`

Those blocks are real runtime and tooling inputs, not documentation-only ideas. `meta`, `ai`, and `route` are preserved through parsing, route-manifest generation, metadata resolution, SSR, and DevTools inspection.

### 3. Reactivity and runtime contracts

The app-facing surface includes fine-grained reactivity and runtime primitives for real application work:

- `signal(...)`, `state(...)`, `computed(...)`, `effect(...)`, `watch(...)`, and related helpers
- `component(...)` for Terajs-native components
- lifecycle hooks such as `onMounted(...)`, `onUpdated(...)`, `onUnmounted(...)`, and `onCleanup(...)`
- context and dependency injection through `provide(...)` and `inject(...)`
- async data and mutation primitives through `createResource(...)`, `createAction(...)`, and invalidation helpers
- durable mutation queues and retry/conflict handling through `createMutationQueue(...)`, queue storage, and `MutationConflictResolver`
- validation through `createSchemaValidator(...)`
- server-function transport contracts and helpers for app-owned server boundaries

### 4. Routing, metadata, and browser primitives

The route layer is part of the runtime story, not bolted on beside it.

- file-based routes and ordered layout chains
- middleware discovery through the configured middleware directory
- metadata resolution that merges `meta`, `ai`, and route carrier data from layouts, route definitions, and page modules
- browser-aware route helpers such as `createBrowserHistory(...)`, `createRouteView(...)`, `Link(...)`, `RoutePending(...)`, and pending-state hooks
- forms and submit helpers through `Form(...)`, `SubmitButton(...)`, `FormStatus(...)`, and `formDataToObject(...)`
- error boundaries and browser-native custom elements through `withErrorBoundary(...)` and `defineCustomElement(...)`

### 5. SSR, hydration, and server functions

The shipped web-first surface includes both client and server paths:

- `@terajs/renderer-ssr` for string and stream rendering
- route execution helpers for SSR route modules
- hydration helpers in runtime plus `hydrateRoot(...)` in the web renderer
- server-function helpers such as `server(...)`, `executeServerFunction(...)`, request handlers, and fetch-based or custom transports

SSR results carry route state, metadata, optional AI context, and serialized resource data so client hydration and diagnostics can reuse structured state instead of reconstructing it from DOM guesses.

### 6. Local-first runtime and realtime transport

Local-first behavior is a shipped framework concern in Terajs, not an app-specific add-on.

- actions, resources, invalidation, and durable mutation queues are part of the runtime
- retries, queue lifecycle, and conflict-resolution decisions are structured rather than ad hoc
- queued mutation lifecycle and hub transport events feed directly into DevTools diagnostics

The current first-party realtime adapters are:

- `@terajs/hub-signalr`
- `@terajs/hub-socketio`
- `@terajs/hub-websockets`

All three plug into the same runtime `ServerFunctionTransport` contract. The internal CLI (`@terajs/cli`, currently private) can scaffold hub-ready apps with `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`.

Example realtime config:

```js
module.exports = {
  sync: {
    hub: {
      type: "socket.io",
      url: "https://api.example.com/live",
      autoConnect: true,
      retryPolicy: "exponential"
    }
  }
};
```

### 7. DevTools and the VS Code bridge

Terajs DevTools is part of the shipped app story, not an afterthought.

The overlay can inspect:

- mounted components and drill-down state
- signals and effect activity
- issues and logs
- router transitions and load timing
- queue lifecycle metrics
- performance summaries
- AI diagnostics context assembled from structured runtime data
- live bridge sessions for the companion VS Code tooling

In development, you can also attach DevTools to the companion VS Code extension through a same-origin bridge.

```ts
import {
  autoAttachVsCodeDevtoolsBridge,
  mountDevtoolsOverlay
} from "@terajs/app/devtools";

mountDevtoolsOverlay();
autoAttachVsCodeDevtoolsBridge();
```

That bridge is development-only. Production builds do not expose the bridge manifest route or auto-attach helper.

### 8. Interop and lower-level public packages

Terajs exposes a wider public package graph than the three app-facing entrypoints.

- `@terajs/adapter-react`: mount Terajs components inside React trees and bridge Terajs resources into React hooks
- `@terajs/adapter-vue`: mount Terajs components inside Vue applications and bridge resources into Vue composables and directives
- `@terajs/adapter-ai`: define structured AI action schemas and capture sanitized reactive state snapshots for tooling or assistants
- `@terajs/renderer`: platform-agnostic renderer interfaces, AST contracts, mount/hydration interfaces, and renderer errors
- `@terajs/router-manifest`: infer file paths, build routes from parsed SFCs, and assemble route manifests directly
- `@terajs/compiler`: template parsing, AST, IR, and style compilation primitives
- `@terajs/sfc`: `.tera` parser and compiler helpers
- `@terajs/shared`: shared metadata, debug-event, and dependency-graph contracts
- `@terajs/devtools`: the same DevTools surface exposed through `@terajs/app/devtools`
- `@terajs/vite-plugin`: the same Vite integration exposed through `@terajs/app/vite`
- `@terajs/ui`: a public but intentionally minimal shared-UI seam reserved for future stable framework UI primitives

### 9. Directional work already in the repo

Some Terajs work is present in-repo today but is not part of the shipped web-first launch center:

- `packages/renderer-ios`: experimental stub work for SwiftUI-backed native rendering
- `packages/renderer-android`: experimental stub work for Compose-backed native rendering
- `ROADMAP_NATIVE_RENDERERS.md`, `RENDERER_ARCHITECHTURE.md`, and `terajs_kit.md`: directional docs for where the framework can expand after the web-first release surface

Those areas are important, but this README keeps them clearly separated from the current release surface.

## Framework-agnostic core, not compatibility theater

Terajs is framework-agnostic at the architecture level, not just in slogans.

- Core packages such as `shared`, `reactivity`, `runtime`, `compiler`, `router`, and `sfc` stay neutral.
- Environment-specific behavior lives in adapters and renderers such as `renderer-web`, `renderer-ssr`, and the Vite plugin.
- React and Vue wrappers exist to let Terajs participate in mixed stacks without making React or Vue the center of the core design.

That is why the project can ship wrappers like `@terajs/adapter-react` and `@terajs/adapter-vue` while still keeping the main runtime model Terajs-native.

## Package map

The current repo is easiest to understand in four groups.

### App-facing and launch-centered

- `@terajs/app`
- `@terajs/app/vite`
- `@terajs/app/devtools`
- `@terajs/reactivity`
- `@terajs/runtime`
- `@terajs/router`
- `@terajs/renderer-web`
- `@terajs/renderer-ssr`

### Lower-level public packages

- `@terajs/renderer`
- `@terajs/router-manifest`
- `@terajs/compiler`
- `@terajs/sfc`
- `@terajs/shared`
- `@terajs/devtools`
- `@terajs/vite-plugin`
- `@terajs/adapter-ai`
- `@terajs/adapter-react`
- `@terajs/adapter-vue`
- `@terajs/hub-signalr`
- `@terajs/hub-socketio`
- `@terajs/hub-websockets`
- `@terajs/ui`

### Internal tooling

- `@terajs/cli` is currently private and used for Terajs development and external smoke validation.

### Directional repo work

- `packages/renderer-ios`
- `packages/renderer-android`

## Documentation map

- Release-critical root docs:
- `README.md`: full launch overview, feature map, and package map
- `API_REFERENCE.md`: canonical shipped API surface and public package reference
- `COMPONENTS.md`: component model, SFC blocks, TSX/JSX, metadata, AI, route carriers, and interop seams
- `Core_Philosophy.md`: architecture principles and package-boundary rationale
- `CHANGELOG.md`: shipped release changes and status notes
- `RELEASE_CANDIDATE_CHECKLIST.md`: release gating and hardening status

- Deep dives and conventions:
- `STYLE_GUIDE.md`: authoring conventions for components, styling, and project structure

- Directional and planning docs:
- `VISION.md`: long-range product vision
- `ROADMAP.md`: broader roadmap and future-facing initiatives
- `ROADMAP_NATIVE_RENDERERS.md`: native renderer direction
- `RENDERER_ARCHITECHTURE.md`: renderer-contract and renderer-design notes
- `terajs_kit.md`: Kit-level direction and ideas

- Brand and legal:
- `BRAND_GUIDELINES.md`: naming, voice, and visual direction
- `BRAND_TOKENS.md`: design tokens used by current Terajs surfaces
- `TRADEMARKS.md`: trademark rules
- `LICENSE.md`: license terms

- Package READMEs under `packages/*`: leaf-package guidance for direct package consumers

## Direction without confusion

Terajs keeps both launch realism and long-term ambition visible.

- The shipped web-first surface is documented in `README.md` and `API_REFERENCE.md`.
- Directional work remains visible in `VISION.md`, `ROADMAP.md`, and the renderer roadmap documents.

That split is intentional: the release docs should be complete and concrete, while the vision and roadmap docs should keep sight of what Terajs is building toward.

---
