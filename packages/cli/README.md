# @terajs/cli

Command-line tooling for scaffolding and running Terajs projects.

This package backs the official Terajs scaffold flow and exposes project maintenance commands.

## Quickstart

```bash
npm create terajs@latest my-app
cd my-app
npm install
npm run dev
```

## Commands

- `tera init <name>`: scaffold a new Terajs project
- `tera init <name> --hub <signalr|socket.io|websockets> [--hub-url <url>]`: scaffold a project preconfigured for realtime hub transport
- `tera doctor`: inspect a Terajs project and report missing or broken setup
- `tera dev --port <number>`: start Vite dev server with Terajs plugin
- `tera build`: build production output with Terajs plugin

Scaffolded projects target the app-facing launch surface:

- `@terajs/app`
- `@terajs/app/vite`
- `terajs.config.cjs`
- `.tera` route/page structure under `src/pages`

## Notes

- Generated projects include `.tera` file association defaults for VS Code.
- Realtime scaffolds can preconfigure `sync.hub` for SignalR, Socket.IO, or raw WebSockets.
- `create-terajs` is the public one-command entrypoint for app creation.
