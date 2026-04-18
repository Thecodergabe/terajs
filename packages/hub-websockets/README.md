# @terajs/hub-websockets

WebSocket transport adapter for Terajs sync hub workflows.

This package implements the runtime `ServerFunctionTransport` contract and adds first-party raw WebSocket connection, request/response, invalidation, and diagnostics support.

## Install

```bash
npm install @terajs/hub-websockets
```

## Usage

```ts
import { createWebSocketHubTransport } from "@terajs/hub-websockets";
import { invalidateResources, setServerFunctionTransport } from "@terajs/runtime";

const hub = await createWebSocketHubTransport({
	url: "wss://api.example.com/live",
	autoConnect: true,
	retryPolicy: "exponential"
});

hub.subscribe((message) => {
	if (message.type === "invalidate") {
		void invalidateResources(message.keys);
	}
});

setServerFunctionTransport(hub);
```

## Transport shape

The created transport exposes:

- `connect()`
- `disconnect()`
- `isConnected()`
- `subscribe(listener)`
- runtime `invoke(call)` support through the shared server-function transport contract

## Notes

- In browser environments, the adapter can use the global `WebSocket` implementation.
- In non-browser environments, provide `createWebSocket` when the global constructor is unavailable.
- The adapter emits structured `hub:*` debug events for DevTools visibility.