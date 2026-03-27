```md
# 🎨 Nebula Style Guide

This guide outlines recommended patterns for writing clean, maintainable Nebula components. These conventions are optional but strongly encouraged to keep codebases consistent and scalable.

Nebula’s philosophy:
> Provide structure without restricting creativity.

---

## 1. File Naming

Use **PascalCase** for components:

```
Button.tsx
UserProfile.tsx
Counter.tsx
```

Use **camelCase** or **kebab-case** for utilities:

```
useFetch.ts
formatDate.ts
router.ts
```

---

## 2. Recommended Component Structure

Nebula encourages a clear structure inside `.tsx` files:

```tsx
// --- Props ---
export interface Props {}

// --- Logic ---
export function Component(props: Props) {
  // state, computed, effects, handlers

  // --- Template ---
  return () => (
    <div>...</div>
  );
}

// --- Styles (optional) ---
export const styles = `...`;
```

This keeps components predictable and easy to navigate.

---

## 3. Keep Components Small

Aim for:

- one responsibility per component  
- under ~200 lines  
- splitting large components into multiple files  

Example folder structure:

```
UserCard/
  UserCard.tsx
  UserCard.logic.ts
  UserCard.template.tsx
  UserCard.styles.css
```

---

## 4. Use Computed Values for Derived State

Avoid recalculating expensive values inside templates.

❌ Avoid:

```tsx
return () => <div>{expensiveCalculation()}</div>;
```

✔ Prefer:

```ts
const result = computed(expensiveCalculation);

return () => <div>{result.get()}</div>;
```

---

## 5. Keep Templates Pure

Templates should:

- contain no side effects  
- only read reactive values  
- avoid heavy logic  
- avoid creating new objects/functions unnecessarily  

Good:

```tsx
return () => <div>{count.get()}</div>;
```

Bad:

```tsx
return () => <div>{Math.random()}</div>;
```

---

## 6. Use Scoped Styles When Appropriate

Nebula supports optional scoped styles:

```ts
export const styles = `
  .root {
    padding: 8px;
  }
`;
```

Use scoped styles for:

- component‑specific styling  
- reusable UI elements  

Use global CSS or utility frameworks for:

- layout  
- typography  
- spacing  

---

## 7. Prefer Composition Over Inheritance

Break UI into small reusable pieces:

```tsx
<Toolbar>
  <Button label="Save" />
  <Button label="Cancel" />
</Toolbar>
```

Avoid deeply nested component logic.

---

## 8. SSR‑Safe Patterns

Avoid:

- direct DOM access in logic  
- timers in SSR mode  
- effects on the server  

Use `isServer()` when needed:

```ts
if (!isServer()) {
  effect(() => console.log("client only"));
}
```

---

## 9. Organize State Thoughtfully

Use:

- `state()` for local component state  
- `createStore()` for global state  
- `createContext()` for dependency injection  

Avoid:

- global singletons unless intentional  
- passing props deeply through many layers  

---

## 10. Naming Conventions

### Components:
- PascalCase  
- descriptive names  

### Signals:
- `count`, `isOpen`, `user`  

### Computed values:
- `doubleCount`, `formattedDate`  

### Event handlers:
- `handleSubmit`, `handleClick`, `handleChange`  

---

## 11. Event Handlers

Use descriptive names:

```ts
function handleSubmit() {}
function handleClick() {}
function handleChange() {}
```

Avoid inline anonymous handlers when possible.

---

## 12. Async Logic

Use async functions inside logic, not templates:

```ts
async function loadUser() {
  const data = await fetchUser();
  user.set(data);
}
```

Avoid async templates.

---

## 13. Error Handling

Use try/catch inside logic:

```ts
async function load() {
  try {
    data.set(await fetchData());
  } catch (err) {
    error.set(err);
  }
}
```

Avoid throwing errors inside templates.

---

## 14. Reactivity Best Practices

Nebula uses fine‑grained, explicit dependency tracking.

- avoid deep reactive objects  
- use nested signals for nested state  
- keep dependencies explicit  
- avoid unnecessary watchers  
- prefer computed values for derived data  

This keeps reactivity predictable and performant.

---

## 15. Slots & Composition Patterns

Nebula supports:

- default slots  
- named slots  
- scoped slots  

Use slots for:

- layout components  
- cards, modals, popovers  
- lists and data tables  
- reusable UI patterns  

Slots should be pure functions and should not contain side effects.

---

## 16. Portals & Overlays

Use `<Portal>` for:

- modals  
- popovers  
- tooltips  
- dropdowns  
- global overlays  

Portals should contain only UI, not business logic.

---

## 17. Philosophy Summary

Nebula encourages components that are:

- small  
- predictable  
- pure  
- composable  
- SSR‑safe  
- cross‑platform  
- easy to read and maintain  

These guidelines help teams build consistent, scalable Nebula applications without sacrificing flexibility.
```
