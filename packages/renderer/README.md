# @terajs/renderer

Platform-agnostic renderer contracts for Terajs.

This package contains the neutral renderer layer used by web, SSR, and future native renderer implementations. Most application code should start with `@terajs/app` or `@terajs/renderer-web`; use `@terajs/renderer` when you are building a renderer, tooling, or another lower-level integration.

## Install

```bash
npm install @terajs/renderer
```

## What it exports

- AST node types such as `ASTNode`, `ElementNode`, `TextNode`, `InterpolationNode`, `IfNode`, and `ForNode`
- renderer contracts such as `RenderContext` and `Renderer`
- template and component contracts such as `TemplateFn` and `FrameworkComponent`
- mount contracts such as `MountAPI` and `MountOptions`
- hydration contracts such as `HydrationAPI` and `HydrationMode`
- shared renderer errors such as `RendererError` and `UnsupportedNodeError`

## Renderer contract example

```ts
import type { RenderContext, Renderer } from "@terajs/renderer";

export const renderer: Renderer = {
  renderElement(node, ctx: RenderContext) {
    return { type: node.tag, children: node.children, ctx };
  },
  renderText(node) {
    return node.value;
  },
  renderInterpolation(node, ctx) {
    return node.expression(ctx);
  },
  renderIf(node, ctx) {
    return node.condition(ctx) ? node.thenBranch : node.elseBranch;
  },
  renderFor(node, ctx) {
    return node.iterable(ctx).map((item) => node.render(item, ctx));
  },
  renderNode(node, ctx) {
    switch (node.type) {
      case "Text":
        return this.renderText(node, ctx);
      default:
        throw new Error(`Unhandled node type: ${node.type}`);
    }
  }
};
```

## Notes

- This package is intentionally renderer-neutral and should not absorb DOM, browser-history, or adapter-specific behavior.
- `@terajs/renderer-web` is the production-ready web implementation built on these contracts.
- Experimental native renderer work in `packages/renderer-ios` and `packages/renderer-android` should also align to this layer.