# @terajs/cli

Command-line tooling for scaffolding and running Terajs projects.

Status: internal package (`private: true`) used for Terajs development and external smoke validation.

## Commands

- `tera init <name>`: scaffold a new Terajs project
- `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`: scaffold a project preconfigured for realtime hub transport
- `tera doctor`: inspect a Terajs project and report missing or broken setup
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build`: build production output with Terajs plugin

## Typical Flow

```bash
tera init my-app
cd my-app
npm install
npm run dev
```

Scaffolded projects target the app-facing launch surface:

- `@terajs/app`
- `@terajs/app/vite`
- `terajs.config.cjs`
- `.tera` route/page structure under `src/pages`

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- Publish behavior is intentionally disabled while CLI surface remains internal.
