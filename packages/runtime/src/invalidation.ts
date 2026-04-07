import { Debug } from "@terajs/shared";

export type ResourceKey = string;

type InvalidationHandler = () => Promise<unknown> | unknown;

const resourceInvalidationHandlers = new Map<ResourceKey, Set<InvalidationHandler>>();
const invalidationCollectorStack: Set<ResourceKey>[] = [];

function normalizeKeys(keys: ResourceKey | ResourceKey[]): ResourceKey[] {
  const input = Array.isArray(keys) ? keys : [keys];
  return [...new Set(input.filter((key): key is ResourceKey => typeof key === "string" && key.length > 0))];
}

function getCurrentCollector(): Set<ResourceKey> | undefined {
  return invalidationCollectorStack[invalidationCollectorStack.length - 1];
}

async function triggerResourceInvalidation(keys: ResourceKey[]): Promise<void> {
  const handlers = new Set<InvalidationHandler>();

  for (const key of keys) {
    const registeredHandlers = resourceInvalidationHandlers.get(key);
    if (!registeredHandlers) {
      continue;
    }

    for (const handler of registeredHandlers) {
      handlers.add(handler);
    }
  }

  Debug.emit("resource:invalidate", {
    keys,
    handlerCount: handlers.size
  });

  await Promise.all([...handlers].map((handler) => Promise.resolve(handler())));
}

export function registerResourceInvalidation(
  keys: ResourceKey | ResourceKey[],
  handler: InvalidationHandler
): () => void {
  const normalizedKeys = normalizeKeys(keys);

  for (const key of normalizedKeys) {
    const handlers = resourceInvalidationHandlers.get(key) ?? new Set<InvalidationHandler>();
    handlers.add(handler);
    resourceInvalidationHandlers.set(key, handlers);
  }

  return () => {
    for (const key of normalizedKeys) {
      const handlers = resourceInvalidationHandlers.get(key);
      if (!handlers) {
        continue;
      }

      handlers.delete(handler);
      if (handlers.size === 0) {
        resourceInvalidationHandlers.delete(key);
      }
    }
  };
}

export async function invalidateResources(keys: ResourceKey | ResourceKey[]): Promise<void> {
  const normalizedKeys = normalizeKeys(keys);
  if (normalizedKeys.length === 0) {
    return;
  }

  const collector = getCurrentCollector();
  if (collector) {
    for (const key of normalizedKeys) {
      collector.add(key);
    }
    return;
  }

  await triggerResourceInvalidation(normalizedKeys);
}

export async function captureInvalidatedResources<TResult>(
  run: () => Promise<TResult> | TResult
): Promise<{ result: TResult; invalidated: ResourceKey[] }> {
  const collector = new Set<ResourceKey>();
  invalidationCollectorStack.push(collector);

  try {
    const result = await run();
    return {
      result,
      invalidated: [...collector]
    };
  } finally {
    invalidationCollectorStack.pop();
  }
}