import { buildTimeline, computePerformanceMetrics, computeRouterMetrics, replayEventsAtIndex } from "./analytics.js";
import { Debug, getAllReactives, getDebugListenerCount, getReactiveByRid, setReactiveValue, subscribeDebug } from "@terajs/shared";
import { captureStateSnapshot } from "@terajs/adapter-ai";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "./sanity.js";
import { buildAIPrompt } from "./aiPrompt.js";

export interface DevtoolsEvent {
  type: string;
  timestamp: number;
  payload?: Record<string, unknown>;
  level?: "info" | "warn" | "error";
  file?: string;
  line?: number;
  column?: number;
}

export interface DevtoolsAIAssistantOptions {
  enabled?: boolean;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

type DevtoolsOverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type DevtoolsOverlaySize = "normal" | "large";

interface DevtoolsLayoutOptions {
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
}

export interface DevtoolsAppOptions {
  ai?: DevtoolsAIAssistantOptions;
  layout?: DevtoolsLayoutOptions;
}

interface NormalizedAIAssistantOptions {
  enabled: boolean;
  endpoint: string | null;
  model: string;
  timeoutMs: number;
}

interface NormalizedLayoutOptions {
  position: DevtoolsOverlayPosition;
  panelSize: DevtoolsOverlaySize;
  persistPreferences: boolean;
}

interface AIAssistantRequest {
  prompt: string;
  snapshot: ReturnType<typeof captureStateSnapshot>;
  sanity: ReturnType<typeof computeSanityMetrics>;
  events: DevtoolsEvent[];
}

type AIAssistantHook = (request: AIAssistantRequest) => Promise<unknown> | unknown;

declare global {
  interface Window {
    __TERAJS_AI_ASSISTANT__?: AIAssistantHook;
  }
}

type TabName =
  | "Components"
  | "AI Diagnostics"
  | "Signals"
  | "Meta"
  | "Issues"
  | "Logs"
  | "Timeline"
  | "Router"
  | "Queue"
  | "Performance"
  | "Sanity Check"
  | "Settings";

interface DevtoolsState {
  activeTab: TabName;
  events: DevtoolsEvent[];
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  expandedComponentNodeKeys: Set<string>;
  componentTreeInitialized: boolean;
  activeInspectorTab: InspectorPanelTab;
  expandedValuePaths: Set<string>;
  eventCount: number;
  selectedMetaKey: string | null;
  selectedComponentKey: string | null;
  logFilter: "all" | "component" | "signal" | "effect" | "error" | "hub" | "route";
  timelineCursor: number;
  theme: "dark" | "light";
  aiPrompt: string | null;
  aiLikelyCause: string | null;
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiResponse: string | null;
  aiError: string | null;
  overlayPosition: DevtoolsOverlayPosition;
  overlayPanelSize: DevtoolsOverlaySize;
  persistOverlayPreferences: boolean;
}

type InspectorPanelTab = "overview" | "props" | "reactive" | "dom" | "activity";

interface MountedComponentEntry {
  key: string;
  scope: string;
  instance: number;
  aiPreview?: string;
}

interface ComponentTreeNode {
  component: MountedComponentEntry;
  children: ComponentTreeNode[];
}

type InspectableComponentContext = {
  props?: unknown;
};

type PrimitiveEditableValue = string | number | boolean;

interface LiveReactiveEntry {
  rid: string;
  label: string;
  type: string;
  currentValue: unknown;
}

const TABS: TabName[] = [
  "Components",
  "AI Diagnostics",
  "Signals",
  "Meta",
  "Issues",
  "Logs",
  "Timeline",
  "Router",
  "Queue",
  "Performance",
  "Sanity Check",
  "Settings"
];

const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_COMPONENT_SELECT_EVENT = "terajs:devtools:component-select";
const DEVTOOLS_COMPONENT_PICKED_EVENT = "terajs:devtools:component-picked";
const DEVTOOLS_COMPONENT_HOVER_EVENT = "terajs:devtools:component-hover";
const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";

export function mountDevtoolsApp(root: HTMLElement, options: DevtoolsAppOptions = {}): () => void {
  const aiOptions = normalizeAIAssistantOptions(options.ai);
  const layoutOptions = normalizeLayoutOptions(options.layout);
  const state: DevtoolsState = {
    activeTab: "Components",
    events: [],
    mountedComponents: new Map(),
    expandedComponentNodeKeys: new Set(),
    componentTreeInitialized: false,
    activeInspectorTab: "overview",
    expandedValuePaths: new Set(),
    eventCount: 0,
    selectedMetaKey: null,
    selectedComponentKey: null,
    logFilter: "all",
    timelineCursor: -1,
    theme: "dark",
    aiPrompt: null,
    aiLikelyCause: null,
    aiStatus: "idle",
    aiResponse: null,
    aiError: null,
    overlayPosition: layoutOptions.position,
    overlayPanelSize: layoutOptions.panelSize,
    persistOverlayPreferences: layoutOptions.persistPreferences
  };
  let aiRequestToken = 0;

  const appendEvent = (rawEvent: unknown) => {
    const event = normalizeEvent(rawEvent);
    if (!event) return;

    const previousSelection = state.selectedComponentKey;
    applyComponentLifecycle(state.mountedComponents, state.expandedComponentNodeKeys, event);

    if (previousSelection && !state.mountedComponents.has(previousSelection)) {
      state.selectedComponentKey = null;
      notifyComponentSelection(null, null, "clear");
    }

    if (event.type === "reactive:error" || event.type === "error:reactivity") {
      const likelyCause = generateLikelyCause(event.payload);
      if (likelyCause) {
        event.payload = { ...event.payload, likelyCause };
        state.aiLikelyCause = likelyCause;
      }
    }

    state.events = [...state.events.slice(-249), event];
    state.eventCount += 1;
    state.timelineCursor = state.events.length - 1;
    render();
  };

  const unsubDebug = Debug.on(appendEvent);
  const unsubEventBus = subscribeDebug(appendEvent, { replay: true });

  const dispatchWindowEvent = (name: string, detail: Record<string, unknown>) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const notifyInspectMode = (enabled: boolean) => {
    dispatchWindowEvent(DEVTOOLS_INSPECT_MODE_EVENT, {
      enabled
    });
  };

  const notifyComponentSelection = (scope: string | null, instance: number | null, source: "panel" | "picker" | "clear") => {
    dispatchWindowEvent(DEVTOOLS_COMPONENT_SELECT_EVENT, {
      scope,
      instance,
      source
    });
  };

  const notifyComponentHover = (scope: string | null, instance: number | null) => {
    dispatchWindowEvent(DEVTOOLS_COMPONENT_HOVER_EVENT, {
      scope,
      instance
    });
  };

  const notifyLayoutPreferences = () => {
    dispatchWindowEvent(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, {
      position: state.overlayPosition,
      panelSize: state.overlayPanelSize,
      persistPreferences: state.persistOverlayPreferences
    });
  };

  const handleComponentPicked = (rawEvent: Event) => {
    const customEvent = rawEvent as CustomEvent<unknown>;
    const detail = customEvent.detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as Record<string, unknown>;
    const scope = typeof payload.scope === "string" ? payload.scope : null;
    const instance = typeof payload.instance === "number" ? payload.instance : null;
    if (!scope || instance === null) {
      return;
    }

    state.activeTab = "Components";
    state.selectedComponentKey = buildComponentKey(scope, instance);
    render();
  };

  if (typeof window !== "undefined") {
    window.addEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
  }

  const handleClick = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) return;

    const tab = target.closest<HTMLElement>("[data-tab]")?.dataset.tab as TabName | undefined;
    if (tab) {
      state.activeTab = tab;
      notifyInspectMode(tab === "Components");
      if (tab !== "Components") {
        notifyComponentSelection(null, null, "clear");
      }
      render();
      return;
    }

    const logFilter = target.closest<HTMLElement>("[data-log-filter]")?.dataset.logFilter as DevtoolsState["logFilter"] | undefined;
    if (logFilter) {
      state.logFilter = logFilter;
      render();
      return;
    }

    const metaKey = target.closest<HTMLElement>("[data-meta-key]")?.dataset.metaKey;
    if (metaKey) {
      state.selectedMetaKey = metaKey;
      render();
      return;
    }

    const treeToggle = target.closest<HTMLElement>("[data-action='toggle-component-node']");
    if (treeToggle) {
      const key = treeToggle.dataset.treeNodeKey;
      if (key) {
        if (state.expandedComponentNodeKeys.has(key)) {
          state.expandedComponentNodeKeys.delete(key);
        } else {
          state.expandedComponentNodeKeys.add(key);
        }
        render();
      }
      return;
    }

    const inspectorTab = target.closest<HTMLElement>("[data-inspector-tab]")?.dataset.inspectorTab;
    if (isInspectorPanelTab(inspectorTab) && inspectorTab !== state.activeInspectorTab) {
      state.activeInspectorTab = inspectorTab;
      render();
      return;
    }

    const valueToggle = target.closest<HTMLElement>("[data-action='toggle-value-node']");
    if (valueToggle) {
      const valuePath = valueToggle.dataset.valuePath;
      if (valuePath) {
        if (state.expandedValuePaths.has(valuePath)) {
          state.expandedValuePaths.delete(valuePath);
        } else {
          state.expandedValuePaths.add(valuePath);
        }
        render();
      }
      return;
    }

    const livePropToggle = target.closest<HTMLElement>("[data-action='toggle-live-prop']");
    if (livePropToggle) {
      const scope = livePropToggle.dataset.componentScope;
      const instanceRaw = livePropToggle.dataset.componentInstance;
      const propKey = livePropToggle.dataset.propKey;
      const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
      if (scope && propKey && Number.isFinite(instance) && toggleLivePropValue(scope, instance, propKey)) {
        render();
      }
      return;
    }

    const liveReactiveToggle = target.closest<HTMLElement>("[data-action='toggle-live-reactive']");
    if (liveReactiveToggle) {
      const rid = liveReactiveToggle.dataset.reactiveRid;
      if (rid && toggleLiveReactiveValue(rid)) {
        render();
      }
      return;
    }

    const layoutPosition = target.closest<HTMLElement>("[data-layout-position]")?.dataset.layoutPosition;
    if (isOverlayPosition(layoutPosition) && layoutPosition !== state.overlayPosition) {
      state.overlayPosition = layoutPosition;
      notifyLayoutPreferences();
      render();
      return;
    }

    const layoutSize = target.closest<HTMLElement>("[data-layout-size]")?.dataset.layoutSize;
    if (isOverlaySize(layoutSize) && layoutSize !== state.overlayPanelSize) {
      state.overlayPanelSize = layoutSize;
      notifyLayoutPreferences();
      render();
      return;
    }

    if (target.closest("[data-layout-persist-toggle]")) {
      state.persistOverlayPreferences = !state.persistOverlayPreferences;
      notifyLayoutPreferences();
      render();
      return;
    }

