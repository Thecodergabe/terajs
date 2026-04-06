import { describe, it, expect, vi } from "vitest";
import terajsPlugin from "./index";
import { Debug } from "@terajs/shared";
import fs from "fs";

vi.mock("@terajs/shared", () => ({
  Debug: { emit: vi.fn() }
}));

describe("Terajs Vite Plugin (integration)", () => {
  it("emits sfc:load when loading a .nbl file", () => {
    const plugin = terajsPlugin();
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    plugin.load("Component.nbl");
    expect(Debug.emit).toHaveBeenCalledWith("sfc:load", {
      scope: "Component.nbl"
    });
  });

  it("emits sfc:hmr on handleHotUpdate()", () => {
    const plugin = terajsPlugin();
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    const ctx = {
      file: "Component.nbl",
      server: {
        moduleGraph: {
          getModuleById: vi.fn(() => ({ id: "Component.nbl" })),
          invalidateModule: vi.fn()
        }
      }
    };
    plugin.handleHotUpdate(ctx);
    expect(Debug.emit).toHaveBeenCalledWith("sfc:hmr", {
      scope: "Component.nbl"
    });
  });
});
