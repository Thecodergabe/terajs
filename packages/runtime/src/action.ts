import { signal, type Signal } from "@terajs/reactivity";

export type ActionState = "idle" | "pending" | "success" | "error";

export interface Action<TArgs extends unknown[] = unknown[], TResult = unknown> {
  data: Signal<TResult | undefined>;
  error: Signal<unknown>;
  state: Signal<ActionState>;
  pending: () => boolean;
  latest: () => TResult | undefined;
  promise: () => Promise<TResult> | null;
  run: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
}

export interface ActionOptions<TResult> {
  initialValue?: TResult;
  clearDataOnRun?: boolean;
}

export function createAction<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult> | TResult,
  options: ActionOptions<TResult> = {}
): Action<TArgs, TResult> {
  const data = signal<TResult | undefined>(options.initialValue);
  const error = signal<unknown>(undefined);
  const state = signal<ActionState>(options.initialValue === undefined ? "idle" : "success");

  let currentPromise: Promise<TResult> | null = null;
  let activeRunCount = 0;
  let latestRunId = 0;

  const run = async (...args: TArgs): Promise<TResult> => {
    latestRunId += 1;
    const runId = latestRunId;
    activeRunCount += 1;
    currentPromise = Promise.resolve(handler(...args));
    error.set(undefined);
    state.set("pending");

    if (options.clearDataOnRun === true) {
      data.set(undefined);
    }

    try {
      const result = await currentPromise;
      if (runId === latestRunId) {
        data.set(result);
        error.set(undefined);
        state.set("success");
      }

      return result;
    } catch (actionError) {
      if (runId === latestRunId) {
        error.set(actionError);
        state.set("error");
      }

      throw actionError;
    } finally {
      activeRunCount = Math.max(0, activeRunCount - 1);
      if (activeRunCount === 0 && currentPromise && runId === latestRunId) {
        currentPromise = null;
      }
    }
  };

  return {
    data,
    error,
    state,
    pending: () => state() === "pending",
    latest: () => data(),
    promise: () => currentPromise,
    run,
    reset: () => {
      currentPromise = null;
      activeRunCount = 0;
      latestRunId += 1;
      data.set(options.initialValue);
      error.set(undefined);
      state.set(options.initialValue === undefined ? "idle" : "success");
    }
  };
}