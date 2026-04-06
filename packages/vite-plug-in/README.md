# Nebula Vite Plugin

This plugin enables Nebula SFC compilation, HMR, and auto-imports for your project.

## Features
- Compiles `.nbl` Single-File Components
- Hot Module Replacement (HMR) for SFCs
- **Auto-imports**: All components in configured directories are available globally in SFCs (no manual imports needed)

## Usage

### 1. Install and configure in your Vite project

```js
// vite.config.js or vite.config.ts
import nebulaPlugin from '@nebula/vite-plugin';

export default {
  plugins: [nebulaPlugin()]
};
```

### 2. Auto-imports

By default, all `.nbl` files in `packages/devtools/src/components` are auto-imported and available in your SFCs.

#### Example
Suppose you have:

```
packages/devtools/src/components/FancyButton.nbl
```

You can use `<FancyButton />` in any SFC without importing it.

#### Customizing auto-import directories

Create a `nebula.config.js` in your project root:

```js
module.exports = {
  autoImportDirs: [
    'packages/devtools/src/components',
    'src/components', // add your own
  ]
};
```

### 3. Devtools Overlay

To enable the Nebula DevTools overlay, import and call:

```js
import { mountDevtoolsOverlay } from '@nebula/devtools';
mountDevtoolsOverlay();
```

This will show the overlay in your app for live inspection.

---

## Testing

Run Vitest tests:

```
npx vitest run
```

---

## Advanced
- The plugin injects a virtual module `virtual:nebula-auto-imports` for auto-imports.
- You can extend or override the plugin for custom workflows.
