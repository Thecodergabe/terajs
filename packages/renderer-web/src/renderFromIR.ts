/**
 * @file renderFromIR.ts
 * @description
 * Reactive client-side DOM renderer for Nebula's IR.
 */

import type {
  IRModule,
  IRNode,
  IRTextNode,
  IRInterpolationNode,
  IRElementNode,
  IRIfNode,
  IRForNode,
  IRPropNode,
} from "@terajs/compiler";

import {
  createElement,
  createText,
  createFragment,
  insert,
  remove,
} from "./dom";

import {
  bindText,
  bindProp,
  bindClass,
  bindStyle,
  bindEvent,
} from "./bindings";

import { effect } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";

/* -------------------------------------------------------------------------- */
/*                             PUBLIC ENTRY POINTS                            */
/* -------------------------------------------------------------------------- */

export function renderIRModuleToFragment(ir: IRModule, ctx: any): DocumentFragment {
  Debug.emit("ir:render:module", { filePath: ir.filePath });

  const frag = createFragment();

  for (const node of ir.template) {
    const dom = renderIRNode(node, ctx);
    if (dom) insert(frag, dom);
  }

  return frag;
}

export function renderIRNode(node: IRNode, ctx: any): Node | null {
  switch (node.type) {
    case "text":
      return renderIRText(node);
    case "interp":
      return renderIRInterpolation(node, ctx);
    case "element":
      return renderIRElement(node, ctx);
    case "if":
      return renderIRIf(node, ctx);
    case "for":
      return renderIRFor(node, ctx);
    default:
      Debug.emit("error:renderer", { message: "Unknown IR node", node });
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   TEXT                                     */
/* -------------------------------------------------------------------------- */

function renderIRText(node: IRTextNode): Text {
  Debug.emit("ir:render:text", { value: node.value });
  return createText(node.value);
}

/* -------------------------------------------------------------------------- */
/*                              INTERPOLATION                                 */
/* -------------------------------------------------------------------------- */

function renderIRInterpolation(node: IRInterpolationNode, ctx: any): Text {
  Debug.emit("ir:render:interp", { expression: node.expression });

  const text = createText("");

  bindText(text, () => resolveExpr(ctx, node.expression));

  return text;
}

/* -------------------------------------------------------------------------- */
/*                                  ELEMENT                                   */
/* -------------------------------------------------------------------------- */

function renderIRElement(node: IRElementNode, ctx: any): HTMLElement {
  Debug.emit("ir:render:element", { tag: node.tag });

  const el = createElement(node.tag);

  applyIRProps(el, node.props, ctx);

  for (const child of node.children) {
    const dom = renderIRNode(child, ctx);
    if (dom) insert(el, dom);
  }

  return el;
}

function applyIRProps(el: HTMLElement, props: IRPropNode[], ctx: any): void {
  for (const p of props) {
    switch (p.kind) {
      case "static":
        applyStaticProp(el, p);
        break;

      case "bind":
        applyBindProp(el, p, ctx);
        break;

      case "event":
        applyEventProp(el, p, ctx);
        break;

      default:
        Debug.emit("ir:render:prop:skip", p);
    }
  }
}

function applyStaticProp(el: HTMLElement, p: IRPropNode): void {
  if (p.name === "class") {
    el.className = String(p.value ?? "");
  } else if (p.name === "style" && typeof p.value === "object") {
    const styleObj = p.value as Record<string, any>;
    for (const key in styleObj) {
      el.style[key as any] = String(styleObj[key]);
    }
  } else {
    if (p.value != null) el.setAttribute(p.name, String(p.value));
  }
}

function applyBindProp(el: HTMLElement, p: IRPropNode, ctx: any): void {
  const expr = String(p.value);

  if (p.name === "class") {
    bindClass(el, () => resolveExpr(ctx, expr));
    return;
  }

  if (p.name === "style") {
    bindStyle(el, () => {
      const v = resolveExpr(ctx, expr);

      if (typeof v === "string") return { color: v };

      return v || {};
    });
    return;
  }

  bindProp(el, p.name, () => resolveExpr(ctx, expr));
}

function applyEventProp(el: HTMLElement, p: IRPropNode, ctx: any): void {
  const handler = resolveExpr(ctx, String(p.value));

  if (typeof handler === "function") {
    bindEvent(el, p.name, handler);
  } else {
    Debug.emit("error:renderer", {
      message: `Event handler '${p.value}' is not a function`,
      value: handler,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                    IF                                      */
/* -------------------------------------------------------------------------- */

function renderIRIf(node: IRIfNode, ctx: any): Node {
  Debug.emit("ir:render:if", { condition: node.condition });

  const anchor = document.createComment("if");
  const parent = createFragment();
  parent.appendChild(anchor);

  effect(() => {
    const condition = !!resolveExpr(ctx, node.condition);
    const branch = condition ? node.then : node.else ?? [];

    // Remove old nodes
    let next = anchor.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      remove(toRemove);
    }

    // Insert new nodes in correct order
    let ref: ChildNode | null = anchor.nextSibling;
    for (const child of branch) {
      const dom = renderIRNode(child, ctx);
      if (dom) {
        insert(parent, dom, ref ?? null);
        ref = null;
      }
    }
  });

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                                    FOR                                     */
/* -------------------------------------------------------------------------- */

function renderIRFor(node: IRForNode, ctx: any): Node {
  Debug.emit("ir:render:for", { each: node.each });

  const anchor = document.createComment("for");
  const parent = createFragment();
  parent.appendChild(anchor);

  effect(() => {
    const array = resolveExpr(ctx, node.each) || [];
    const nodes: Node[] = [];

    for (let i = 0; i < array.length; i++) {
      const childCtx = {
        ...ctx,
        [node.item]: array[i],
        [node.index ?? "i"]: i,
      };

      const frag = createFragment();
      for (const child of node.body) {
        const dom = renderIRNode(child, childCtx);
        if (dom) frag.appendChild(dom);
      }

      nodes.push(frag);
    }

    // Clear old
    let next = anchor.nextSibling;
    while (next) {
      const toRemove = next;
      next = next.nextSibling;
      remove(toRemove);
    }

    // Insert new in correct order
    let ref: ChildNode | null = anchor.nextSibling;
    for (const n of nodes) {
      insert(parent, n, ref ?? null);
      ref = null;
    }
  });

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                             EXPRESSION RESOLUTION                          */
/* -------------------------------------------------------------------------- */

function resolveExpr(ctx: any, expr: string): any {
  if (!ctx) return undefined;

  if (expr in ctx) {
    const raw = ctx[expr];
    return typeof raw === "function" ? raw() : raw;
  }

  const parts = expr.split(".");
  let current: any = ctx;

  for (const part of parts) {
    if (current == null) return undefined;
    const value = current[part];
    current = typeof value === "function" ? value() : value;
  }

  return current;
}

