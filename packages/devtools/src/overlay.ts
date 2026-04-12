import { mountDevtoolsApp, type DevtoolsAIAssistantOptions } from "./app.js";

type DevtoolsOverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type DevtoolsOverlaySize = "normal" | "large";

export interface DevtoolsOverlayOptions {
  startOpen?: boolean;
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
  panelShortcut?: string;
  visibilityShortcut?: string;
  ai?: DevtoolsAIAssistantOptions;
}

interface NormalizedOverlayOptions {
  startOpen: boolean;
  position: DevtoolsOverlayPosition;
  panelSize: DevtoolsOverlaySize;
  persistPreferences: boolean;
  panelShortcut: string;
  visibilityShortcut: string;
  ai: {
    enabled: boolean;
    endpoint: string;
    model: string;
    timeoutMs: number;
  };
}

const DEFAULT_OPTIONS: NormalizedOverlayOptions = {
  startOpen: false,
  position: "bottom-right",
  panelSize: "normal",
  persistPreferences: true,
  panelShortcut: "Ctrl+Shift+D",
  visibilityShortcut: "Ctrl+Shift+H",
  ai: {
    enabled: true,
    endpoint: "",
    model: "terajs-assistant",
    timeoutMs: 12000
  }
};

const DEVTOOLS_INSPECT_MODE_EVENT = "terajs:devtools:inspect-mode";
const DEVTOOLS_COMPONENT_SELECT_EVENT = "terajs:devtools:component-select";
const DEVTOOLS_COMPONENT_PICKED_EVENT = "terajs:devtools:component-picked";
const DEVTOOLS_COMPONENT_HOVER_EVENT = "terajs:devtools:component-hover";
const DEVTOOLS_LAYOUT_PREFERENCES_EVENT = "terajs:devtools:layout-preferences";

const OVERLAY_PREFERENCES_STORAGE_KEY = "terajs:devtools:overlay-preferences";

interface OverlayPreferencesPayload {
  position?: DevtoolsOverlayPosition;
  panelSize?: DevtoolsOverlaySize;
  persistPreferences?: boolean;
}

interface OverlayStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const COMPONENT_SCOPE_ATTR = "data-terajs-component-scope";
const COMPONENT_INSTANCE_ATTR = "data-terajs-component-instance";

const INSPECT_STYLE_ID = "terajs-devtools-inspect-style";
const INSPECT_HOVER_CLASS = "terajs-devtools-hover-component";
const INSPECT_SELECTED_CLASS = "terajs-devtools-selected-component";

let overlayEl: HTMLDivElement | null = null;
let cleanupOverlay: (() => void) | null = null;
let keyListener: ((event: KeyboardEvent) => void) | null = null;
let wheelListener: EventListener | null = null;
let inspectModeListener: EventListener | null = null;
let componentSelectListener: EventListener | null = null;
let componentHoverListener: EventListener | null = null;
let layoutPreferencesListener: EventListener | null = null;
let pointerMoveListener: ((event: PointerEvent) => void) | null = null;
let inspectClickListener: ((event: MouseEvent) => void) | null = null;
let requestedInspectMode = false;
let inspectModeEnabled = false;
let treeHoverPreviewActive = false;
let highlightedHoverEl: HTMLElement | null = null;
let highlightedSelectedEl: HTMLElement | null = null;
let panelVisible = false;
let overlayVisible = true;
let activeOptions: NormalizedOverlayOptions = {
  ...DEFAULT_OPTIONS,
  ai: { ...DEFAULT_OPTIONS.ai }
};

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

function getOverlayStorage(): OverlayStorage | null {
  const windowStorage = typeof window !== "undefined"
    ? (window as Window & { localStorage?: unknown }).localStorage
    : undefined;
  const globalStorage = (globalThis as typeof globalThis & { localStorage?: unknown }).localStorage;

  const candidates = [windowStorage, globalStorage];
  for (const candidate of candidates) {
    if (
      candidate
      && typeof (candidate as OverlayStorage).getItem === "function"
      && typeof (candidate as OverlayStorage).setItem === "function"
      && typeof (candidate as OverlayStorage).removeItem === "function"
    ) {
      return candidate as OverlayStorage;
    }
  }

  return null;
}

function loadPersistedOverlayPreferences(): OverlayPreferencesPayload {
  const storage = getOverlayStorage();
  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(OVERLAY_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const position = parsed.position;
    const panelSize = parsed.panelSize;

    return {
      position: isOverlayPosition(position) ? position : undefined,
      panelSize: isOverlaySize(panelSize) ? panelSize : undefined
    };
  } catch {
    return {};
  }
}

function savePersistedOverlayPreferences(): void {
  const storage = getOverlayStorage();
  if (!storage || !activeOptions.persistPreferences) {
    return;
  }

  try {
    storage.setItem(OVERLAY_PREFERENCES_STORAGE_KEY, JSON.stringify({
      position: activeOptions.position,
      panelSize: activeOptions.panelSize
    }));
  } catch {
    // Swallow storage errors so DevTools remains interactive in restricted contexts.
  }
}

function clearPersistedOverlayPreferences(): void {
  const storage = getOverlayStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(OVERLAY_PREFERENCES_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures in restricted contexts.
  }
}

function resolveShellClass(position: DevtoolsOverlayPosition): string {
  const classes = ["fab-shell"];

  if (position === "bottom-left" || position === "top-left") {
    classes.push("is-left");
  }

  if (position === "bottom-center" || position === "top-center" || position === "center") {
    classes.push("is-center");
  }

  if (position === "top-left" || position === "top-right" || position === "top-center") {
    classes.push("is-top");
  }

  return classes.join(" ");
}

