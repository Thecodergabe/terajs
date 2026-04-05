import { describe, it, expect, vi } from "vitest";
import { sfcToComponent } from "./sfcToComponent";
import { compileScript } from "./compileScript";

vi.mock("./compileScript", () => ({
  compileScript: vi.fn(() => ({ setupCode: "function setup(){}" }))
}));

vi.mock("./compileTemplate", () => ({
  compileTemplateFromSFC: vi.fn(() => ({ meta: {}, ai: {}, route: null }))
}));

describe("sfcToComponent", () => {
  it("extracts script as raw string and compiles it", () => {
    const sfc = {
      filePath: "/components/Test.nbl",
      template: "<div>Hello</div>",
      script: "export function setup() {}",
      style: null,
      meta: {},
      ai: {},
      routeOverride: null
    };

    const out = sfcToComponent(sfc);

    expect(compileScript).toHaveBeenCalledWith("export function setup() {}");
    expect(out).toContain("function setup()");
  });
});
