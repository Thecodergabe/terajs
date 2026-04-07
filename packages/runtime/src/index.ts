/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/runtime package.
 * Coordinates component lifecycle and dependency injection.
 */

// Component Core
export { component, onCleanup } from "./component/component";
export { ComponentContext, getCurrentContext, setCurrentContext, createComponentContext } from "./component/context";
export type { Disposer } from "./component/context";

// Lifecycle Hooks
export { onMounted, onUpdated, onUnmounted } from "./component/lifecycle";

// Context / Dependency Injection (The "Nerve System")
export { provide } from "./context/provide";
export { inject } from "./context/inject";
export { 
  contextStack, 
  pushContextFrame, 
  popContextFrame 
} from "./context/contextStack";
export type { ContextFrame, ContextKey } from "./context/contextStack";

// Hydration (For SSR/Edge support)
export {
  consumeHydratedResource,
  getHydratedResource,
  scheduleHydration,
  setHydrationState
} from "./hydration";
export type { RuntimeHydrationState } from "./hydration";

// Async data
export { createResource } from "./resource";
export type { Resource, ResourceState } from "./resource";

// Server functions
export {
  executeServerFunction,
  executeServerFunctionCall,
  getServerFunctionTransport,
  hasServerFunction,
  server,
  setServerFunctionTransport
} from "./server";
export type {
  ServerExecutionContext,
  ServerFunction,
  ServerFunctionCall,
  ServerFunctionOptions,
  ServerFunctionTransport
} from "./server";
export {
  createFetchServerFunctionTransport,
  createServerContextFromRequest,
  createServerFunctionRequestHandler,
  handleServerFunctionRequest,
  readServerFunctionCall
} from "./serverTransport";
export type {
  FetchServerFunctionTransportOptions,
  ServerFunctionErrorResponse,
  ServerFunctionRequestHandlerOptions,
  ServerFunctionResponse,
  ServerFunctionSuccessResponse
} from "./serverTransport";