function applyOverlayPosition(position: DevtoolsOverlayPosition): void {
  if (!overlayEl) {
    return;
  }

  overlayEl.style.left = "";
  overlayEl.style.right = "";
  overlayEl.style.top = "";
  overlayEl.style.bottom = "";
  overlayEl.style.transform = "";

  if (position === "bottom-left") {
    overlayEl.style.left = "20px";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "top-left") {
    overlayEl.style.left = "20px";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "bottom-right") {
    overlayEl.style.right = "20px";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "top-right") {
    overlayEl.style.right = "20px";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "none";
  } else if (position === "bottom-center") {
    overlayEl.style.left = "50%";
    overlayEl.style.bottom = "16px";
    overlayEl.style.transform = "translateX(-50%)";
  } else if (position === "top-center") {
    overlayEl.style.left = "50%";
    overlayEl.style.top = "16px";
    overlayEl.style.transform = "translateX(-50%)";
  } else {
    overlayEl.style.left = "50%";
    overlayEl.style.top = "50%";
    overlayEl.style.transform = "translate(-50%, -50%)";
  }

  const shell = overlayEl.shadowRoot?.querySelector(".fab-shell") as HTMLDivElement | null;
  if (shell) {
    shell.className = resolveShellClass(position);
  }
}

function applyOverlayPanelSize(panelSize: DevtoolsOverlaySize): void {
  if (!overlayEl) {
    return;
  }

  if (panelSize === "large") {
    overlayEl.style.setProperty("--terajs-overlay-panel-width", "980px");
    overlayEl.style.setProperty("--terajs-overlay-panel-height", "920px");
    return;
  }

  overlayEl.style.setProperty("--terajs-overlay-panel-width", "760px");
  overlayEl.style.setProperty("--terajs-overlay-panel-height", "840px");
}

