/**
 * @file index.ts
 * @description
 * Entry point for the @terajs/router package.
 */

export { 
  inferPathFromFile, 
  buildRouteFromSFC 
} from "./builder";

export type { RouteDefinition } from "./builder";
