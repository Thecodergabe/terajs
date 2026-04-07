import { describe, expect, it } from "vitest";
import { createAction } from "./action";

describe("createAction", () => {
  it("tracks pending, data, and success state", async () => {
    const action = createAction(async (value: string) => value.toUpperCase());

    const pending = action.run("tera");
    expect(action.pending()).toBe(true);
    await expect(pending).resolves.toBe("TERA");
    expect(action.pending()).toBe(false);
    expect(action.data()).toBe("TERA");
    expect(action.state()).toBe("success");
  });

  it("captures errors from the latest run", async () => {
    const action = createAction(async (value: string) => {
      if (value === "boom") {
        throw new Error("boom");
      }

      return value;
    });

    await expect(action.run("boom")).rejects.toThrow("boom");
    expect(action.pending()).toBe(false);
    expect(action.state()).toBe("error");
    expect(action.error()).toBeInstanceOf(Error);
  });

  it("keeps the latest successful result when older runs settle later", async () => {
    let resolveFirst: ((value: string) => void) | undefined;
    let resolveSecond: ((value: string) => void) | undefined;
    const action = createAction((value: string) => new Promise<string>((resolve) => {
      if (value === "first") {
        resolveFirst = resolve;
        return;
      }

      resolveSecond = resolve;
    }));

    const first = action.run("first");
    const second = action.run("second");

    resolveSecond?.("SECOND");
    await expect(second).resolves.toBe("SECOND");
    expect(action.data()).toBe("SECOND");
    expect(action.state()).toBe("success");

    resolveFirst?.("FIRST");
    await expect(first).resolves.toBe("FIRST");
    expect(action.data()).toBe("SECOND");
    expect(action.state()).toBe("success");
  });

  it("resets back to the initial state", async () => {
    const action = createAction(async () => "saved", {
      initialValue: "draft"
    });

    await action.run();
    expect(action.data()).toBe("saved");

    action.reset();

    expect(action.data()).toBe("draft");
    expect(action.state()).toBe("success");
    expect(action.error()).toBeUndefined();
  });
});