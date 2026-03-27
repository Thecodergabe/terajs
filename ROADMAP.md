# 🚀 Nebula Roadmap

Nebula is a fine‑grained, JSX‑based UI framework designed for clarity, performance, and flexibility. This roadmap outlines the core features, architectural goals, and future directions of the framework.

Nebula’s philosophy:
> Provide structure without restricting creativity.  
> Stay fast, predictable, and platform‑agnostic.

---

## 1. Fine‑Grained Reactivity

Nebula uses explicit, dependency‑tracked signals:

- `state()` for reactive values  
- `computed()` for derived values  
- `effect()` for side effects  
- automatic dependency tracking  
- no VDOM  
- direct DOM/native updates  

Reactivity is predictable, fast, and SSR‑safe.

---

## 2. Component Model

Nebula components are simple functions:

- props → logic → template → styles  
- JSX templates  
- no custom file formats  
- no compiler  
- no magic  

Components run once; templates update reactively.

---

## 3. Props System

- TypeScript‑first  
- fully inferred  
- immutable  
- simple, predictable API  

---

## 4. Styles

Nebula supports:

- optional scoped styles  
- global CSS  
- CSS modules  
- Tailwind / utility frameworks  
- design systems  

Scoped styles require no compiler.

---

## 5. Async Components

- `lazy(() => import(...))`  
- SSR‑friendly  
- no Suspense boundaries  
- no waterfalls  
- predictable hydration  

---

## 6. SSR & Hydration

Nebula’s SSR model:

- components run once  
- effects do not run on the server  
- deterministic hydration  
- no VDOM diffing  
- no hydration mismatch traps  

Streaming SSR is planned.

---

## 7. Routing System

Nebula will include an official router:

- file‑based routing (optional)  
- manual routing API  
- nested routes & layouts  
- SSR‑aware route loaders  
- async route components  
- simple guards & redirects  

---

## 8. State Management

Nebula will expand reactivity into global state:

- `createStore()` for structured global state  
- `createContext()` / `useContext()`  
- derived stores  
- async resources  
- SSR‑safe hydration  
- devtools support  

---

## 9. UI Library & Framework Compatibility

Nebula works with any DOM‑based UI library:

- Tailwind, Bootstrap, UnoCSS  
- Material Web Components, Radix, ShadCN  
- CSS Modules, SCSS, Styled Components  
- Web Components  

Nebula does not enforce a design system.

---

## 10. Tooling & Build Integration

Nebula will support:

- Vite (first‑class)  
- ESBuild / Rollup  
- optional JSX transforms  
- optional scoped‑style transforms  
- fast HMR with preserved state  
- TypeScript‑first DX  

---

## 11. Multi‑Platform Rendering (Web, Native, Canvas)

Nebula Core is renderer‑agnostic. Planned renderers:

- **nebula-dom** — HTML  
- **nebula-native** — iOS/Android native views  
- **nebula-canvas** — Canvas/WebGL/Skia  
- **nebula-server** — SSR output  
- **nebula-terminal** — terminal UIs (future)  

Components remain the same; only the renderer changes.

---

## 12. Slots & Composition

Nebula supports:

- default slots  
- named slots  
- scoped slots  
- slot functions  
- optional `<Slot>` helper  

Slots are fully reactive and SSR‑safe.

---

## 13. Portals (Teleporting Content)

Nebula will include a `<Portal>` primitive:

- render content outside normal hierarchy  
- modals, popovers, tooltips, dropdowns  
- works across web, native, canvas  
- hydration‑safe  
- fine‑grained updates  

---

## 14. Virtualized Lists & Infinite Feeds

Nebula will include high‑performance list primitives:

- `<VirtualList />`  
- `<InfiniteFeed />`  
- windowing & overscan  
- recycled DOM/native nodes  
- variable item heights  
- infinite scrolling  
- cross‑platform support  

Designed for ecommerce, dashboards, and doom‑scroll feeds.

---

## 15. Data Loading & Server Functions

Nebula Kit will include:

- route‑level loaders  
- `createResource()` for async data  
- caching & refetching  
- error/loading states  
- server‑only functions  
- streaming data support  
- hydration with serialized data  

---

## 16. Nebula Kit (Application Framework Layer)

Nebula Kit is the batteries‑included meta‑framework:

- file‑based routing  
- data loaders  
- streaming SSR  
- partial hydration  
- virtualization components  
- portal & slot primitives  
- built‑in UI patterns (modal, popover, toast)  
- integration patterns for ecommerce, CMS, APIs  

Nebula Core = rendering engine.  
Nebula Kit = full application framework.

---

## 17. Philosophy Summary

Nebula aims to be:

- simple  
- fast  
- predictable  
- flexible  
- platform‑agnostic  
- scalable from small apps to enterprise systems  

Nebula Core stays minimal.  
Nebula Kit provides structure when needed.

