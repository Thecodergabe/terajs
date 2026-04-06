import { beforeEach, describe, expect, it } from "vitest";
import { signal, setRuntimeMode } from "@terajs/reactivity";
import { setHydrationState } from "./hydration";
import { createResource } from "./resource";

describe("createResource", () => {
  beforeEach(() => {
    setRuntimeMode("client");
    setHydrationState({});
  });

  it("loads immediately and exposes resolved data", async () => {
    const resource = createResource(async () => "docs");

    expect(resource.loading()).toBe(true);
    await resource.promise();
    expect(resource.data()).toBe("docs");
    expect(resource.state()).toBe("ready");
  });

  it("refetches when the source signal changes", async () => {
    const source = signal("a");
    const resource = createResource(source, async (value) => value.toUpperCase());

    await resource.promise();
    expect(resource.data()).toBe("A");

    source.set("b");
    await Promise.resolve();
    await resource.promise();

    expect(resource.data()).toBe("B");
  });

  it("captures errors and allows mutation", async () => {
    const resource = createResource<string>(async () => {
      throw new Error("boom");
    }, { immediate: false });

    await expect(resource.refetch()).rejects.toThrow("boom");
    expect(resource.state()).toBe("error");
    expect(resource.error()).toBeInstanceOf(Error);

    resource.mutate("fallback");
    expect(resource.data()).toBe("fallback");
    expect(resource.state()).toBe("ready");
  });

  it("reuses hydrated resource data before fetching", async () => {
    setHydrationState({
      resources: {
        greeting: "from-ssr"
      }
    });

    const resource = createResource(async () => "from-fetch", {
      hydrateKey: "greeting"
    });

    expect(resource.data()).toBe("from-ssr");
    expect(resource.state()).toBe("ready");
    expect(resource.promise()).toBeNull();
  });
});