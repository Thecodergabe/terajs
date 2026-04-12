/**
 * @file renderFromIR.ts
 * @description
 * Reactive client-side DOM renderer for Terajs's IR.
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
  IRForNode,
  IRPropNode,
} from "@terajs/compiler";

import {
  createElement,
  createText,
  createFragment,
  insert,
  remove,
  addNodeCleanup,
} from "./dom.js";

import { renderComponent, type FrameworkComponent } from "./render.js";

import {
  bindText,
  bindProp,
  bindClass,
  bindStyle,
  bindEvent,
} from "./bindings.js";

import { dispose, effect } from "@terajs/reactivity";
import { Debug } from "@terajs/shared";
import { Portal as WebPortal } from "./portal.js";

/* -------------------------------------------------------------------------- */
/*                             PUBLIC ENTRY POINTS                            */
/* -------------------------------------------------------------------------- */

/**
 * Renders a compiled IR module into a detached document fragment.
 *
 * This is the primary bridge between compiler output and the web renderer.
 * It walks the module template, renders each IR node with the provided
 * execution context, and returns a fragment ready for insertion.
 *
 * @param ir - The compiled IR module produced by the compiler or SFC pipeline.
 * @param ctx - The runtime execution context used to resolve bindings, slots, and events.
 * @returns A document fragment containing the rendered module output.
 */
export function renderIRModuleToFragment(ir: IRModule, ctx: any): DocumentFragment {
  Debug.emit("ir:render:module", { filePath: ir.filePath });

  const frag = createFragment();

  for (const node of ir.template) {
    const dom = renderIRNode(node, ctx);
    if (dom) insert(frag, dom);
  }

  return frag;
}

/**
 * Renders a single IR node into a DOM node.
 *
 * The renderer supports text, interpolation, element, portal, slot, `if`,
 * and `for` node kinds. Unknown node types emit a renderer error and return
 * `null` so callers can continue rendering surrounding output.
 *
 * @param node - The IR node to render.
 * @param ctx - The runtime execution context used to resolve bindings and slots.
 * @param isSvg - Whether the current render position is inside an SVG subtree.
 * @returns The rendered DOM node, or `null` when the node cannot be rendered.
 */
export function renderIRNode(node: IRNode, ctx: any, isSvg: boolean = false): Node | null {
  switch (node.type) {
    case "text":
      return renderIRText(node);
    case "interp":
      return renderIRInterpolation(node, ctx);
    case "element":
      return renderIRElement(node, ctx, isSvg);
    case "portal":
      return renderIRPortal(node, ctx, isSvg);
    case "slot":
      return renderIRSlot(node, ctx, isSvg);
    case "if":
      return renderIRIf(node, ctx, isSvg);
    case "for":
      return renderIRFor(node, ctx, isSvg);
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

function renderIRElement(node: IRElementNode, ctx: any, isSvg: boolean): Element {
  const component = resolveComponentBinding(ctx, node.tag);
  if (component) {
    return renderIRComponent(node, component, ctx, isSvg) as Element;
  }

  Debug.emit("ir:render:element", { tag: node.tag, svg: isSvg });

  const nextSvg = isSvg || node.tag === "svg";
  const el = createElement(node.tag, nextSvg);

  applyIRProps(el, node.props, ctx);

  for (const child of node.children) {
    const dom = renderIRNode(child, ctx, nextSvg);
    if (dom) insert(el, dom);
  }

  return el;
}

function renderIRComponent(
  node: IRElementNode,
  component: FrameworkComponent,
  ctx: any,
  isSvg: boolean
): Node {
  Debug.emit("ir:render:component", { tag: node.tag });

  const props = buildComponentProps(node, ctx, isSvg);
  const rendered = renderComponent(component, props);
  const cleanup = createComponentCleanup(rendered.ctx);

  queueMicrotask(() => {
    if (!cleanup.active()) {
      return;
    }

    runMountedHooks(rendered.ctx);
  });

  attachComponentCleanup(rendered.node, cleanup.dispose);

  return normalizeRenderedComponentNode(rendered.node);
}

function renderIRPortal(node: IRPortalNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:portal", {
    hasTarget: node.target != null
  });

  return WebPortal({
    to: resolvePortalTarget(node.target, ctx),
    children: node.children.map((child) => renderIRNode(child, ctx, isSvg))
  });
}

