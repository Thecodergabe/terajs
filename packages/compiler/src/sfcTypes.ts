import type { HydrationMode } from "@terajs/shared";

export interface RouteOverride {
  path?: string;
  layout?: string;
  middleware?: string | string[];
  prerender?: boolean;
  hydrate?: HydrationMode;
  edge?: boolean;
}

export interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  aiSummary?: "auto" | string;
  aiKeywords?: "auto" | string[];
  aiAltText?: "auto" | boolean;
  schema?: unknown;
  analytics?: {
    track?: boolean;
    events?: string[];
  };
  performance?: {
    priority?: "low" | "normal" | "high";
    hydrate?: HydrationMode;
    cache?: string;
    edge?: boolean;
  };
  a11y?: {
    autoAlt?: boolean;
    autoLabel?: boolean;
    autoLandmarks?: boolean;
  };
  i18n?: {
    languages?: string[];
    autoTranslate?: boolean;
  };
}

export interface ParsedSFC {
  filePath: string;
  template: string | { content: string };
  script: string | { content: string; lang?: string };
  style: string | { content: string; scoped?: boolean; lang?: string } | null;
  meta: MetaConfig;
  ai?: Record<string, any>;
  routeOverride: RouteOverride | null;
}