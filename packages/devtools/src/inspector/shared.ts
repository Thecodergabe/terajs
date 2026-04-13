export interface InspectorEventLike {
  payload?: Record<string, unknown>;
}

export interface ComponentIdentity {
  scope: string;
  instance: number;
}

export function normalizeInspectorQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesInspectorQuery(query: string, ...values: unknown[]): boolean {
  if (query.length === 0) {
    return true;
  }

  return values.some((value) => shortJson(value).toLowerCase().includes(query));
}

export function describeValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

export function buildComponentKey(scope: string, instance: number): string {
  return `${scope}#${instance}`;
}

export function parseComponentKey(value: string): ComponentIdentity | null {
  const pivot = value.lastIndexOf("#");
  if (pivot <= 0 || pivot >= value.length - 1) {
    return null;
  }

  const scope = value.slice(0, pivot);
  const instance = Number(value.slice(pivot + 1));
  if (!scope || !Number.isFinite(instance)) {
    return null;
  }

  return { scope, instance };
}

export function readComponentIdentity(event: InspectorEventLike): ComponentIdentity | null {
  const payload = event.payload ?? {};

  const context = readUnknown(payload, "context");
  const contextRecord = context && typeof context === "object"
    ? context as Record<string, unknown>
    : undefined;

  const scope =
    readString(payload, "scope") ??
    readString(payload, "name") ??
    readString(contextRecord, "name") ??
    readComponentName(readUnknown(payload, "component")) ??
    null;

  const instance =
    readNumber(payload, "instance") ??
    readNumber(payload, "id") ??
    readNumber(contextRecord, "instance") ??
    null;

  if (!scope || instance === null) {
    return null;
  }

  return {
    scope,
    instance
  };
}

export function readString(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

export function readNumber(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" ? value : undefined;
}

export function readUnknown(record: Record<string, unknown> | undefined, key: string): unknown {
  return record?.[key];
}

export function shortJson(value: unknown): string {
  return safeString(value).slice(0, 120);
}

export function safeString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (typeof value === "symbol" || typeof value === "function") return String(value);
  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return "[unserializable]";
  }
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readComponentName(value: unknown): string | undefined {
  if (typeof value === "function") {
    const name = value.name.trim();
    return name.length > 0 ? name : undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const directName = record.name;
  if (typeof directName === "string" && directName.trim().length > 0) {
    return directName;
  }

  return undefined;
}
