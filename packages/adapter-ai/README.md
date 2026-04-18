# @terajs/adapter-ai

AI-facing helper package for Terajs.

This package provides structured action-schema helpers and sanitized reactive-state snapshots for tooling, assistants, and other AI-adjacent integrations.

## Install

```bash
npm install @terajs/adapter-ai
```

## What it exports

- `defineAIActions(schema)` for declaring a typed action schema with built-in validation
- `captureStateSnapshot(signals?)` for exporting a sanitized snapshot of active Terajs signals
- `AIActionsSchema` and `AIActionsDefinition` types for action-schema authoring
- `AIStateSnapshot` for structured state export consumers

## Minimal example

```ts
import { captureStateSnapshot, defineAIActions } from "@terajs/adapter-ai";

const actions = defineAIActions({
  openIssue: {
    description: "Create a project issue",
    params: {
      title: { type: "string", required: true },
      priority: { type: "string" }
    }
  }
});

const isValid = actions.validate("openIssue", {
  title: "Document router diagnostics"
});

const snapshot = captureStateSnapshot();
```

## Notes

- `captureStateSnapshot(...)` filters sensitive keys such as password, token, credential, and API-key style fields instead of serializing them blindly.
- Snapshot output is normalized for tooling consumption and avoids leaking raw non-serializable values.
- This package complements Terajs metadata and DevTools workflows; it is not a model-provider SDK.