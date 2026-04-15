import { shortJson } from "./inspector/shared.js";

export interface AIDebugEventLike {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export interface AICodeReference {
  file: string;
  line: number | null;
  column: number | null;
  summary: string;
  eventType: string;
  level: "warn" | "error";
  timestamp: number;
}

export interface AIDebugIssueSummary {
  type: string;
  level: "warn" | "error";
  message: string;
  timestamp: number;
  location: {
    file: string;
    line: number | null;
    column: number | null;
  } | null;
}

export function isAIDebugIssueEvent(event: AIDebugEventLike): boolean {
  if (event.type.startsWith("ai:assistant:")) {
    return false;
  }

  return (
    event.level === "warn"
    || event.level === "error"
    || event.type.startsWith("error:")
    || event.type.includes("warn")
    || event.type.includes("hydration")
    || event.type === "hub:error"
    || event.type === "hub:disconnect"
    || event.type === "queue:fail"
    || event.type === "queue:conflict"
    || event.type === "queue:skip:missing-handler"
  );
}

export function summarizeAIDebugIssue(event: AIDebugEventLike): string {
  const payload = event.payload;
  if (!payload) {
    return event.type;
  }

  if (event.type === "queue:fail") {
    const type = readString(payload, "type") ?? "unknown";
    const attempts = readNumber(payload, "attempts");
    const error = readString(payload, "error") ?? "unknown error";
    const attemptsSuffix = attempts === undefined
      ? ""
      : ` after ${attempts} attempt${attempts === 1 ? "" : "s"}`;

    return `Queue mutation ${type} failed${attemptsSuffix}: ${error}`;
  }

  if (event.type === "queue:conflict") {
    const type = readString(payload, "type") ?? "unknown";
    const decision = readString(payload, "decision") ?? "replace";
    return `Queue conflict for ${type} resolved as ${decision}`;
  }

  if (event.type === "queue:skip:missing-handler") {
    const type = readString(payload, "type") ?? "unknown";
    return `Queue handler missing for mutation type ${type}`;
  }

  if (event.type === "hub:error") {
    const transport = readString(payload, "transport") ?? "hub";
    const message = readString(payload, "message") ?? "unknown error";
    return `Realtime ${transport} transport error: ${message}`;
  }

  if (event.type === "hub:disconnect") {
    const transport = readString(payload, "transport") ?? "hub";
    const reason = readString(payload, "reason") ?? "connection closed";
    return `Realtime ${transport} disconnected: ${reason}`;
  }

  const message = payload.message;
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  const likelyCause = payload.likelyCause;
  if (typeof likelyCause === "string" && likelyCause.length > 0) {
    return likelyCause;
  }

  return shortJson(payload).slice(0, 220);
}

export function collectRecentAIDebugIssues(
  events: AIDebugEventLike[],
  maxItems: number
): AIDebugIssueSummary[] {
  return events
    .filter((event) => isAIDebugIssueEvent(event))
    .slice(-maxItems)
    .map((event) => ({
      type: event.type,
      level: event.level === "error" || event.type.startsWith("error:") ? "error" : "warn",
      message: summarizeAIDebugIssue(event),
      timestamp: event.timestamp,
      location: typeof event.file === "string" && event.file.length > 0
        ? {
          file: event.file,
          line: typeof event.line === "number" ? event.line : null,
          column: typeof event.column === "number" ? event.column : null
        }
        : null
    }));
}

export function collectRecentCodeReferences(
  events: AIDebugEventLike[],
  maxItems: number
): AICodeReference[] {
  const references: AICodeReference[] = [];
  const seen = new Set<string>();

  for (let index = events.length - 1; index >= 0 && references.length < maxItems; index -= 1) {
    const event = events[index];
    if (!isAIDebugIssueEvent(event) || typeof event.file !== "string" || event.file.trim().length === 0) {
      continue;
    }

    const summary = summarizeAIDebugIssue(event);
    const line = typeof event.line === "number" ? event.line : null;
    const column = typeof event.column === "number" ? event.column : null;
    const key = `${event.file}:${line ?? "-"}:${column ?? "-"}:${summary}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    references.push({
      file: event.file,
      line,
      column,
      summary,
      eventType: event.type,
      level: event.level === "error" || event.type.startsWith("error:") ? "error" : "warn",
      timestamp: event.timestamp
    });
  }

  return references;
}

export function formatAICodeReferenceLocation(reference: AICodeReference): string {
  if (reference.line === null) {
    return reference.file;
  }

  if (reference.column === null) {
    return `${reference.file}:${reference.line}`;
  }

  return `${reference.file}:${reference.line}:${reference.column}`;
}

function readString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(payload: Record<string, unknown>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === "number" ? value : undefined;
}