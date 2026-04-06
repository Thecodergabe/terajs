import { isServer } from "@terajs/reactivity";
import { Debug, type ServerContext } from "@terajs/shared";

const serverFunctionHandlerSymbol = Symbol("terajs.serverFunctionHandler");

export interface ServerExecutionContext extends ServerContext {
  functionId: string;
}

export interface ServerFunctionCall {
  id: string;
  args: unknown[];
}

export interface ServerFunctionTransport {
  invoke(call: ServerFunctionCall): Promise<unknown>;
}

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
    return await handler(...args, { ...context, functionId: id });
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

export function setServerFunctionTransport(
  transport?: ServerFunctionTransport
): void {
  serverFunctionTransport = transport;
}

export function getServerFunctionTransport(): ServerFunctionTransport | undefined {
  return serverFunctionTransport;
}

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
  return wrapped;
}

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