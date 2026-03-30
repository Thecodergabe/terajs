import { MetaConfig, ParsedSFC, RouteOverride } from "./types";

/**
 * Extracts the inner content of a simple block like <template>...</template>.
 * This is a minimal implementation; you can replace it with a proper parser later.
 */
function extractBlock(source: string, tag: string): string | null {
  const open = `<${tag}>`;
  const close = `</${tag}>`;
  const start = source.indexOf(open);
  if (start === -1) return null;
  const end = source.indexOf(close, start + open.length);
  if (end === -1) return null;
  return source.slice(start + open.length, end).trim();
}

/**
 * Parses the raw contents of a `<meta>` block into a MetaConfig object.
 * For now this is a stub; you can later support YAML/JSON-like syntax.
 */
function parseMeta(raw: string | null): MetaConfig {
  if (!raw || !raw.trim()) return {};
  // TODO: implement a real parser (YAML/JSON-ish) for meta blocks.
  // For now, return an empty object to keep the types wired.
  return {};
}

/**
 * Parses the raw contents of a `<route>` block into a RouteOverride object.
 * For now this is a stub; you can later support YAML/JSON-like syntax.
 */
function parseRoute(raw: string | null): RouteOverride | null {
  if (!raw || !raw.trim()) return null;
  // TODO: implement a real parser (YAML/JSON-ish) for route blocks.
  // For now, return an empty object to keep the types wired.
  return {};
}

/**
 * Parses a Nebula SFC++ source string into a structured ParsedSFC object.
 *
 * @param source - Full text contents of the .nbl file.
 * @param filePath - Absolute or project-relative path to the file.
 */
export function parseSFC(source: string, filePath: string): ParsedSFC {
  const template = extractBlock(source, "template") ?? "";
  const script = extractBlock(source, "script") ?? "";
  const style = extractBlock(source, "style");
  const metaRaw = extractBlock(source, "meta");
  const routeRaw = extractBlock(source, "route");

  const meta = parseMeta(metaRaw);
  const routeOverride = parseRoute(routeRaw);

  return {
    filePath,
    template,
    script,
    style: style ?? null,
    meta,
    routeOverride,
  };
}
