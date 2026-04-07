import { describe, it, expect, vi } from "vitest";
import type { HmrContext, Plugin } from "vite";
import terajsPlugin from "./index";
import { compileSfcToComponent } from "./compileSfcToComponent";
import { Debug } from "@terajs/shared";
import { server } from "@terajs/runtime";
import { setRuntimeMode } from "@terajs/reactivity";
import fs from "fs";
import path from "node:path";
import { Readable } from "node:stream";

vi.mock("./config", () => ({
  getAutoImportDirs: () => [path.resolve(process.cwd(), "packages/devtools/src/components")],
  getRouteDirs: () => [path.resolve(process.cwd(), "src/routes")],
  getConfiguredRoutes: () => []
}));

vi.mock("@terajs/shared", () => ({
  Debug: { emit: vi.fn() }
}));

vi.mock("./compileSfcToComponent", () => ({
  compileSfcToComponent: vi.fn(() => "export default function Comp() {}")
}));

describe("Terajs Vite Plugin (integration)", () => {
  function createResponseCollector() {
    const headers = new Map<string, string | string[]>();
    let statusCode = 200;
    let body = Buffer.alloc(0);

    return {
      headers,
      get statusCode() {
        return statusCode;
      },
      set statusCode(value: number) {
        statusCode = value;
      },
      setHeader(name: string, value: string | string[]) {
        headers.set(name, value);
      },
      end(chunk?: any) {
        body = chunk ? Buffer.from(chunk) : Buffer.alloc(0);
      },
      readJson() {
        return JSON.parse(body.toString("utf8"));
      }
    };
  }

  function requireHook<TArgs extends unknown[], TResult>(
    hook: Plugin["load"] | Plugin["resolveId"] | Plugin["handleHotUpdate"]
  ): (...args: TArgs) => TResult {
    if (typeof hook === "function") {
      return hook as unknown as (...args: TArgs) => TResult;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as unknown as (...args: TArgs) => TResult;
    }

    throw new Error("Expected Vite plugin hook to be defined.");
  }

  function requireServerHook(hook: Plugin["configureServer"]): (server: any) => void {
    if (typeof hook === "function") {
      return hook as (server: any) => void;
    }

    if (hook && typeof hook === "object" && "handler" in hook && typeof hook.handler === "function") {
      return hook.handler as (server: any) => void;
    }

    throw new Error("Expected Vite configureServer hook to be defined.");
  }

  it("mounts a dev middleware for server function requests", async () => {
    setRuntimeMode("server");
    const getGreeting = server(async (name: string) => `hello ${name}`, { id: "getGreeting" });
    expect(getGreeting.id).toBe("getGreeting");

    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);

    configureServer({
      middlewares: { use }
    } as any);

    expect(use).toHaveBeenCalledTimes(1);

    const middleware = use.mock.calls[0][0] as (req: any, res: any, next: () => void) => Promise<void>;
    const req = Readable.from([JSON.stringify({ id: "getGreeting", args: ["Ada"] })]) as any;
    req.method = "POST";
    req.url = "/_terajs/server";
    req.headers = {
      host: "localhost:5173",
      "content-type": "application/json"
    };

    const res = createResponseCollector();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(res.readJson()).toEqual({
      ok: true,
      result: "hello Ada"
    });
  });

  it("passes through non-server-function requests", async () => {
    const plugin = terajsPlugin();
    const use = vi.fn();
    const configureServer = requireServerHook(plugin.configureServer);

    configureServer({
      middlewares: { use }
    } as any);

    const middleware = use.mock.calls[0][0] as (req: any, res: any, next: () => void) => Promise<void>;
    const req = Readable.from([]) as any;
    req.method = "GET";
    req.url = "/app";
    req.headers = { host: "localhost:5173" };

    const res = createResponseCollector();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("emits sfc:load when loading a .nbl file", () => {
    const plugin = terajsPlugin();
    const load = requireHook<[string], unknown>(plugin.load);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    load("Component.nbl");
    expect(compileSfcToComponent).toHaveBeenCalled();
    expect(Debug.emit).toHaveBeenCalledWith("sfc:load", {
      scope: "Component.nbl"
    });
  });

  it("emits sfc:hmr on handleHotUpdate()", () => {
    const plugin = terajsPlugin();
    const handleHotUpdate = requireHook<[HmrContext], unknown>(plugin.handleHotUpdate);
    vi.spyOn(fs, "readFileSync").mockReturnValue("<template>Hello</template>");
    const ctx = {
      file: "Component.nbl",
      server: {
        moduleGraph: {
          getModuleById: vi.fn(() => ({ id: "Component.nbl" })),
          invalidateModule: vi.fn()
        }
      }
    } as unknown as HmrContext;
    handleHotUpdate(ctx);
    expect(Debug.emit).toHaveBeenCalledWith("sfc:hmr", {
      scope: "Component.nbl"
    });
  });

  it("generates a virtual route manifest module", () => {
    const routesDir = path.resolve(process.cwd(), "src/routes");
    const productDir = path.join(routesDir, "products");

    vi.spyOn(fs, "existsSync").mockImplementation((input) => {
      const value = String(input);
      return value === routesDir || value === productDir;
    });

    vi.spyOn(fs, "readdirSync").mockImplementation((input, options) => {
      const value = String(input);
      if (options && typeof options === "object" && "withFileTypes" in options && options.withFileTypes) {
        if (value === routesDir) {
          return [
            { name: "layout.nbl", isDirectory: () => false, isFile: () => true },
            { name: "index.nbl", isDirectory: () => false, isFile: () => true },
            { name: "products", isDirectory: () => true, isFile: () => false }
          ] as any;
        }

        if (value === productDir) {
          return [
            { name: "[id].nbl", isDirectory: () => false, isFile: () => true }
          ] as any;
        }
      }

      return [] as any;
    });

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("layout.nbl")) return "<template><slot /></template>";
      if (value.endsWith("index.nbl")) return "<template><Home /></template>";
      if (value.endsWith("[id].nbl")) return "<template><Product /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const resolveId = requireHook<[string], unknown>(plugin.resolveId);
  const load = requireHook<[string], unknown>(plugin.load);
  const resolved = resolveId("virtual:terajs-routes");
  const code = load("\0virtual:terajs-routes");

    expect(resolved).toBe("\0virtual:terajs-routes");
    expect(typeof code).toBe("string");
    expect(code).toContain("@terajs/router-manifest");
    expect(code).toContain('filePath: "/src/routes/index.nbl"');
    expect(code).toContain('filePath: "/src/routes/products/[id].nbl"');
  });

  it("passes config-defined route overrides into the virtual manifest", async () => {
    const configModule = await import("./config");
    vi.spyOn(configModule, "getConfiguredRoutes").mockReturnValue([
      {
        filePath: path.resolve(process.cwd(), "src/routes/docs.nbl"),
        path: "/learn",
        middleware: ["docs"],
        prerender: false
      }
    ]);

    vi.spyOn(fs, "readFileSync").mockImplementation((input) => {
      const value = String(input);
      if (value.endsWith("docs.nbl")) return "<template><Docs /></template>";
      return "<template />";
    });

    const plugin = terajsPlugin();
  const load = requireHook<[string], unknown>(plugin.load);
  const code = load("\0virtual:terajs-routes");

    expect(typeof code).toBe("string");
    expect(code).toContain("routeConfigs");
    expect(code).toContain('path: "/learn"');
    expect(code).toContain('middleware: ["docs"]');
    expect(code).toContain('prerender: false');
  });
});
