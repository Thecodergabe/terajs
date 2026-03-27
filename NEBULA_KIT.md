```md
# Nebula Kit

Nebula Kit is the official application framework built on top of Nebula Core. While Nebula Core provides the rendering engine, reactivity system, and component model, Nebula Kit provides the structure needed to build full applications.

Nebula Kit is comparable to frameworks like Nuxt, Next, SvelteKit, and SolidStart — but built on Nebula’s simpler, faster, fine‑grained foundation.

Nebula Kit is optional. Nebula Core remains fully usable on its own.

---

## 1. Philosophy

Nebula Kit follows four principles:

### **1. Convention over configuration**
Developers get a predictable project structure without losing flexibility.

### **2. Server + client harmony**
Data loading, SSR, and hydration work together seamlessly.

### **3. Performance by default**
Streaming SSR, partial hydration, and virtualization are built‑in.

### **4. Platform‑agnostic**
Nebula Kit works with any Nebula renderer (DOM, native, canvas).

---

## 2. Features Overview

Nebula Kit includes:

- file‑based routing  
- nested layouts  
- route loaders (server data)  
- streaming SSR  
- partial hydration  
- server functions  
- async components  
- virtualization primitives  
- portal & slot primitives  
- built‑in UI patterns (modal, popover, toast)  
- integration patterns for ecommerce, CMS, APIs  

Nebula Kit is designed for apps of any scale — from small sites to enterprise dashboards.

---

## 3. File‑Based Routing

Nebula Kit supports a simple, predictable routing structure:

```
src/routes/
  index.tsx
  about.tsx
  products/
    [id].tsx
    index.tsx
  dashboard/
    layout.tsx
    index.tsx
```

### Dynamic routes

```
products/[id].tsx
```

### Nested layouts

```
dashboard/layout.tsx
dashboard/index.tsx
```

Layouts wrap child routes automatically.

---

## 4. Route Loaders (Server Data)

Each route can export a `load()` function:

```ts
export async function load({ params, query, cookies }) {
  return fetchProduct(params.id);
}
```

Loaders:

- run on the server  
- can be async  
- return serializable data  
- hydrate on the client  
- support streaming  

This enables SSR‑friendly data fetching without waterfalls.

---

## 5. Server Functions

Nebula Kit supports server‑only functions:

```ts
export const getUser = server(async () => {
  return db.user.find();
});
```

Server functions:

- never run on the client  
- can access secrets  
- automatically serialize results  
- integrate with loaders and actions  

---

## 6. Streaming SSR

Nebula Kit supports streaming HTML to the client:

- send above‑the‑fold content immediately  
- stream async sections as they resolve  
- hydrate progressively  
- reduce TTFB and LCP  

Streaming works with:

- async components  
- route loaders  
- nested layouts  
- portals  

---

## 7. Partial Hydration

Nebula Kit hydrates only what’s interactive:

- static sections stay static  
- interactive components hydrate lazily  
- hydration can be deferred by:
  - visibility  
  - idle time  
  - user interaction  

This keeps large pages fast.

---

## 8. Virtualized Lists & Infinite Feeds

Nebula Kit includes high‑performance list primitives:

### `<VirtualList />`
Renders only visible items.

### `<InfiniteFeed />`
Loads more items as the user scrolls.

### `useVirtualList()`
Low‑level hook for custom virtualization.

### Features:
- windowing  
- overscan  
- recycled DOM/native nodes  
- variable item heights  
- cross‑platform support  

Perfect for ecommerce grids, dashboards, and doom‑scroll feeds.

---

## 9. Portals & Overlays

Nebula Kit includes a `<Portal>` primitive for:

- modals  
- popovers  
- tooltips  
- dropdowns  
- global overlays  

Portals work across:

- web (DOM)  
- native (overlay layers)  
- canvas (z‑index layers)  
- SSR (inline rendering)  

---

## 10. Built‑In UI Patterns

Nebula Kit ships with optional UI primitives:

- `<Modal />`  
- `<Popover />`  
- `<Tooltip />`  
- `<Dropdown />`  
- `<ToastProvider />`  
- `<Overlay />`  

These are unstyled and framework‑agnostic.

---

## 11. Data Resources

Nebula Kit includes `createResource()` for async state:

```ts
const user = createResource(() => fetchUser());
```

Features:

- caching  
- refetching  
- loading/error states  
- SSR hydration  
- suspense‑free async flows  

---

## 12. Integration Patterns

Nebula Kit provides examples and adapters for:

- ecommerce (Shopify, Medusa, Commerce.js)  
- CMS (Sanity, Contentful, Strapi)  
- APIs (REST, GraphQL, tRPC)  
- authentication providers  
- design systems  

Nebula Kit does not enforce a backend.

---

## 13. Multi‑Platform Support

Nebula Kit works with any Nebula renderer:

- **nebula-dom** (web)  
- **nebula-native** (iOS/Android)  
- **nebula-canvas** (Skia/WebGL)  
- **nebula-server** (SSR)  

Routing, loaders, and hydration adapt to the renderer.

---

## 14. Philosophy Summary

Nebula Kit is:

- structured  
- scalable  
- SSR‑first  
- performance‑focused  
- cross‑platform  
- flexible  
- batteries‑included  

Nebula Core = rendering engine.  
Nebula Kit = full application framework.

```