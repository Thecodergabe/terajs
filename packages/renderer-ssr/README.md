# @terajs/renderer-ssr

Server-side rendering package for Terajs.

Provides string and stream rendering helpers plus route execution helpers for SSR workflows.

Most applications meet this surface through framework or server integration layers. Use it directly when you are composing SSR around Terajs route modules and runtime hydration payloads.

## Install

```bash
npm install @terajs/renderer-ssr
```

## Core APIs

- `renderToString(component, context)`
- `renderToStream(component, context)`
- `executeServerRoute(options)`

## SSR context and result types

Important public types include:

- `SSRContext`
- `SSRHydrationHint`
- `SSRResult`
- `ExecuteServerRouteOptions`
- `ExecuteServerRouteResult`
- `SSRRouteModule`

`SSRContext` and `SSRResult` can carry:

- `meta`
- `route`
- optional `ai`
- serialized resources
- route hydration snapshots
- loader data

## Notes

- Pair with `@terajs/router` for route definitions and route loading contracts.
- Pair with `@terajs/renderer-web` for client hydration.
- Keep request/response transport logic in adapter layers where possible.
