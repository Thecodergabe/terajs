# Changelog

## 1.0.0

- Public Terajs release surface aligned to `1.0.0` across the publishable packages.
- App-facing facade stabilized around `@terajs/app`, `@terajs/app/vite`, and `@terajs/app/devtools`.
- DevTools development bridge shipped with the same-origin `/_terajs/devtools/bridge` manifest route, sanitized session export, live session reveal, and VS Code AI bridge hooks.
- Realtime transport coverage includes SignalR, Socket.IO, and raw WebSockets adapters.
- Local-first queue contracts ship with retry hooks, durable queue storage, and `MutationConflictResolver` strategies for `replace`, `ignore`, and `merge` decisions.