    const componentButton = target.closest<HTMLElement>("[data-component-key]");
    if (componentButton) {
      const scope = componentButton.dataset.componentScope;
      const instanceRaw = componentButton.dataset.componentInstance;
      const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
      if (scope && Number.isFinite(instance)) {
        state.selectedComponentKey = buildComponentKey(scope, instance);
        notifyComponentSelection(scope, instance, "panel");
        render();
      }
      return;
    }

    if (target.closest("[data-action='clear-component-selection']")) {
      state.selectedComponentKey = null;
      notifyComponentSelection(null, null, "clear");
      render();
      return;
    }

    if (target.closest("[data-action='ask-ai']")) {
      const snapshot = captureStateSnapshot();
      const sanity = computeSanityMetrics(state.events, {
        ...DEFAULT_SANITY_THRESHOLDS,
        debugListenerCount: getDebugListenerCount()
      });

      state.aiPrompt = buildAIPrompt({
        snapshot,
        sanity,
        events: state.events
      });
      state.aiError = null;
      state.aiResponse = null;

      const prompt = state.aiPrompt;
      if (!prompt) {
        state.aiStatus = "error";
        state.aiError = "Unable to generate an AI prompt for the current state.";
        render();
        return;
      }

      if (!aiOptions.enabled) {
        state.aiStatus = "idle";
        render();
        return;
      }

      const hasGlobalHook = getGlobalAIAssistantHook() !== null;
      if (!hasGlobalHook && !aiOptions.endpoint) {
        state.aiStatus = "idle";
        render();
        return;
      }

      const token = ++aiRequestToken;
      state.aiStatus = "loading";
      render();

      void resolveAIAssistantResponse({
        prompt,
        snapshot,
        sanity,
        events: state.events.slice(-120)
      }, aiOptions).then((response) => {
        if (token !== aiRequestToken) {
          return;
        }

        state.aiStatus = "ready";
        state.aiResponse = response;
        state.aiError = null;
        render();
      }).catch((error) => {
        if (token !== aiRequestToken) {
          return;
        }

        state.aiStatus = "error";
        state.aiError = error instanceof Error ? error.message : "AI request failed.";
        state.aiResponse = null;
        render();
      });
      return;
    }

    if (target.closest("[data-action='copy-ai-prompt']")) {
      if (state.aiPrompt && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(state.aiPrompt).catch(() => {});
      }
      return;
    }

    if (target.closest("[data-theme-toggle]")) {
      state.theme = state.theme === "dark" ? "light" : "dark";
      render();
      return;
    }

    if (target.closest("[data-clear-events]")) {
      state.events = [];
      state.eventCount = 0;
      state.timelineCursor = -1;
      state.selectedMetaKey = null;
      state.selectedComponentKey = null;
      state.mountedComponents.clear();
      state.expandedComponentNodeKeys.clear();
      state.componentTreeInitialized = false;
      state.aiPrompt = null;
      state.aiLikelyCause = null;
      state.aiStatus = "idle";
      state.aiResponse = null;
      state.aiError = null;
      aiRequestToken += 1;
      notifyInspectMode(state.activeTab === "Components");
      notifyComponentSelection(null, null, "clear");
      render();
    }
  };

  const handleInput = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.dataset.timelineCursor !== "true") return;

    state.timelineCursor = Number(target.value);
    render();
  };

  const handleChange = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.dataset.livePropInput === "true") {
      const scope = target.dataset.componentScope;
      const instanceRaw = target.dataset.componentInstance;
      const propKey = target.dataset.propKey;
      const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
      if (scope && propKey && Number.isFinite(instance) && applyLivePropInput(scope, instance, propKey, target.value)) {
        render();
      }
      return;
    }

    if (target.dataset.liveReactiveInput === "true") {
      const rid = target.dataset.reactiveRid;
      if (rid && applyLiveReactiveInput(rid, target.value)) {
        render();
      }
    }
  };

  const handleMouseOver = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const componentButton = target.closest<HTMLElement>("[data-component-key]");
    if (!componentButton) {
      return;
    }

    const scope = componentButton.dataset.componentScope;
    const instanceRaw = componentButton.dataset.componentInstance;
    const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
    if (!scope || !Number.isFinite(instance)) {
      return;
    }

    notifyComponentHover(scope, instance);
  };

  const handleMouseOut = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const componentButton = target.closest<HTMLElement>("[data-component-key]");
    if (!componentButton) {
      return;
    }

    const relatedTarget = (domEvent as MouseEvent).relatedTarget;
    if (relatedTarget instanceof Element && componentButton.contains(relatedTarget)) {
      return;
    }

    notifyComponentHover(null, null);
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("mouseover", handleMouseOver);
  root.addEventListener("mouseout", handleMouseOut);

  render();

  return () => {
    unsubDebug();
    unsubEventBus();
    if (typeof window !== "undefined") {
      window.removeEventListener(DEVTOOLS_COMPONENT_PICKED_EVENT, handleComponentPicked as EventListener);
    }
    notifyInspectMode(false);
    notifyComponentSelection(null, null, "clear");
    notifyComponentHover(null, null);
    root.removeEventListener("click", handleClick);
    root.removeEventListener("input", handleInput);
    root.removeEventListener("change", handleChange);
    root.removeEventListener("mouseover", handleMouseOver);
    root.removeEventListener("mouseout", handleMouseOut);
    root.innerHTML = "";
  };

  function render() {
    root.dataset.theme = state.theme;
    root.innerHTML = renderApp(state);
    notifyInspectMode(state.activeTab === "Components");
  }
}

function normalizeEvent(rawEvent: unknown): DevtoolsEvent | null {
  if (!rawEvent || typeof rawEvent !== "object") return null;

  const event = rawEvent as Record<string, unknown>;
  const type = typeof event.type === "string" ? event.type : null;
  const timestamp = typeof event.timestamp === "number" ? event.timestamp : Date.now();
  if (!type) return null;

  if (event.payload && typeof event.payload === "object") {
    return {
      type,
      timestamp,
      payload: event.payload as Record<string, unknown>,
      level: parseLevel(event.level),
      file: typeof event.file === "string" ? event.file : undefined,
      line: typeof event.line === "number" ? event.line : undefined,
      column: typeof event.column === "number" ? event.column : undefined
    };
  }

  const { payload: _payload, type: _type, timestamp: _timestamp, ...rest } = event;
  return {
    type,
    timestamp,
    payload: rest,
    level: parseLevel(event.level),
    file: typeof event.file === "string" ? event.file : undefined,
    line: typeof event.line === "number" ? event.line : undefined,
    column: typeof event.column === "number" ? event.column : undefined
  };
}

function parseLevel(level: unknown): DevtoolsEvent["level"] {
  if (level === "info" || level === "warn" || level === "error") return level;
  return undefined;
}

function renderApp(state: DevtoolsState): string {
  return `
    <div class="devtools-shell">
      <div class="devtools-header">
        <div>
          <div class="devtools-title">Terajs DevTools</div>
          <div class="devtools-subtitle">Events: ${state.eventCount}</div>
        </div>
        <button class="toolbar-button" data-theme-toggle="true">${state.theme === "dark" ? "Light Theme" : "Dark Theme"}</button>
      </div>
      <div class="devtools-body">
        <div class="devtools-tabs">
          ${TABS.map((tab) => `
            <button class="tab-button ${state.activeTab === tab ? "is-active" : ""}" data-tab="${escapeHtml(tab)}">${escapeHtml(tab)}</button>
          `).join("")}
        </div>
        <div class="devtools-panel">
          ${renderPanel(state)}
        </div>
      </div>
    </div>
  `;
}

function renderPanel(state: DevtoolsState): string {
  switch (state.activeTab) {
    case "Components":
      return renderComponentsPanel(state);
    case "AI Diagnostics":
      return renderAIDiagnosticsPanel(state);
    case "Signals":
      return renderSignalsPanel(state);
    case "Meta":
      return renderMetaPanel(state);
    case "Issues":
      return renderIssuesPanel(state.events);
    case "Logs":
      return renderLogsPanel(state);
    case "Timeline":
      return renderTimelinePanel(state);
    case "Router":
      return renderRouterPanel(state.events);
    case "Queue":
      return renderQueuePanel(state.events);
    case "Performance":
      return renderPerformancePanel(state.events);
    case "Sanity Check":
      return renderSanityPanel(state.events);
    case "Settings":
      return renderSettingsPanel(state);
  }
}

function renderComponentsPanel(state: DevtoolsState): string {
  const components = collectMountedComponents(state);
  const tree = buildComponentTree(components);

  if (components.length === 0) {
    state.componentTreeInitialized = false;
  }

  if (!state.componentTreeInitialized && tree.roots.length > 0) {
    const expandableKeys = collectExpandableTreeKeys(tree.roots);
    for (const key of expandableKeys) {
      state.expandedComponentNodeKeys.add(key);
    }
    state.componentTreeInitialized = true;
  }

  const selected = resolveSelectedComponent(components, state.selectedComponentKey);
  const selectedKey = selected?.key ?? null;

  expandSelectedTreePath(state.expandedComponentNodeKeys, selectedKey, tree.parentByKey);

  const drilldown = selected
    ? collectComponentDrilldown(state.events, selected.scope, selected.instance)
    : null;

  const treeMarkup = tree.roots.length === 0
    ? `<div class="empty-state">No components mounted.</div>`
    : `
      <ul class="component-tree-list">
        ${renderComponentTree(tree.roots, selectedKey, state.expandedComponentNodeKeys)}
      </ul>
    `;

  const inspectorMarkup = !selected || !drilldown
    ? `<div class="empty-state">Select a component to inspect Props, Reactive State, and Context.</div>`
    : `
      <div class="component-inspector-header detail-card">
        <div class="inspector-selected-row">
          <div class="inspector-selected-summary">
            <span class="inspector-selected-chip">Selected</span>
            <div>
              <div><span class="accent-text is-cyan">${escapeHtml(selected.scope)}</span> <span class="component-tree-instance">#${selected.instance}</span></div>
              ${selected.aiPreview ? `<div class="muted-text">AI Context: ${escapeHtml(selected.aiPreview)}</div>` : `<div class="muted-text">Nuxt-style drill-down for props, reactive state, DOM preview, and activity.</div>`}
            </div>
          </div>
          <div class="inspector-stats-row">
            ${renderInspectorStatPill("mounts", String(drilldown.mounts))}
            ${renderInspectorStatPill("updates", String(drilldown.updates))}
            ${renderInspectorStatPill("errors", String(drilldown.errors))}
          </div>
        </div>
        ${renderInspectorTabBar(state.activeInspectorTab)}
      </div>
      <div class="inspector-surface">
        ${renderInspectorPanel(state, selected, drilldown)}
      </div>
    `;

  return `
    <div class="components-layout">
      <div class="panel-title is-blue">Component Tree</div>
      <div class="panel-subtitle">Live component instances: ${components.length}</div>
      <div class="components-split-pane">
        <section class="components-tree-pane">
          <div class="button-row component-tree-toolbar">
            <button class="toolbar-button" data-action="clear-component-selection">Clear Selection</button>
          </div>
          ${treeMarkup}
        </section>
        <section class="components-inspector-pane">
          <div class="panel-title is-cyan">State Inspector</div>
          <div class="panel-subtitle">Props, Reactive State, and Context</div>
          ${inspectorMarkup}
        </section>
      </div>
    </div>
  `;
}

