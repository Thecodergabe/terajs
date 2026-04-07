/**
 * @file renderToString.ts
 * @description
 * Terajs's server-side renderer.
 *
 * Converts an IRModule (compiler output) into:
 * - HTML markup
 * - <head> metadata
 * - hydration hints for the client
 *
 * This renderer is intentionally minimal and renderer-agnostic.
 * It does not evaluate expressions or signals; it simply serializes
 * the IR tree into HTML.
 */

import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRPortalNode,
  IRSlotNode,
  IRIfNode,
  IRForNode
} from "@terajs/compiler";
import type { SSRContext, SSRResult, SSRHydrationHint } from "./types";

export interface SSRHtml {
  __ssrHtml: string;
}

export function createSSRHtml(html: string): SSRHtml {
  return { __ssrHtml: html };
}

export function isSSRHtml(value: unknown): value is SSRHtml {
  return typeof value === "object" && value !== null && "__ssrHtml" in value;
}

/**
 * Render a Terajs IRModule to an SSRResult.
 *
 * @param ir - The IRModule produced by the compiler.
 * @param ctx - Optional SSR context for overriding meta/route.
 * @returns SSRResult containing html, head, and hydration metadata.
 */
export function renderToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): SSRResult {
  const body = renderBodyToString(ir, ctx);
  const hydration = resolveHydration(ir, ctx);
  const marker = renderHydrationMarker(hydration, {
    ai: ctx.ai ?? ir.ai,
    resources: ctx.resources,
    routeSnapshot: ctx.routeSnapshot
  });
  const html = body + marker;
  const head = renderHead(ir, ctx);

  return {
    html,
    head,
    hydration,
    ai: ctx.ai ?? ir.ai,
    resources: ctx.resources,
    routeSnapshot: ctx.routeSnapshot
  };
}

export function renderBodyToString(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): string {
  const scope = ctx.scope ?? {};
  return ir.template.map((node) => renderNode(node, scope)).join("");
}

/**
 * Render a single IR node into HTML.
 *
 * @param node - The IR node to render.
 */
function renderNode(node: IRNode, scope: Record<string, unknown>): string {
  switch (node.type) {
    case "text":
      return renderText(node);
    case "interp":
      return renderInterp(node, scope);
    case "element":
      return renderElement(node, scope);
    case "portal":
      return renderPortal(node, scope);
    case "slot":
      return renderSlot(node, scope);
    case "if":
      return renderIf(node, scope);
    case "for":
      return renderFor(node, scope);
    default:
      return "";
  }
}

/**
 * Render a text node.
 */
function renderText(node: IRTextNode): string {
  return escapeText(node.value);
}

/**
 * Render an interpolation node.
 * SSR does not evaluate expressions yet, so this returns an empty string.
 */
function renderInterp(node: IRInterpolationNode, scope: Record<string, unknown>): string {
  const value = resolveExpr(scope, node.expression);
  if (value == null) {
    return "";
  }

  if (isSSRHtml(value)) {
    return value.__ssrHtml;
  }

  return escapeText(String(value));
}

/**
 * Render an element node and its children.
 */
function renderElement(node: IRElementNode, scope: Record<string, unknown>): string {
  const attrs = renderAttrs(node.props, scope);
  const children = node.children.map((child) => renderNode(child, scope)).join("");
  return `<${node.tag}${attrs}>${children}</${node.tag}>`;
}

function renderPortal(node: IRPortalNode, scope: Record<string, unknown>): string {
  return node.children.map((child) => renderNode(child, scope)).join("");
}

function renderSlot(node: IRSlotNode, scope: Record<string, unknown>): string {
  const slotName = node.name ?? "default";
  const slotValue = (scope.slots as Record<string, unknown> | undefined)?.[slotName];

  if (slotValue != null) {
    return renderSlotValue(slotValue);
  }

  return node.fallback.map((child) => renderNode(child, scope)).join("");
}

/**
 * Render a v-if node.
 */
function renderIf(node: IRIfNode, scope: Record<string, unknown>): string {
  if (resolveExpr(scope, node.condition)) {
    return node.then.map((child) => renderNode(child, scope)).join("");
  }
  return node.else?.map((child) => renderNode(child, scope)).join("") ?? "";
}

/**
 * Render a v-for node.
 * SSR does not evaluate expressions yet; it simply renders the body once.
 */
function renderFor(node: IRForNode, scope: Record<string, unknown>): string {
  const value = resolveExpr(scope, node.each);
  const items = Array.isArray(value) ? value : [];

  return items
    .map((item, index) => {
      const childScope = {
        ...scope,
        [node.item]: item,
        [node.index ?? "i"]: index
      };
      return node.body.map((child) => renderNode(child, childScope)).join("");
    })
    .join("");
}

