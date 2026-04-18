# create-terajs

Create a new Terajs application with npm's `create` flow.

## Usage

```bash
npm create terajs@latest my-app
```

### Realtime preset

```bash
npm create terajs@latest my-app -- --hub socket.io --hub-url https://api.example.com/live
```

### Next steps

```bash
cd my-app
npm install
npm run dev
```