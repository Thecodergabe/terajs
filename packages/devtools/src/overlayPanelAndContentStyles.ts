export const overlayPanelAndContentStyles = `
  .component-drilldown-headline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--tera-border);
    padding: 0 0 8px;
  }

  .component-drilldown-id {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }

  .component-drilldown-path {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    font-weight: 700;
  }

  .component-drilldown-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  .inspector-surface {
    display: grid;
    align-content: flex-start;
    gap: 8px;
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: 100%;
    overflow: auto;
    overflow-x: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-headline {
    border-bottom-color: var(--tera-light-border-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-path {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-drilldown-meta {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen {
    background: var(--tera-light-shell-bg);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree,
  #terajs-devtools-root[data-theme="light"] .components-screen-inspector {
    background: var(--tera-light-panel-bg);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree {
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 34%),
      radial-gradient(circle at top right, rgba(50, 215, 255, 0.08), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(239, 246, 255, 0.88));
    border-bottom-color: var(--tera-light-border);
  }

  .components-screen-tree .components-screen-header {
    background: linear-gradient(180deg, rgba(22, 37, 71, 0.84), rgba(12, 20, 38, 0.78));
    border-bottom-color: rgba(47, 109, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-tree .components-screen-header {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 42%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.12), transparent 32%),
      var(--tera-light-panel-emphasis);
    border-bottom-color: var(--tera-light-border-strong);
  }

  .devtools-tabs {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: rgba(13, 13, 13, 0.84);
    display: flex;
    flex-direction: row;
    overflow: auto hidden;
    padding: 6px;
    gap: 6px;
    backdrop-filter: blur(12px);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs {
    background: linear-gradient(180deg, rgba(243, 248, 255, 0.99), rgba(230, 240, 255, 0.97));
    border-right-color: var(--tera-light-border);
    border-bottom-color: var(--tera-light-border);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
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

  .tab-button {
    white-space: nowrap;
    flex: 0 0 auto;
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

  .toolbar-button:disabled,
  .toolbar-button:disabled:hover {
    cursor: wait;
    transform: none;
    opacity: 0.82;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button,
  #terajs-devtools-root[data-theme="light"] .toolbar-button,
  #terajs-devtools-root[data-theme="light"] .filter-button,
  #terajs-devtools-root[data-theme="light"] .select-button {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .tab-button:hover,
  #terajs-devtools-root[data-theme="light"] .toolbar-button:hover,
  #terajs-devtools-root[data-theme="light"] .filter-button:hover,
  #terajs-devtools-root[data-theme="light"] .select-button:hover {
    border-color: var(--tera-light-border-strong);
    background: rgba(255, 255, 255, 0.96);
    color: var(--tera-light-accent-strong);
    transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .tab-button.is-active,
  #terajs-devtools-root[data-theme="light"] .filter-button.is-active,
  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-active,
  #terajs-devtools-root[data-theme="light"] .select-button.is-selected {
    background: rgba(255, 255, 255, 0.94);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
    box-shadow: inset 0 0 0 1px rgba(79, 140, 255, 0.16);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active {
    background: linear-gradient(180deg, #2b6edc, #1a4daa);
    color: #ffffff;
    border-color: rgba(26, 77, 170, 0.72);
    box-shadow: 0 12px 24px rgba(31, 88, 214, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  #terajs-devtools-root[data-theme="light"] .devtools-tabs .tab-button.is-active:hover {
    background: linear-gradient(180deg, #2f76e8, #1c56bc);
    color: #ffffff;
    transform: none;
  }

  .tab-button.is-active,
  .filter-button.is-active,
  .toolbar-button.is-active,
  .select-button.is-selected {
    background: linear-gradient(135deg, var(--tera-blue), var(--tera-cyan));
    color: #ffffff;
    box-shadow: 0 10px 24px rgba(47, 109, 255, 0.3);
  }

  .toolbar-button.is-loading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .toolbar-button.is-loading::before {
    content: "";
    width: 11px;
    height: 11px;
    flex: 0 0 auto;
    border: 2px solid rgba(255, 255, 255, 0.82);
    border-right-color: transparent;
    border-radius: 999px;
    animation: tera-toolbar-spin 0.85s linear infinite;
  }

  @keyframes tera-toolbar-spin {
    to {
      transform: rotate(360deg);
    }
  }

  #terajs-devtools-root[data-theme="light"] .toolbar-button.is-loading::before {
    border-color: rgba(31, 88, 214, 0.82);
    border-right-color: transparent;
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
    padding: 12px;
    background: linear-gradient(180deg, rgba(26, 26, 26, 0.72), rgba(13, 13, 13, 0.9));
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .devtools-panel-iframe-shell {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .devtools-panel-iframe {
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 100%;
    border: 0;
    background: transparent;
  }

  #terajs-devtools-root[data-theme="light"] .devtools-panel {
    background: var(--tera-light-shell-bg);
    color: var(--tera-light-text-strong);
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
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
    grid-template-columns: minmax(0, 1fr);
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
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.16), transparent 36%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 28%),
      linear-gradient(180deg, rgba(238, 246, 255, 0.98), rgba(221, 235, 255, 0.96));
    border-color: var(--tera-light-border-strong);
    box-shadow: var(--tera-light-shadow);
  }

  .ai-workbench-shell {
    padding: 0;
    overflow: hidden;
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.12), transparent 26%),
      radial-gradient(circle at center, rgba(90, 79, 212, 0.08), transparent 36%),
      linear-gradient(180deg, rgba(10, 18, 33, 0.98), rgba(5, 9, 18, 0.98));
  }

  .ai-workbench-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .ai-workbench-pane {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.9), rgba(5, 9, 18, 0.96));
    border-bottom: 1px solid var(--tera-border);
  }

  .ai-workbench-pane:last-child {
    border-bottom: 0;
  }

  .ai-workbench-rail {
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .ai-workbench-main {
    background: linear-gradient(180deg, rgba(11, 23, 45, 0.94), rgba(6, 12, 25, 0.98));
  }

  .ai-workbench-body {
    display: grid;
    gap: 14px;
    align-content: flex-start;
  }

  .ai-workbench-block {
    display: grid;
    gap: 8px;
  }

  .ai-workbench-message-card {
    margin: 0;
  }

  .ai-workbench-details {
    border: 1px solid rgba(50, 215, 255, 0.2);
    border-radius: 14px;
    background: rgba(7, 18, 35, 0.56);
    overflow: hidden;
  }

  .ai-workbench-details summary {
    cursor: pointer;
    list-style: none;
    padding: 12px 14px;
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .ai-workbench-details summary::-webkit-details-marker {
    display: none;
  }

  .ai-workbench-details-body {
    padding: 0 14px 14px;
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-shell {
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.14), transparent 26%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.1), transparent 24%),
      radial-gradient(circle at center right, rgba(50, 215, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-pane {
    background: var(--tera-light-panel-bg);
    color: var(--tera-light-text-strong);
    border-bottom-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-rail {
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-main {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(239, 246, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details {
    background: var(--tera-light-panel-raised-soft);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .ai-workbench-details summary {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero {
    background:
      linear-gradient(135deg, rgba(47, 109, 255, 0.14), rgba(90, 79, 212, 0.1) 42%, rgba(50, 215, 255, 0.08) 68%),
      rgba(255, 255, 255, 0.97);
    border-color: var(--tera-light-border);
    box-shadow: var(--tera-light-shadow);
  }

  #terajs-devtools-root[data-theme="light"] .panel-hero-pill {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(235, 245, 255, 0.9));
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .panel-section-heading {
    color: var(--tera-light-text-strong);
  }

  .ask-ai-button {
    background: rgba(34, 66, 124, 0.58);
    color: #f4f8ff;
    border: 1px solid rgba(97, 156, 255, 0.26);
    box-shadow: none;
  }

  .ask-ai-button:hover {
    background: rgba(42, 79, 145, 0.62);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button {
    background: rgba(73, 126, 255, 0.12);
    color: var(--tera-light-text-strong);
    border-color: rgba(73, 126, 255, 0.2);
  }

  #terajs-devtools-root[data-theme="light"] .ask-ai-button:hover {
    background: rgba(73, 126, 255, 0.18);
    color: var(--tera-light-text-strong);
  }

  .ai-prompt {
    display: block;
    width: 100%;
    min-height: 180px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    padding: 14px;
    background: rgba(4, 9, 19, 0.92);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-prompt {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .ai-response {
    display: block;
    width: 100%;
    min-height: 120px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    padding: 14px;
    background: rgba(4, 9, 19, 0.92);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    overflow: auto;
    margin-top: 0;
  }

  #terajs-devtools-root[data-theme="light"] .ai-response {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .ai-hint {
    display: block;
    margin-top: 6px;
    color: rgba(147, 167, 203, 0.96);
  }

  #terajs-devtools-root[data-theme="light"] .ai-hint {
    color: var(--tera-light-text-muted);
  }

  .ai-diagnostics-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(180px, auto) minmax(0, 1fr);
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane,
  .ai-diagnostics-layout .ai-diagnostics-detail-pane {
    display: flex;
    flex-direction: column;
  }

  .ai-diagnostics-layout .ai-diagnostics-nav-pane .components-screen-body {
    flex: 1;
    overflow: visible;
    padding: var(--tera-components-column-padding) 12px;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-header {
    flex: 0 0 auto;
  }

  .ai-diagnostics-layout .ai-diagnostics-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  .ai-diagnostics-layout .components-tree-pane {
    border-right: 0;
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .ai-diagnostics-layout .components-inspector-pane {
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
    border-bottom-color: var(--tera-light-border);
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-inspector-pane {
    background: var(--tera-light-panel-bg);
  }

`;
