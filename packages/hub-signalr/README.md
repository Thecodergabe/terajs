# @terajs/hub-signalr

SignalR transport adapter for Terajs sync hub workflows.

This is a first-party realtime adapter. The `socket.io` and `websockets` packages use the same runtime transport contract and expose the same high-level transport shape.

## Install

```bash
npm install @terajs/hub-signalr @microsoft/signalr
```

## Usage

```ts
import { createSignalRHubTransport } from "@terajs/hub-signalr";
import { invalidateResources, setServerFunctionTransport } from "@terajs/runtime";

const hub = await createSignalRHubTransport({
  url: "https://api.example.com/chat-hub",
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

The created transport implements the runtime `ServerFunctionTransport` contract and also exposes:

- `connect()`
- `disconnect()`
- `isConnected()`
- `subscribe(listener)`

## Diagnostics

The adapter emits structured `hub:*` debug events for DevTools and diagnostics, including connect, disconnect, push, sync-start, sync-complete, and error flows.
