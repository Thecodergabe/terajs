import { isServer } from "@terajs/reactivity";
import { Debug, type ServerContext } from "@terajs/shared";
import { captureInvalidatedResources, type ResourceKey } from "./invalidation.js";

const serverFunctionHandlerSymbol = Symbol("terajs.serverFunctionHandler");

export interface ServerExecutionContext extends ServerContext {
  functionId: string;
}

/**
 * Serialized call payload sent across the server-function transport boundary.
 */
export interface ServerFunctionCall {
  id: string;
  args: unknown[];
}

/**
 * Client transport used to invoke registered server functions remotely.
 */
export interface ServerFunctionTransport {
  invoke(call: ServerFunctionCall): Promise<unknown>;
}

/**
 * Result returned when a server function execution includes invalidation metadata.
 */
export interface ServerFunctionExecutionResult<TResult = unknown> {
  result: TResult;
  invalidated: ResourceKey[];
}

/**
 * Configuration for the `server()` wrapper.
 */
export interface ServerFunctionOptions {
  id?: string;
}

type ServerFunctionHandler<TArgs extends unknown[], TResult> = (
  ...args: [...TArgs, ServerExecutionContext]
) => Promise<TResult> | TResult;

type ServerFunctionInputHandler = (...args: any[]) => Promise<any> | any;

type StripServerContext<TArgs extends unknown[]> = TArgs extends [...infer Rest, ServerExecutionContext]
  ? Rest
  : TArgs;

export interface ServerFunction<TArgs extends unknown[] = unknown[], TResult = unknown> {
  (...args: TArgs): Promise<TResult>;
  id: string;
  [serverFunctionHandlerSymbol]: ServerFunctionHandler<TArgs, TResult>;
}

let serverFunctionTransport: ServerFunctionTransport | undefined;
let nextServerFunctionId = 0;
const serverFunctionRegistry = new Map<string, ServerFunctionHandler<unknown[], unknown>>();

function resolveServerFunctionId(
  handler: ServerFunctionHandler<unknown[], unknown>,
  explicitId?: string
): string {
  if (explicitId) {
    return explicitId;
  }

  if (handler.name) {
    return handler.name;
  }

  nextServerFunctionId += 1;
  return `server:function:${nextServerFunctionId}`;
}

async function invokeHandler<TArgs extends unknown[], TResult>(
  id: string,
  handler: ServerFunctionHandler<TArgs, TResult>,
  context: ServerContext,
  args: TArgs
): Promise<TResult> {
  Debug.emit("server:function:invoke", {
    id,
    argsCount: args.length,
    transport: false
  });

  try {
    const execution = await captureInvalidatedResources(() => handler(...args, { ...context, functionId: id }));
    return execution.result;
  } catch (error) {
    Debug.emit("server:function:error", {
      id,
      message: error instanceof Error ? error.message : "Server function failed"
    });
    throw error;
  }
}

async function invokeHandlerWithMetadata<TArgs extends unknown[], TResult>(
  id: string,
  handler: ServerFunctionHandler<TArgs, TResult>,
  context: ServerContext,
  args: TArgs
): Promise<ServerFunctionExecutionResult<TResult>> {
  Debug.emit("server:function:invoke", {
    id,
    argsCount: args.length,
    transport: false
  });

  try {
    return await captureInvalidatedResources(() => handler(...args, { ...context, functionId: id }));
  } catch (error) {
    Debug.emit("server:function:error", {
      id,
      message: error instanceof Error ? error.message : "Server function failed"
    });
    throw error;
  }
}

async function invokeTransport<TResult>(id: string, args: unknown[]): Promise<TResult> {
  if (!serverFunctionTransport) {
    throw new Error(
      `Terajs server(): no client transport is configured for server function \"${id}\".`
    );
  }

  Debug.emit("server:function:transport", {
    id,
    argsCount: args.length,
    transport: true
  });

  return serverFunctionTransport.invoke({ id, args }) as Promise<TResult>;
}