function renderComponentTree(
  nodes: ComponentTreeNode[],
  selectedComponentKey: string | null,
  expandedKeys: Set<string>,
  ancestorHasNext: boolean[] = []
): string {
  return nodes.map((node, index) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && expandedKeys.has(node.component.key);
    const isSelected = selectedComponentKey === node.component.key;
    const hasNextSibling = index < nodes.length - 1;

    const guides = ancestorHasNext.map((hasNext) => `
      <span class="tree-indent-guide ${hasNext ? "is-continuing" : ""}"></span>
    `).join("");

    return `
      <li class="component-tree-node">
        <div class="component-tree-row" data-tree-depth="${ancestorHasNext.length}">
          <span class="component-tree-guides">${guides}</span>
          ${hasChildren ? `
            <button
              class="component-tree-toggle"
              data-action="toggle-component-node"
              data-tree-node-key="${escapeHtml(node.component.key)}"
              aria-label="${isExpanded ? "Collapse" : "Expand"} ${escapeHtml(node.component.scope)}"
            >${isExpanded ? "▾" : "▸"}</button>
          ` : `<span class="component-tree-toggle is-placeholder">▸</span>`}
          <button
            class="component-tree-select ${isSelected ? "is-active" : ""}"
            data-component-key="${escapeHtml(node.component.key)}"
            data-component-scope="${escapeHtml(node.component.scope)}"
            data-component-instance="${node.component.instance}"
          >
            <span class="component-tree-label">${escapeHtml(node.component.scope)}</span>
            <span class="component-tree-instance">#${node.component.instance}</span>
          </button>
        </div>
        ${node.component.aiPreview ? `<div class="muted-text ai-hint component-ai-hint">AI: ${escapeHtml(node.component.aiPreview)}</div>` : ""}
        ${hasChildren && isExpanded ? `
          <ul class="component-tree-list component-tree-children">
            ${renderComponentTree(node.children, selectedComponentKey, expandedKeys, [...ancestorHasNext, hasNextSibling])}
          </ul>
        ` : ""}
      </li>
    `;
  }).join("");
}

function isInspectorPanelTab(value: unknown): value is InspectorPanelTab {
  return value === "overview"
    || value === "props"
    || value === "reactive"
    || value === "dom"
    || value === "activity";
}

function renderInspectorStatPill(label: string, value: string): string {
  return `
    <div class="inspector-stat-pill">
      <span class="inspector-stat-label">${escapeHtml(label)}</span>
      <span class="inspector-stat-value">${escapeHtml(value)}</span>
    </div>
  `;
}

function renderInspectorTabBar(activeTab: InspectorPanelTab): string {
  const tabs: Array<{ key: InspectorPanelTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "props", label: "Props" },
    { key: "reactive", label: "Reactive" },
    { key: "dom", label: "DOM" },
    { key: "activity", label: "Activity" }
  ];

  return `
    <div class="inspector-tab-row">
      ${tabs.map((tab) => `
        <button
          class="inspector-tab-button ${activeTab === tab.key ? "is-selected" : ""}"
          data-inspector-tab="${tab.key}"
          type="button"
        >${tab.label}</button>
      `).join("")}
    </div>
  `;
}

function renderInspectorPanel(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
): string {
  switch (state.activeInspectorTab) {
    case "props":
      return renderInspectorPropsPanel(state, selected, drilldown.propsSnapshot);
    case "reactive":
      return renderInspectorReactivePanel(state, selected, drilldown);
    case "dom":
      return renderInspectorDomPanel(drilldown);
    case "activity":
      return renderInspectorActivityPanel(drilldown);
    case "overview":
    default:
      return renderInspectorOverviewPanel(state, selected, drilldown);
  }
}

function renderInspectorOverviewPanel(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
): string {
  const livePropsSnapshot = resolveLivePropsSnapshot(selected.scope, selected.instance, drilldown.propsSnapshot);

  return `
    <div class="inspector-overview-grid">
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Component Identity</div>
        <div class="inspector-grid">
          <div><span class="accent-text is-cyan">Scope:</span> ${escapeHtml(selected.scope)}</div>
          <div><span class="accent-text is-cyan">Instance:</span> ${selected.instance}</div>
          <div><span class="accent-text is-blue">Unmounts:</span> ${drilldown.unmounts}</div>
          <div><span class="accent-text is-blue">Reactive keys:</span> ${drilldown.reactiveState.length}</div>
        </div>
      </div>
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Props Snapshot</div>
        ${renderValueExplorer(livePropsSnapshot ?? {}, "props", state.expandedValuePaths)}
      </div>
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Route Snapshot</div>
        ${renderValueExplorer(drilldown.routeSnapshot ?? {}, "route", state.expandedValuePaths)}
      </div>
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Meta Snapshot</div>
        ${renderValueExplorer(drilldown.metaSnapshot ?? {}, "meta", state.expandedValuePaths)}
      </div>
    </div>
  `;
}

function renderInspectorPropsPanel(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  propsSnapshot: unknown
): string {
  const livePropsSnapshot = resolveLivePropsSnapshot(selected.scope, selected.instance, propsSnapshot);

  if (!livePropsSnapshot || typeof livePropsSnapshot !== "object" || Array.isArray(livePropsSnapshot)) {
    return `
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Props</div>
        ${renderValueExplorer(livePropsSnapshot ?? {}, "props", state.expandedValuePaths)}
      </div>
    `;
  }

  const entries = Object.entries(livePropsSnapshot as Record<string, unknown>);

  if (entries.length === 0) {
    return `
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Props</div>
        <div class="empty-state">This component does not currently expose any props.</div>
      </div>
    `;
  }

  return `
    <div class="detail-card inspector-card">
      <div class="panel-subtitle">Props</div>
      <div class="muted-text">Booleans toggle live. Primitive props can be edited inline. Nested values stay explorable.</div>
      <div class="inspector-control-list">
        ${entries.map(([key, value]) => renderPropInspectorEntry(selected, key, value, state.expandedValuePaths)).join("")}
      </div>
    </div>
  `;
}

