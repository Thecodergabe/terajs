export interface NormalizedDevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export function normalizeEvent(rawEvent: unknown): NormalizedDevtoolsEvent | null {
  if (!rawEvent || typeof rawEvent !== "object") return null;

  const event = rawEvent as Record<string, unknown>;
  const type = typeof event.type === "string" ? event.type : null;
  const timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
  if (!type) return null;

  if (event.payload && typeof event.payload === "object") {
    return {
      type,
      timestamp,
      payload: event.payload as Record<string, unknown>,
      level: parseLevel(event.level),
      file: typeof event.file === "string" ? event.file : undefined,
      line: typeof event.line === "number" ? event.line : undefined,
      column: typeof event.column === "number" ? event.column : undefined
    };
  }

  const { payload: _payload, type: _type, timestamp: _timestamp, ...rest } = event;
  return {
    type,
    timestamp,
    payload: rest,
    level: parseLevel(event.level),
    file: typeof event.file === "string" ? event.file : undefined,
    line: typeof event.line === "number" ? event.line : undefined,
    column: typeof event.column === "number" ? event.column : undefined
  };
}

function parseLevel(level: unknown): NormalizedDevtoolsEvent["level"] {
  if (level === "info" || level === "warn" || level === "error") return level;
  return undefined;
}
