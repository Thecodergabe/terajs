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
import type { SSRContext } from "./types";
import {
  renderHydrationMarker,
  renderHydrationData,
  resolveHydration,
  renderAttrs,
  renderText,
  renderInterp,
  renderPortal,
  renderSlot,
  renderIf,
  renderFor
} from "./renderToString";

function isSuspenseElement(node: IRElementNode): boolean {
  return node.tag.toLowerCase() === "suspense";
}

function renderNodeToStream(node: IRNode, scope: Record<string, unknown>): Array<string | Promise<string>> {
  switch (node.type) {
    case "text":
      return [renderText(node as IRTextNode)];
    case "interp":
      return [renderInterp(node as IRInterpolationNode, scope)];
    case "element":
      return renderElementToStream(node as IRElementNode, scope);
    case "portal":
      return [renderPortal(node as IRPortalNode, scope)];
    case "slot":
      return [renderSlot(node as IRSlotNode, scope)];
    case "if":
      return [renderIf(node as IRIfNode, scope)];
    case "for":
      return [renderFor(node as IRForNode, scope)];
    default:
      return [""];
  }
}

function renderNodesToStream(nodes: IRNode[], scope: Record<string, unknown>) {
  return nodes.flatMap((node) => renderNodeToStream(node, scope));
}

function renderElementToStream(node: IRElementNode, scope: Record<string, unknown>) {
  if (isSuspenseElement(node)) {
    return renderSuspenseToStream(node, scope);
  }

  const attrs = renderAttrs(node.props, scope);
  const openTag = `<${node.tag}${attrs}>`;
  const closeTag = `</${node.tag}>`;
  const childChunks = renderNodesToStream(node.children, scope);

  return [openTag, ...childChunks, closeTag];
}

function partitionSuspenseChildren(node: IRElementNode) {
  const primary: IRNode[] = [];
  const fallback: IRNode[] = [];

  for (const child of node.children) {
    if (child.type === "slot" && (child as IRSlotNode).name === "fallback") {
      fallback.push(...(child as IRSlotNode).fallback);
      continue;
    }

    primary.push(child);
  }

  return { primary, fallback };
}

function renderSuspenseToStream(node: IRElementNode, scope: Record<string, unknown>) {
  const id = `terajs-suspense-${Math.random().toString(36).slice(2, 10)}`;
  const { primary, fallback } = partitionSuspenseChildren(node);
  const fallbackChunks = renderNodesToStream(fallback, scope);
  const fallbackHtml = fallback.length > 0 ? flattenChunks(fallbackChunks) : Promise.resolve("");

  const primaryChunks = renderNodesToStream(primary, scope);
  const opening = `<div data-terajs-suspense-id="${id}" data-terajs-suspense="pending">`;
  const closing = `</div>`;
  const readyMarker = `<!--suspense-ready:${id}-->`;
  const resolvedContent = flattenChunks(primaryChunks);

  return [opening, fallbackHtml, closing, readyMarker, resolvedContent];
}

async function flattenChunks(chunks: Array<string | Promise<string>>): Promise<string> {
  const pieces: string[] = [];

  for (const chunk of chunks) {
    pieces.push(typeof chunk === "string" ? chunk : await chunk);
  }

  return pieces.join("");
}

export async function renderToStream(
  ir: IRModule,
  ctx: Partial<SSRContext> = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const scope = ctx.scope ?? {};
      const bodyChunks = renderNodesToStream(ir.template, scope);

      for (const chunk of bodyChunks) {
        const text = typeof chunk === "string" ? chunk : await chunk;
        controller.enqueue(encoder.encode(text));
      }

      const marker = renderHydrationMarker(resolveHydration(ir, ctx), {
        ai: ctx.ai ?? ir.ai,
        resources: ctx.resources,
        routeSnapshot: ctx.routeSnapshot
      });
      controller.enqueue(encoder.encode(marker));
      controller.enqueue(encoder.encode(renderHydrationData(ctx.data ?? {})));
      controller.close();
    }
  });
}