function renderInspectorReactivePanel(
  state: DevtoolsState,
  selected: MountedComponentEntry,
  drilldown: ReturnType<typeof collectComponentDrilldown>
): string {
  const liveReactiveEntries = collectOwnedReactiveEntries(selected.scope, selected.instance);

  if (liveReactiveEntries.length === 0 && drilldown.reactiveState.length === 0) {
    return `
      <div class="detail-card inspector-card">
        <div class="panel-subtitle">Reactive State</div>
        <div class="empty-state">No reactive updates linked to this component yet.</div>
      </div>
    `;
  }

  return `
    <div class="detail-card inspector-card">
      <div class="panel-subtitle">Reactive State</div>
      ${liveReactiveEntries.length === 0 ? `<div class="empty-state">No live registry-owned reactives found for this component.</div>` : `
        <div class="muted-text">Registry-backed reactives can be toggled or edited inline without leaving the inspector.</div>
        <div class="inspector-control-list">
          ${liveReactiveEntries.map((entry) => renderReactiveInspectorEntry(entry, state.expandedValuePaths)).join("")}
        </div>
      `}
      ${drilldown.reactiveState.length === 0 ? "" : `
        <div class="panel-subtitle">Recent reactive activity</div>
        <ul class="stack-list reactive-feed">
          ${drilldown.reactiveState.map((entry) => `
            <li class="stack-item reactive-feed-item">
              <span class="accent-text is-cyan">${escapeHtml(entry.key)}</span>
              <span class="muted-text">${escapeHtml(entry.preview)}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderPropInspectorEntry(
  selected: MountedComponentEntry,
  key: string,
  value: unknown,
  expandedValuePaths: Set<string>
): string {
  const resolvedValue = unwrapInspectableValue(value);
  const editable = describeEditablePrimitive(resolvedValue);

  return `
    <div class="inspector-control-row">
      <div class="inspector-control-header">
        <div class="inspector-control-labels">
          <span class="accent-text is-cyan">${escapeHtml(key)}</span>
          <span class="value-badge">${escapeHtml(describeInspectableValueType(value))}</span>
        </div>
        ${editable
          ? renderPrimitiveEditorControl({
              kind: "prop",
              scope: selected.scope,
              instance: selected.instance,
              key,
              value: editable.value,
              valueType: editable.type
            })
          : `<span class="muted-text">Inspect</span>`}
      </div>
      ${isExpandableValue(resolvedValue)
        ? renderValueExplorer(resolvedValue, `props.${key}`, expandedValuePaths)
        : `<div class="inspector-control-preview">${escapeHtml(formatPrimitiveValue(resolvedValue))}</div>`}
    </div>
  `;
}

function renderReactiveInspectorEntry(entry: LiveReactiveEntry, expandedValuePaths: Set<string>): string {
  const editable = describeEditablePrimitive(entry.currentValue);

  return `
    <div class="inspector-control-row">
      <div class="inspector-control-header">
        <div class="inspector-control-labels">
          <span class="accent-text is-cyan">${escapeHtml(entry.label)}</span>
          <span class="value-badge">${escapeHtml(entry.type)}</span>
        </div>
        ${editable
          ? renderPrimitiveEditorControl({
              kind: "reactive",
              rid: entry.rid,
              value: editable.value,
              valueType: editable.type
            })
          : `<span class="muted-text">Inspect</span>`}
      </div>
      ${isExpandableValue(entry.currentValue)
        ? renderValueExplorer(entry.currentValue, `reactive.${entry.rid}`, expandedValuePaths)
        : `<div class="inspector-control-preview">${escapeHtml(formatPrimitiveValue(entry.currentValue))}</div>`}
    </div>
  `;
}

function renderPrimitiveEditorControl(options: {
  kind: "prop" | "reactive";
  valueType: "string" | "number" | "boolean";
  value: PrimitiveEditableValue;
  scope?: string;
  instance?: number;
  key?: string;
  rid?: string;
}): string {
  if (options.valueType === "boolean") {
    if (options.kind === "prop") {
      return `
        <button
          class="toolbar-button inspector-toggle-button ${options.value ? "is-active" : ""}"
          data-action="toggle-live-prop"
          data-component-scope="${escapeHtml(options.scope ?? "")}" 
          data-component-instance="${escapeHtml(String(options.instance ?? ""))}"
          data-prop-key="${escapeHtml(options.key ?? "")}"
          type="button"
        >${options.value ? "Enabled" : "Disabled"}</button>
      `;
    }

    return `
      <button
        class="toolbar-button inspector-toggle-button ${options.value ? "is-active" : ""}"
        data-action="toggle-live-reactive"
        data-reactive-rid="${escapeHtml(options.rid ?? "")}"
        type="button"
      >${options.value ? "Enabled" : "Disabled"}</button>
    `;
  }

  const inputType = options.valueType === "number" ? "number" : "text";
  const dataAttributes = options.kind === "prop"
    ? `data-live-prop-input="true" data-component-scope="${escapeHtml(options.scope ?? "")}" data-component-instance="${escapeHtml(String(options.instance ?? ""))}" data-prop-key="${escapeHtml(options.key ?? "")}"`
    : `data-live-reactive-input="true" data-reactive-rid="${escapeHtml(options.rid ?? "")}"`;

  return `
    <input
      class="inspector-live-input"
      type="${inputType}"
      value="${escapeHtml(String(options.value))}"
      ${dataAttributes}
    />
  `;
}

function renderInspectorDomPanel(drilldown: ReturnType<typeof collectComponentDrilldown>): string {
  return `
    <div class="detail-card inspector-card">
      <div class="panel-subtitle">DOM Preview</div>
      ${drilldown.domPreview.length === 0 ? `<div class="empty-state">No DOM preview available for this component yet.</div>` : `
        <pre class="inspector-code">${escapeHtml(drilldown.domPreview.join("\n"))}</pre>
      `}
    </div>
  `;
}

function renderInspectorActivityPanel(drilldown: ReturnType<typeof collectComponentDrilldown>): string {
  return `
    <div class="detail-card inspector-card">
      <div class="panel-subtitle">Recent Activity</div>
      ${drilldown.recent.length === 0 ? `<div class="empty-state">No component-specific events captured yet.</div>` : `
        <ul class="stack-list activity-feed">
          ${drilldown.recent.map((entry) => `
            <li class="stack-item">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `}
    </div>
  `;
}

function renderValueExplorer(
  value: unknown,
  rootPath: string,
  expandedValuePaths: Set<string>
): string {
  if (!isExpandableValue(value)) {
    return `<div class="value-empty">${escapeHtml(formatPrimitiveValue(value))}</div>`;
  }

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) {
    return `<div class="value-empty">${Array.isArray(value) ? "[]" : "{}"}</div>`;
  }

  return `
    <div class="value-explorer">
      ${entries.map(([key, entryValue]) => renderValueNode(key, entryValue, `${rootPath}.${key}`, expandedValuePaths)).join("")}
    </div>
  `;
}

function renderValueNode(
  key: string,
  value: unknown,
  path: string,
  expandedValuePaths: Set<string>,
  depth = 0
): string {
  if (!isExpandableValue(value)) {
    return `
      <div class="value-leaf" data-value-depth="${depth}">
        <span class="value-key">${escapeHtml(key)}</span>
        <span class="value-badge">${escapeHtml(describeValueType(value))}</span>
        <span class="value-preview">${escapeHtml(formatPrimitiveValue(value))}</span>
      </div>
    `;
  }

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value as Record<string, unknown>);
  const expanded = expandedValuePaths.has(path);

  return `
    <div class="value-node" data-value-depth="${depth}">
      <button
        class="value-node-toggle"
        data-action="toggle-value-node"
        data-value-path="${escapeHtml(path)}"
        type="button"
      >
        <span class="value-node-chevron">${expanded ? "▾" : "▸"}</span>
        <span class="value-key">${escapeHtml(key)}</span>
        <span class="value-badge">${Array.isArray(value) ? `array(${entries.length})` : `object(${entries.length})`}</span>
      </button>
      ${expanded ? `
        <div class="value-node-children">
          ${entries.length === 0 ? `<div class="value-empty">${Array.isArray(value) ? "[]" : "{}"}</div>` : entries.map(([childKey, childValue]) => renderValueNode(childKey, childValue, `${path}.${childKey}`, expandedValuePaths, depth + 1)).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function isExpandableValue(value: unknown): value is Record<string, unknown> | unknown[] {
  return Array.isArray(value) || (!!value && typeof value === "object");
}

function describeValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

function formatPrimitiveValue(value: unknown): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return String(value);
  }

  return shortJson(value);
}

function renderSignalsPanel(state: DevtoolsState): string {
  const updates = collectSignalUpdates(state.events);
  const effectRuns = state.events.filter((event) => event.type === "effect:run").length;
  const registry = collectSignalRegistrySnapshot();
  const registryById = new Map(registry.map((entry) => [entry.id, entry]));
  const registryByKey = new Map(
    registry
      .filter((entry) => Boolean(entry.key))
      .map((entry) => [entry.key as string, entry])
  );

  const resolvedUpdates = updates.map((update) => {
    const match = registryById.get(update.key) ?? registryByKey.get(update.key);
    return {
      ...update,
      label: match?.label ?? update.key,
      type: match?.type
    };
  });

  const updatesMarkup = resolvedUpdates.length === 0
    ? `<div class="empty-state">No recent reactive updates in the buffered event window.</div>`
    : `
      <ul class="stack-list">
        ${resolvedUpdates.map((update) => `
          <li class="stack-item">
            <span class="accent-text is-cyan">${escapeHtml(update.label)}</span>
            ${update.type ? `<span class="muted-text">(${escapeHtml(update.type)})</span>` : ""}
            <span class="muted-text">= ${escapeHtml(update.preview)}</span>
          </li>
        `).join("")}
      </ul>
    `;

  const registryMarkup = registry.length === 0
    ? `<div class="empty-state">No active refs/signals/reactive values registered.</div>`
    : `
      <ul class="stack-list compact-list">
        ${registry.slice(0, 36).map((entry) => `
          <li class="stack-item performance-item">
            <span class="accent-text is-purple">${escapeHtml(entry.label)}</span>
            <span class="muted-text">${escapeHtml(entry.type)}</span>
            <span class="muted-text">${escapeHtml(entry.valuePreview)}</span>
          </li>
        `).join("")}
      </ul>
    `;

  return renderPageShell({
    title: "Ref / Reactive Inspector",
    accentClass: "is-purple",
    subtitle: `Effects run: ${effectRuns} | Active reactive values: ${registry.length}`,
    pills: [
      `${resolvedUpdates.length} recent updates`,
      `${registry.length} active values`
    ],
    body: [
      renderPageSection("Recent updates", updatesMarkup),
      renderPageSection("Active reactive registry", registryMarkup)
    ].join("")
  });
}

function renderMetaPanel(state: DevtoolsState): string {
  const entries = collectMetaEntries(state.events);
  const selected = entries.find((entry) => entry.key === state.selectedMetaKey) ?? entries[0] ?? null;

  if (entries.length === 0) {
    return renderPageShell({
      title: "Meta / AI / Route Inspector",
      accentClass: "is-green",
      subtitle: "Metadata currently available on the debug stream",
      body: renderPageSection("Observed metadata", `<div class="empty-state">No component metadata has been observed yet.</div>`, "is-full")
    });
  }

  const selectionMarkup = `
    <ul class="stack-list compact-list">
      ${entries.map((entry) => `
        <li>
          <button class="select-button ${selected?.key === entry.key ? "is-selected" : ""}" data-meta-key="${escapeHtml(entry.key)}">
            <span class="accent-text is-green">${escapeHtml(entry.scope)}</span>
            <span class="muted-text">#${entry.instance}</span>
          </button>
        </li>
      `).join("")}
    </ul>
  `;

  return renderPageShell({
    title: "Meta / AI / Route Inspector",
    accentClass: "is-green",
    subtitle: `Components with metadata: ${entries.length}`,
    pills: [selected ? `${selected.scope}#${selected.instance} selected` : "No selection"],
    body: [
      renderPageSection("Observed metadata", selectionMarkup),
      renderPageSection("Meta snapshot", renderValueExplorer(selected?.meta ?? {}, "meta-panel.meta", state.expandedValuePaths)),
      renderPageSection("AI snapshot", renderValueExplorer(selected?.ai ?? {}, "meta-panel.ai", state.expandedValuePaths)),
      renderPageSection("Route snapshot", renderValueExplorer(selected?.route ?? {}, "meta-panel.route", state.expandedValuePaths))
    ].join("")
  });
}

function renderIssuesPanel(events: DevtoolsEvent[]): string {
  const issues = events.filter((event) =>
    event.type.startsWith("error:") ||
    event.type.includes("warn") ||
    event.type.includes("hydration") ||
    event.level === "error" ||
    event.level === "warn"
  );

  const errorCount = issues.filter((event) => event.level === "error" || event.type.startsWith("error:")).length;
  const warnCount = issues.filter((event) => event.level === "warn" || event.type.includes("warn")).length;

  if (issues.length === 0) {
    return renderPageShell({
      title: "Issues and Warnings",
      accentClass: "is-red",
      subtitle: "Errors: 0 | Warnings: 0",
      body: renderPageSection("Issue feed", `<div class="empty-state">No issues detected.</div>`, "is-full")
    });
  }

  return renderPageShell({
    title: "Issues and Warnings",
    accentClass: "is-red",
    subtitle: `Errors: ${errorCount} | Warnings: ${warnCount}`,
    pills: [`${issues.length} surfaced events`],
    body: renderPageSection("Issue feed", `
      <ul class="stack-list">
        ${issues.slice(-50).map((issue) => `
          <li class="stack-item ${issue.level === "error" || issue.type.startsWith("error:") ? "issue-error" : "issue-warn"}">
            <span class="item-label">[${escapeHtml(issue.type)}]</span>
            <span>${escapeHtml(issueMessage(issue))}</span>
          </li>
        `).join("")}
      </ul>
    `, "is-full")
  });
}

function renderLogsPanel(state: DevtoolsState): string {
  const logs = state.events.slice(-100).filter((event) => {
    if (state.logFilter === "all") return true;
    return event.type.includes(state.logFilter);
  });

  return renderPageShell({
    title: "Event Logs",
    accentClass: "is-blue",
    subtitle: `Total events: ${state.events.length}`,
    pills: [`filter: ${state.logFilter}`],
    body: [
      renderPageSection("Filters", `
        <div class="button-row">
          ${(["all", "component", "signal", "effect", "error", "hub", "route"] as const).map((filter) => `
            <button class="filter-button ${state.logFilter === filter ? "is-active" : ""}" data-log-filter="${filter}">${filter}</button>
          `).join("")}
        </div>
      `, "is-full"),
      renderPageSection("Recent events", logs.length === 0 ? `<div class="empty-state">No events.</div>` : `
        <ul class="stack-list log-list">
          ${logs.map((log) => `
            <li class="stack-item">
              <span class="accent-text is-cyan">[${escapeHtml(log.type)}]</span>
              <span>${escapeHtml(summarizeLog(log))}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}

function renderTimelinePanel(state: DevtoolsState): string {
  const timeline = buildTimeline(state.events, 250);
  const cursor = timeline.length === 0 ? -1 : Math.max(0, Math.min(state.timelineCursor, timeline.length - 1));
  const replayedCount = timeline.length === 0 ? 0 : replayEventsAtIndex(timeline, cursor).length;

  return renderPageShell({
    title: "Timeline and Replay",
    accentClass: "is-green",
    subtitle: `Replaying ${replayedCount} / ${timeline.length} events`,
    pills: [timeline.length === 0 ? "timeline empty" : `cursor ${cursor}`],
    body: [
      renderPageSection("Replay cursor", timeline.length > 0 ? `
        <div class="range-wrap">
          <input class="timeline-slider" type="range" min="0" max="${Math.max(0, timeline.length - 1)}" value="${Math.max(0, cursor)}" data-timeline-cursor="true" />
          <div class="tiny-muted">Cursor: ${cursor}</div>
        </div>
      ` : `<div class="empty-state">No events in timeline.</div>`, "is-full"),
      renderPageSection("Replay feed", timeline.length === 0 ? `<div class="empty-state">No events in timeline.</div>` : `
        <ul class="stack-list log-list">
          ${timeline.map((entry, index) => `
            <li class="stack-item ${index <= cursor ? "timeline-active" : "timeline-inactive"}">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}

function renderRouterPanel(events: DevtoolsEvent[]): string {
  const metrics = computeRouterMetrics(events, 30000);
  const snapshot = collectRouteSnapshot(events);
  const timeline = collectRouteTimeline(events).slice(-80).reverse();
  const issues = collectRouteIssues(events).slice(-30).reverse();

  return renderPageShell({
    title: "Router Diagnostics",
    accentClass: "is-cyan",
    subtitle: `Current route: ${snapshot.currentRoute ?? "unknown"}`,
    pills: [
      `${metrics.pendingNavigations} pending`,
      `${metrics.redirects} redirects`,
      `${metrics.errors} errors`
    ],
    body: [
      renderPageSection("Window metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Route Events (30s)", String(metrics.totalRouteEvents))}
          ${renderMetricCard("Navigate Start", String(metrics.navigationStarts))}
          ${renderMetricCard("Navigate End", String(metrics.navigationEnds))}
          ${renderMetricCard("Route Changed", String(metrics.routeChanges))}
          ${renderMetricCard("Pending", String(metrics.pendingNavigations))}
          ${renderMetricCard("Redirects", String(metrics.redirects))}
          ${renderMetricCard("Blocked", String(metrics.blocked))}
          ${renderMetricCard("Warnings", String(metrics.warnings))}
          ${renderMetricCard("Router Errors", String(metrics.errors))}
          ${renderMetricCard("Load Start", String(metrics.loadStarts))}
          ${renderMetricCard("Load End", String(metrics.loadEnds))}
          ${renderMetricCard("Avg Load", `${metrics.avgLoadMs}ms`)}
          ${renderMetricCard("Max Load", `${metrics.maxLoadMs}ms`)}
        </div>
      `, "is-full"),
      renderPageSection("Route snapshot", `
        <div class="inspector-grid">
          <div><span class="accent-text is-cyan">Current:</span> ${escapeHtml(snapshot.currentRoute ?? "unknown")}</div>
          <div><span class="accent-text is-cyan">Last Event:</span> ${escapeHtml(snapshot.lastEventType ?? "none")}</div>
          <div><span class="accent-text is-cyan">Last Source:</span> ${escapeHtml(snapshot.source ?? "unknown")}</div>
          <div><span class="accent-text is-cyan">Last From:</span> ${escapeHtml(snapshot.from ?? "null")}</div>
          <div><span class="accent-text is-cyan">Last To:</span> ${escapeHtml(snapshot.to ?? "null")}</div>
          <div><span class="accent-text is-cyan">Params:</span> ${escapeHtml(shortJson(snapshot.params ?? {}))}</div>
          <div><span class="accent-text is-cyan">Query:</span> ${escapeHtml(shortJson(snapshot.query ?? {}))}</div>
          <div><span class="accent-text is-cyan">Guard Context:</span> ${escapeHtml(snapshot.guardContext ?? "none")}</div>
          <div><span class="accent-text is-cyan">Phase:</span> ${escapeHtml(snapshot.phase ?? "unknown")}</div>
        </div>
      `),
      renderPageSection("Route activity by target", metrics.byRoute.length === 0 ? `<div class="empty-state">No route activity in the current window.</div>` : `
        <ul class="stack-list log-list">
          ${metrics.byRoute.slice(0, 12).map((entry) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-cyan">${escapeHtml(entry.route)}</span>
              <span class="muted-text">hits=${entry.hits}</span>
              <span class="muted-text">blocked=${entry.blocked}</span>
              <span class="muted-text">redirects=${entry.redirects}</span>
              <span class="muted-text">errors=${entry.errors}</span>
              <span class="muted-text">avg=${entry.avgLoadMs}ms</span>
              <span class="muted-text">max=${entry.maxLoadMs}ms</span>
            </li>
          `).join("")}
        </ul>
      `),
      renderPageSection("Route issues", issues.length === 0 ? `<div class="empty-state">No router warnings or errors.</div>` : `
        <ul class="stack-list">
          ${issues.map((issue) => `
            <li class="stack-item ${issue.type === "error:router" || issue.type === "route:blocked" ? "issue-error" : "issue-warn"}">
              <span class="item-label">[${escapeHtml(issue.type)}]</span>
              <span>${escapeHtml(issue.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `),
      renderPageSection("Recent route timeline", timeline.length === 0 ? `<div class="empty-state">No route events captured yet.</div>` : `
        <ul class="stack-list log-list">
          ${timeline.map((entry) => `
            <li class="stack-item">
              <span class="item-label">[${escapeHtml(entry.type)}]</span>
              <span>${escapeHtml(entry.summary)}</span>
            </li>
          `).join("")}
        </ul>
      `, "is-full")
    ].join("")
  });
}

function renderPerformancePanel(events: DevtoolsEvent[]): string {
  const metrics = computePerformanceMetrics(events, 10000);

  return renderPageShell({
    title: "Performance",
    accentClass: "is-amber",
    subtitle: `Hot event types: ${metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", ")}`,
    pills: [`${metrics.totalEvents} events / 10s`, `${metrics.updatesPerSecond} events / sec`],
    body: [
      renderPageSection("Performance window", `
        <div class="metrics-grid">
          ${renderMetricCard("Events (10s)", String(metrics.totalEvents))}
          ${renderMetricCard("Events / sec", String(metrics.updatesPerSecond))}
          ${renderMetricCard("Effect Runs", String(metrics.effectRuns))}
          ${renderMetricCard("Render Events", String(metrics.renderEvents))}
          ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
          ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
          ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
          ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
          ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
          ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
          ${renderMetricCard("Hub Connects", String(metrics.hubConnections))}
          ${renderMetricCard("Hub Disconnects", String(metrics.hubDisconnections))}
          ${renderMetricCard("Hub Errors", String(metrics.hubErrors))}
          ${renderMetricCard("Hub Push", String(metrics.hubPushReceived))}
        </div>
      `, "is-full"),
      renderPageSection("Hot event types", `<div class="muted-text">${escapeHtml(metrics.hotTypes.length === 0 ? "none" : metrics.hotTypes.join(", "))}</div>`),
      renderPageSection("By event type", metrics.byType.length === 0 ? `<div class="empty-state">No performance data yet.</div>` : `
        <ul class="stack-list log-list">
          ${metrics.byType.slice(0, 20).map((item) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(item.type)}</span>
              <span class="muted-text">count=${item.count}</span>
              <span class="muted-text">avg=${item.avgDeltaMs}ms</span>
              <span class="muted-text">max=${item.maxDeltaMs}ms</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

function renderQueuePanel(events: DevtoolsEvent[]): string {
  const metrics = computePerformanceMetrics(events, 10000);
  const queueEvents = events
    .filter((event) => event.type.startsWith("queue:"))
    .slice(-80)
    .reverse();

  return renderPageShell({
    title: "Queue Monitor",
    accentClass: "is-amber",
    subtitle: `Pending estimate: ${metrics.queueDepthEstimate} | Enqueued: ${metrics.queueEnqueued}`,
    pills: [`${metrics.queueConflicts} conflicts`, `${metrics.queueRetried} retried`],
    body: [
      renderPageSection("Queue metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Queue Enqueued", String(metrics.queueEnqueued))}
          ${renderMetricCard("Queue Conflicts", String(metrics.queueConflicts))}
          ${renderMetricCard("Queue Retried", String(metrics.queueRetried))}
          ${renderMetricCard("Queue Failed", String(metrics.queueFailed))}
          ${renderMetricCard("Queue Flushed", String(metrics.queueFlushed))}
          ${renderMetricCard("Queue Depth Est.", String(metrics.queueDepthEstimate))}
        </div>
      `),
      renderPageSection("Recent queue events", queueEvents.length === 0 ? `<div class="empty-state">No queue events yet.</div>` : `
        <ul class="stack-list log-list">
          ${queueEvents.map((event) => `
            <li class="stack-item performance-item">
              <span class="accent-text is-amber">${escapeHtml(event.type)}</span>
              <span class="muted-text">${escapeHtml(queueEventSummary(event))}</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

function renderSanityPanel(events: DevtoolsEvent[]): string {
  const metrics = computeSanityMetrics(events, {
    ...DEFAULT_SANITY_THRESHOLDS,
    debugListenerCount: getDebugListenerCount()
  });

  const criticalCount = metrics.alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = metrics.alerts.filter((alert) => alert.severity === "warning").length;

  return renderPageShell({
    title: "Sanity Check",
    accentClass: "is-red",
    subtitle: `Critical: ${criticalCount} | Warnings: ${warningCount}`,
    pills: [`${metrics.activeEffects} active effects`, `${metrics.debugListenerCount} debug listeners`],
    body: [
      renderPageSection("Sanity metrics", `
        <div class="metrics-grid">
          ${renderMetricCard("Active Effects", String(metrics.activeEffects))}
          ${renderMetricCard("Effect Creates", String(metrics.effectCreates))}
          ${renderMetricCard("Effect Disposes", String(metrics.effectDisposes))}
          ${renderMetricCard("Effect Runs / sec", String(metrics.effectRunsPerSecond))}
          ${renderMetricCard("Effect Imbalance", String(metrics.effectImbalance))}
          ${renderMetricCard("Debug Listeners", String(metrics.debugListenerCount))}
        </div>
      `),
      renderPageSection("Alerts", metrics.alerts.length === 0 ? `<div class="empty-state">No runaway effects or listener leaks detected in the active window.</div>` : `
        <ul class="stack-list">
          ${metrics.alerts.map((alert) => `
            <li class="stack-item ${alert.severity === "critical" ? "issue-error" : "issue-warn"}">
              <span class="item-label">[${escapeHtml(alert.severity.toUpperCase())}]</span>
              <span>${escapeHtml(alert.message)}</span>
              <span class="muted-text">current=${escapeHtml(String(alert.current))}, threshold=${escapeHtml(String(alert.threshold))}</span>
            </li>
          `).join("")}
        </ul>
      `)
    ].join("")
  });
}

function renderSettingsPanel(state: DevtoolsState): string {
  const positionChoices: Array<{ value: DevtoolsOverlayPosition; label: string }> = [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "center", label: "Center" }
  ];

  const panelSizes: Array<{ value: DevtoolsOverlaySize; label: string }> = [
    { value: "normal", label: "Normal" },
    { value: "large", label: "Large" }
  ];

  return renderPageShell({
    title: "Devtools Settings",
    accentClass: "is-purple",
    subtitle: "Layout, persistence, and session controls",
    pills: [`dock: ${state.overlayPosition}`, `size: ${state.overlayPanelSize}`],
    body: [
      renderPageSection("Overlay Position", `
        <div class="button-row">
          ${positionChoices.map((choice) => `
            <button
              class="select-button ${state.overlayPosition === choice.value ? "is-selected" : ""}"
              data-layout-position="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Panel Size", `
        <div class="button-row">
          ${panelSizes.map((choice) => `
            <button
              class="select-button ${state.overlayPanelSize === choice.value ? "is-selected" : ""}"
              data-layout-size="${choice.value}"
              type="button"
            >${choice.label}</button>
          `).join("")}
        </div>
      `),
      renderPageSection("Persist Preferences", `
        <div class="muted-text">Store position and size in local storage for the next session.</div>
        <div class="button-row">
          <button
            class="toolbar-button ${state.persistOverlayPreferences ? "is-active" : ""}"
            data-layout-persist-toggle="true"
            type="button"
          >${state.persistOverlayPreferences ? "Enabled" : "Disabled"}</button>
        </div>
      `),
      renderPageSection("Session Actions", `
        <div class="button-row">
          <button class="toolbar-button danger-button" data-clear-events="true">Clear All Events</button>
        </div>
      `)
    ].join("")
  });
}

function renderAIDiagnosticsPanel(state: DevtoolsState): string {
  const aiStatusLabel = state.aiStatus === "loading"
    ? "Querying assistant..."
    : state.aiStatus === "ready"
    ? "Response ready"
    : state.aiStatus === "error"
    ? "Assistant unavailable"
    : "Prompt-only mode";

  return renderPageShell({
    title: "AI Diagnostics",
    accentClass: "is-purple",
    subtitle: "Snapshot-driven context and likely cause insights",
    pills: [aiStatusLabel],
    className: "ai-page",
    body: [
      renderPageSection("Assistant controls", `
        <div class="button-row">
          <button class="toolbar-button ask-ai-button" data-action="ask-ai">Ask Terajs AI</button>
          <button class="toolbar-button" data-action="copy-ai-prompt">Copy Prompt</button>
        </div>
      `, "is-full ai-panel"),
      renderPageSection("Assistant status", `
        <div><span class="accent-text is-purple">Assistant Status:</span> ${escapeHtml(aiStatusLabel)}</div>
        <div><span class="accent-text is-purple">Current AI Insight:</span> ${escapeHtml(state.aiLikelyCause ?? "No reactive error detected yet.")}</div>
        ${state.aiStatus === "loading" ? `<div class="empty-state">Consulting configured assistant provider...</div>` : ""}
        ${state.aiError ? `<div class="detail-card issue-error"><div class="accent-text is-red">${escapeHtml(state.aiError)}</div></div>` : ""}
      `, "is-full"),
      renderPageSection("Assistant response", state.aiResponse ? `<pre class="ai-response">${escapeHtml(state.aiResponse)}</pre>` : `<div class="empty-state">No assistant response captured yet.</div>`, "is-full"),
      renderPageSection("AI prompt", state.aiPrompt ? `<pre class="ai-prompt">${escapeHtml(state.aiPrompt)}</pre>` : `<div class="empty-state">Click \"Ask Terajs AI\" to build a prompt from the active keyed signal registry.</div>`, "is-full")
    ].join("")
  });
}

function renderPageShell(options: {
  title: string;
  accentClass: string;
  subtitle: string;
  pills?: string[];
  body: string;
  className?: string;
}): string {
  const pillsMarkup = options.pills && options.pills.length > 0
    ? `
      <div class="panel-hero-pills">
        ${options.pills.map((pill) => `<span class="panel-hero-pill">${escapeHtml(pill)}</span>`).join("")}
      </div>
    `
    : "";

  return `
    <div class="devtools-page ${options.className ?? ""}">
      <div class="panel-hero">
        <div class="panel-title ${options.accentClass}">${escapeHtml(options.title)}</div>
        <div class="panel-subtitle">${escapeHtml(options.subtitle)}</div>
        ${pillsMarkup}
      </div>
      <div class="panel-section-grid">
        ${options.body}
      </div>
    </div>
  `;
}

function renderPageSection(title: string, content: string, className = ""): string {
  const cardClass = className.length > 0 ? `detail-card panel-section-card ${className}` : "detail-card panel-section-card";

  return `
    <section class="${cardClass}">
      <div class="panel-section-heading">${escapeHtml(title)}</div>
      ${content}
    </section>
  `;
}

function renderMetricCard(label: string, value: string): string {
  return `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderEmptyPanel(title: string, subtitle: string, message: string): string {
  return `
    <div>
      <div class="panel-title is-blue">${escapeHtml(title)}</div>
      <div class="panel-subtitle">${escapeHtml(subtitle)}</div>
      <div class="empty-state">${escapeHtml(message)}</div>
    </div>
  `;
}

function collectMountedComponents(state: DevtoolsState) {
  const fromRegistry: MountedComponentEntry[] = Array.from(state.mountedComponents.values())
    .sort((left, right) => left.scope.localeCompare(right.scope) || left.instance - right.instance)
    .map((entry) => ({
      key: entry.key,
      scope: entry.scope,
      instance: entry.instance,
      aiPreview: entry.aiPreview
    }));

  if (fromRegistry.length > 0) {
    return fromRegistry;
  }

  return collectMountedComponentsFromDom();
}

function collectMountedComponentsFromDom() {
  if (typeof document === "undefined") {
    return [] as MountedComponentEntry[];
  }

  const componentMap = new Map<string, MountedComponentEntry>();
  const elements = document.querySelectorAll<HTMLElement>("[data-terajs-component-scope][data-terajs-component-instance]");

  for (const element of Array.from(elements)) {
    const scope = element.getAttribute("data-terajs-component-scope");
    const instanceRaw = element.getAttribute("data-terajs-component-instance");
    const instance = instanceRaw !== null ? Number(instanceRaw) : Number.NaN;
    if (!scope || !Number.isFinite(instance)) {
      continue;
    }

    const key = buildComponentKey(scope, instance);
    if (!componentMap.has(key)) {
      componentMap.set(key, {
        key,
        scope,
        instance
      });
    }
  }

  return Array.from(componentMap.values()).sort((left, right) => left.scope.localeCompare(right.scope) || left.instance - right.instance);
}

function buildComponentTree(components: MountedComponentEntry[]): {
  roots: ComponentTreeNode[];
  parentByKey: Map<string, string>;
} {
  const nodeMap = new Map<string, ComponentTreeNode>();
  const parentByKey = resolveComponentParentMapFromDom(components);

  for (const component of components) {
    nodeMap.set(component.key, {
      component,
      children: []
    });
  }

  const roots: ComponentTreeNode[] = [];

  for (const component of components) {
    const node = nodeMap.get(component.key);
    if (!node) {
      continue;
    }

    const parentKey = parentByKey.get(component.key);
    const parentNode = parentKey ? nodeMap.get(parentKey) : undefined;

    if (parentNode && parentNode.component.key !== node.component.key) {
      parentNode.children.push(node);
      continue;
    }

    roots.push(node);
  }

  sortComponentTree(roots);

  return {
    roots,
    parentByKey
  };
}

function resolveComponentParentMapFromDom(components: MountedComponentEntry[]): Map<string, string> {
  const parentByKey = new Map<string, string>();

  if (typeof document === "undefined") {
    return parentByKey;
  }

  for (const component of components) {
    const selector = `[data-terajs-component-scope="${escapeAttributeSelector(component.scope)}"][data-terajs-component-instance="${component.instance}"]`;
    const element = document.querySelector(selector);
    if (!(element instanceof HTMLElement)) {
      continue;
    }

    const parentElement = element.parentElement?.closest<HTMLElement>("[data-terajs-component-scope][data-terajs-component-instance]");
    if (!parentElement) {
      continue;
    }

    const parentScope = parentElement.getAttribute("data-terajs-component-scope");
    const parentInstanceRaw = parentElement.getAttribute("data-terajs-component-instance");
    const parentInstance = parentInstanceRaw !== null ? Number(parentInstanceRaw) : Number.NaN;

    if (!parentScope || !Number.isFinite(parentInstance)) {
      continue;
    }

    const parentKey = buildComponentKey(parentScope, parentInstance);
    if (parentKey !== component.key) {
      parentByKey.set(component.key, parentKey);
    }
  }

  return parentByKey;
}

function sortComponentTree(nodes: ComponentTreeNode[]): void {
  nodes.sort((left, right) =>
    left.component.scope.localeCompare(right.component.scope) || left.component.instance - right.component.instance
  );

  for (const node of nodes) {
    sortComponentTree(node.children);
  }
}

function collectExpandableTreeKeys(nodes: ComponentTreeNode[]): string[] {
  const keys: string[] = [];

  for (const node of nodes) {
    if (node.children.length > 0) {
      keys.push(node.component.key);
      keys.push(...collectExpandableTreeKeys(node.children));
    }
  }

  return keys;
}

function expandSelectedTreePath(
  expandedKeys: Set<string>,
  selectedKey: string | null,
  parentByKey: Map<string, string>
): void {
  if (!selectedKey) {
    return;
  }

  let cursor = selectedKey;
  while (parentByKey.has(cursor)) {
    const parent = parentByKey.get(cursor);
    if (!parent) {
      break;
    }

    expandedKeys.add(parent);
    cursor = parent;
  }
}

function applyComponentLifecycle(
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>,
  expandedComponentNodeKeys: Set<string>,
  event: DevtoolsEvent
) {
  const identity = readComponentIdentity(event);
  if (!identity) {
    return;
  }

  const key = buildComponentKey(identity.scope, identity.instance);
  const current = mountedComponents.get(key);

  if (isComponentMountEvent(event.type)) {
    const ai = readUnknown(event.payload, "ai");
    mountedComponents.set(key, {
      key,
      scope: identity.scope,
      instance: identity.instance,
      aiPreview: ai !== undefined ? safeString(ai).slice(0, 160) : current?.aiPreview,
      lastSeenAt: event.timestamp
    });
    expandedComponentNodeKeys.add(key);
    return;
  }

  if (isComponentUnmountEvent(event.type)) {
    mountedComponents.delete(key);
    expandedComponentNodeKeys.delete(key);
    return;
  }

  if (!current) {
    return;
  }

  const ai = readUnknown(event.payload, "ai");
  mountedComponents.set(key, {
    ...current,
    aiPreview: ai !== undefined ? safeString(ai).slice(0, 160) : current.aiPreview,
    lastSeenAt: event.timestamp
  });
}

function resolveSelectedComponent(
  components: MountedComponentEntry[],
  selectedComponentKey: string | null
) {
  if (selectedComponentKey) {
    const selected = components.find((component) => component.key === selectedComponentKey);
    if (selected) {
      return selected;
    }

    const parsed = parseComponentKey(selectedComponentKey);
    if (parsed) {
      return {
        key: selectedComponentKey,
        scope: parsed.scope,
        instance: parsed.instance
      };
    }
  }

  return components[0] ?? null;
}

function collectComponentDrilldown(events: DevtoolsEvent[], scope: string, instance: number) {
  let mounts = 0;
  let unmounts = 0;
  let updates = 0;
  let errors = 0;
  let propsSnapshot: unknown = undefined;
  let metaSnapshot: unknown = undefined;
  let routeSnapshot: unknown = undefined;
  const reactiveKeys = new Set<string>();
  const reactiveStateMap = new Map<string, string>();

  const recent: Array<{ type: string; summary: string }> = [];

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const identity = readComponentIdentity(event);
    const matchesComponent = identity?.scope === scope && identity.instance === instance;

    if (isSignalLikeUpdate(event.type)) {
      const reactiveKey = readString(event.payload, "rid") ?? readString(event.payload, "key");
      if (reactiveKey && reactiveKey.includes(`${scope}#${instance}`)) {
        reactiveKeys.add(reactiveKey);

        if (!reactiveStateMap.has(reactiveKey)) {
          const reactivePreview =
            readUnknown(event.payload, "next") ??
            readUnknown(event.payload, "value") ??
            readUnknown(event.payload, "newValue") ??
            readUnknown(event.payload, "prev") ??
            readUnknown(event.payload, "initialValue");

          reactiveStateMap.set(reactiveKey, shortJson(reactivePreview));
        }
      }
    }

    const isComponentError = event.type === "error:component"
      && (readString(event.payload, "name") === scope || readString(event.payload, "scope") === scope)
      && (readNumber(event.payload, "instance") ?? instance) === instance;

    if (!matchesComponent && !isComponentError) {
      continue;
    }

    if (isComponentMountEvent(event.type)) mounts += 1;
    if (isComponentUnmountEvent(event.type)) unmounts += 1;
    if (event.type === "component:update" || event.type === "component:state:update" || event.type === "component:props:update") updates += 1;
    if (event.type === "error:component") errors += 1;

    if (propsSnapshot === undefined) {
      propsSnapshot = readUnknown(event.payload, "props") ?? readUnknown(event.payload, "componentProps") ?? {};
    }

    if (metaSnapshot === undefined) {
      metaSnapshot = readUnknown(event.payload, "meta") ?? {};
    }

    if (routeSnapshot === undefined) {
      routeSnapshot = readUnknown(event.payload, "route") ?? {};
    }

    if (recent.length < 8) {
      recent.push({
        type: event.type,
        summary: summarizeLog(event)
      });
    }
  }

  return {
    mounts,
    unmounts,
    updates,
    errors,
    propsSnapshot,
    metaSnapshot,
    routeSnapshot,
    reactiveState: Array.from(reactiveStateMap.entries()).map(([key, preview]) => ({ key, preview })).slice(0, 16),
    reactiveKeys: Array.from(reactiveKeys).slice(0, 8),
    domPreview: collectDomSubtreePreview(scope, instance),
    recent
  };
}

function collectDomSubtreePreview(scope: string, instance: number): string[] {
  if (typeof document === "undefined") {
    return [];
  }

  const selector = `[data-terajs-component-scope="${escapeAttributeSelector(scope)}"][data-terajs-component-instance="${instance}"]`;
  const root = document.querySelector(selector);
  if (!(root instanceof HTMLElement)) {
    return [];
  }

  const lines: string[] = [];
  const queue: Array<{ element: Element; depth: number }> = [{ element: root, depth: 0 }];

  while (queue.length > 0 && lines.length < 12) {
    const current = queue.shift();
    if (!current) break;

    const { element, depth } = current;
    const indent = "  ".repeat(depth);
    const idPart = element.id ? `#${element.id}` : "";
    const classPart = element.classList.length > 0
      ? `.${Array.from(element.classList).slice(0, 2).join(".")}`
      : "";

    lines.push(`${indent}<${element.tagName.toLowerCase()}${idPart}${classPart}>`);

    for (const child of Array.from(element.children).slice(0, 4)) {
      queue.push({
        element: child,
        depth: depth + 1
      });
    }
  }

  return lines;
}

function resolveLivePropsSnapshot(scope: string, instance: number, fallback: unknown): unknown {
  return resolveLiveComponentContext(scope, instance)?.props ?? fallback;
}

function resolveLiveComponentContext(scope: string, instance: number): InspectableComponentContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  const selector = `[data-terajs-component-scope="${escapeAttributeSelector(scope)}"][data-terajs-component-instance="${instance}"]`;
  const element = document.querySelector(selector) as (HTMLElement & { __terajsComponentContext?: InspectableComponentContext }) | null;
  const context = element?.__terajsComponentContext;

  if (!context || typeof context !== "object") {
    return null;
  }

  return context;
}

function toggleLivePropValue(scope: string, instance: number, key: string): boolean {
  const context = resolveLiveComponentContext(scope, instance);
  if (!context?.props || typeof context.props !== "object") {
    return false;
  }

  const props = context.props as Record<string, unknown>;
  const resolved = unwrapInspectableValue(props[key]);
  if (typeof resolved !== "boolean") {
    return false;
  }

  return applyLivePropValue(props, key, !resolved);
}

function applyLivePropInput(scope: string, instance: number, key: string, rawValue: string): boolean {
  const context = resolveLiveComponentContext(scope, instance);
  if (!context?.props || typeof context.props !== "object") {
    return false;
  }

  const props = context.props as Record<string, unknown>;
  const currentValue = unwrapInspectableValue(props[key]);
  const coerced = coerceEditableInputValue(rawValue, currentValue);
  if (coerced === undefined) {
    return false;
  }

  return applyLivePropValue(props, key, coerced);
}

function applyLivePropValue(props: Record<string, unknown>, key: string, nextValue: PrimitiveEditableValue): boolean {
  const currentValue = props[key];

  if (isRefLike(currentValue)) {
    currentValue.value = nextValue;
    return true;
  }

  if (isSignalLike(currentValue)) {
    currentValue.set(nextValue);
    return true;
  }

  props[key] = nextValue;
  return true;
}

function toggleLiveReactiveValue(rid: string): boolean {
  const currentValue = getReactiveByRid(rid)?.currentValue;
  if (typeof currentValue !== "boolean") {
    return false;
  }

  return setReactiveValue(rid, !currentValue);
}

function applyLiveReactiveInput(rid: string, rawValue: string): boolean {
  const currentValue = getReactiveByRid(rid)?.currentValue;
  const coerced = coerceEditableInputValue(rawValue, currentValue);
  if (coerced === undefined) {
    return false;
  }

  return setReactiveValue(rid, coerced);
}

function describeEditablePrimitive(value: unknown): { type: "string" | "number" | "boolean"; value: PrimitiveEditableValue } | null {
  if (typeof value === "string") {
    return {
      type: "string",
      value
    };
  }

  if (typeof value === "number") {
    return {
      type: "number",
      value
    };
  }

  if (typeof value === "boolean") {
    return {
      type: "boolean",
      value
    };
  }

  return null;
}

function describeInspectableValueType(value: unknown): string {
  if (isRefLike(value)) {
    return `ref:${describeValueType(value.value)}`;
  }

  if (isSignalLike(value)) {
    return `signal:${describeValueType(value())}`;
  }

  return describeValueType(value);
}

function unwrapInspectableValue(value: unknown): unknown {
  if (isRefLike(value)) {
    return value.value;
  }

  if (isSignalLike(value)) {
    return value();
  }

  return value;
}

function coerceEditableInputValue(rawValue: string, currentValue: unknown): PrimitiveEditableValue | undefined {
  if (typeof currentValue === "number") {
    const next = Number(rawValue);
    return Number.isFinite(next) ? next : undefined;
  }

  if (typeof currentValue === "string") {
    return rawValue;
  }

  return undefined;
}

function isRefLike(value: unknown): value is { value: unknown; _sig: unknown } {
  return !!value && typeof value === "object" && "_sig" in value && "value" in value;
}

function isSignalLike(value: unknown): value is { (): unknown; set(next: unknown): void } {
  return typeof value === "function" && "set" in value && typeof (value as { set?: unknown }).set === "function";
}

function escapeAttributeSelector(value: string): string {
  const css = globalThis.CSS;
  if (css && typeof css.escape === "function") {
    return css.escape(value);
  }

  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function isComponentMountEvent(type: string): boolean {
  return type === "component:mounted" || type === "component:mount";
}

function isComponentUnmountEvent(type: string): boolean {
  return type === "component:unmounted" || type === "component:unmount";
}

function buildComponentKey(scope: string, instance: number): string {
  return `${scope}#${instance}`;
}

function parseComponentKey(value: string): { scope: string; instance: number } | null {
  const pivot = value.lastIndexOf("#");
  if (pivot <= 0 || pivot >= value.length - 1) {
    return null;
  }

  const scope = value.slice(0, pivot);
  const instance = Number(value.slice(pivot + 1));
  if (!scope || !Number.isFinite(instance)) {
    return null;
  }

  return { scope, instance };
}

function readComponentIdentity(event: DevtoolsEvent): { scope: string; instance: number } | null {
  const payload = event.payload ?? {};

  const context = readUnknown(payload, "context");
  const contextRecord = context && typeof context === "object"
    ? context as Record<string, unknown>
    : undefined;

  const scope =
    readString(payload, "scope") ??
    readString(payload, "name") ??
    readString(contextRecord, "name") ??
    readComponentName(readUnknown(payload, "component")) ??
    null;

  const instance =
    readNumber(payload, "instance") ??
    readNumber(payload, "id") ??
    readNumber(contextRecord, "instance") ??
    null;

  if (!scope || instance === null) {
    return null;
  }

  return {
    scope,
    instance
  };
}

function readComponentName(value: unknown): string | undefined {
  if (typeof value === "function") {
    const name = value.name.trim();
    return name.length > 0 ? name : undefined;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const directName = record.name;
  if (typeof directName === "string" && directName.trim().length > 0) {
    return directName;
  }

  return undefined;
}

function collectSignalUpdates(events: DevtoolsEvent[]) {
  const signalMap = new Map<string, { key: string; preview: string }>();

  for (const event of events) {
    if (!isSignalLikeUpdate(event.type)) continue;
    const key = readString(event.payload, "key") ?? readString(event.payload, "rid") ?? event.type;
    const previewValue =
      readUnknown(event.payload, "next") ??
      readUnknown(event.payload, "value") ??
      readUnknown(event.payload, "newValue") ??
      readUnknown(event.payload, "prev") ??
      readUnknown(event.payload, "initialValue");

    signalMap.set(key, {
      key,
      preview: safeString(previewValue).slice(0, 60)
    });
  }

  return Array.from(signalMap.values());
}

function collectSignalRegistrySnapshot() {
  const snapshot = captureStateSnapshot();

  return snapshot.signals
    .map((entry) => ({
      id: entry.id,
      key: entry.key,
      type: entry.type,
      scope: entry.scope,
      label: entry.key ?? `${entry.scope} (${entry.type})`,
      valuePreview: shortJson(entry.value)
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function collectOwnedReactiveEntries(scope: string, instance: number): LiveReactiveEntry[] {
  const deduped = new Map<string, LiveReactiveEntry>();

  for (const entry of getAllReactives()) {
    if (entry.owner?.scope !== scope || entry.owner.instance !== instance) {
      continue;
    }

    const label = entry.meta.key ?? entry.meta.rid;
    const dedupeKey = entry.meta.key ? `${scope}#${instance}:${entry.meta.key}` : entry.meta.rid;
    const current = deduped.get(dedupeKey);
    const nextEntry: LiveReactiveEntry = {
      rid: entry.meta.rid,
      label,
      type: entry.meta.type,
      currentValue: entry.currentValue
    };

    if (!current || current.currentValue === undefined) {
      deduped.set(dedupeKey, nextEntry);
    }
  }

  return Array.from(deduped.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function collectMetaEntries(events: DevtoolsEvent[]) {
  const metaMap = new Map<string, {
    key: string;
    scope: string;
    instance: number;
    meta: unknown;
    ai: unknown;
    route: unknown;
  }>();

  for (const event of events) {
    if (isComponentMountEvent(event.type)) {
      const identity = readComponentIdentity(event);
      if (!identity) continue;

      const scope = identity.scope;
      const instance = identity.instance;
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      if (meta === undefined && ai === undefined && route === undefined) continue;
      const key = `${scope}#${instance}`;
      metaMap.set(key, { key, scope, instance, meta, ai, route });
      continue;
    }

    if (event.type === "route:meta:resolved") {
      const target = readString(event.payload, "to") ?? "current-route";
      const meta = readUnknown(event.payload, "meta");
      const ai = readUnknown(event.payload, "ai");
      const route = readUnknown(event.payload, "route");
      const key = `route:${target}`;
      metaMap.set(key, {
        key,
        scope: `Route ${target}`,
        instance: event.timestamp,
        meta,
        ai,
        route
      });
    }
  }

  return Array.from(metaMap.values());
}

function collectRouteSnapshot(events: DevtoolsEvent[]) {
  let currentRoute: string | null = null;
  let from: string | null = null;
  let to: string | null = null;
  let source: string | null = null;
  let params: unknown = undefined;
  let query: unknown = undefined;
  let guardContext: string | null = null;
  let phase: string | null = null;
  let lastEventType: string | null = null;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!(event.type.startsWith("route:") || event.type === "error:router")) {
      continue;
    }

    const payload = event.payload ?? {};

    if (!lastEventType) {
      lastEventType = event.type;
    }

    if (!to) {
      to = readString(payload, "to") ?? readString(payload, "route") ?? null;
    }

    if (!from) {
      from = readString(payload, "from") ?? null;
    }

    if (!source) {
      source = readString(payload, "source") ?? null;
    }

    if (params === undefined) {
      params = readUnknown(payload, "params");
    }

    if (query === undefined) {
      query = readUnknown(payload, "query");
    }

    if (!phase) {
      phase = readString(payload, "phase") ?? null;
    }

    if (!guardContext) {
      const guardName = readString(payload, "guardName");
      if (guardName) {
        guardContext = guardName;
      } else {
        const middleware = readUnknown(payload, "middleware");
        if (Array.isArray(middleware)) {
          guardContext = middleware.map((value) => safeString(value)).join(", ");
        }
      }
    }

    if (!currentRoute && event.type === "route:changed") {
      currentRoute = readString(payload, "to") ?? null;
    }
  }

  return {
    currentRoute,
    from,
    to,
    source,
    params,
    query,
    guardContext,
    phase,
    lastEventType
  };
}

function collectRouteIssues(events: DevtoolsEvent[]) {
  return events
    .filter((event) => event.type === "error:router" || event.type === "route:warn" || event.type === "route:blocked")
    .map((event) => ({
      type: event.type,
      summary: routeEventSummary(event)
    }));
}

function collectRouteTimeline(events: DevtoolsEvent[]) {
  return events
    .filter((event) => event.type.startsWith("route:") || event.type === "error:router")
    .map((event) => ({
      type: event.type,
      summary: routeEventSummary(event)
    }));
}

function summarizeLog(event: DevtoolsEvent): string {
  const payload = event.payload ?? {};
  const scope = readString(payload, "scope") ?? readString(payload, "name");
  const message = readString(payload, "message");
  if (message) return message;
  if (scope) return scope;
  return shortJson(payload);
}

function issueMessage(event: DevtoolsEvent): string {
  const message = readString(event.payload, "message");
  if (message) return message;
  const likelyCause = readString(event.payload, "likelyCause");
  if (likelyCause) return `Likely Cause: ${likelyCause}`;
  return shortJson(event.payload ?? {});
}

function queueEventSummary(event: DevtoolsEvent): string {
  const payload = event.payload ?? {};
  const id = readString(payload, "id");
  const type = readString(payload, "type");
  const decision = readString(payload, "decision");
  const attempts = readNumber(payload, "attempts");
  const pending = readNumber(payload, "pending");

  const parts = [
    type ? `type=${type}` : undefined,
    id ? `id=${id}` : undefined,
    decision ? `decision=${decision}` : undefined,
    attempts !== undefined ? `attempts=${attempts}` : undefined,
    pending !== undefined ? `pending=${pending}` : undefined
  ].filter((part): part is string => typeof part === "string");

  return parts.length > 0 ? parts.join(" ") : shortJson(payload);
}

function routeEventSummary(event: DevtoolsEvent): string {
  const payload = event.payload ?? {};
  const from = readString(payload, "from");
  const to = readString(payload, "to") ?? readString(payload, "route");
  const source = readString(payload, "source");
  const message = readString(payload, "message");
  const redirectTo = readString(payload, "redirectTo");
  const phase = readString(payload, "phase");
  const guardName = readString(payload, "guardName");
  const durationMs = readNumber(payload, "durationMs");

  const middleware = readUnknown(payload, "middleware");
  const middlewareSummary = Array.isArray(middleware)
    ? middleware.map((item) => safeString(item)).join(",")
    : undefined;

  const parts = [
    from !== undefined ? `from=${from ?? "null"}` : undefined,
    to ? `to=${to}` : undefined,
    source ? `source=${source}` : undefined,
    redirectTo ? `redirect=${redirectTo}` : undefined,
    guardName ? `guard=${guardName}` : undefined,
    middlewareSummary ? `middleware=${middlewareSummary}` : undefined,
    phase ? `phase=${phase}` : undefined,
    durationMs !== undefined ? `duration=${durationMs}ms` : undefined,
    message ? `message=${message}` : undefined
  ].filter((part): part is string => typeof part === "string" && part.length > 0);

  return parts.length > 0 ? parts.join(" ") : shortJson(payload);
}

function generateLikelyCause(payload: Record<string, unknown> | undefined): string | null {
  const snapshot = captureStateSnapshot();
  const entries = snapshot.signals.map((signal) => `${signal.key ?? signal.id}: ${safeString(signal.value)}`);
  const topEntries = entries.slice(0, 4).join("; ");
  const origin = readString(payload, "rid") ?? readString(payload, "scope") ?? "unknown origin";
  const message = readString(payload, "message") ?? "reactive error detected";

  return `Detected reactive error (${message}) from ${origin}. Current keyed state: ${topEntries || "no keyed signals available"}.`;
}

function isOverlayPosition(value: unknown): value is DevtoolsOverlayPosition {
  return value === "bottom-left"
    || value === "bottom-right"
    || value === "bottom-center"
    || value === "top-left"
    || value === "top-right"
    || value === "top-center"
    || value === "center";
}

function isOverlaySize(value: unknown): value is DevtoolsOverlaySize {
  return value === "normal" || value === "large";
}

function normalizeLayoutOptions(options?: DevtoolsLayoutOptions): NormalizedLayoutOptions {
  return {
    position: isOverlayPosition(options?.position) ? options.position : "bottom-right",
    panelSize: isOverlaySize(options?.panelSize) ? options.panelSize : "normal",
    persistPreferences: options?.persistPreferences !== false
  };
}

function normalizeAIAssistantOptions(options?: DevtoolsAIAssistantOptions): NormalizedAIAssistantOptions {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : null;

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : "terajs-assistant";

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : 12000;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

function getGlobalAIAssistantHook(): AIAssistantHook | null {
  if (typeof globalThis !== "object" || globalThis === null) {
    return null;
  }

  const maybeHook = (globalThis as typeof globalThis & {
    __TERAJS_AI_ASSISTANT__?: unknown;
  }).__TERAJS_AI_ASSISTANT__;

  return typeof maybeHook === "function" ? maybeHook as AIAssistantHook : null;
}

async function resolveAIAssistantResponse(
  request: AIAssistantRequest,
  options: NormalizedAIAssistantOptions
): Promise<string> {
  const globalHook = getGlobalAIAssistantHook();
  if (globalHook) {
    const response = await globalHook(request);
    return extractAIAssistantResponseText(response);
  }

  if (!options.endpoint) {
    throw new Error("No AI assistant provider is configured. Set devtools.ai.endpoint or provide window.__TERAJS_AI_ASSISTANT__. ");
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs);

  try {
    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: options.model,
        prompt: request.prompt,
        snapshot: request.snapshot,
        sanity: request.sanity,
        events: request.events
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`AI endpoint returned ${response.status}.`);
    }

    const rawText = await response.text();
    if (!rawText.trim()) {
      return "AI endpoint returned an empty response body.";
    }

    try {
      const parsed = JSON.parse(rawText) as unknown;
      return extractAIAssistantResponseText(parsed);
    } catch {
      return rawText;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`AI request timed out after ${options.timeoutMs}ms.`);
    }

    throw error instanceof Error ? error : new Error("AI request failed.");
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function extractAIAssistantResponseText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "AI assistant returned an empty string.";
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    const direct = payload.response ?? payload.content ?? payload.answer ?? payload.output_text;
    if (typeof direct === "string" && direct.trim().length > 0) {
      return direct;
    }

    const choices = payload.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const first = choices[0] as Record<string, unknown>;
      const message = first?.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (typeof content === "string" && content.trim().length > 0) {
        return content;
      }

      const text = first?.text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text;
      }
    }
  }

  return shortJson(value);
}

function isSignalLikeUpdate(type: string): boolean {
  return (
    type === "signal:update" ||
    type === "state:update" ||
    type === "reactive:updated" ||
    type === "reactive:update" ||
    type === "ref:set" ||
    type === "computed:update"
  );
}

function readString(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === "number" ? value : undefined;
}

function readUnknown(record: Record<string, unknown> | undefined, key: string): unknown {
  return record?.[key];
}

function shortJson(value: unknown): string {
  return safeString(value).slice(0, 120);
}

function describeInspectorSnapshot(value: unknown): string {
  if (value === undefined || value === null) {
    return "not captured";
  }

  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
    return "not captured";
  }

  return shortJson(value);
}

function prettyJson(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "[unserializable]";
  }
}

function safeString(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
