```md
# Nebula API Reference

This document describes the full public API of **Nebula Core** — the reactivity system, component model, lifecycle utilities, and DOM‑agnostic primitives that power Nebula’s rendering engine and Nebula Kit.

Nebula’s API is intentionally small, predictable, and stable.

---

# 1. Reactivity API

Nebula uses fine‑grained, explicit dependency tracking. Signals are the foundation of all reactive behavior.

---

## 1.1 `state(initialValue)`

Creates a reactive signal.

```ts
const count = state(0);
count.get();     // 0
count.set(1);    // triggers updates
```

### Returns:
- `{ get(): T; set(value: T): void }`

### Notes:
- Signals are shallow  
- Use nested signals for nested state  
- SSR‑safe  

---

## 1.2 `computed(fn)`

Creates a derived reactive value.

```ts
const double = computed(() => count.get() * 2);
double.get(); // auto‑tracks dependencies
```

### Features:
- memoized  
- lazy  
- recalculates only when dependencies change  

---

## 1.3 `effect(fn)`

Runs a function whenever its dependencies change.

```ts
effect(() => {
  console.log(count.get());
});
```

### Notes:
- runs once on mount  
- tracks dependencies automatically  
- does **not** run on the server  

---

## 1.4 `onCleanup(fn)`

Registers cleanup logic for an effect.

```ts
effect(() => {
  const id = setInterval(...);
  onCleanup(() => clearInterval(id));
});
```

---

# 2. Component API

Nebula components are simple functions that return a template function.

---

## 2.1 Component Signature

```ts
export function Component(props) {
  // logic
  return () => (
    <div>...</div>
  );
}
```

### Rules:
- component runs once  
- template runs reactively  
- props are immutable  
- SSR‑safe  

---

## 2.2 `lazy(importFn)`

Loads a component asynchronously.

```ts
const User = lazy(() => import("./User"));
```

### Features:
- SSR‑friendly  
- no Suspense boundaries  
- hydrates normally  

---

## 2.3 `isServer()`

Returns `true` during SSR.

```ts
if (isServer()) {
  // skip client-only logic
}
```

---

# 3. Lifecycle API

Nebula provides minimal lifecycle utilities.

---

## 3.1 `onMount(fn)`

Runs when the component is mounted.

```ts
onMount(() => {
  console.log("mounted");
});
```

---

## 3.2 `onUnmount(fn)`

Runs when the component is removed.

```ts
onUnmount(() => {
  console.log("unmounted");
});
```

---

# 4. Context API

Nebula supports dependency injection via context.

---

## 4.1 `createContext(defaultValue?)`

Creates a context object.

```ts
const ThemeContext = createContext("light");
```

---

## 4.2 `useContext(Context)`

Reads a context value.

```ts
const theme = useContext(ThemeContext);
```

---

## 4.3 `<Context.Provider value={...}>`

Provides a context value to children.

```tsx
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>
```

---

# 5. Portal API

Nebula supports teleporting content outside the normal hierarchy.

---

## 5.1 `<Portal to="target">`

```tsx
<Portal to="body">
  <Modal />
</Portal>
```

### Behavior:
- DOM → mounts into a DOM node  
- Native → mounts into overlay layer  
- Canvas → draws in higher z‑index layer  
- Server → renders inline  

---

# 6. Slot API

Nebula supports default, named, and scoped slots.

---

## 6.1 Default Slot

```tsx
export function Card(props) {
  return () => <div>{props.children?.()}</div>;
}
```

---

## 6.2 Named Slots

```tsx
<Modal
  header={() => <h1>Title</h1>}
  footer={() => <button>Close</button>}
>
  Body content
</Modal>
```

---

## 6.3 Scoped Slots

```tsx
<List items={users} item={user => <UserCard user={user} />} />
```

---

# 7. Renderer API (Low‑Level)

Renderers implement the following interface:

```ts
interface Renderer {
  createElement(type: string): Node;
  createText(value: string): Node;
  createFragment(): Node;
  insert(parent: Node, child: Node, anchor?: Node): void;
  remove(node: Node): void;
  setText(node: Node, value: string): void;
  setProp(node: Node, name: string, value: any): void;
  addEvent(node: Node, name: string, handler: Function): void;
  removeEvent(node: Node, name: string): void;
}
```

Nebula Core is renderer‑agnostic.

---

# 8. SSR API

Nebula supports deterministic SSR.

---

## 8.1 `renderToString(component)`

Renders a component to an HTML string.

---

## 8.2 `renderToStream(component)`

Streams HTML chunks.

---

## 8.3 Hydration Markers

Nebula automatically inserts hydration markers for:

- signals  
- components  
- portals  
- async boundaries  

---

# 9. Utility API

Nebula includes small utilities.

---

## 9.1 `mergeProps(a, b)`

Merges props objects.

---

## 9.2 `classList(obj)`

Converts an object to a class string.

```ts
classList({ active: isActive.get(), disabled: isDisabled.get() });
```

---

## 9.3 `styleMap(obj)`

Converts an object to inline styles.

---

# 10. Philosophy Summary

Nebula’s API is:

- small  
- predictable  
- stable  
- platform‑agnostic  
- SSR‑safe  
- fine‑grained  
- easy to learn  

Nebula Core stays minimal.  
Nebula Kit adds structure.  
Renderers handle output.

```