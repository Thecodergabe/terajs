# **Terajs**

Terajs is a next-generation UI framework built on **fine-grained reactivity**, a **compiler-powered template system**, and a **developer-first philosophy**.
It feels familiar, performs like Solid, reads like Vue, stays flexible like React - without their complexity.

Terajs is:

- **TypeScript-first, but TypeScript-optional**
- **style-agnostic**
- **platform-agnostic**
- **DX-driven**
- **debuggable by design**
- **AI-ready and meta-aware**

Terajs's goal is simple:

> **Provide structure without restricting creativity.**

---

# Features

## **Fine-grained reactivity**
Terajs uses explicit, dependency-tracked signals:

- `signal()` for reactive values
- `computed()` for derived values
- `effect()` for side effects
- deterministic updates
- no VDOM
- no diffing
- no component re-renders

Signals update the DOM directly.

---

## **Single-File Components (SFC)**

Terajs components use a clean, declarative format:

```
<template>
<script>
<style>
<meta>
<ai>      <- planned feature
<route>
```

Everything a component needs lives in one place.

---

## **Auto-imports & DevTools**

- All `.nbl` files in `src/components` (or configured dirs) are globally available in SFCs - no manual imports needed.
- DevTools overlay: live inspection of components, signals, effects, logs, and issues.

### Example: Using auto-imported components

Suppose you have:

```
src/components/FancyButton.nbl
```

You can use `<FancyButton />` in any SFC without importing it.

### Enabling DevTools overlay

In your app entry point:

```js
import { mountDevtoolsOverlay } from '@terajs/devtools';
mountDevtoolsOverlay();
```

### Customizing auto-imports

Add a `terajs.config.js` to your project root:

```js
module.exports = {
  autoImportDirs: [
    'src/components',
    'packages/devtools/src/components',
  ]
};
```

---

## **Compiler-powered templates**

Terajs includes a full template pipeline:

- tokenizer
- parser
- AST transforms
- IR generation
- optimized codegen
- SSR-aware output
- hydration hints

Templates compile into direct DOM operations bound to signals.

---

## **Component-driven routing & metadata**

Terajs components can define:

- route configuration
- SEO metadata
- **AI metadata (planned)**
- layouts
- nested routes

Routing is flexible, not prescriptive.

---

## **SSR without pain**

Terajs's SSR model:

- components run once
- effects do not run on the server
- deterministic hydration
- no hydration mismatch traps
- hydration logs for debugging

Streaming SSR is planned.

For applications that need server-owned logic, Terajs can also expose an optional app server boundary for route loaders and server functions.

That boundary is meant for:

- database access
- auth and session checks
- cookie-aware personalization
- trusted mutations
- secret-bearing backend calls

It is not meant to replace direct API clients or formal service contracts. If your app already talks to a versioned backend through OpenAPI, Kiota, REST, or GraphQL, that remains a valid client boundary.

Terajs's role is the app-layer boundary between the UI and server-owned logic, not a replacement for external API design.

---

## **Style-agnostic**

Terajs does not enforce or prefer any styling approach.

Use:

- Tailwind
- UnoCSS
- CSS Modules
- SCSS
- Styled Components
- Vanilla CSS
- Inline styles
- Design systems

Scoped styles are optional and require no build step.

---

## **Platform-agnostic**

Terajs Core is renderer-agnostic.

Planned renderers:

- **packages/renderer-web** - DOM
- **packages/renderer-ios** and **packages/renderer-android** - native renderers
- **packages/renderer-canvas** - Canvas/WebGL/Skia
- **packages/renderer-ssr** - server output
- **packages/renderer-terminal** - terminal UIs

Write once, render anywhere.

---

## **DX above everything**

Terajs is built for humans:

- predictable reactivity
- simple mental model
- readable stack traces
- clear error messages
- fast HMR
- template -> IR -> DOM mapping
- devtools hooks (planned)

Debugging is a first-class feature.

---

# Example Component

```nbl
<template>
  <button class="root" @click="increment">
    Count: {{ count }}
  </button>
</template>

<script>
  export let initial = 0

  const count = signal(initial)

  function increment() {
    count.set(count() + 1)
  }
</script>

<style scoped>
  .root {
    padding: 8px;
  }
</style>

<meta>
{
  "title": "Counter",
  "description": "A simple counter component",
  "keywords": ["counter", "example", "terajs"],
  "og:title": "Terajs Counter Example",
  "og:description": "A minimal counter component built with Terajs"
}
</meta>

<ai>
{
  "summary": "A simple interactive counter component that demonstrates Terajs's fine-grained reactivity.",
  "intent": "Demonstrate reactive UI updates",
  "entities": ["counter", "button", "signal"],
  "audience": "developers learning Terajs"
}
</ai>

<route>
{
  "path": "/counter",
  "layout": "default"
}
</route>
```

> **Note:**
> The `<ai>` block is a **planned feature**.
> It is not yet implemented in the SFC parser, compiler, or runtime.

---

# Monorepo Structure

```
packages/
  compiler/        -> template compiler (AST -> IR -> codegen)
  reactivity/      -> fine-grained reactive system
  renderer/        -> platform-agnostic renderer core
  renderer-web/    -> DOM renderer + JSX runtime
  renderer-ssr/    -> server renderer
  runtime/         -> hydration, scheduling, lifecycle
  router/          -> component-driven routing
  sfc/             -> .nbl single-file component parser
  shared/          -> shared utilities
  ui/              -> optional UI primitives
```

Terajs Core stays minimal.
Terajs Kit (future) provides structure when needed.

---

# Roadmap (Short Version)

- [x] Fine-grained reactivity
- [x] JSX runtime
- [x] IR renderer
- [x] SSR renderer
- [x] Hydration
- [x] Routing
- [x] Metadata system
- [x] Template compiler
- [ ] **AI metadata block (`<ai>`)**
- [ ] Streaming SSR
- [ ] Virtualized lists
- [ ] Portal primitives
- [ ] Devtools
- [ ] Terajs Kit (meta-framework)
- [ ] Native renderer
- [ ] Canvas renderer

Full roadmap is in `ROADMAP.md`.

---

# Philosophy Summary

Terajs aims to be:

- simple
- fast
- predictable
- flexible
- platform-agnostic
- scalable from small apps to enterprise systems
- TypeScript-first, but JS-friendly
- debuggable by design

Terajs gives developers **power, not rules**.

---
