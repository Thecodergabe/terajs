import { describe, test, expect, beforeEach } from "vitest";

import {
  applyDebugEventToGraph,
  ReactiveGraph
} from "./graph/manager";

import type { DebugEvent } from "../types/events";
import { getDependencyGraphSnapshot } from "../dependencyGraph";

function resetGraph() {
  // Clear semantic nodes
  const all = ReactiveGraph.getAllNodes();
  for (const node of all) {
    const dep = ReactiveGraph.getDependencyNode(node.rid);
    if (dep) {
      dep.dependsOn.clear();
      dep.dependents.clear();
    }
  }
}

describe("Reactive Graph Manager", () => {
  beforeEach(() => {
    resetGraph();
  });

  test("reactive:created registers a signal node", () => {
    const event: DebugEvent = {
      type: "reactive:created",
      timestamp: Date.now(),
      meta: {
        rid: "Test#1.ref#1",
        type: "ref",
        scope: "Test",
        instance: 1,
        createdAt: Date.now()
      }
    };

    applyDebugEventToGraph(event);

    const node = ReactiveGraph.getNodeInfo("Test#1.ref#1");
    expect(node).toBeDefined();
    expect(node!.kind).toBe("signal");
    expect(node!.meta!.rid).toBe("Test#1.ref#1");
  });

  test("reactive:updated ensures node exists", () => {
    const event: DebugEvent = {
      type: "reactive:updated",
      timestamp: Date.now(),
      rid: "X#1.ref#1"
    };

    applyDebugEventToGraph(event);

    const node = ReactiveGraph.getNodeInfo("X#1.ref#1");
    expect(node).toBeDefined();
    expect(node!.kind).toBe("signal");
  });

  test("computed:recomputed registers computed node", () => {
    const event: DebugEvent = {
      type: "computed:recomputed",
      timestamp: Date.now(),
      rid: "Comp#1.computed#1"
    };

    applyDebugEventToGraph(event);

    const node = ReactiveGraph.getNodeInfo("Comp#1.computed#1");
    expect(node).toBeDefined();
    expect(node!.kind).toBe("computed");
  });

  test("component:mounted registers component node", () => {
    const event: DebugEvent = {
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    };

    applyDebugEventToGraph(event);

    const rid = "Counter#1";
    const node = ReactiveGraph.getNodeInfo(rid);

    expect(node).toBeDefined();
    expect(node!.kind).toBe("component");
    expect(node!.scope).toBe("Counter");
    expect(node!.instance).toBe(1);
  });

  test("component:unmounted removes component node", () => {
    const mount: DebugEvent = {
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    };

    const unmount: DebugEvent = {
      type: "component:unmounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    };

    applyDebugEventToGraph(mount);
    applyDebugEventToGraph(unmount);

    const rid = "Counter#1";
    const node = ReactiveGraph.getNodeInfo(rid);

    expect(node).toBeUndefined();
  });

    test("dom:updated registers DOM node", () => {
    const event: DebugEvent = {
        type: "dom:updated",
        timestamp: Date.now(),
        nodeId: "dom123"
        // no rid here
    };

    applyDebugEventToGraph(event);

    const rid = "dom#dom123";
    const node = ReactiveGraph.getNodeInfo(rid);

    expect(node).toBeDefined();
    expect(node!.kind).toBe("dom");
    expect(node!.domNodeId).toBe("dom123");
    });


  test("route:changed registers route node", () => {
    const event: DebugEvent = {
      type: "route:changed",
      timestamp: Date.now(),
      from: "/old",
      to: "/new"
    };

    applyDebugEventToGraph(event);

    const rid = "route:/new";
    const node = ReactiveGraph.getNodeInfo(rid);

    expect(node).toBeDefined();
    expect(node!.kind).toBe("route");
  });
});
