import { afterEach, describe, expect, it, vi } from "vitest";
import { Debug, emitDebug, resetDebugListeners } from "@terajs/shared";
import { ref } from "@terajs/reactivity";
import {
  mountDevtoolsOverlay,
  toggleDevtoolsOverlay,
  toggleDevtoolsVisibility,
  unmountDevtoolsOverlay
} from "./overlay";

const OVERLAY_PREFERENCES_STORAGE_KEY = "terajs:devtools:overlay-preferences";

function ensureTestStorage(): Storage {
  const candidate = (window as Window & { localStorage?: unknown }).localStorage;
  if (
    candidate
    && typeof (candidate as Storage).getItem === "function"
    && typeof (candidate as Storage).setItem === "function"
    && typeof (candidate as Storage).removeItem === "function"
  ) {
    return candidate as Storage;
  }

  const store = new Map<string, string>();
  const fallback: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    }
  };

  Object.defineProperty(window, "localStorage", {
    value: fallback,
    configurable: true
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: fallback,
    configurable: true
  });

  return fallback;
}

describe("devtools overlay public entry", () => {
  afterEach(() => {
    unmountDevtoolsOverlay();
    resetDebugListeners();
    delete (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__;
    ensureTestStorage().removeItem(OVERLAY_PREFERENCES_STORAGE_KEY);
    document.body.innerHTML = "";
  });

  it("mounts the real devtools shell instead of placeholder text", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container");
    expect(host).toBeTruthy();

    const shadowRoot = host?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Terajs DevTools");
    expect(shadowRoot?.textContent).not.toContain("UI will mount here");
  });

  it("renders events from both debug channels", () => {
    mountDevtoolsOverlay();

    Debug.emit("effect:run", {});
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Events: 2");
    expect(shadowRoot?.textContent).toContain("Counter");
  });

  it("replays component events emitted before overlay mount", () => {
    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "LandingPage",
      instance: 1
    });

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("LandingPage");
  });

  it("toggles panel visibility from the fab without remounting a second host", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    toggleDevtoolsOverlay();
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    toggleDevtoolsOverlay();
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    mountDevtoolsOverlay();
    expect(document.querySelectorAll("#terajs-overlay-container")).toHaveLength(1);
  });

  it("supports hiding and showing the full overlay shell", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    expect(host?.style.display).toBe("block");

    toggleDevtoolsVisibility();
    expect(host?.style.display).toBe("none");

    toggleDevtoolsVisibility();
    expect(host?.style.display).toBe("block");
  });

  it("supports centered bottom positioning", () => {
    mountDevtoolsOverlay({ position: "bottom-center" });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.left).toBe("50%");
    expect(host?.style.transform).toBe("translateX(-50%)");
    expect(shell?.classList.contains("is-center")).toBe(true);
  });

  it("supports top docking presets", () => {
    mountDevtoolsOverlay({ position: "top-right" });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.right).toBe("20px");
    expect(host?.style.top).toBe("16px");
    expect(host?.style.bottom).toBe("");
    expect(shell?.classList.contains("is-top")).toBe(true);
  });

  it("restores persisted layout preferences when explicit layout is not provided", () => {
    ensureTestStorage().setItem(OVERLAY_PREFERENCES_STORAGE_KEY, JSON.stringify({
      position: "bottom-left",
      panelSize: "large"
    }));

    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shell = host?.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;

    expect(host?.style.left).toBe("20px");
    expect(host?.style.bottom).toBe("16px");
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("980px");
    expect(shell?.classList.contains("is-left")).toBe(true);
  });

  it("updates layout from settings controls and persists changes", () => {
    mountDevtoolsOverlay({ startOpen: true });

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const shadowRoot = host?.shadowRoot;

    const settingsTab = shadowRoot?.querySelector('[data-tab="Settings"]') as HTMLButtonElement | null;
    settingsTab?.click();

    const centerButton = shadowRoot?.querySelector('[data-layout-position="center"]') as HTMLButtonElement | null;
    centerButton?.click();
    expect(host?.style.top).toBe("50%");
    expect(host?.style.transform).toBe("translate(-50%, -50%)");

    const largeButton = shadowRoot?.querySelector('[data-layout-size="large"]') as HTMLButtonElement | null;
    largeButton?.click();
    expect(host?.style.getPropertyValue("--terajs-overlay-panel-width")).toBe("980px");

    const persisted = JSON.parse(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY) ?? "{}");
    expect(persisted.position).toBe("center");
    expect(persisted.panelSize).toBe("large");

    const persistToggle = shadowRoot?.querySelector('[data-layout-persist-toggle="true"]') as HTMLButtonElement | null;
    persistToggle?.click();
    expect(ensureTestStorage().getItem(OVERLAY_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it("edits live boolean props from the props inspector", () => {
    const componentRoot = document.createElement("div") as HTMLDivElement & {
      __terajsComponentContext?: { props: { enabled: boolean } };
    };
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    componentRoot.__terajsComponentContext = {
      props: {
        enabled: true
      }
    };
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const propsTab = shadowRoot?.querySelector('[data-inspector-tab="props"]') as HTMLButtonElement | null;
    propsTab?.click();

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-prop"][data-prop-key="enabled"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(componentRoot.__terajsComponentContext?.props.enabled).toBe(false);
  });

  it("edits live reactive booleans from the reactive inspector", () => {
    const enabled = ref(true, {
      scope: "Counter",
      instance: 1,
      key: "enabled"
    });

    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const reactiveTab = shadowRoot?.querySelector('[data-inspector-tab="reactive"]') as HTMLButtonElement | null;
    reactiveTab?.click();

    const toggleButton = shadowRoot?.querySelector('[data-action="toggle-live-reactive"]') as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();
    toggleButton?.click();

    expect(enabled.value).toBe(false);
  });

  it("supports keyboard shortcuts for panel and visibility controls", () => {
    mountDevtoolsOverlay();

    const host = document.getElementById("terajs-overlay-container") as HTMLDivElement | null;
    const panel = host?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
    expect(panel?.classList.contains("is-hidden")).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "d", ctrlKey: true, shiftKey: true }));
    expect(panel?.classList.contains("is-hidden")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", ctrlKey: true, shiftKey: true }));
    expect(host?.style.display).toBe("none");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "h", ctrlKey: true, shiftKey: true }));
    expect(host?.style.display).toBe("block");
  });

  it("supports toolbar interactions for theme toggle and event reset", () => {
    mountDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const host = document.getElementById("terajs-overlay-container");
    const shadowRoot = host?.shadowRoot;
    const mountRoot = shadowRoot?.getElementById("terajs-devtools-root") as HTMLDivElement | null;
    expect(mountRoot?.dataset.theme).toBe("dark");

    const themeButton = shadowRoot?.querySelector('[data-theme-toggle="true"]') as HTMLButtonElement | null;
    themeButton?.click();
    expect(mountRoot?.dataset.theme).toBe("light");

    const settingsTab = shadowRoot?.querySelector('[data-tab="Settings"]') as HTMLButtonElement | null;
    settingsTab?.click();

    const clearButton = shadowRoot?.querySelector('[data-clear-events="true"]') as HTMLButtonElement | null;
    clearButton?.click();

    expect(shadowRoot?.textContent).toContain("Events: 0");
  });

  it("uses global AI assistant hook when available", async () => {
    const hook = vi.fn(async () => "Use keyed route metadata to trace render timing.");
    (window as typeof window & { __TERAJS_AI_ASSISTANT__?: unknown }).__TERAJS_AI_ASSISTANT__ = hook;

    mountDevtoolsOverlay();

    Debug.emit("error:reactivity", {
      message: "Sample reactive failure",
      rid: "signal:counter"
    } as any);

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const aiTab = shadowRoot?.querySelector('[data-tab="AI Diagnostics"]') as HTMLButtonElement | null;
    aiTab?.click();

    const askButton = shadowRoot?.querySelector('[data-action="ask-ai"]') as HTMLButtonElement | null;
    askButton?.click();

    await Promise.resolve();
    await Promise.resolve();

    expect(hook).toHaveBeenCalledTimes(1);
    expect(shadowRoot?.textContent).toContain("Response ready");
    expect(shadowRoot?.textContent).toContain("Use keyed route metadata to trace render timing.");
  });

  it("shows router issues in the issues panel", () => {
    mountDevtoolsOverlay();

    Debug.emit("error:router", {
      message: "No route matched /missing",
      to: "/missing"
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const issuesTab = shadowRoot?.querySelector('[data-tab="Issues"]') as HTMLButtonElement | null;
    issuesTab?.click();

    expect(shadowRoot?.textContent).toContain("No route matched /missing");
  });

  it("shows queue events in the queue monitor tab", () => {
    mountDevtoolsOverlay();

    Debug.emit("queue:enqueue", {
      id: "q1",
      type: "form:save",
      pending: 1
    });
    Debug.emit("queue:conflict", {
      id: "q1",
      type: "form:save",
      conflictKey: "profile:1",
      decision: "replace"
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const queueTab = shadowRoot?.querySelector('[data-tab="Queue"]') as HTMLButtonElement | null;
    queueTab?.click();

    expect(shadowRoot?.textContent).toContain("Queue Monitor");
    expect(shadowRoot?.textContent).toContain("form:save");
  });

  it("shows active refs in signals tab without requiring recent updates", () => {
    const activeRef = ref("ready", {
      scope: "OverlaySpec",
      instance: 1,
      key: "overlay.test.ref"
    });

    mountDevtoolsOverlay();

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const signalsTab = shadowRoot?.querySelector('[data-tab="Signals"]') as HTMLButtonElement | null;
    signalsTab?.click();

    expect(activeRef.value).toBe("ready");
    expect(shadowRoot?.textContent).toContain("Active reactive registry");
    expect(shadowRoot?.textContent).toContain("overlay.test.ref");
  });

  it("highlights component roots when selected from the components list", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);
  });

  it("highlights component roots when hovering tree rows", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(true);

    componentButton?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, composed: true }));

    expect(componentRoot.classList.contains("terajs-devtools-hover-component")).toBe(false);
  });

  it("uses tabbed component drill-down instead of accordion toggles", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    const domTab = shadowRoot?.querySelector('[data-inspector-tab="dom"]') as HTMLButtonElement | null;
    domTab?.click();

    const selectedDomTab = shadowRoot?.querySelector('[data-inspector-tab="dom"].is-selected') as HTMLButtonElement | null;
    expect(selectedDomTab).toBeTruthy();

    const inspectorSurface = shadowRoot?.querySelector('.inspector-surface') as HTMLDivElement | null;
    inspectorSurface?.click();

    const selectedDomTabAfterBodyClick = shadowRoot?.querySelector('[data-inspector-tab="dom"].is-selected') as HTMLButtonElement | null;
    expect(selectedDomTabAfterBodyClick).toBeTruthy();
  });

  it("enables inspect mode immediately when startOpen is true", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay({ startOpen: true });

    expect(document.body.hasAttribute("data-terajs-inspect-mode")).toBe(true);
  });

  it("supports inspect mode click-to-pick from page components", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    componentRoot.dispatchEvent(new Event("pointermove", { bubbles: true, composed: true }));
    componentRoot.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, button: 0 }));

    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton?.classList.contains("is-active")).toBe(true);
    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);
  });

  it("keeps mounted components visible after large event churn", () => {
    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    for (let index = 0; index < 450; index += 1) {
      Debug.emit("effect:run", { key: `k${index}` });
    }

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    expect(shadowRoot?.textContent).toContain("Counter");
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    expect(componentButton).toBeTruthy();
  });

  it("clears selected highlight when leaving the components tab", () => {
    const componentRoot = document.createElement("div");
    componentRoot.setAttribute("data-terajs-component-scope", "Counter");
    componentRoot.setAttribute("data-terajs-component-instance", "1");
    document.body.appendChild(componentRoot);

    mountDevtoolsOverlay();
    toggleDevtoolsOverlay();

    emitDebug({
      type: "component:mounted",
      timestamp: Date.now(),
      scope: "Counter",
      instance: 1
    });

    const shadowRoot = document.getElementById("terajs-overlay-container")?.shadowRoot;
    const componentButton = shadowRoot?.querySelector('[data-component-key="Counter#1"]') as HTMLButtonElement | null;
    componentButton?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(true);

    const logsTab = shadowRoot?.querySelector('[data-tab="Logs"]') as HTMLButtonElement | null;
    logsTab?.click();

    expect(componentRoot.classList.contains("terajs-devtools-selected-component")).toBe(false);
  });
});