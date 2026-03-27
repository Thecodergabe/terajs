# Nebula Vision

Nebula is a next‑generation UI framework built on three core principles:

---

## 1. Fine‑Grained Reactivity

Nebula’s reactivity system is:

- synchronous  
- deterministic  
- dependency‑tracked  
- cleanup‑aware  
- SSR‑safe  

No VDOM. No batching. No re‑rendering entire components.

Signals update the DOM directly.

---

## 2. Developer Experience First

Nebula aims to be:

- intuitive for beginners  
- powerful for experts  
- predictable in behavior  
- minimal in boilerplate  
- flexible in structure  

Nebula provides **conventions**, not constraints.

---

## 3. SSR Without Pain

Nebula’s SSR philosophy:

> **SSR should be easy, predictable, and require no special mental model.**

This means:

- effects do not run on the server  
- components can be async  
- hydration is deterministic  
- no Suspense complexity  
- no hydration mismatch traps  

---

## 4. Components That Feel Familiar, But Work Better

Nebula components use a recommended structure:

- Props  
- Logic  
- Template  
- Styles  

All inside `.tsx`, with full syntax highlighting and no custom file format.

---

## 5. Escape Hatches Everywhere

Nebula is not a prison.

Developers can:

- structure files however they want  
- use or ignore scoped styles  
- write components in multiple styles  
- build custom renderers  
- integrate with any bundler  

Nebula stays out of the way.

---

## 6. Small, Reusable, Composable Pieces

Nebula encourages:

- small components  
- clear boundaries  
- predictable composition  
- easy child‑parent communication  

This keeps codebases maintainable at scale.

---

Nebula’s vision is simple:

> **A framework that feels familiar, performs like Solid, reads like Vue, and stays as flexible as React — without their complexity.**
