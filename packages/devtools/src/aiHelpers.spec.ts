import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAIAssistantResponseDetailed, type AIAssistantRequest, type NormalizedAIAssistantOptions } from "./aiHelpers.js";

const TEST_REQUEST: AIAssistantRequest = {
  prompt: "Inspect the latest runtime warnings.",
  snapshot: { signals: [] },
  sanity: { alerts: [] },
  events: []
};

const TEST_OPTIONS: NormalizedAIAssistantOptions = {
  enabled: true,
  endpoint: null,
  model: "test-assistant",
  timeoutMs: 25
};

afterEach(() => {
  delete (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__;
  vi.useRealTimers();
});

describe("devtools ai helpers", () => {
  it("times out the global AI assistant hook when it exceeds timeoutMs", async () => {
    vi.useFakeTimers();

    (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__ = () => new Promise(() => {});

    const pending = resolveAIAssistantResponseDetailed(TEST_REQUEST, TEST_OPTIONS);
    const assertion = expect(pending).rejects.toMatchObject({
      name: "AIAssistantRequestError",
      kind: "timeout",
      telemetry: expect.objectContaining({
        provider: "global-hook",
        model: TEST_OPTIONS.model,
        endpoint: null
      })
    });

    await vi.advanceTimersByTimeAsync(TEST_OPTIONS.timeoutMs + 1);
    await assertion;
  });

  it("preserves structured assistant responses from the global hook", async () => {
    (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__ = () => ({
      summary: "Counter updates are re-entering the same effect.",
      likelyCauses: [
        "An effect writes back into the signal it depends on during render."
      ],
      codeReferences: [
        {
          file: "src/components/Counter.tera",
          line: 27,
          column: 9,
          reason: "The counter render path is the first likely write-back site."
        }
      ],
      nextChecks: [
        "Inspect the effect body that mutates count while reading count."
      ],
      suggestedFixes: [
        "Move the write into an explicit event handler or guard the effect."
      ]
    });

    const result = await resolveAIAssistantResponseDetailed(TEST_REQUEST, TEST_OPTIONS);

    expect(result.text).toBe("Counter updates are re-entering the same effect.");
    expect(result.structured).toEqual({
      summary: "Counter updates are re-entering the same effect.",
      likelyCauses: [
        "An effect writes back into the signal it depends on during render."
      ],
      codeReferences: [
        {
          file: "src/components/Counter.tera",
          line: 27,
          column: 9,
          reason: "The counter render path is the first likely write-back site."
        }
      ],
      nextChecks: [
        "Inspect the effect body that mutates count while reading count."
      ],
      suggestedFixes: [
        "Move the write into an explicit event handler or guard the effect."
      ]
    });
    expect(result.telemetry.provider).toBe("global-hook");
  });
});