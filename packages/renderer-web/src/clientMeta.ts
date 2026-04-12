import type { MetaConfig } from "@terajs/shared";

function normalizeMetaString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const lower = trimmed.toLowerCase();
  if (lower === "undefined" || lower === "null") {
    return "";
  }

  return trimmed;
}

function normalizeContent(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return normalizeMetaString(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeMetaString(item) || String(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && item.toLowerCase() !== "undefined" && item.toLowerCase() !== "null")
      .join(", ");
  }

  const normalized = normalizeMetaString(value);
  if (normalized) {
    return normalized;
  }

  return String(value);
}

function syncMetaTag(name: string, content: string | undefined, attrName: "name" | "property" = "name"): void {
  if (typeof document === "undefined") {
    return;
  }

  const selector = `meta[${attrName}="${name}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    el?.remove();
    return;
  }

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, name);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
}

export function updateHead(meta: MetaConfig, ai?: Record<string, unknown>): void {
  if (typeof document === "undefined") return;
  if (!meta || typeof meta !== "object") return;

  const title = normalizeMetaString(meta.title);
  if (title) {
    document.title = title;
  }

  for (const [key, value] of Object.entries(meta)) {
    if (key === "title") {
      continue;
    }

    const content = normalizeContent(value);
    if (key.startsWith("og:")) {
      syncMetaTag(key, content || undefined, "property");
      continue;
    }

    syncMetaTag(key, content || undefined, "name");
  }

  const aiContent = ai && typeof ai === "object" && Object.keys(ai).length > 0
    ? JSON.stringify(ai)
    : undefined;
  syncMetaTag("terajs-ai-hint", aiContent, "name");
}