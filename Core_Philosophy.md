# Terajs Core Philosophy

Terajs is guided by a few hard architectural commitments. These are the rules that shape the framework even when convenience would pull in a different direction.

## 1. Compiler-native, not runtime-heavy

Terajs is built around a compiler pipeline, IR generation, and fine-grained bindings rather than a VDOM rerender loop.

That matters because it keeps the mental model aligned with the runtime model:

- reactive reads stay explicit
- updates stay local to the nodes that consumed them
- renderer work follows compiler output instead of component tree diffing

## 2. Framework-agnostic core, adapter-specific edges

The core of Terajs must stay neutral.

Packages such as `shared`, `reactivity`, `runtime`, `compiler`, `router`, and `sfc` should not grow browser glue, Vite glue, or host-framework glue just because it is convenient for a feature in the short term.

Environment-specific behavior belongs in:

- renderers like `renderer-web` and `renderer-ssr`
- toolchain adapters like the Vite plugin
- interoperability wrappers like `@terajs/adapter-react` and `@terajs/adapter-vue`

This is what allows Terajs to be framework-agnostic without pretending existing ecosystems do not exist.

## 3. Interop without compatibility theater

React and Vue wrappers are valuable, but Terajs should not distort its core model to mimic them internally.

The rule is simple:

- integrate with host frameworks at the seam
- keep application logic and neutral contracts Terajs-native
- avoid importing React/Vue lifecycle assumptions into the core

That is how Terajs can be practical in mixed stacks without becoming a clone of another framework.

## 4. Route-first application structure

Routing is part of the application model, not a bolt-on package.

Terajs favors a route-first structure where pages, layouts, metadata, middleware, and load behavior all compose through the same pipeline. The route tree should tell the truth about the app.

## 5. Local-first behavior belongs in the runtime

Terajs treats local-first concerns as framework-level runtime behavior, not purely app-specific infrastructure.

That means the runtime should continue to own:

- action and resource state
- invalidation flows
- queued mutation delivery
- retry policy
- conflict handling seams
- structured queue telemetry for diagnostics

The goal is not to force one sync architecture on every app. The goal is to make durable, inspectable local-first behavior a first-class option.

## 6. Diagnostics are part of the product

Terajs should be unusually legible when something goes wrong.

That means investing in:

- traceable reactive updates
- route timing and guard visibility
- queue lifecycle visibility
- structured runtime events
- component drill-down
- tooling that uses structured state instead of scraping arbitrary DOM

If the framework is hard to inspect, the architecture is not finished.

## 7. TypeScript-first, never TypeScript-required

TypeScript should improve the developer experience without gatekeeping the framework.

- TypeScript users should get strong inference and good surface area
- JavaScript users should still use the same runtime contracts
- public APIs should avoid TS-only tricks that create a two-tier experience

## 8. Flexibility with boundaries

Terajs should stay flexible, but flexibility is not the same thing as architectural blur.

Developers should be able to:

- author in `.tera` SFCs or TSX/JSX
- use the facade package or leaf packages
- style however they want
- integrate with existing React or Vue applications
- build custom renderers or adapters

But the framework should still preserve the distinction between neutral contracts and adapters, between launch docs and roadmap docs, and between shipped behavior and direction.

## 9. Performance should not require a harder mental model

Performance wins only matter if the programming model stays readable.

Terajs should keep chasing:

- direct updates
- predictable reactive ownership
- small responsibilities
- compiler help where it reduces runtime cost

without turning ordinary application code into an expert-only system.