/**
 * Render static HTML attributes.
 */
function renderAttrs(props: any[], scope: Record<string, unknown>): string {
  if (!props.length) return "";
  const parts: string[] = [];

  for (const p of props) {
    if (p.kind === "static") {
      parts.push(`${p.name}="${escapeAttr(String(p.value))}"`);
      continue;
    }

    if (p.kind === "bind") {
      const resolved = resolveExpr(scope, String(p.value));
      if (resolved == null || resolved === false) {
        continue;
      }

      if (p.name === "style" && typeof resolved === "object") {
        const style = Object.entries(resolved as Record<string, unknown>)
          .map(([key, value]) => `${key}:${String(value)}`)
          .join(";");
        if (style) {
          parts.push(`style="${escapeAttr(style)}"`);
        }
        continue;
      }

      if (p.name === "class" && Array.isArray(resolved)) {
        parts.push(`class="${escapeAttr(resolved.join(" "))}"`);
        continue;
      }

      if (resolved === true) {
        parts.push(p.name);
        continue;
      }

      parts.push(`${p.name}="${escapeAttr(String(resolved))}"`);
    }
  }

  return parts.length ? " " + parts.join(" ") : "";
}

/**
 * Render <head> metadata from IR meta + SSR context.
 */
export function renderHead(ir: IRModule, ctx: Partial<SSRContext>): string {
  const meta = { ...(ir.meta || {}), ...(ctx.meta || {}) };
  const parts: string[] = [];

  if (meta.title) {
    parts.push(`<title>${escapeText(String(meta.title))}</title>`);
  }
  if (meta.description) {
    parts.push(
      `<meta name="description" content="${escapeAttr(
        String(meta.description)
      )}">`
    );
  }

  return parts.join("");
}

/**
 * Determine the hydration mode from:
 * - route.hydrate
 * - meta.performance.hydrate
 * - SSR context overrides
 */
export function resolveHydration(
  ir: IRModule,
  ctx: Partial<SSRContext>
): SSRHydrationHint {
  const metaHydrate = ir.meta?.performance?.hydrate;
  const routeHydrate = ir.route?.hydrate;
  const ctxMetaHydrate = ctx.meta?.performance?.hydrate;
  const ctxRouteHydrate = ctx.route?.hydrate;

  const mode =
    ctxRouteHydrate ??
    ctxMetaHydrate ??
    routeHydrate ??
    metaHydrate ??
    "eager";

  return { mode };
}

/**
 * Emit a hydration marker script tag.
 *
 * This is consumed by the client renderer to determine how and when
 * to hydrate the server-rendered HTML.
 */
export function renderHydrationMarker(
  hint: SSRHydrationHint,
  payloadContext: {
    ai?: Record<string, any>;
    resources?: Record<string, unknown>;
    routeSnapshot?: SSRContext["routeSnapshot"];
  } = {}
): string {

  const payload: {
    mode: SSRHydrationHint["mode"];
    ai?: Record<string, any>;
    resources?: Record<string, unknown>;
    routeSnapshot?: SSRContext["routeSnapshot"];
  } = {
    mode: hint.mode
  };

  if (payloadContext.ai !== undefined) {
    payload.ai = payloadContext.ai;
  }

  if (payloadContext.routeSnapshot !== undefined) {
    payload.routeSnapshot = payloadContext.routeSnapshot;
  }

  if (payloadContext.resources !== undefined) {
    payload.resources = payloadContext.resources;
  }

  return `<script type="application/terajs-hydration">${JSON.stringify(payload)}</script>`;
}


/**
 * Escape text content for safe HTML output.
 */
function escapeText(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Escape attribute values for safe HTML output.
 */
function escapeAttr(v: string): string {
  return escapeText(v).replace(/"/g, "&quot;");
}

function resolveExpr(scope: Record<string, unknown>, expr: string): unknown {
  if (expr in scope) {
    const value = scope[expr];
    return typeof value === "function" ? value() : value;
  }

  const parts = expr.split(".");
  let current: unknown = scope;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    const value = (current as Record<string, unknown>)[part];
    current = typeof value === "function" ? value() : value;
  }

  return current;
}

function renderSlotValue(value: unknown): string {
  if (typeof value === "function") {
    return renderSlotValue(value());
  }

  if (value == null || value === false || value === true) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderSlotValue(item)).join("");
  }

  if (isSSRHtml(value)) {
    return value.__ssrHtml;
  }

  return escapeText(String(value));
}

