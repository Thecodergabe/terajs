# @terajs/hub-socketio

Socket.IO transport adapter for Terajs sync hub workflows.

This package implements the runtime `ServerFunctionTransport` contract and adds first-party Socket.IO connection, invalidation, and diagnostics support.

## Install

```bash
npm install @terajs/hub-socketio socket.io-client
```

## Usage

```ts
import { createSocketIoHubTransport } from "@terajs/hub-socketio";
import { invalidateResources, setServerFunctionTransport } from "@terajs/runtime";

const hub = await createSocketIoHubTransport({
	url: "https://api.example.com/live",
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

## Diagnostics

The adapter emits structured `hub:*` debug events for DevTools visibility.