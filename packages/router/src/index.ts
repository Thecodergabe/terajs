/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/router package.
 */

export { 
  inferPathFromFile, 
  buildRouteFromSFC 
} from "./builder";

export { buildRouteManifest } from "./manifest";

export { loadRouteMatch } from "./loading";
export { resolveLoadedRouteMetadata } from "./meta";

export {
  createBrowserHistory,
  createMemoryHistory,
  createRouter,
  matchRoute
} from "./runtime";

export type { RouteDefinition, RouteLayoutDefinition } from "./builder";
export type { RouteConfigInput, RouteManifestOptions, RouteSourceInput } from "./manifest";
export type {
  LoadedLayoutModule,
  LoadedRouteMatch,
  RouteLoadContext,
  RouteModule
} from "./loading";
export type { ResolvedRouteMetadata } from "./meta";
export type {
  GuardContext,
  NavigationGuard,
  NavigationResult,
  RouteMatch,
  RouteParams,
  RouteQuery,
  RouteQueryValue,
  Router,
  RouterHistory,
  RouterOptions
} from "./runtime";
