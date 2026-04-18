import { escapeHtml, safeString, shortJson } from "./shared.js";

export function renderValueExplorer(
  value: unknown,
  _rootPath: string,
  _expandedValuePaths: Set<string>
): string {
  if (!isExpandableValue(value)) {
    return `<div class="value-empty">${escapeHtml(formatPrimitiveValue(value))}</div>`;
  }

  return `<pre class="inspector-code inspector-json">${escapeHtml(prettyInspectorJson(value))}</pre>`;
}

export function isExpandableValue(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || (!!value && typeof value === "object");
}

export function formatPrimitiveValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return String(value);
  }

  return shortJson(value);
}

function prettyInspectorJson(value: unknown): string {
  const seen = new WeakSet<object>();

  try {
    const serialized = JSON.stringify(value, (_key, entry: unknown) => {
      if (entry && typeof entry === "object") {
        if (seen.has(entry as object)) {
          return "[Circular]";
        }
        seen.add(entry as object);
      }

      if (entry === undefined) {
        return "[undefined]";
      }

      if (typeof entry === "function") {
        return `[Function ${(entry as Function).name || "anonymous"}]`;
      }

      if (typeof entry === "symbol") {
        return String(entry);
      }

      if (typeof entry === "bigint") {
        return `${entry.toString()}n`;
      }

      if (entry instanceof Error) {
        return {
          name: entry.name,
          message: entry.message
        };
      }

      return entry;
    }, 2);

    return typeof serialized === "string" ? serialized : safeString(value);
  } catch {
    return safeString(value);
  }
}
