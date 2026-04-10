import { mountDevtoolsApp } from "./app.js";

let overlayEl: HTMLDivElement | null = null;
let cleanupOverlay: (() => void) | null = null;
let visible = true;

export function mountDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof document === "undefined" || overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.id = "terajs-overlay-container";
  overlayEl.style.position = "fixed";
  overlayEl.style.bottom = "20px";
  overlayEl.style.left = "20px";
  overlayEl.style.width = "420px";
  overlayEl.style.height = "60vh";
  overlayEl.style.zIndex = "999999";
  overlayEl.style.display = "block";

  const shadowRoot = overlayEl.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `
    <style>${overlayStyles}</style>
    <div class="overlay-frame">
      <div id="terajs-devtools-root"></div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  const mountRoot = shadowRoot.getElementById("terajs-devtools-root");
  if (!mountRoot) {
    throw new Error("Terajs devtools failed to create its mount root.");
  }

  cleanupOverlay = mountDevtoolsApp(mountRoot);
}

export function toggleDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  if (!overlayEl) {
    mountDevtoolsOverlay();
    return;
  }

  visible = !visible;
  overlayEl.style.display = visible ? "block" : "none";
}

export function unmountDevtoolsOverlay(): void {
  if (process.env.NODE_ENV === "production") return;
  cleanupOverlay?.();
  cleanupOverlay = null;

  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }

  visible = true;
}

const overlayStyles = `
  :host {
    all: initial;
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
    width: 100%;
    height: 100%;
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
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: rgba(245, 245, 245, 0.96);
    border-right-color: rgba(46, 46, 46, 0.12);
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
    background: rgba(255, 255, 255, 0.94);
    color: #181818;
    border-color: rgba(46, 46, 46, 0.12);
  }

  .tab-button.is-active,
  .filter-button.is-active,
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
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 245, 245, 0.96));
  }

  .ai-panel {
    border: 1px solid rgba(50, 215, 255, 0.3);
    background: linear-gradient(180deg, rgba(17, 45, 94, 0.46), rgba(5, 11, 24, 0.92));
    box-shadow: 0 0 34px rgba(47, 109, 255, 0.2), 0 0 62px rgba(50, 215, 255, 0.16);
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 12px;
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

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
  }

  .panel-title {
    font-family: var(--tera-heading-font);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }

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
`;
