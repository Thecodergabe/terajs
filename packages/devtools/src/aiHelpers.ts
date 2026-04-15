
import { shortJson } from "./inspector/shared.js";
import type { SafeDocumentDiagnostic } from "./documentContext.js";
import type { SafeDocumentContext } from "./documentContext.js";

export interface AIAssistantRequest {
  prompt: string;
  snapshot: unknown;
  sanity: unknown;
  events: unknown[];
  document?: SafeDocumentContext | null;
  documentDiagnostics?: SafeDocumentDiagnostic[];
}

export interface AIAssistantOptionsInput {
  enabled?: boolean;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export interface NormalizedAIAssistantOptions {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

export type AIAssistantHook = (request: AIAssistantRequest) => Promise<unknown> | unknown;
export type AIAssistantProviderKind = "global-hook" | "http-endpoint" | "vscode-extension";
export type AIAssistantFallbackPath = "none" | "global-hook-over-endpoint";

export interface AIAssistantTelemetry {
  provider: AIAssistantProviderKind;
  durationMs: number;
  httpStatus: number | null;
  delivery: "one-shot";
  fallbackPath: AIAssistantFallbackPath;
  model: string;
  endpoint: string | null;
}

export interface AIAssistantCodeReference {
  file: string;
  line: number | null;
  column: number | null;
  reason: string;
}

export interface AIAssistantStructuredResponse {
  summary: string;
  likelyCauses: string[];
  codeReferences: AIAssistantCodeReference[];
  nextChecks: string[];
  suggestedFixes: string[];
}

export interface AIAssistantResolvedResponse {
  text: string;
  structured: AIAssistantStructuredResponse | null;
  telemetry: AIAssistantTelemetry;
}

export interface AIAssistantRequestFailure extends Error {
  telemetry: AIAssistantTelemetry;
  kind: "timeout" | "http-error" | "request-failed" | "unconfigured";
}

export function normalizeAIAssistantOptions(options?: AIAssistantOptionsInput): NormalizedAIAssistantOptions {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : null;

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : "terajs-assistant";

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : 12000;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

export async function resolveAIAssistantResponse(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<string> {
  const result = await resolveAIAssistantResponseDetailed(request, options);
  return result.text;
}

export async function resolveAIAssistantResponseDetailed(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<AIAssistantResolvedResponse> {
  const globalHook = getGlobalAIAssistantHook();
  if (globalHook) {
    return resolveAIAssistantResponseWithHandlerDetailed(request, options, "global-hook", globalHook);
  }

  if (!options.endpoint) {
    throw createAIAssistantRequestFailure(
      "No AI assistant provider is configured. Set devtools.ai.endpoint or provide window.__TERAJS_AI_ASSISTANT__. ",
      createAIAssistantTelemetry(options, "http-endpoint", 0, null),
      "unconfigured"
    );
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        prompt: request.prompt,
        snapshot: request.snapshot,
        sanity: request.sanity,
        events: request.events,
        document: request.document ?? undefined,
        documentDiagnostics: request.documentDiagnostics ?? undefined
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw createAIAssistantRequestFailure(
        `AI endpoint returned ${response.status}.`,
        createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, response.status),
        "http-error"
      );
    }

    const rawText = await response.text();
    const telemetry = createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, response.status);
    if (!rawText.trim()) {
      return {
        text: "AI endpoint returned an empty response body.",
        structured: null,
        telemetry
      };
    }

    try {
      const parsed = JSON.parse(rawText) as unknown;
      const normalizedResponse = normalizeAIAssistantResponse(parsed);
      return {
        text: normalizedResponse.text,
        structured: normalizedResponse.structured,
        telemetry
      };
    } catch {
      const normalizedResponse = normalizeAIAssistantResponse(rawText);
      return {
        text: normalizedResponse.text,
        structured: normalizedResponse.structured,
        telemetry
      };
    }
  } catch (error) {
    if (isAIAssistantRequestFailure(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw createAIAssistantRequestFailure(
        `AI request timed out after ${options.timeoutMs}ms.`,
        createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, null),
        "timeout"
      );
    }

    throw createAIAssistantRequestFailure(
      error instanceof Error ? error.message : "AI request failed.",
      createAIAssistantTelemetry(options, "http-endpoint", Date.now() - startedAt, null),
      "request-failed"
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export function isAIAssistantRequestFailure(value: unknown): value is AIAssistantRequestFailure {
  if (!(value instanceof Error)) {
    return false;
  }

  const candidate = value as Partial<AIAssistantRequestFailure>;
  return (
    typeof candidate.kind === "string"
    && typeof candidate.telemetry?.provider === "string"
    && typeof candidate.telemetry?.durationMs === "number"
  );
}

export function describeInspectorSnapshot(value: unknown): string {
  if (value === undefined || value === null) {
    return "not captured";
  }

  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
    return "not captured";
  }

  return shortJson(value);
}

export function prettyJson(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unserializable]";
  }
}

export function getGlobalAIAssistantHook(): AIAssistantHook | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }

  const maybeHook = (globalThis as typeof globalThis & {
    __TERAJS_AI_ASSISTANT__?: unknown;
  }).__TERAJS_AI_ASSISTANT__;

  return typeof maybeHook === "function" ? maybeHook as AIAssistantHook : null;
}

export async function resolveAIAssistantResponseWithHandlerDetailed(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions,
  provider: AIAssistantProviderKind,
  handler: AIAssistantHook
): Promise<AIAssistantResolvedResponse> {
  const startedAt = Date.now();
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    const response = await Promise.race([
      Promise.resolve().then(() => handler(request)),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(createAIAssistantRequestFailure(
            `AI request timed out after ${options.timeoutMs}ms.`,
            createAIAssistantTelemetry(options, provider, Date.now() - startedAt, null),
            "timeout"
          ));
        }, options.timeoutMs);
      })
    ]);

    const envelope = extractAIAssistantResponseEnvelope(response);
    const normalizedResponse = normalizeAIAssistantResponse(envelope.content);
    return {
      text: normalizedResponse.text,
      structured: normalizedResponse.structured,
      telemetry: createAIAssistantTelemetry(
        options,
        provider,
        Date.now() - startedAt,
        null,
        envelope.telemetry
      )
    };
  } catch (error) {
    if (isAIAssistantRequestFailure(error)) {
      throw error;
    }

    throw createAIAssistantRequestFailure(
      error instanceof Error ? error.message : "AI request failed.",
      createAIAssistantTelemetry(options, provider, Date.now() - startedAt, null),
      "request-failed"
    );
  } finally {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
    }
  }
}

function createAIAssistantTelemetry(
  options: NormalizedAIAssistantOptions,
  provider: AIAssistantProviderKind,
  durationMs: number,
  httpStatus: number | null,
  overrides?: Partial<Pick<AIAssistantTelemetry, "model" | "endpoint">>
): AIAssistantTelemetry {
  return {
    provider,
    durationMs,
    httpStatus,
    delivery: "one-shot",
    fallbackPath: provider === "global-hook" && options.endpoint ? "global-hook-over-endpoint" : "none",
    model: overrides?.model ?? options.model,
    endpoint: overrides?.endpoint ?? options.endpoint
  };
}

function createAIAssistantRequestFailure(
  message: string,
  telemetry: AIAssistantTelemetry,
  kind: AIAssistantRequestFailure["kind"]
): AIAssistantRequestFailure {
  const error = new Error(message) as AIAssistantRequestFailure;
  error.name = "AIAssistantRequestError";
  error.telemetry = telemetry;
  error.kind = kind;
  return error;
}

export function formatAIAssistantCodeReferenceLocation(reference: AIAssistantCodeReference): string {
  if (reference.line === null) {
    return reference.file;
  }

  if (reference.column === null) {
    return `${reference.file}:${reference.line}`;
  }

  return `${reference.file}:${reference.line}:${reference.column}`;
}

function extractAIAssistantResponseEnvelope(value: unknown): {
  content: unknown;
  telemetry?: Partial<Pick<AIAssistantTelemetry, "model" | "endpoint">>;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { content: value };
  }

  const payload = value as Record<string, unknown>;
  const telemetry = payload.telemetry;
  if (!telemetry || typeof telemetry !== "object" || Array.isArray(telemetry)) {
    return { content: value };
  }

  const telemetryRecord = telemetry as Record<string, unknown>;
  return {
    content: payload.response ?? payload.result ?? payload.content ?? value,
    telemetry: {
      model: readNonEmptyString(telemetryRecord.model) ?? undefined,
      endpoint: typeof telemetryRecord.endpoint === "string"
        ? telemetryRecord.endpoint
        : telemetryRecord.endpoint === null
        ? null
        : undefined
    }
  };
}

function normalizeAIAssistantResponse(value: unknown): {
  text: string;
  structured: AIAssistantStructuredResponse | null;
} {
  const structured = extractAIAssistantStructuredResponse(value);

  return {
    text: extractAIAssistantResponseText(value, structured),
    structured
  };
}