function ensureInspectStyles(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(INSPECT_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = INSPECT_STYLE_ID;
  style.textContent = `
body[data-terajs-inspect-mode="true"] [${COMPONENT_SCOPE_ATTR}] {
  cursor: crosshair !important;
}

.${INSPECT_HOVER_CLASS} {
  outline: 2px solid rgba(50, 215, 255, 0.72) !important;
  outline-offset: 2px !important;
}

.${INSPECT_SELECTED_CLASS} {
  outline: 2px solid rgba(47, 109, 255, 0.96) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 3px rgba(50, 215, 255, 0.36) !important;
}
`;

  document.head.appendChild(style);
}

function clearHoverHighlight(): void {
  if (highlightedHoverEl) {
    highlightedHoverEl.classList.remove(INSPECT_HOVER_CLASS);
    highlightedHoverEl = null;
  }
}

function setHoverHighlight(nextEl: HTMLElement | null): void {
  if (highlightedHoverEl === nextEl) {
    return;
  }

  clearHoverHighlight();
  if (!nextEl) {
    return;
  }

  highlightedHoverEl = nextEl;
  highlightedHoverEl.classList.add(INSPECT_HOVER_CLASS);
}

function clearSelectedHighlight(): void {
  if (highlightedSelectedEl) {
    highlightedSelectedEl.classList.remove(INSPECT_SELECTED_CLASS);
    highlightedSelectedEl = null;
  }
}

function setSelectedHighlight(nextEl: HTMLElement | null): void {
  if (highlightedSelectedEl === nextEl) {
    return;
  }

  clearSelectedHighlight();
  if (!nextEl) {
    return;
  }

  highlightedSelectedEl = nextEl;
  highlightedSelectedEl.classList.add(INSPECT_SELECTED_CLASS);
}

function parseComponentIdentityFromElement(element: HTMLElement): { scope: string; instance: number } | null {
  const scope = element.getAttribute(COMPONENT_SCOPE_ATTR);
  const instanceRaw = element.getAttribute(COMPONENT_INSTANCE_ATTR);
  const instance = instanceRaw !== null ? Number(instanceRaw) : Number.NaN;

  if (!scope || !Number.isFinite(instance)) {
    return null;
  }

  return {
    scope,
    instance
  };
}

function findComponentElementFromTarget(target: EventTarget | null): HTMLElement | null {
  let current = target instanceof Element ? target : null;

  while (current) {
    if (current instanceof HTMLElement && current.hasAttribute(COMPONENT_SCOPE_ATTR) && current.hasAttribute(COMPONENT_INSTANCE_ATTR)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function isOverlayEventTarget(event: Event): boolean {
  if (!overlayEl) {
    return false;
  }

  const path = event.composedPath();
  return path.includes(overlayEl);
}

function escapeAttributeValue(value: string): string {
  const css = globalThis.CSS;
  if (css && typeof css.escape === "function") {
    return css.escape(value);
  }

  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function findElementForComponent(scope: string, instance: number): HTMLElement | null {
  const scopeSelector = escapeAttributeValue(scope);
  const selector = `[${COMPONENT_SCOPE_ATTR}="${scopeSelector}"][${COMPONENT_INSTANCE_ATTR}="${instance}"]`;
  const match = document.querySelector(selector);
  return match instanceof HTMLElement ? match : null;
}

function setInspectMode(enabled: boolean): void {
  inspectModeEnabled = enabled;
  document.body.toggleAttribute("data-terajs-inspect-mode", enabled);

  if (!enabled) {
    clearHoverHighlight();
    clearSelectedHighlight();
  }
}

function applyInspectModeContext(): void {
  setInspectMode(requestedInspectMode && panelVisible && overlayVisible);
}

function setupInspectBridge(): void {
  ensureInspectStyles();

  inspectModeListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as Record<string, unknown>;
    requestedInspectMode = payload.enabled === true;
    applyInspectModeContext();
  };

  componentSelectListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as Record<string, unknown>;
    const scope = typeof payload.scope === "string" ? payload.scope : null;
    const instance = typeof payload.instance === "number" ? payload.instance : null;

    if (!scope || instance === null) {
      clearSelectedHighlight();
      return;
    }

    setSelectedHighlight(findElementForComponent(scope, instance));
  };

  componentHoverListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as Record<string, unknown>;
    const scope = typeof payload.scope === "string" ? payload.scope : null;
    const instance = typeof payload.instance === "number" ? payload.instance : null;

    if (!scope || instance === null) {
      treeHoverPreviewActive = false;
      clearHoverHighlight();
      return;
    }

    treeHoverPreviewActive = true;
    setHoverHighlight(findElementForComponent(scope, instance));
  };

  pointerMoveListener = (event: PointerEvent) => {
    if (!inspectModeEnabled) {
      return;
    }

    if (treeHoverPreviewActive) {
      return;
    }

    if (isOverlayEventTarget(event)) {
      setHoverHighlight(null);
      return;
    }

    setHoverHighlight(findComponentElementFromTarget(event.target));
  };

  inspectClickListener = (event: MouseEvent) => {
    if (!inspectModeEnabled || event.button !== 0) {
      return;
    }

    if (isOverlayEventTarget(event)) {
      return;
    }

    const componentEl = findComponentElementFromTarget(event.target);
    if (!componentEl) {
      return;
    }

    const identity = parseComponentIdentityFromElement(componentEl);
    if (!identity) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setSelectedHighlight(componentEl);
    window.dispatchEvent(new CustomEvent(DEVTOOLS_COMPONENT_PICKED_EVENT, {
      detail: {
        scope: identity.scope,
        instance: identity.instance,
        source: "picker"
      }
    }));
  };

  window.addEventListener(DEVTOOLS_INSPECT_MODE_EVENT, inspectModeListener);
  window.addEventListener(DEVTOOLS_COMPONENT_SELECT_EVENT, componentSelectListener);
  window.addEventListener(DEVTOOLS_COMPONENT_HOVER_EVENT, componentHoverListener);
  document.addEventListener("pointermove", pointerMoveListener, true);
  document.addEventListener("click", inspectClickListener, true);
}

function teardownInspectBridge(): void {
  if (inspectModeListener) {
    window.removeEventListener(DEVTOOLS_INSPECT_MODE_EVENT, inspectModeListener);
    inspectModeListener = null;
  }

  if (componentSelectListener) {
    window.removeEventListener(DEVTOOLS_COMPONENT_SELECT_EVENT, componentSelectListener);
    componentSelectListener = null;
  }

  if (componentHoverListener) {
    window.removeEventListener(DEVTOOLS_COMPONENT_HOVER_EVENT, componentHoverListener);
    componentHoverListener = null;
  }

  if (pointerMoveListener) {
    document.removeEventListener("pointermove", pointerMoveListener, true);
    pointerMoveListener = null;
  }

  if (inspectClickListener) {
    document.removeEventListener("click", inspectClickListener, true);
    inspectClickListener = null;
  }

  inspectModeEnabled = false;
  requestedInspectMode = false;
  treeHoverPreviewActive = false;
  document.body.removeAttribute("data-terajs-inspect-mode");
  clearHoverHighlight();
  clearSelectedHighlight();
}

function setupLayoutPreferencesBridge(): void {
  if (typeof window === "undefined") {
    return;
  }

  layoutPreferencesListener = (rawEvent: Event) => {
    const detail = (rawEvent as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as OverlayPreferencesPayload;
    let layoutChanged = false;
    let persistenceChanged = false;

    if (typeof payload.persistPreferences === "boolean" && payload.persistPreferences !== activeOptions.persistPreferences) {
      activeOptions.persistPreferences = payload.persistPreferences;
      persistenceChanged = true;
    }

    if (isOverlayPosition(payload.position) && payload.position !== activeOptions.position) {
      activeOptions.position = payload.position;
      applyOverlayPosition(activeOptions.position);
      layoutChanged = true;
    }

    if (isOverlaySize(payload.panelSize) && payload.panelSize !== activeOptions.panelSize) {
      activeOptions.panelSize = payload.panelSize;
      applyOverlayPanelSize(activeOptions.panelSize);
      layoutChanged = true;
    }

    if (!layoutChanged && !persistenceChanged) {
      return;
    }

    if (activeOptions.persistPreferences) {
      savePersistedOverlayPreferences();
      return;
    }

    if (persistenceChanged) {
      clearPersistedOverlayPreferences();
    }
  };

  window.addEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, layoutPreferencesListener);
}

function teardownLayoutPreferencesBridge(): void {
  if (!layoutPreferencesListener || typeof window === "undefined") {
    return;
  }

  window.removeEventListener(DEVTOOLS_LAYOUT_PREFERENCES_EVENT, layoutPreferencesListener);
  layoutPreferencesListener = null;
}

function normalizeAIAssistantOptions(options?: DevtoolsAIAssistantOptions): NormalizedOverlayOptions["ai"] {
  const endpoint = typeof options?.endpoint === "string" && options.endpoint.trim().length > 0
    ? options.endpoint.trim()
    : "";

  const model = typeof options?.model === "string" && options.model.trim().length > 0
    ? options.model.trim()
    : DEFAULT_OPTIONS.ai.model;

  const timeoutMs = typeof options?.timeoutMs === "number" && Number.isFinite(options.timeoutMs)
    ? Math.min(60000, Math.max(1500, Math.round(options.timeoutMs)))
    : DEFAULT_OPTIONS.ai.timeoutMs;

  return {
    enabled: options?.enabled !== false,
    endpoint,
    model,
    timeoutMs
  };
}

function normalizeOptions(options?: DevtoolsOverlayOptions): NormalizedOverlayOptions {
  const startOpen = typeof options?.startOpen === "boolean"
    ? options.startOpen
    : DEFAULT_OPTIONS.startOpen;
  const position = isOverlayPosition(options?.position)
    ? options.position
    : DEFAULT_OPTIONS.position;
  const panelSize = isOverlaySize(options?.panelSize)
    ? options.panelSize
    : DEFAULT_OPTIONS.panelSize;
  const persistPreferences = options?.persistPreferences !== false;
  const panelShortcut = typeof options?.panelShortcut === "string" && options.panelShortcut.trim().length > 0
    ? options.panelShortcut.trim()
    : DEFAULT_OPTIONS.panelShortcut;
  const visibilityShortcut = typeof options?.visibilityShortcut === "string" && options.visibilityShortcut.trim().length > 0
    ? options.visibilityShortcut.trim()
    : DEFAULT_OPTIONS.visibilityShortcut;

  return {
    startOpen,
    position,
    panelSize,
    persistPreferences,
    panelShortcut,
    visibilityShortcut,
    ai: normalizeAIAssistantOptions(options?.ai)
  };
}

function applyPersistedOptions(
  normalized: NormalizedOverlayOptions,
  rawOptions?: DevtoolsOverlayOptions
): NormalizedOverlayOptions {
  if (!normalized.persistPreferences) {
    return normalized;
  }

  const persisted = loadPersistedOverlayPreferences();

  const usePersistedPosition = !rawOptions || !isOverlayPosition(rawOptions.position);
  const usePersistedSize = !rawOptions || !isOverlaySize(rawOptions.panelSize);

  return {
    ...normalized,
    position: usePersistedPosition && persisted.position
      ? persisted.position
      : normalized.position,
    panelSize: usePersistedSize && persisted.panelSize
      ? persisted.panelSize
      : normalized.panelSize
  };
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const tokens = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (tokens.length === 0) {
    return false;
  }

  const expectedKey = tokens.find((token) => !["ctrl", "control", "cmd", "meta", "shift", "alt", "option"].includes(token));

  const expectsCtrl = tokens.includes("ctrl") || tokens.includes("control");
  const expectsMeta = tokens.includes("cmd") || tokens.includes("meta");
  const expectsShift = tokens.includes("shift");
  const expectsAlt = tokens.includes("alt") || tokens.includes("option");

  if (expectsCtrl && !(event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (expectsMeta && !event.metaKey) {
    return false;
  }

  if (expectsShift !== event.shiftKey) {
    return false;
  }

  if (expectsAlt !== event.altKey) {
    return false;
  }

  if (!expectedKey) {
    return true;
  }

  return event.key.toLowerCase() === expectedKey;
}

function panelElement(): HTMLDivElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-panel") as HTMLDivElement | null;
}

function fabElement(): HTMLButtonElement | null {
  return overlayEl?.shadowRoot?.getElementById("terajs-devtools-fab") as HTMLButtonElement | null;
}

function applyPanelState(): void {
  const panel = panelElement();
  const fab = fabElement();
  if (!panel || !fab) {
    return;
  }

  panel.classList.toggle("is-hidden", !panelVisible);
  fab.setAttribute("aria-expanded", panelVisible ? "true" : "false");
  applyInspectModeContext();
}

function applyOverlayVisibility(): void {
  if (!overlayEl) {
    return;
  }

  overlayEl.style.display = overlayVisible ? "block" : "none";
  applyInspectModeContext();
}

export function mountDevtoolsOverlay(options?: DevtoolsOverlayOptions): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof document === "undefined" || overlayEl) return;

  activeOptions = applyPersistedOptions(normalizeOptions(options), options);
  panelVisible = activeOptions.startOpen;
  overlayVisible = true;

  overlayEl = document.createElement("div");
  overlayEl.id = "terajs-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.pointerEvents = "none";

  const shadowRoot = overlayEl.attachShadow({ mode: "open" });
  const shellClass = resolveShellClass(activeOptions.position);
  shadowRoot.innerHTML = `
    <style>${overlayStyles}</style>
    <div class="${shellClass}">
      <div id="terajs-devtools-panel" class="overlay-frame is-hidden">
        <div id="terajs-devtools-root"></div>
      </div>
      <button id="terajs-devtools-fab" class="devtools-fab" type="button" aria-expanded="false" aria-label="Toggle Terajs DevTools">Terajs</button>
    </div>
  `;

  document.body.appendChild(overlayEl);
  applyOverlayPosition(activeOptions.position);
  applyOverlayPanelSize(activeOptions.panelSize);

  if (activeOptions.persistPreferences) {
    savePersistedOverlayPreferences();
  }

  const fab = fabElement();
  fab?.addEventListener("click", () => {
    toggleDevtoolsOverlay();
  });

  const mountRoot = shadowRoot.getElementById("terajs-devtools-root");
  if (!mountRoot) {
    throw new Error("Terajs devtools failed to create its mount root.");
  }

  setupInspectBridge();
  setupLayoutPreferencesBridge();

  cleanupOverlay = mountDevtoolsApp(mountRoot, {
    ai: activeOptions.ai,
    layout: {
      position: activeOptions.position,
      panelSize: activeOptions.panelSize,
      persistPreferences: activeOptions.persistPreferences
    }
  });

  keyListener = (event: KeyboardEvent) => {
    if (matchesShortcut(event, activeOptions.panelShortcut)) {
      event.preventDefault();
      toggleDevtoolsOverlay();
      return;
    }

    if (matchesShortcut(event, activeOptions.visibilityShortcut)) {
      event.preventDefault();
      toggleDevtoolsVisibility();
    }
  };

  document.addEventListener("keydown", keyListener);

  wheelListener = (event: Event) => {
    const wheelEvent = event as WheelEvent;

    if (!panelVisible) {
      return;
    }

    const panel = panelElement();
    if (!panel) {
      return;
    }

    const path = wheelEvent.composedPath();
    const target = path.find((node): node is Element => node instanceof Element);
    if (!target || !panel.contains(target)) {
      return;
    }

    const scrollHost = target.closest(".devtools-panel, .devtools-tabs, .stack-list, .ai-prompt, .ai-response");
    if (!(scrollHost instanceof HTMLElement)) {
      wheelEvent.preventDefault();
      return;
    }

    const canScroll = scrollHost.scrollHeight > scrollHost.clientHeight + 1;
    if (!canScroll) {
      wheelEvent.preventDefault();
      return;
    }

    const deltaY = wheelEvent.deltaY;
    const atTop = scrollHost.scrollTop <= 0;
    const atBottom = scrollHost.scrollTop + scrollHost.clientHeight >= scrollHost.scrollHeight - 1;

    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      wheelEvent.preventDefault();
      return;
    }

    wheelEvent.stopPropagation();
  };

  shadowRoot.addEventListener("wheel", wheelListener, { passive: false });
  applyPanelState();
  applyOverlayVisibility();
}

