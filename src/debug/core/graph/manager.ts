/**
 * @file manager.ts
 * @description
 * Reactive Graph Manager for Nebula.
 *
 * Sits on top of:
 * - the debug event stream (DebugEvent union)
 * - the dependency graph (edges between RIDs)
 * - reactive metadata
 *
 * Responsibilities:
 * - register every reactive node (signal, computed, effect)
 * - register component instances
 * - keep a catalog of nodes with their kind + metadata
 * - react to debug events to keep the model in sync
 */

import type { ReactiveMetadata } from "../../types/metadata";
import type { DebugEvent } from "../../types/events";
import type { DependencyNode } from "../../types/graph";

import {
  getDependencyNode,
  getDependencyGraphSnapshot,
  removeDependencyNode
} from "../dependencyGraph";

import { subscribeDebug } from "../eventBus";

/**
 * High‑level classification of nodes in the reactive graph.
 */
export type GraphNodeKind =
  | "signal"
  | "computed"
  | "effect"
  | "component"
  | "dom"
  | "route";

/**
 * Extended node info for DevTools / introspection.
 * This wraps the low‑level DependencyNode with semantic meaning.
 */
export interface GraphNodeInfo {
  /** Reactive identity (RID) or synthetic id (for components/routes). */
  rid: string;
  /** High‑level kind of node. */
  kind: GraphNodeKind;
  /** Optional reactive metadata (for signals/computed/effects). */
  meta?: ReactiveMetadata;
  /** Optional component scope (for components). */
  scope?: string;
  /** Optional component instance id (for components). */
  instance?: number;
  /** Optional DOM node identifier (for dom nodes). */
  domNodeId?: string;
}

/**
 * Internal registry of all known graph nodes.
 * This is a semantic layer on top of the raw dependency graph.
 */
const nodes = new Map<string, GraphNodeInfo>();

/**
 * Derive a node kind from reactive metadata.
 */
function kindFromMeta(meta: ReactiveMetadata): GraphNodeKind {
  switch (meta.type) {
    case "ref":
      return "signal";
    case "computed":
      return "computed";
    case "effect":
      return "effect";
    default:
      return "signal";
  }
}

/**
 * Create a synthetic RID for a component instance.
 */
function componentRid(scope: string, instance: number): string {
  return `${scope}#${instance}`;
}

/**
 * Register or update a node in the high‑level graph registry.
 */
function upsertNode(info: GraphNodeInfo): void {
  const existing = nodes.get(info.rid);
  if (existing) {
    nodes.set(info.rid, { ...existing, ...info });
  } else {
    nodes.set(info.rid, info);
  }
}

/**
 * Remove a node from the high‑level registry and from the dependency graph.
 */
function removeNode(rid: string): void {
  nodes.delete(rid);
  removeDependencyNode(rid);
}

/**
 * Apply a single debug event to the reactive graph model.
 *
 * This is the main integration point between:
 * - the debug event bus
 * - the dependency graph
 * - the high‑level node registry
 */
export function applyDebugEventToGraph(event: DebugEvent): void {
  switch (event.type) {
    /* -------------------------- Reactive primitives ------------------------ */

    case "reactive:created": {
      const meta = event.meta;
      const kind = kindFromMeta(meta);

      upsertNode({
        rid: meta.rid,
        kind,
        meta
      });
      break;
    }

    case "reactive:updated": {
      const rid = event.rid;
      const node = nodes.get(rid);
      if (!node) {
        upsertNode({
          rid,
          kind: "signal"
        });
      }
      break;
    }

    case "computed:recomputed": {
      const rid = event.rid;
      const node = nodes.get(rid);
      if (!node) {
        upsertNode({
          rid,
          kind: "computed"
        });
      }
      break;
    }

    /* ------------------------------ Components ------------------------------ */

    case "component:mounted": {
      const rid = componentRid(event.scope, event.instance);
      upsertNode({
        rid,
        kind: "component",
        scope: event.scope,
        instance: event.instance
      });
      break;
    }

    case "component:unmounted": {
      const rid = componentRid(event.scope, event.instance);
      removeNode(rid);
      break;
    }

    /* --------------------------------- DOM --------------------------------- */

    case "dom:updated": {
      if (!event.nodeId) break;
      const rid = event.rid ?? `dom#${event.nodeId}`;
      upsertNode({
        rid,
        kind: "dom",
        domNodeId: event.nodeId
      });
      break;
    }

    /* -------------------------------- Routes -------------------------------- */

    case "route:changed": {
      const rid = `route:${event.to}`;
      upsertNode({
        rid,
        kind: "route"
      });
      break;
    }

    default:
      // reactive:read and others are temporal only for now.
      break;
  }
}

/**
 * ReactiveGraph: high‑level read‑only API over the reactive graph.
 *
 * This is what DevTools and introspection code should use.
 */
export const ReactiveGraph = {
  /**
   * Feed a debug event into the graph manager.
   * (Usually not needed directly; we subscribe below.)
   */
  applyEvent(event: DebugEvent): void {
    applyDebugEventToGraph(event);
  },

  /**
   * Get high‑level node info by RID.
   */
  getNodeInfo(rid: string): GraphNodeInfo | undefined {
    return nodes.get(rid);
  },

  /**
   * Get the underlying dependency node (edges) by RID.
   */
  getDependencyNode(rid: string): DependencyNode | undefined {
    return getDependencyNode(rid);
  },

  /**
   * Get a snapshot of all high‑level nodes.
   */
  getAllNodes(): GraphNodeInfo[] {
    return Array.from(nodes.values());
  },

  /**
   * Get a snapshot of the low‑level dependency graph.
   */
  getGraphSnapshot(): DependencyNode[] {
    return getDependencyGraphSnapshot();
  }
};

/**
 * Wire the manager into the debug event bus.
 */
subscribeDebug((event) => {
  applyDebugEventToGraph(event);
});
