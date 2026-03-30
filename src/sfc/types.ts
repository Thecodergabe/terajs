/**
 * Hydration strategies supported by Nebula SFC++.
 *
 * - "eager": Hydrate immediately after SSR.
 * - "visible": Hydrate when the component becomes visible in the viewport.
 * - "idle": Hydrate when the browser is idle.
 * - "interaction": Hydrate on first user interaction (click, focus, etc.).
 * - "none": Never hydrate; stays static HTML.
 * - "ai": Let an AI strategy decide the best hydration mode.
 */
export type HydrationMode =
  | "eager"
  | "visible"
  | "idle"
  | "interaction"
  | "none"
  | "ai";

/**
 * Optional route overrides declared inside an SFC `<route>` block.
 * These override the defaults inferred from the file path and pages directory.
 */
export interface RouteOverride {
  /** Custom path for this route, e.g. "/blog/:slug". */
  path?: string;
  /** Named layout to use, e.g. "default", "admin". */
  layout?: string;
  /** Middleware name(s) to run before entering this route. */
  middleware?: string | string[];
  /** Whether this route should be prerendered at build time. */
  prerender?: boolean;
  /** Hydration strategy for this route. */
  hydrate?: HydrationMode;
  /** Whether this route should run on the edge runtime. */
  edge?: boolean;
}

/**
 * Metadata configuration declared inside an SFC `<meta>` block.
 * This drives SEO, AI, analytics, performance, and accessibility behavior.
 */
export interface MetaConfig {
  /** Page title, used for <title> and SEO. */
  title?: string;
  /** Page description, used for meta description and previews. */
  description?: string;
  /** Keywords for SEO; can be a string or list of strings. */
  keywords?: string[] | string;

  /** AI-generated or explicit summary of the page. */
  aiSummary?: "auto" | string;
  /** AI-generated or explicit keywords. */
  aiKeywords?: "auto" | string[];
  /** Whether to auto-generate alt text for images. */
  aiAltText?: "auto" | boolean;

  /** Arbitrary schema.org / JSON-LD configuration. */
  schema?: unknown;

  /** Analytics configuration for this page. */
  analytics?: {
    /** Whether to track this page in analytics. */
    track?: boolean;
    /** Named events to emit when this page is viewed or interacted with. */
    events?: string[];
  };

  /** Performance-related hints and configuration. */
  performance?: {
    /** Relative priority of this page. */
    priority?: "low" | "normal" | "high";
    /** Hydration strategy override at the meta level. */
    hydrate?: HydrationMode;
    /** Cache hint, e.g. "1h", "5m". */
    cache?: string;
    /** Whether this page should run on the edge runtime. */
    edge?: boolean;
  };

  /** Accessibility-related hints and AI helpers. */
  a11y?: {
    /** Auto-generate alt text where missing. */
    autoAlt?: boolean;
    /** Auto-generate labels where missing. */
    autoLabel?: boolean;
    /** Enforce or auto-add landmark roles. */
    autoLandmarks?: boolean;
  };

  /** Internationalization-related configuration. */
  i18n?: {
    /** Supported languages for this page. */
    languages?: string[];
    /** Whether to auto-translate content. */
    autoTranslate?: boolean;
  };
}

/**
 * Parsed representation of a Nebula SFC++ file.
 * This is the result of splitting out <template>, <script>, <style>, <meta>, and <route>.
 */
export interface ParsedSFC {
  /** Absolute or project-relative file path of the SFC. */
  filePath: string;
  /** Raw contents of the <template> block. */
  template: string;
  /** Raw contents of the <script> block. */
  script: string;
  /** Raw contents of the <style> block, if present. */
  style: string | null;
  /** Parsed metadata configuration from the <meta> block. */
  meta: MetaConfig;
  /** Parsed route override configuration from the <route> block, if present. */
  routeOverride: RouteOverride | null;
}