/**
 * Sets the client transport used for browser-side server function calls.
 *
 * @param transport - The transport implementation to install, or `undefined` to clear it.
 */
export function setServerFunctionTransport(
  transport?: ServerFunctionTransport
): void {
  serverFunctionTransport = transport;
}

/**
 * Returns the currently configured client transport for server function calls.
 *
 * @returns The active server function transport, if one is configured.
 */
export function getServerFunctionTransport(): ServerFunctionTransport | undefined {
  return serverFunctionTransport;
}

/**
 * Wraps a handler as a Terajs server function.
 *
 * The returned function executes locally on the server and dispatches through
 * the configured transport on the client.
 *
 * @param handler - The server-owned implementation.
 * @param options - Optional registration metadata.
 * @returns A callable server-function wrapper with a stable id.
 */
export function server<THandler extends ServerFunctionInputHandler>(
  handler: THandler,
  options: ServerFunctionOptions = {}
): ServerFunction<StripServerContext<Parameters<THandler>>, Awaited<ReturnType<THandler>>> {
  type TArgs = StripServerContext<Parameters<THandler>>;
  type TResult = Awaited<ReturnType<THandler>>;

  const normalizedHandler = ((...args: [...TArgs, ServerExecutionContext]) => (
    handler as (...handlerArgs: [...TArgs, ServerExecutionContext]) => Promise<TResult> | TResult
  )(...args)) as ServerFunctionHandler<TArgs, TResult>;
  const id = resolveServerFunctionId(
    normalizedHandler as ServerFunctionHandler<unknown[], unknown>,
    options.id
  );

  const wrapped = (async (...args: TArgs): Promise<TResult> => {
    if (isServer()) {
      return invokeHandler(id, normalizedHandler, {}, args);
    }

    return invokeTransport<TResult>(id, args);
  }) as ServerFunction<TArgs, TResult>;

  wrapped.id = id;
  wrapped[serverFunctionHandlerSymbol] = normalizedHandler;
  serverFunctionRegistry.set(id, normalizedHandler as ServerFunctionHandler<unknown[], unknown>);
  return wrapped;
}

export async function executeServerFunctionCall(
  call: ServerFunctionCall,
  context: ServerContext = {}
): Promise<unknown> {
  const handler = serverFunctionRegistry.get(call.id);
  if (!handler) {
    throw new Error(`Unknown server function \"${call.id}\".`);
  }

  return invokeHandler(call.id, handler, context, call.args);
}

/**
 * Executes a serialized server-function call and returns invalidation metadata.
 *
 * @param call - The serialized call payload.
 * @param context - Optional server execution context.
 * @returns The handler result plus any invalidated resource keys.
 */
export async function executeServerFunctionCallWithMetadata(
  call: ServerFunctionCall,
  context: ServerContext = {}
): Promise<ServerFunctionExecutionResult> {
  const handler = serverFunctionRegistry.get(call.id);
  if (!handler) {
    throw new Error(`Unknown server function "${call.id}".`);
  }

  return invokeHandlerWithMetadata(call.id, handler, context, call.args);
}

/**
 * Checks whether a server function id is registered locally.
 *
 * @param id - The server function identifier to look up.
 * @returns `true` when the id exists in the local server-function registry.
 */
export function hasServerFunction(id: string): boolean {
  return serverFunctionRegistry.has(id);
}

/**
 * Executes a typed server function directly against the current environment.
 *
 * On the server this invokes the registered handler immediately. In the browser
 * it dispatches through the configured transport.
 *
 * @param fn - The wrapped server function to execute.
 * @param context - Optional server execution context.
 * @param args - Arguments forwarded to the server function.
 * @returns The resolved server function result.
 */
export async function executeServerFunction<TArgs extends unknown[], TResult>(
  fn: ServerFunction<TArgs, TResult>,
  context: ServerContext = {},
  ...args: TArgs
): Promise<TResult> {
  if (isServer()) {
    return invokeHandler(fn.id, fn[serverFunctionHandlerSymbol], context, args);
  }

  return invokeTransport<TResult>(fn.id, args);
}