export function toggleDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  panelVisible = !panelVisible;
  applyPanelState();
}

export function toggleDevtoolsVisibility(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  overlayVisible = !overlayVisible;
  applyOverlayVisibility();
}

export function unmountDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;

  if (wheelListener && overlayEl?.shadowRoot) {
    overlayEl.shadowRoot.removeEventListener("wheel", wheelListener);
    wheelListener = null;
  }

  if (keyListener) {
    document.removeEventListener("keydown", keyListener);
    keyListener = null;
  }

  cleanupOverlay?.();
  cleanupOverlay = null;

  teardownLayoutPreferencesBridge();
  teardownInspectBridge();

  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }

  panelVisible = false;
  overlayVisible = true;
  activeOptions = {
    ...DEFAULT_OPTIONS,
    ai: { ...DEFAULT_OPTIONS.ai }
  };
}

const overlayStyles = `
  :host {
    all: initial;
  }

  .fab-shell {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: auto;
  }

  .fab-shell.is-left {
    align-items: flex-start;
  }

  .fab-shell.is-center {
    align-items: center;
  }

  .fab-shell.is-top {
    flex-direction: column-reverse;
  }

  .devtools-fab {
    appearance: none;
    border: 1px solid rgba(50, 215, 255, 0.36);
    border-radius: 999px;
    background: linear-gradient(135deg, #2f6dff, #32d7ff);
    color: #ffffff;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    min-width: 102px;
    height: 42px;
    padding: 0 18px;
    cursor: pointer;
    box-shadow: 0 12px 28px rgba(47, 109, 255, 0.32);
    transition: transform 120ms ease, box-shadow 140ms ease;
    position: relative;
    z-index: 3;
  }

  .devtools-fab:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(50, 215, 255, 0.28);
  }

  .devtools-fab:focus-visible {
    outline: 2px solid rgba(50, 215, 255, 0.75);
    outline-offset: 2px;
  }

  .overlay-frame {
    --tera-black: #05070f;
    --tera-carbon: #0d1320;
    --tera-graphite: #1d2940;
    --tera-blue: #2f6dff;
    --tera-cyan: #32d7ff;
    --tera-purple: #6f6dff;
    --tera-mist: #93a7cb;
    --tera-cloud: #f2f7ff;
    --tera-body-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --tera-heading-font: "Space Grotesk", "Inter", sans-serif;
    --tera-code-font: "JetBrains Mono", "Fira Code", monospace;
    --tera-surface: var(--tera-carbon);
    --tera-border: rgba(147, 167, 203, 0.18);
    --tera-panel-glow: linear-gradient(145deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.11) 44%, rgba(111, 109, 255, 0.1));
    --tera-shadow: 0 24px 60px rgba(2, 8, 20, 0.52);
    position: relative;
    width: min(var(--terajs-overlay-panel-width, 760px), calc(100vw - 24px));
    height: min(72vh, var(--terajs-overlay-panel-height, 840px));
    border: 1px solid var(--tera-border);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--tera-shadow);
    background:
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.16), transparent 28%),
      radial-gradient(circle at bottom left, rgba(111, 109, 255, 0.16), transparent 34%),
      var(--tera-black);
    color: var(--tera-cloud);
    font-family: var(--tera-body-font);
    z-index: 2;
  }

  .fab-shell.is-center .overlay-frame {
    transform-origin: bottom center;
  }

  .fab-shell.is-top .overlay-frame {
    transform-origin: top right;
  }

  .fab-shell.is-top.is-left .overlay-frame {
    transform-origin: top left;
  }

  .fab-shell.is-top.is-center .overlay-frame {
    transform-origin: top center;
  }

  @media (max-width: 860px) {
    .overlay-frame {
      width: min(94vw, var(--terajs-overlay-panel-width, 760px));
      height: min(70vh, var(--terajs-overlay-panel-height, 760px));
    }
  }

  .overlay-frame.is-hidden {
    display: none;
  }

  #terajs-devtools-root {
    width: 100%;
    height: 100%;
  }

  #terajs-devtools-root[data-theme="light"] {
    color: #181818;
  }

  .devtools-shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--panel-bg, transparent);
    color: inherit;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-shell {
    --panel-bg: linear-gradient(180deg, #ffffff, var(--tera-cloud));
  }

  .devtools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.1), rgba(50, 215, 255, 0.09) 60%, transparent),
      rgba(255, 255, 255, 0.92);
    border-bottom-color: rgba(46, 46, 46, 0.12);
  }

  .devtools-title {
    font-family: var(--tera-heading-font);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--tera-cloud);
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-title {
    color: #0d2a57;
  }

  .devtools-subtitle,
  .panel-subtitle,
  .muted-text,
  .tiny-muted,
  .metric-label {
    color: var(--tera-mist);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-subtitle,
  #terajs-devtools-root[data-theme="light"] .panel-subtitle,
  #terajs-devtools-root[data-theme="light"] .muted-text,
  #terajs-devtools-root[data-theme="light"] .tiny-muted,
  #terajs-devtools-root[data-theme="light"] .metric-label {
    color: #626262;
  }

  .devtools-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overscroll-behavior: contain;
  }

  .devtools-tabs {
    width: 132px;
    border-right: 1px solid var(--tera-border);
    background: rgba(13, 13, 13, 0.84);
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding: 8px;
    gap: 6px;
    backdrop-filter: blur(12px);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: linear-gradient(180deg, #f4f8ff, #eef4ff);
    border-right-color: rgba(32, 64, 112, 0.16);
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .tab-button,
  .toolbar-button,
  .filter-button,
  .select-button {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 8px 10px;
    background: rgba(46, 46, 46, 0.76);
    color: var(--tera-cloud);
    cursor: pointer;
    font: inherit;
    text-align: left;
    transition: transform 120ms ease, background 140ms ease, border-color 140ms ease, box-shadow 140ms ease, color 140ms ease;
  }

  .toolbar-button,
  .filter-button,
  .select-button {
    text-align: center;
  }

  .tab-button:hover,
  .toolbar-button:hover,
  .filter-button:hover,
  .select-button:hover {
    border-color: rgba(50, 215, 255, 0.32);
    background: rgba(50, 215, 255, 0.14);
    transform: translateY(-1px);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.98);
    color: #14284a;
    border-color: rgba(55, 103, 183, 0.2);
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    background: linear-gradient(135deg, var(--tera-blue), var(--tera-cyan));
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(47, 109, 255, 0.3);
  }

  .danger-button {
    background: linear-gradient(135deg, #9f1239, #dc2626);
    color: #ffffff;
  }

  .devtools-panel {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: auto;
    padding: 16px;
    background: linear-gradient(180deg, rgba(26, 26, 26, 0.72), rgba(13, 13, 13, 0.9));
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(241, 247, 255, 0.98));
    color: #10213f;
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .devtools-page {
    display: grid;
    gap: 12px;
  }

  .panel-hero {
    display: grid;
    gap: 6px;
    padding: 16px 18px;
    border: 1px solid var(--tera-border);
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.16), rgba(50, 215, 255, 0.08) 58%, rgba(111, 109, 255, 0.12)),
      rgba(8, 16, 31, 0.92);
    box-shadow: 0 18px 36px rgba(2, 8, 20, 0.24);
  }

  .panel-hero-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .panel-hero-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.2);
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-mist);
    font-size: 11px;
    font-family: var(--tera-code-font);
  }

  .panel-section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .panel-section-card {
    min-height: 0;
  }

  .panel-section-card.is-full {
    grid-column: 1 / -1;
  }

  .panel-section-heading {
    margin-bottom: 10px;
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--tera-cloud);
  }

  .ai-panel {
    border: 1px solid rgba(50, 215, 255, 0.3);
    background: linear-gradient(180deg, rgba(17, 45, 94, 0.46), rgba(5, 11, 24, 0.92));
    box-shadow: 0 0 34px rgba(47, 109, 255, 0.2), 0 0 62px rgba(50, 215, 255, 0.16);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-panel {
    background: linear-gradient(180deg, rgba(235, 245, 255, 0.96), rgba(225, 239, 255, 0.94));
    border-color: rgba(54, 118, 210, 0.28);
    box-shadow: 0 10px 30px rgba(63, 120, 203, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.08), rgba(50, 215, 255, 0.08) 58%, rgba(111, 109, 255, 0.08)),
      rgba(255, 255, 255, 0.96);
    border-color: rgba(54, 118, 210, 0.16);
    box-shadow: 0 16px 30px rgba(63, 120, 203, 0.1);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: rgba(255, 255, 255, 0.94);
    border-color: rgba(54, 118, 210, 0.16);
    color: #516178;
  }

  #terajs-devtools-root[data-theme="light"] .panel-section-heading {
    color: #10213f;
  }

  .ask-ai-button {
    background: linear-gradient(135deg, var(--tera-cyan), var(--tera-blue));
    color: #ffffff;
    border: 1px solid rgba(50, 215, 255, 0.38);
    box-shadow: 0 14px 32px rgba(50, 215, 255, 0.2);
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 180px;
    border: 1px solid rgba(111, 109, 255, 0.28);
    border-radius: 14px;
    padding: 14px;
    background: rgba(8, 14, 30, 0.95);
    color: #dfe9ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 12px;
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 120px;
    border: 1px solid rgba(50, 215, 255, 0.34);
    border-radius: 14px;
    padding: 14px;
    background: rgba(6, 16, 34, 0.96);
    color: #d7f2ff;
    font-family: var(--tera-code-font);
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 10px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: rgba(255, 255, 255, 0.96);
    color: #18253d;
    border-color: rgba(46, 46, 46, 0.2);
  }

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
  }

  .component-select-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
  }

  .component-row-title {
    display: inline-block;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .component-row-meta {
    font-family: var(--tera-code-font);
    white-space: nowrap;
  }

  .component-detail-card {
    margin-top: 12px;
  }

  .components-layout {
    display: grid;
    gap: 10px;
  }

  .components-split-pane {
    display: grid;
    grid-template-columns: minmax(260px, 44%) minmax(320px, 56%);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    overflow: hidden;
    min-height: 340px;
    background: linear-gradient(180deg, rgba(7, 18, 35, 0.84), rgba(5, 11, 24, 0.95));
  }

  #terajs-devtools-root[data-theme="light"] .components-split-pane {
    background: linear-gradient(180deg, rgba(246, 250, 255, 0.98), rgba(236, 244, 255, 0.96));
    border-color: rgba(54, 118, 210, 0.24);
  }

  .components-tree-pane,
  .components-inspector-pane {
    min-width: 0;
    min-height: 0;
    padding: 10px 12px;
    overflow: auto;
  }

  .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
  }

  #terajs-devtools-root[data-theme="light"] .components-tree-pane {
    border-right-color: rgba(54, 118, 210, 0.22);
  }

  .component-tree-toolbar {
    margin-top: 0;
    margin-bottom: 10px;
  }

  .component-tree-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }

  .component-tree-children {
    margin-top: 2px;
  }

  .component-tree-node {
    margin: 0;
    padding: 0;
  }

  .component-tree-row {
    display: grid;
    grid-template-columns: auto auto 1fr;
    align-items: center;
    gap: 3px;
    min-height: 28px;
  }

  .component-tree-guides {
    display: inline-flex;
    align-items: stretch;
    gap: 0;
  }

  .tree-indent-guide {
    width: 12px;
    height: 24px;
    display: inline-block;
    position: relative;
  }

  .tree-indent-guide.is-continuing::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(50, 215, 255, 0.28);
  }

  #terajs-devtools-root[data-theme="light"] .tree-indent-guide.is-continuing::before {
    background: rgba(54, 118, 210, 0.32);
  }

  .component-tree-toggle {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: rgba(47, 109, 255, 0.08);
    color: rgba(144, 219, 255, 0.95);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1;
    display: inline-grid;
    place-items: center;
    padding: 0;
  }

  .component-tree-toggle:hover {
    border-color: rgba(50, 215, 255, 0.48);
    background: rgba(50, 215, 255, 0.16);
  }

  .component-tree-toggle.is-placeholder {
    cursor: default;
    opacity: 0.28;
  }

  .component-tree-select {
    appearance: none;
    width: 100%;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--tera-cloud);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 24px;
    padding: 2px 8px;
    cursor: pointer;
    text-align: left;
  }

  .component-tree-select:hover {
    background: rgba(50, 215, 255, 0.12);
    border-color: rgba(50, 215, 255, 0.36);
  }

  .component-tree-select.is-active {
    background: linear-gradient(135deg, rgba(19, 183, 255, 0.35), rgba(30, 234, 255, 0.28));
    border-color: rgba(78, 241, 255, 0.92);
    box-shadow: inset 0 0 0 1px rgba(18, 232, 255, 0.78), 0 0 0 1px rgba(18, 232, 255, 0.42), 0 8px 22px rgba(19, 183, 255, 0.24);
    color: #ecfbff;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select {
    color: #10213f;
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-select.is-active {
    color: #072544;
    background: linear-gradient(135deg, rgba(86, 206, 255, 0.35), rgba(115, 236, 255, 0.4));
    border-color: rgba(25, 166, 214, 0.74);
    box-shadow: inset 0 0 0 1px rgba(44, 189, 226, 0.6), 0 6px 16px rgba(40, 152, 205, 0.2);
  }

  .component-tree-label {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 600;
  }

  .component-tree-instance {
    font-family: var(--tera-code-font);
    opacity: 0.82;
    font-size: 11px;
    white-space: nowrap;
  }

  .component-ai-hint {
    margin-left: 36px;
    margin-top: 2px;
    margin-bottom: 4px;
    font-size: 11px;
  }

  .component-inspector-header {
    margin-top: 10px;
  }

  .inspector-selected-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .inspector-selected-summary {
    display: flex;
    gap: 10px;
    min-width: 0;
    align-items: flex-start;
  }

  .inspector-selected-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 74px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: #ecfbff;
    background: linear-gradient(135deg, rgba(19, 183, 255, 0.52), rgba(30, 234, 255, 0.22));
    border: 1px solid rgba(78, 241, 255, 0.46);
  }

  .inspector-stats-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .inspector-stat-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.22);
    background: rgba(6, 16, 34, 0.86);
    font-size: 11px;
  }

  .inspector-stat-label {
    color: var(--tera-mist);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .inspector-stat-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-weight: 700;
  }

  .inspector-tab-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .inspector-tab-button {
    appearance: none;
    border: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 999px;
    padding: 7px 12px;
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-mist);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, transform 120ms ease;
  }

  .inspector-tab-button:hover {
    border-color: rgba(50, 215, 255, 0.4);
    color: var(--tera-cloud);
    transform: translateY(-1px);
  }

  .inspector-tab-button.is-selected {
    background: linear-gradient(135deg, rgba(19, 183, 255, 0.88), rgba(30, 234, 255, 0.55));
    color: #04111f;
    border-color: rgba(78, 241, 255, 0.88);
    box-shadow: 0 10px 24px rgba(19, 183, 255, 0.24);
  }

  .inspector-surface {
    display: grid;
    gap: 12px;
    margin-top: 10px;
  }

  .inspector-overview-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .inspector-card {
    min-height: 0;
  }

  .reactive-feed,
  .activity-feed {
    margin-top: 10px;
    max-height: 320px;
  }

  .inspector-control-list {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .inspector-control-row {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(50, 215, 255, 0.14);
    background: rgba(4, 10, 22, 0.52);
  }

  .inspector-control-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .inspector-control-labels {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .inspector-control-preview {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .inspector-live-input {
    min-width: min(220px, 100%);
    max-width: 100%;
    border: 1px solid rgba(50, 215, 255, 0.24);
    border-radius: 10px;
    background: rgba(6, 16, 34, 0.9);
    color: var(--tera-cloud);
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
  }

  .inspector-live-input:focus {
    outline: 2px solid rgba(50, 215, 255, 0.36);
    outline-offset: 1px;
  }

  .inspector-toggle-button {
    min-width: 92px;
  }

  .reactive-feed-item {
    align-items: flex-start;
  }

  .value-explorer {
    display: grid;
    gap: 6px;
  }

  .value-node,
  .value-leaf {
    border: 1px solid rgba(50, 215, 255, 0.14);
    border-radius: 10px;
    background: rgba(4, 10, 22, 0.6);
  }

  .value-node-toggle,
  .value-leaf {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
    color: var(--tera-cloud);
  }

  .value-node-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .value-node-toggle:hover {
    background: rgba(50, 215, 255, 0.08);
  }

  .value-node-chevron {
    color: var(--tera-cyan);
    width: 12px;
    display: inline-grid;
    place-items: center;
  }

  .value-key {
    min-width: 0;
    overflow-wrap: anywhere;
    font-family: var(--tera-code-font);
  }

  .value-badge {
    justify-self: end;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(47, 109, 255, 0.16);
    border: 1px solid rgba(50, 215, 255, 0.16);
    color: var(--tera-mist);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .value-node-children {
    display: grid;
    gap: 6px;
    padding: 0 10px 10px 22px;
  }

  .value-preview {
    grid-column: 2 / span 2;
    color: var(--tera-mist);
    overflow-wrap: anywhere;
  }

  .value-empty {
    padding: 10px;
    border-radius: 10px;
    background: rgba(4, 10, 22, 0.42);
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-selected-chip {
    color: #072544;
    background: linear-gradient(135deg, rgba(86, 206, 255, 0.48), rgba(115, 236, 255, 0.22));
    border-color: rgba(25, 166, 214, 0.44);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-stat-pill,
  #terajs-devtools-root[data-theme="light"] .inspector-control-row,
  #terajs-devtools-root[data-theme="light"] .value-node,
  #terajs-devtools-root[data-theme="light"] .value-leaf,
  #terajs-devtools-root[data-theme="light"] .value-empty {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(54, 118, 210, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-tab-button {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(54, 118, 210, 0.18);
    color: #4e5f7a;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-tab-button.is-selected {
    color: #072544;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-live-input {
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(54, 118, 210, 0.22);
    color: #10213f;
  }

  #terajs-devtools-root[data-theme="light"] .value-badge {
    background: rgba(64, 126, 213, 0.08);
    color: #516178;
  }

  .inspector-section {
    margin-top: 8px;
    border: 1px solid var(--tera-border);
    border-radius: 12px;
    background: rgba(10, 18, 33, 0.72);
    overflow: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section {
    background: rgba(255, 255, 255, 0.92);
    border-color: rgba(46, 46, 46, 0.16);
  }

  .inspector-section-toggle {
    width: 100%;
    appearance: none;
    border: 0;
    border-bottom: 1px solid rgba(50, 215, 255, 0.18);
    background: rgba(47, 109, 255, 0.08);
    color: var(--tera-cloud);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .inspector-section-toggle:hover {
    background: rgba(50, 215, 255, 0.16);
  }

  .inspector-section-chevron {
    width: 14px;
    color: var(--tera-cyan);
    font-size: 12px;
    display: inline-grid;
    place-items: center;
  }

  .inspector-section-title {
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .inspector-section-body {
    padding: 10px;
    display: grid;
    gap: 8px;
  }

  .inspector-code {
    margin: 0;
    border: 1px solid rgba(50, 215, 255, 0.3);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.94);
    padding: 10px;
    color: #dff5ff;
    max-height: 220px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.44;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-code {
    background: rgba(242, 248, 255, 0.96);
    color: #10213f;
    border-color: rgba(54, 118, 210, 0.28);
  }

  .inspector-grid {
    display: grid;
    gap: 6px;
    font-size: 12px;
  }

  @media (max-width: 900px) {
    .components-split-pane {
      grid-template-columns: 1fr;
    }

    .panel-section-grid {
      grid-template-columns: 1fr;
    }

    .inspector-overview-grid {
      grid-template-columns: 1fr;
    }

    .components-tree-pane {
      border-right: 0;
      border-bottom: 1px solid rgba(50, 215, 255, 0.24);
      max-height: 280px;
    }
  }

  .panel-title {
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

  #terajs-devtools-root[data-theme="light"] .is-blue { color: #0a57cc; }
  #terajs-devtools-root[data-theme="light"] .is-green { color: #007e96; }
  #terajs-devtools-root[data-theme="light"] .is-purple { color: #5a43bc; }
  #terajs-devtools-root[data-theme="light"] .is-red { color: #b2204f; }
  #terajs-devtools-root[data-theme="light"] .is-cyan { color: #007da8; }
  #terajs-devtools-root[data-theme="light"] .is-amber { color: #8a5100; }

  .is-blue { color: var(--tera-blue); }
  .is-green { color: var(--tera-cyan); }
  .is-purple { color: var(--tera-purple); }
  .is-red { color: #ff6b8b; }
  .is-cyan { color: var(--tera-cyan); }
  .is-amber { color: #ffc56a; }

  .empty-state {
    padding: 12px 0;
    color: rgba(179, 179, 179, 0.72);
    font-size: 13px;
  }

  #terajs-devtools-root[data-theme="light"] .empty-state {
    color: rgba(46, 46, 46, 0.56);
  }

  .stack-list {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 360px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .stack-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .compact-list {
    max-height: 180px;
  }

  .log-list {
    max-height: 320px;
  }

  .stack-item,
  .detail-card,
  .metric-card {
    background: var(--tera-panel-glow), rgba(26, 26, 26, 0.96);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .stack-item,
  #terajs-devtools-root[data-theme="light"] .detail-card,
  #terajs-devtools-root[data-theme="light"] .metric-card {
    background: linear-gradient(145deg, rgba(47, 109, 255, 0.06), rgba(50, 215, 255, 0.05) 52%, rgba(255, 255, 255, 0.94));
    border-color: rgba(46, 46, 46, 0.12);
  }

  .stack-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .item-label,
  .accent-text {
    font-weight: 700;
  }

  .item-label,
  .metric-value,
  .tiny-muted {
    font-family: var(--tera-code-font);
  }

  .issue-error {
    border-color: rgba(255, 107, 139, 0.28);
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffd6de;
  }

  .issue-warn {
    border-color: rgba(255, 197, 106, 0.28);
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.16), rgba(26, 26, 26, 0.98));
    color: #ffe6b0;
  }

  #terajs-devtools-root[data-theme="light"] .issue-error {
    background: linear-gradient(145deg, rgba(255, 107, 139, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a1738;
  }

  #terajs-devtools-root[data-theme="light"] .issue-warn {
    background: linear-gradient(145deg, rgba(255, 197, 106, 0.12), rgba(255, 255, 255, 0.96));
    color: #8a5400;
  }

  .timeline-active {
    border-left: 3px solid var(--tera-cyan);
  }

  .timeline-inactive {
    opacity: 0.7;
  }

  .performance-item {
    border-left: 3px solid var(--tera-purple);
  }

  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin: 12px 0;
  }

  .metric-value {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .metric-value {
    color: #181818;
  }

  .range-wrap {
    margin: 12px 0;
  }

  .timeline-slider {
    width: 100%;
    accent-color: var(--tera-blue);
  }

  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }
`;
