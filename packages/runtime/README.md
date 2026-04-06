# Nebula Runtime

The Nebula runtime coordinates component mounting, context, and the connection between reactivity and the DOM.

---

## Features
- Platform-agnostic: works in browser, SSR, and custom renderers
- Context system for dependency injection
- Lifecycle hooks for mounting, updating, and disposal
- Integrates with Nebula’s fine-grained reactivity

---

## Usage Example

```ts
import { mount } from '@nebula/runtime';
import App from './App.nbl';

mount(App, document.getElementById('app'));
```

---

## Context API

```ts
import { createComponentContext, getCurrentContext, setCurrentContext } from '@nebula/shared';

const ctx = createComponentContext();
setCurrentContext(ctx);
```

---

## DevTools Integration
- All runtime events are streamed to the devtools overlay for live inspection.

---

## API Reference
- `mount(component, el)`
- `createComponentContext()`
- `getCurrentContext()`
- `setCurrentContext(ctx)`

---

See the devtools and shared package docs for more on debugging and inspection.
