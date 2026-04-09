import { describe, it, expect } from "vitest";
import { generateRouteConfig, generateRouteConfigWithAssets } from "./routesScanner";

describe("Route Scanner", () => {
  it("converts [id].nbl to dynamic segment :id", () => {
    const files = ["posts/[id].nbl"];
    const config = generateRouteConfig(files);

    expect(config).toContain('path: "/posts/:id"');
  });

  it("nests sibling routes under a directory layout", () => {
    const files = ["admin/layout.nbl", "admin/dashboard.nbl"];
    const config = generateRouteConfig(files);

    expect(config).toContain('layout: import("./admin/layout.nbl")');
    expect(config).toContain('path: "/admin/dashboard"');
  });

  it("adds hashed asset paths when manifest metadata is available", () => {
    const files = ["src/routes/home.nbl", "src/routes/about.nbl"];
    const manifest = {
      "src/routes/home.nbl": { file: "assets/home-C9a1b2.js" },
      "src/routes/about.nbl": { file: "assets/about-F7e4d3.js" }
    };

    const config = generateRouteConfigWithAssets(files, manifest);

    expect(config).toContain('asset: "assets/home-C9a1b2.js"');
    expect(config).toContain('asset: "assets/about-F7e4d3.js"');
  });
});
