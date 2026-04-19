export const overlayFabAndShellStyles = `
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
    letter-spacing: 0.01em;
    min-width: 118px;
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
    width: min(var(--terajs-overlay-panel-width, 920px), calc(100vw - 12px));
    max-width: calc(100vw - 12px);
    height: min(var(--terajs-overlay-panel-height, 760px), calc(100vh - 12px));
    max-height: calc(100vh - 12px);
    border: 1px solid var(--tera-border);
    border-radius: 14px;
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

  @media (min-width: 861px) {
    .overlay-frame {
      width: min(var(--terajs-overlay-panel-width, 920px), 75vw, calc(100vw - 24px));
      max-width: min(75vw, calc(100vw - 24px));
      height: min(var(--terajs-overlay-panel-height, 760px), 75vh, calc(100vh - 24px));
      max-height: min(75vh, calc(100vh - 24px));
      border-radius: 18px;
    }
  }

  .overlay-frame.is-hidden {
    display: none;
  }

  #terajs-devtools-root {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  #terajs-devtools-root[data-theme="light"] {
    --tera-light-text-strong: var(--tera-light-cyan-ink);
    --tera-light-text-soft: #5f5ed9;
    --tera-light-text-muted: #746fe8;
    --tera-light-accent: #2f6dff;
    --tera-light-accent-strong: #1f58d6;
    --tera-light-accent-violet: #5a4fd4;
    --tera-light-accent-soft: rgba(47, 109, 255, 0.14);
    --tera-light-accent-soft-strong: rgba(47, 109, 255, 0.22);
    --tera-light-border: rgba(79, 140, 255, 0.28);
    --tera-light-border-strong: rgba(88, 201, 255, 0.34);
    --tera-light-shell-bg:
      radial-gradient(circle at 0% 0%, rgba(47, 109, 255, 0.24), transparent 30%),
      radial-gradient(circle at 92% 8%, rgba(90, 79, 212, 0.2), transparent 26%),
      radial-gradient(circle at 70% 32%, rgba(50, 215, 255, 0.16), transparent 24%),
      linear-gradient(180deg, rgba(251, 254, 255, 0.99), rgba(230, 242, 255, 0.98));
    --tera-light-panel-bg:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 34%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.11), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(235, 245, 255, 0.98));
    --tera-light-panel-alt:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 32%),
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.1), transparent 28%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
    --tera-light-panel-emphasis:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 38%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.99), rgba(216, 225, 255, 0.97));
    --tera-light-panel-raised: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(236, 246, 255, 0.96));
    --tera-light-panel-raised-soft: linear-gradient(180deg, rgba(248, 252, 255, 0.98), rgba(231, 241, 255, 0.97));
    --tera-light-shadow: 0 18px 38px rgba(47, 109, 255, 0.16), 0 0 26px rgba(90, 79, 212, 0.12);
    --tera-light-cyan-ink: #0b7ea6;
    --tera-light-purple-ink: #5647c8;
    --tera-light-red-ink: #b2204f;
    --tera-light-amber-ink: #8a5100;
    --tera-light-mint-ink: #0f8d77;
    color: var(--tera-light-text-strong);
  }

  .devtools-shell {
    --tera-sidebar-width: 100%;
    --tera-components-tree-width: minmax(0, 1fr);
    --tera-components-column-padding: 10px;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--panel-bg, transparent);
    color: inherit;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-shell {
    --panel-bg: var(--tera-light-shell-bg);
  }

  .devtools-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background:
      linear-gradient(120deg, rgba(47, 109, 255, 0.18), rgba(50, 215, 255, 0.1) 58%, transparent),
      rgba(13, 19, 32, 0.94);
    backdrop-filter: blur(14px);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.18), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.16), transparent 30%),
      radial-gradient(circle at center, rgba(50, 215, 255, 0.08), transparent 46%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(235, 245, 255, 0.93));
    border-bottom-color: var(--tera-light-border);
  }

  .devtools-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  .devtools-host-controls-panel {
    display: grid;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(8, 17, 34, 0.9), rgba(7, 14, 28, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-panel {
    border-bottom-color: var(--tera-light-border);
    background: linear-gradient(180deg, rgba(247, 251, 255, 0.98), rgba(237, 245, 255, 0.96));
  }

  .devtools-host-controls-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .devtools-host-controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .devtools-host-controls-section {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid rgba(50, 215, 255, 0.16);
    border-radius: 12px;
    background: rgba(10, 20, 38, 0.54);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-section {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.88);
  }

  .devtools-host-controls-title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--tera-cloud);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-host-controls-title {
    color: var(--tera-light-text-strong);
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
    color: var(--tera-light-text-strong);
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
    color: var(--tera-light-text-muted);
  }

  .devtools-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
  }

  .components-screen {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(220px, 40%) minmax(0, 1fr);
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: contain;
    background: linear-gradient(180deg, rgba(7, 13, 26, 0.94), rgba(4, 8, 18, 0.9));
  }

  .components-screen.is-inspector-hidden {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .components-screen-sidebar {
    min-width: 0;
    min-height: 0;
    display: flex;
  }

  .components-screen-sidebar .devtools-tabs {
    width: 100%;
    height: auto;
  }

  .components-screen-tree,
  .components-screen-inspector {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  .components-screen-tree {
    grid-column: 1;
    grid-row: 2;
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .components-screen-inspector {
    grid-column: 1;
    grid-row: 3;
  }

  .components-screen.is-inspector-hidden .components-screen-tree {
    border-right: 0;
    border-bottom: 0;
  }

  .components-screen-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(14, 24, 43, 0.66), rgba(8, 13, 24, 0.6));
  }

  .components-screen-header-row {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .components-screen-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .components-screen-pill {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 0 9px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    background: rgba(7, 18, 35, 0.58);
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  .components-screen-search,
  .components-screen-filter {
    width: 100%;
    border: 1px solid rgba(50, 215, 255, 0.24);
    border-radius: 8px;
    background: rgba(7, 18, 35, 0.72);
    color: var(--tera-cloud);
    padding: 8px 10px;
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .components-screen-search:focus,
  .components-screen-filter:focus {
    border-color: rgba(50, 215, 255, 0.48);
    box-shadow: 0 0 0 1px rgba(50, 215, 255, 0.3);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter {
    background: var(--tera-light-panel-raised);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-search:focus,
  #terajs-devtools-root[data-theme="light"] .components-screen-filter:focus {
    border-color: var(--tera-light-accent);
    box-shadow: 0 0 0 1px rgba(47, 109, 255, 0.18), 0 10px 22px rgba(47, 109, 255, 0.08);
  }

  .components-screen-header .component-tree-toolbar {
    margin-bottom: 0;
  }

  .components-screen-tree .components-screen-search {
    width: 100%;
  }

  .components-screen-body {
    min-width: 0;
    min-height: 0;
    padding: var(--tera-components-column-padding);
    overflow: auto;
    overscroll-behavior: contain;
  }

  .components-screen-inspector .components-screen-body {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-x: hidden;
  }

  .components-screen-inspector .component-drilldown-shell {
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;
  }

  .component-drilldown-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 8px;
    height: 100%;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

`;