function renderIRSlot(node: IRSlotNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:slot", { name: node.name ?? "default" });

  const slotName = node.name ?? "default";
  const slotValue = ctx?.slots?.[slotName];

  if (slotValue != null) {
    return normalizeSlotValue(slotValue);
  }

  const frag = createFragment();
  for (const child of node.fallback) {
    const dom = renderIRNode(child, ctx, isSvg);
    if (dom) {
      insert(frag, dom);
    }
  }
  return frag;
}

function applyIRProps(el: Element, props: IRPropNode[], ctx: any): void {
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

function applyStaticProp(el: Element, p: IRPropNode): void {
  if (p.name === "class") {
    if (el instanceof HTMLElement) {
      el.className = String(p.value ?? "");
      return;
    }
  } else if (p.name === "style" && typeof p.value === "object") {
    const styleObj = p.value as Record<string, any>;
    const styleTarget = (el as HTMLElement | SVGElement).style;
    for (const key in styleObj) {
      styleTarget[key as any] = String(styleObj[key]);
    }
    return;
  }

  if (p.value != null) el.setAttribute(p.name, String(p.value));
}

function applyBindProp(el: Element, p: IRPropNode, ctx: any): void {
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

function applyEventProp(el: Element, p: IRPropNode, ctx: any): void {
  const handler = resolveEventHandler(ctx, String(p.value));

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

function renderIRIf(node: IRIfNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:if", { condition: node.condition });

  const anchor = document.createComment("if");
  const parent = createFragment();
  parent.appendChild(anchor);

  const effectFn = effect(() => {
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
      const dom = renderIRNode(child, ctx, isSvg);
      if (dom) {
        insert(parent, dom, ref ?? null);
        ref = null;
      }
    }
  });

  addNodeCleanup(anchor, () => dispose(effectFn));

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                                    FOR                                     */
/* -------------------------------------------------------------------------- */

function renderIRFor(node: IRForNode, ctx: any, isSvg: boolean): Node {
  Debug.emit("ir:render:for", { each: node.each });

  const anchor = document.createComment("for");
  const parent = createFragment();
  parent.appendChild(anchor);

  const effectFn = effect(() => {
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
        const dom = renderIRNode(child, childCtx, isSvg);
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

  addNodeCleanup(anchor, () => dispose(effectFn));

  return parent;
}

/* -------------------------------------------------------------------------- */
/*                             EXPRESSION RESOLUTION                          */
/* -------------------------------------------------------------------------- */

const SIMPLE_PATH_RE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
const RESERVED_LITERAL_RE = /^(?:true|false|null|undefined|NaN|Infinity)$/;
const expressionEvaluatorCache = new Map<string, (ctx: any, event: Event | undefined) => any>();

function resolveExpr(ctx: any, expr: string): any {
  const normalized = expr.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (isSimplePath(normalized)) {
    return resolveSimplePath(ctx, normalized, true);
  }

  return evaluateExpression(ctx, normalized, undefined);
}

function resolveEventHandler(ctx: any, expr: string): EventListener | undefined {
  const normalized = expr.trim();

  if (normalized.length === 0) {
    return undefined;
  }

  if (isSimplePath(normalized)) {
    const handler = resolveSimplePath(ctx, normalized, false);
    return typeof handler === "function" ? handler as EventListener : undefined;
  }

  return (event: Event) => {
    evaluateExpression(ctx, normalized, event);
  };
}

function isSimplePath(expr: string): boolean {
  return SIMPLE_PATH_RE.test(expr) && !RESERVED_LITERAL_RE.test(expr);
}

function resolveSimplePath(ctx: any, expr: string, invokeFinal: boolean): any {
  if (!ctx) {
    return undefined;
  }

  const parts = expr.split(".");
  let current: any = ctx;

  for (let index = 0; index < parts.length; index += 1) {
    if (current == null) {
      return undefined;
    }

    const value = current[parts[index]];
    const isLast = index === parts.length - 1;
    current = typeof value === "function" && (invokeFinal || !isLast) ? value() : value;
  }

  return current;
}

function evaluateExpression(ctx: any, expr: string, event: Event | undefined): any {
  const evaluator = getExpressionEvaluator(expr);

  try {
    return evaluator(ctx, event);
  } catch (error) {
    Debug.emit("error:renderer", {
      message: `Failed to evaluate expression '${expr}'`,
      expression: expr,
      error,
    });
    return undefined;
  }
}

function getExpressionEvaluator(expr: string): (ctx: any, event: Event | undefined) => any {
  const cached = expressionEvaluatorCache.get(expr);

  if (cached) {
    return cached;
  }

  const evaluator = new Function(
    "$ctx",
    "$event",
    [
      "const scope = $ctx ?? {};",
      "with (scope) {",
      `  return (${expr});`,
      "}",
    ].join("\n"),
  ) as (ctx: any, event: Event | undefined) => any;

  expressionEvaluatorCache.set(expr, evaluator);
  return evaluator;
}

function resolveComponentBinding(ctx: any, tag: string): FrameworkComponent | null {
  if (!isComponentTag(tag)) {
    return null;
  }

  const registry = ctx?.__components;

  if (!registry || typeof registry !== "object") {
    return null;
  }

  const resolved = registry[tag];
  return typeof resolved === "function" ? resolved as FrameworkComponent : null;
}

function isComponentTag(tag: string): boolean {
  if (typeof tag !== "string" || tag.length === 0) {
    return false;
  }

  const first = tag[0];
  return first >= "A" && first <= "Z";
}

function buildComponentProps(node: IRElementNode, ctx: any, isSvg: boolean): Record<string, any> {
  const props: Record<string, any> = {};

  for (const prop of node.props) {
    if (prop.kind === "static") {
      props[prop.name] = prop.value;
      continue;
    }

    if (prop.kind === "bind") {
      props[prop.name] = resolveExpr(ctx, String(prop.value));
      continue;
    }

    if (prop.kind === "event") {
      const handler = resolveEventHandler(ctx, String(prop.value));
      if (typeof handler === "function") {
        props["on" + capitalize(prop.name)] = handler;
      }
    }
  }

  if (node.children.length > 0) {
    props.children = () => {
      const frag = createFragment();

      for (const child of node.children) {
        const dom = renderIRNode(child, ctx, isSvg);
        if (dom) {
          insert(frag, dom);
        }
      }

      return frag;
    };
  }

  return props;
}

function runMountedHooks(ctx: any): void {
  if (!ctx?.mounted) {
    return;
  }

  for (const fn of ctx.mounted) {
    try {
      fn();
    } catch (error) {
      Debug.emit("error:component", {
        name: ctx.name,
        instance: ctx.instance,
        error,
      });
    }
  }
}

function createComponentCleanup(ctx: any): { active: () => boolean; dispose: () => void } {
  let disposed = false;

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;

    if (ctx?.unmounted) {
      for (const fn of ctx.unmounted) {
        try {
          fn();
        } catch (error) {
          Debug.emit("error:component", {
            name: ctx.name,
            instance: ctx.instance,
            error,
          });
        }
      }
    }

    if (ctx?.disposers) {
      for (const cleanup of ctx.disposers) {
        try {
          cleanup();
        } catch {
          // user cleanup errors are non-fatal during teardown
        }
      }

      ctx.disposers.length = 0;
    }
  };

  return {
    active: () => !disposed,
    dispose,
  };
}

function attachComponentCleanup(node: Node, cleanup: () => void): void {
  if (node instanceof DocumentFragment) {
    const children = Array.from(node.childNodes);

    for (const child of children) {
      addNodeCleanup(child, cleanup);
    }

    return;
  }

  addNodeCleanup(node, cleanup);
}

function normalizeRenderedComponentNode(node: Node): Node {
  if (node instanceof DocumentFragment && node.childNodes.length === 1) {
    return node.firstChild as Node;
  }

  return node;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function resolvePortalTarget(target: IRPropNode | undefined, ctx: any): any {
  if (!target) {
    return undefined;
  }

  if (target.kind === "bind") {
    return resolveExpr(ctx, String(target.value));
  }

  return target.value;
}

function normalizeSlotValue(value: any): Node {
  if (typeof value === "function") {
    return normalizeSlotValue(value());
  }

  if (value == null || value === false || value === true) {
    return createFragment();
  }

  if (value instanceof Node) {
    return value;
  }

  if (Array.isArray(value)) {
    const frag = createFragment();
    for (const item of value) {
      insert(frag, normalizeSlotValue(item));
    }
    return frag;
  }

  return createText(String(value));
}

