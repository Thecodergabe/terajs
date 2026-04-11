import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { RouteConfigInput } from "@terajs/router-manifest";

const require = createRequire(import.meta.url);

interface TerajsUserConfig {
  autoImportDirs?: string[];
  routeDirs?: string[];
  sync?: {
    hub?: {
      type?: string;
      url?: string;
      autoConnect?: boolean;
      retryPolicy?: string;
    };
  };
  router?: {
    rootTarget?: string;
    middlewareDir?: string;
    keepPreviousDuringLoading?: boolean;
    applyMeta?: boolean;
  };
  routes?: Array<{
    file?: string;
    filePath?: string;
    path?: string;
    layout?: string;
    mountTarget?: string;
    middleware?: string | string[];
    prerender?: boolean;
    hydrate?: RouteConfigInput["hydrate"];
    edge?: boolean;
  }>;
}

function resolveConfigPath(cwd: string): string | null {
  const candidates = [
    path.resolve(cwd, "terajs.config.cjs"),
    path.resolve(cwd, "terajs.config.js"),
    path.resolve(cwd, "terajs.config.ts")
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function readTypeScriptConfig(configPath: string): TerajsUserConfig {
  const source = fs.readFileSync(configPath, "utf8");
  const exportDefault = source.match(/export\s+default\s+([\s\S]+)$/);

  if (!exportDefault) {
    throw new Error("terajs.config.ts must use a default export.");
  }

  const expression = exportDefault[1].trim().replace(/;\s*$/, "");
  const evaluate = new Function(`return (${expression});`) as () => unknown;
  const config = evaluate();

  if (!config || typeof config !== "object") {
    throw new Error("terajs.config.ts default export must be an object.");
  }

  return config as TerajsUserConfig;
}

function readTerajsConfig(): TerajsUserConfig {
  const cwd = process.cwd();
  const configPath = resolveConfigPath(cwd);

  if (!configPath) {
    return {};
  }

  try {
    if (configPath.endsWith(".ts")) {
      return readTypeScriptConfig(configPath);
    }

    return (require(configPath) as TerajsUserConfig | undefined) ?? {};
  } catch {
    return {};
  }
}

export function getTerajsConfig(): TerajsUserConfig {
  return readTerajsConfig();
}

export function getAutoImportDirs(): string[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const defaultDirs = [path.resolve(cwd, "packages/devtools/src/components")];
  const configuredDirs = Array.isArray(config.autoImportDirs) ? config.autoImportDirs : [];

  if (configuredDirs.length === 0) {
    return defaultDirs;
  }

  return configuredDirs.map((dir) => path.resolve(cwd, dir));
}

export function getRouteDirs(): string[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const configuredDirs = Array.isArray(config.routeDirs) ? config.routeDirs : [];
  const defaultDirs = ["src/pages"];
  const dirs = configuredDirs.length > 0 ? configuredDirs : defaultDirs;

  return dirs
    .map((dir) => path.resolve(cwd, dir))
    .filter((dir, index, values) => fs.existsSync(dir) && values.indexOf(dir) === index);
}

export function getConfiguredRoutes(): RouteConfigInput[] {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const routes = Array.isArray(config.routes) ? config.routes : [];
  const configuredRoutes: RouteConfigInput[] = [];

  for (const route of routes) {
    if (route === null || typeof route !== "object") {
      continue;
    }

      const file = typeof route.file === "string"
        ? route.file
        : typeof route.filePath === "string"
        ? route.filePath
        : null;

      if (!file) {
        continue;
      }

      configuredRoutes.push({
        filePath: path.resolve(cwd, file),
        path: typeof route.path === "string" ? route.path : undefined,
        layout: typeof route.layout === "string" ? route.layout : undefined,
        mountTarget: typeof route.mountTarget === "string" ? route.mountTarget : undefined,
        middleware: Array.isArray(route.middleware)
          ? route.middleware.filter((value): value is string => typeof value === "string")
          : typeof route.middleware === "string"
          ? route.middleware
          : undefined,
        prerender: typeof route.prerender === "boolean" ? route.prerender : undefined,
        hydrate: typeof route.hydrate === "string" ? route.hydrate : undefined,
        edge: typeof route.edge === "boolean" ? route.edge : undefined
      });
  }

  return configuredRoutes;
}

export interface TerajsRouterConfig {
  rootTarget: string;
  middlewareDir: string;
  keepPreviousDuringLoading: boolean;
  applyMeta: boolean;
}

export type TerajsHubType = "signalr" | "socket.io" | "websockets";
export type TerajsHubRetryPolicy = "none" | "exponential";

export interface TerajsHubConfig {
  type: TerajsHubType;
  url: string;
  autoConnect: boolean;
  retryPolicy: TerajsHubRetryPolicy;
}

function isMountTargetId(value: string): boolean {
  return /^[A-Za-z][\w:-]*$/.test(value);
}

function isHubType(value: string): value is TerajsHubType {
  return value === "signalr" || value === "socket.io" || value === "websockets";
}

function isHubRetryPolicy(value: string): value is TerajsHubRetryPolicy {
  return value === "none" || value === "exponential";
}

export function getSyncHubConfig(): TerajsHubConfig | null {
  const config = readTerajsConfig();
  const hub = config.sync?.hub;

  if (!hub || typeof hub !== "object") {
    return null;
  }

  const configuredType = typeof hub.type === "string" ? hub.type.trim() : "signalr";
  if (!isHubType(configuredType)) {
    throw new Error(
      `Invalid terajs sync.hub.type "${configuredType}". Expected one of: signalr, socket.io, websockets.`
    );
  }

  const url = typeof hub.url === "string" ? hub.url.trim() : "";
  if (!url) {
    throw new Error("terajs sync.hub.url is required when sync.hub is configured.");
  }

  const configuredRetryPolicy = typeof hub.retryPolicy === "string"
    ? hub.retryPolicy.trim()
    : "exponential";
  if (!isHubRetryPolicy(configuredRetryPolicy)) {
    throw new Error(
      `Invalid terajs sync.hub.retryPolicy "${configuredRetryPolicy}". Expected one of: none, exponential.`
    );
  }

  return {
    type: configuredType,
    url,
    autoConnect: typeof hub.autoConnect === "boolean" ? hub.autoConnect : true,
    retryPolicy: configuredRetryPolicy
  };
}

export function getRouterConfig(): TerajsRouterConfig {
  const cwd = process.cwd();
  const config = readTerajsConfig();
  const router = config.router;

  const configuredRootTarget = typeof router?.rootTarget === "string" ? router.rootTarget.trim() : "";
  const rootTarget = isMountTargetId(configuredRootTarget) ? configuredRootTarget : "app";

  const middlewareDir = typeof router?.middlewareDir === "string"
    ? path.resolve(cwd, router.middlewareDir)
    : path.resolve(cwd, "src/middleware");

  return {
    rootTarget,
    middlewareDir,
    keepPreviousDuringLoading:
      typeof router?.keepPreviousDuringLoading === "boolean"
        ? router.keepPreviousDuringLoading
        : true,
    applyMeta:
      typeof router?.applyMeta === "boolean"
        ? router.applyMeta
        : true
  };
}