import { shortJson } from "./inspector/shared.js";

export interface AIAssistantRequest {
  prompt: string;
  snapshot: unknown;
  sanity: unknown;
  events: unknown[];
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
  const globalHook = getGlobalAIAssistantHook();
  if (globalHook) {
    const response = await globalHook(request);
    return extractAIAssistantResponseText(response);
  }

  if (!options.endpoint) {
    throw new Error("No AI assistant provider is configured. Set devtools.ai.endpoint or provide window.__TERAJS_AI_ASSISTANT__. ");
  }

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
        events: request.events
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`AI endpoint returned ${response.status}.`);
    }

    const rawText = await response.text();
    if (!rawText.trim()) {
      return "AI endpoint returned an empty response body.";
    }

    try {
      const parsed = JSON.parse(rawText) as unknown;
      return extractAIAssistantResponseText(parsed);
    } catch {
      return rawText;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`AI request timed out after ${options.timeoutMs}ms.`);
    }

    throw error instanceof Error ? error : new Error("AI request failed.");
  } finally {
    clearTimeout(timeoutHandle);
  }
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

function extractAIAssistantResponseText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "AI assistant returned an empty string.";
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    const direct = payload.response ?? payload.content ?? payload.answer ?? payload.output_text;
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct;
    }

    const choices = payload.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const message = first?.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (typeof content === "string" && content.trim().length > 0) {
        return content;
      }

      const text = first?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return shortJson(value);
}
