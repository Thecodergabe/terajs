import { describeValueType } from "./shared.js";

export type PrimitiveEditableValue = string | number | boolean;

export function describeEditablePrimitive(value: unknown): { type: "string" | "number" | "boolean"; value: PrimitiveEditableValue } | null {
  if (typeof value === "string") {
    return {
      type: "string",
      value
    };
  }

  if (typeof value === "number") {
    return {
      type: "number",
      value
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "boolean",
      value
    };
  }

  return null;
}

export function describeInspectableValueType(value: unknown): string {
  if (isRefLike(value)) {
    return `ref:${describeValueType(value.value)}`;
  }

  if (isSignalLike(value)) {
    return `signal:${describeValueType(value())}`;
  }

  return describeValueType(value);
}

export function unwrapInspectableValue(value: unknown): unknown {
  if (isRefLike(value)) {
    return value.value;
  }

  if (isSignalLike(value)) {
    return value();
  }

  return value;
}

export function coerceEditableInputValue(rawValue: string, currentValue: unknown): PrimitiveEditableValue | undefined {
  if (typeof currentValue === "number") {
    const next = Number(rawValue);
    return Number.isFinite(next) ? next : undefined;
  }

  if (typeof currentValue === "string") {
    return rawValue;
  }

  return undefined;
}

export function isRefLike(value: unknown): value is { value: unknown; _sig: unknown } {
  return !!value && typeof value === "object" && "_sig" in value && "value" in value;
}

export function isSignalLike(value: unknown): value is { (): unknown; set(next: unknown): void } {
  return typeof value === "function" && "set" in value && typeof (value as { set?: unknown }).set === "function";
}
