# Terajs Runtime

The Terajs runtime coordinates component lifecycle, context, async data primitives,
local-first queue contracts, and server-function boundaries.

---

## Features
- Platform-agnostic: works in browser, SSR, and custom renderers
- Context system for dependency injection
- Lifecycle hooks for mount/update/unmount orchestration
- Action/resource primitives with queue-aware execution paths
- Validation and invalidation helpers for route and form workflows
- Server function execution and transport adapters

---

## Install

```bash
npm install @terajs/runtime
```

---

## Usage Example

```ts
import { createAction, createMutationQueue } from '@terajs/runtime';

const queue = await createMutationQueue();

const saveProfile = createAction(async (payload: { name: string }) => {
	return payload.name;
});

await saveProfile.runQueued({ queue, type: 'profile:save' }, { name: 'Ada' });
```

---

## Context API

```ts
import { createComponentContext, getCurrentContext, setCurrentContext } from '@terajs/runtime';

const ctx = createComponentContext();
setCurrentContext(ctx);
```

---

## DevTools Integration
- All runtime events are streamed to the devtools overlay for live inspection.

---

## API Reference
- Components: `component`, `onCleanup`, lifecycle hooks
- Context: `provide`, `inject`, `createComponentContext`
- Async data: `createAction`, `createResource`
- Local-first queue: `createMutationQueue`, `createMutationQueueStorage`
- Validation: `createSchemaValidator`
- Server functions: `server`, `executeServerFunction`, transport helpers

---

See API_REFERENCE.md at repository root for the canonical shipped surface.

