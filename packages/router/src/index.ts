/**
 * @file index.ts
 * @description
 * Entry point for the @nebula/router package.
 */

export { 
  inferPathFromFile, 
  buildRouteFromSFC 
} from "./builder";

export type { RouteDefinition } from "./builder";