function extractAIAssistantStructuredResponse(value: unknown): AIAssistantStructuredResponse | null {
  if (value && typeof value === "object") {
    const fromRecord = extractAIAssistantStructuredResponseFromRecord(value as Record<string, unknown>);
    if (fromRecord) {
      return fromRecord;
    }
  }

  const directText = readAIAssistantDirectText(value);
  return directText ? extractAIAssistantStructuredResponseFromText(directText) : null;
}

function extractAIAssistantStructuredResponseFromText(value: string): AIAssistantStructuredResponse | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object"
      ? extractAIAssistantStructuredResponseFromRecord(parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractAIAssistantStructuredResponseFromRecord(
  value: Record<string, unknown>
): AIAssistantStructuredResponse | null {
  const candidates: Record<string, unknown>[] = [value];
  for (const key of ["diagnostics", "analysis", "result", "assistant", "response", "output"]) {
    const nested = value[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      candidates.push(nested as Record<string, unknown>);
    }
  }

  for (const candidate of candidates) {
    const likelyCauses = readStructuredStringList(candidate.likelyCauses ?? candidate.causes);
    const nextChecks = readStructuredStringList(candidate.nextChecks ?? candidate.checks);
    const suggestedFixes = readStructuredStringList(candidate.suggestedFixes ?? candidate.fixes);
    const codeReferences = readStructuredCodeReferences(candidate.codeReferences ?? candidate.references ?? candidate.files);
    const summary = readNonEmptyString(candidate.summary) ?? readNonEmptyString(candidate.overview);

    if (
      !summary
      && likelyCauses.length === 0
      && nextChecks.length === 0
      && suggestedFixes.length === 0
      && codeReferences.length === 0
    ) {
      continue;
    }

    return {
      summary: summary ?? buildStructuredSummary(likelyCauses, nextChecks, suggestedFixes, codeReferences),
      likelyCauses,
      codeReferences,
      nextChecks,
      suggestedFixes
    };
  }

  return null;
}

function extractAIAssistantResponseText(
  value: unknown,
  structured: AIAssistantStructuredResponse | null = null
): string {
  const directText = readAIAssistantDirectText(value);
  if (directText) {
    const structuredFromText = extractAIAssistantStructuredResponseFromText(directText);
    return structuredFromText?.summary ?? directText;
  }

  if (structured) {
    return structured.summary;
  }

  if (typeof value === "string") {
    return "AI assistant returned an empty string.";
  }

  return shortJson(value);
}

function readAIAssistantDirectText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const direct = payload.response ?? payload.content ?? payload.answer ?? payload.output_text;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const first = choices[0] as Record<string, unknown>;
  const message = first?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return content.trim();
  }

  const text = first?.text;
  return typeof text === "string" && text.trim().length > 0 ? text.trim() : null;
}

function readStructuredStringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((entry) => stripBulletMarker(entry.trim()))
      .filter((entry) => entry.length > 0);
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => stripBulletMarker(entry.trim()))
    .filter((entry) => entry.length > 0);
}

function readStructuredCodeReferences(value: unknown): AIAssistantCodeReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const candidate = entry as Record<string, unknown>;
    const file = readNonEmptyString(candidate.file)
      ?? readNonEmptyString(candidate.path)
      ?? readNonEmptyString(candidate.source);
    if (!file) {
      return [];
    }

    return [{
      file,
      line: readNullableNumber(candidate.line),
      column: readNullableNumber(candidate.column),
      reason: readNonEmptyString(candidate.reason)
        ?? readNonEmptyString(candidate.summary)
        ?? readNonEmptyString(candidate.message)
        ?? "Likely implementation surface"
    }];
  });
}

function buildStructuredSummary(
  likelyCauses: string[],
  nextChecks: string[],
  suggestedFixes: string[],
  codeReferences: AIAssistantCodeReference[]
): string {
  if (likelyCauses.length > 0) {
    return likelyCauses[0];
  }

  if (suggestedFixes.length > 0) {
    return suggestedFixes[0];
  }

  if (nextChecks.length > 0) {
    return nextChecks[0];
  }

  if (codeReferences.length > 0) {
    return `Likely implementation surface: ${formatAIAssistantCodeReferenceLocation(codeReferences[0])}`;
  }

  return "Structured AI analysis ready.";
}

function stripBulletMarker(value: string): string {
  return value.replace(/^(?:[-*•]|\d+[.)])\s+/, "").trim();
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
