# @terajs/runtime

Runtime contracts for Terajs components, lifecycle, context, async data, validation, server functions, and local-first queues.

Most application code reaches these APIs through `@terajs/app`, but this package is the right direct dependency for adapters, renderers, libraries, and lower-level framework work.

## Install

```bash
npm install @terajs/runtime
```

## Core areas

- component helpers: `component`, `onCleanup`
- lifecycle hooks: `onMounted`, `onUpdated`, `onUnmounted`
- context and dependency injection: `createComponentContext`, `provide`, `inject`
- async data: `createAction`, `createResource`
- local-first queues: `createMutationQueue`, `createMutationQueueStorage`, `defaultMutationRetryPolicy`
- invalidation and validation: `invalidateResources`, `registerResourceInvalidation`, `createSchemaValidator`
- server-function transport: `server`, `executeServerFunction`, `setServerFunctionTransport`, `createFetchServerFunctionTransport`
- primitives: `Portal`, `Suspense`

## Queue-aware action example

```ts
import { createAction, createMutationQueue } from "@terajs/runtime";

const queue = await createMutationQueue();

const saveProfile = createAction(async (payload: { name: string }) => {
	return payload.name;
});

await saveProfile.runQueued(
	{
		queue,
		type: "profile:save",
		conflictKey: "current-user"
	},
	{ name: "Ada" }
);
```

## Server-function transport example

```ts
import {
	setServerFunctionTransport,
	type ServerFunctionCall,
	type ServerFunctionTransport
} from "@terajs/runtime";

const transport: ServerFunctionTransport = {
	async invoke(call: ServerFunctionCall) {
		return invokeOverSocket(call);
	}
};

setServerFunctionTransport(transport);
```

If you want first-party adapters instead of a custom transport, use `@terajs/hub-signalr`, `@terajs/hub-socketio`, or `@terajs/hub-websockets`.

## DevTools integration

The runtime is designed to be inspectable. Queue state, route invalidation, server transport activity, and related debug events can feed the DevTools overlay without application-specific glue.

For best realtime diagnostics, adapters should emit structured `hub:*` debug events through the app's debug/event pipeline, such as:

- `hub:connect`
- `hub:disconnect`
- `hub:error`
- `hub:push:received`
- `hub:sync:start`
- `hub:sync:complete`

## Notes

- Browser-specific behavior belongs in renderer packages, not here.
- App-facing docs should generally point new users at `@terajs/app`.
- `API_REFERENCE.md` at the repository root remains the canonical source for the shipped runtime surface.

