# Nebula Shared Package

This package provides all shared types, debug/event systems, and the dependency graph for Nebula’s runtime and devtools.

---

## Features
- Central event bus for all runtime and debug events
- Fine-grained dependency graph for signals, effects, and computed values
- Metadata and registry for all reactive and component instances
- Devtools bridge for safe, read-only graph access

---

## Usage Example

```ts
import { Debug } from '@nebula/shared';

Debug.on(event => {
  console.log('Debug event:', event);
});

Debug.emit('signal:create', { key: 'count' });
```

---

## Dependency Graph

```ts
import { addDependency, getDependencyGraphSnapshot } from '@nebula/shared';

addDependency('A', 'B');
const graph = getDependencyGraphSnapshot();
```

---

## Devtools Bridge

```ts
import { DevtoolsBridge } from '@nebula/shared';

const graph = DevtoolsBridge.getGraph();
```

---

## API Reference
- `Debug.on(handler)`
- `Debug.emit(type, payload)`
- `addDependency(from, to)`
- `getDependencyGraphSnapshot()`
- `DevtoolsBridge.getGraph()`

---

See the devtools and reactivity docs for more on live inspection and debugging.
