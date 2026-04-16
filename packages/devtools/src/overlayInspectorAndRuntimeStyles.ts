import { componentTreeStyles } from "./componentTreeStyles.js";

export const overlayInspectorAndRuntimeStyles = `
  .ai-diagnostics-nav-list {
    display: grid;
    gap: 1px;
  }

  .ai-diagnostics-nav-button {
    appearance: none;
    width: 100%;
    justify-self: stretch;
    position: relative;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--component-tree-label-dark);
    display: grid;
    gap: 2px;
    min-height: 26px;
    padding: 3px 14px;
    cursor: pointer;
    text-align: left;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
  }

  .ai-diagnostics-nav-button::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 999px;
    background: rgba(97, 156, 255, 0.24);
    opacity: 1;
    transition: background 140ms ease;
  }

  .ai-diagnostics-nav-button:hover {
    background: var(--component-tree-hover-dark);
    color: #f3fff8;
  }

  .ai-diagnostics-nav-button.is-active {
    background: var(--component-tree-active-dark);
    box-shadow: inset 2px 0 0 var(--component-tree-accent-dark);
    color: #f4f8ff;
  }

  .ai-diagnostics-nav-button:hover::before,
  .ai-diagnostics-nav-button.is-active::before {
    background: var(--component-tree-accent-dark);
  }

  .ai-diagnostics-nav-title {
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1.2;
  }

  .ai-diagnostics-nav-summary {
    color: var(--component-tree-meta-dark);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.25;
  }

  .ai-diagnostics-nav-button.is-active .ai-diagnostics-nav-summary {
    color: rgba(223, 239, 255, 0.82);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button {
    color: var(--component-tree-label-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover {
    background: var(--component-tree-hover-light);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active {
    background: var(--component-tree-active-light);
    box-shadow: inset 2px 0 0 var(--component-tree-accent-light);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button::before {
    background: rgba(73, 126, 255, 0.24);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button:hover::before,
  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active::before {
    background: var(--component-tree-accent-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-summary {
    color: var(--component-tree-meta-light);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-button.is-active .ai-diagnostics-nav-summary {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-diagnostics-nav-title {
    text-shadow: 0 0 10px rgba(50, 215, 255, 0.12);
  }

  .ai-diagnostics-detail-stack,
  .ai-diagnostics-section-block {
    display: grid;
    gap: 10px;
  }

  .meta-panel-layout {
    grid-template-columns: minmax(180px, 31%) minmax(0, 69%);
    grid-template-rows: minmax(0, 1fr);
  }

  .meta-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .meta-panel-layout .meta-panel-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout .ai-diagnostics-nav-pane .components-screen-body,
  .logs-panel-layout .ai-diagnostics-nav-pane .components-screen-body {
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .issues-panel-layout,
  .logs-panel-layout {
    grid-template-columns: minmax(220px, 30%) minmax(0, 70%);
    grid-template-rows: minmax(0, 1fr);
  }

  .issues-panel-layout .components-tree-pane,
  .logs-panel-layout .components-tree-pane {
    border-right: 1px solid rgba(50, 215, 255, 0.26);
    border-bottom: 0;
  }

  #terajs-devtools-root[data-theme="light"] .issues-panel-layout .components-tree-pane,
  #terajs-devtools-root[data-theme="light"] .logs-panel-layout .components-tree-pane {
    border-right-color: var(--tera-light-border);
  }

  .iframe-single-panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    padding: 0;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  .iframe-single-panel .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  #terajs-devtools-root[data-theme="light"] .iframe-single-panel {
    background: var(--tera-light-panel-bg);
  }

  @media (max-width: 520px) {
    .meta-panel-layout {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }

    .meta-panel-layout .components-tree-pane {
      border-right: 0;
      border-bottom: 1px solid var(--tera-border);
    }

    #terajs-devtools-root[data-theme="light"] .meta-panel-layout .components-tree-pane {
      border-bottom-color: var(--tera-light-border);
    }
  }

  .signals-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(160px, auto) minmax(0, 1fr);
    min-height: 360px;
    height: calc(100% + 24px);
    margin: -12px;
    overflow: hidden;
  }

  .signals-summary-pane,
  .signals-detail-pane {
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .signals-summary-pane .components-screen-body,
  .signals-detail-pane .components-screen-body {
    flex: 1;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: var(--tera-components-column-padding) 12px;
  }

  .signals-summary-pane {
    border-bottom: 1px solid var(--tera-border);
    background: linear-gradient(180deg, rgba(16, 28, 58, 0.94), rgba(8, 14, 30, 0.98));
  }

  .signals-detail-pane {
    background: linear-gradient(180deg, rgba(10, 17, 31, 0.86), rgba(5, 9, 18, 0.92));
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
    border-bottom-color: var(--tera-light-border);
    background: var(--tera-light-panel-alt);
  }

  #terajs-devtools-root[data-theme="light"] .signals-detail-pane {
    background: var(--tera-light-panel-bg);
  }

  .signals-summary-list,
  .signals-detail-stack,
  .meta-panel-detail-stack,
  .iframe-panel-stack {
    display: grid;
    gap: 10px;
  }

  .signals-summary-row,
  .signals-section-block,
  .meta-panel-section-block,
  .iframe-panel-section-block {
    display: grid;
    gap: 8px;
    border: 1px solid var(--tera-border);
    border-radius: 8px;
    background: rgba(10, 20, 38, 0.34);
    padding: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-row,
  #terajs-devtools-root[data-theme="light"] .signals-section-block,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-block,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-block {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.58);
  }

  .signals-summary-label,
  .signals-section-heading,
  .meta-panel-section-heading,
  .iframe-panel-section-heading {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-label,
  #terajs-devtools-root[data-theme="light"] .signals-section-heading,
  #terajs-devtools-root[data-theme="light"] .meta-panel-section-heading,
  #terajs-devtools-root[data-theme="light"] .iframe-panel-section-heading {
    color: var(--tera-light-text-strong);
  }

  .signals-summary-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .signals-summary-note {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .signals-summary-note {
    color: var(--tera-light-text-muted);
  }

  .iframe-results-pane {
    min-width: 0;
  }

  .iframe-results-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .iframe-results-item {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid rgba(50, 215, 255, 0.16);
    border-radius: 10px;
    background: rgba(6, 14, 28, 0.56);
    min-width: 0;
  }

  .iframe-results-item.is-error {
    border-color: rgba(255, 107, 139, 0.26);
    background: linear-gradient(180deg, rgba(62, 16, 28, 0.52), rgba(12, 12, 18, 0.72));
  }

  .iframe-results-item.is-warn {
    border-color: rgba(255, 197, 106, 0.24);
    background: linear-gradient(180deg, rgba(62, 40, 12, 0.48), rgba(12, 12, 18, 0.72));
  }

  .iframe-results-item-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .iframe-results-item-title {
    color: var(--tera-cloud);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.45;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .iframe-results-item-meta {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .iframe-results-item-summary {
    color: rgba(227, 238, 255, 0.76);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .timeline-control-panel {
    display: grid;
    gap: 10px;
  }

  .timeline-control-summary {
    display: grid;
    gap: 4px;
  }

  .timeline-control-count {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 700;
  }

  .timeline-control-note {
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.45;
  }

  .signals-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    max-height: 420px;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .signals-list-compact {
    max-height: 360px;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list {
    scrollbar-color: rgba(54, 118, 210, 0.5) rgba(209, 223, 246, 0.8);
  }

  .signals-list-item {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-left: 2px solid var(--tera-cyan);
    background: rgba(7, 18, 35, 0.3);
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-item {
    border-left-color: var(--tera-light-accent);
    background: rgba(47, 109, 255, 0.04);
  }

  .signals-list-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .signals-list-preview {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  #terajs-devtools-root[data-theme="light"] .signals-list-preview {
    color: var(--tera-light-text-strong);
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
    background:
      radial-gradient(circle at top left, rgba(47, 109, 255, 0.16), transparent 30%),
      radial-gradient(circle at top right, rgba(90, 79, 212, 0.14), transparent 26%),
      radial-gradient(circle at center right, rgba(50, 215, 255, 0.08), transparent 24%),
      linear-gradient(180deg, rgba(247, 252, 255, 0.99), rgba(226, 238, 255, 0.97));
    border-color: var(--tera-light-border-strong);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76), 0 18px 34px rgba(47, 109, 255, 0.12), 0 0 26px rgba(50, 215, 255, 0.08);
  }

  .components-tree-pane,
  .components-inspector-pane {
    min-width: 0;
    min-height: 0;
    padding: 10px 12px;
    overflow: auto;
  }

${componentTreeStyles}

  .inspector-cascade {
    display: grid;
    gap: 12px;
  }

  .inspector-cascade-block {
    display: grid;
    gap: 8px;
    border-left: 1px solid var(--tera-border);
    padding-left: 10px;
  }

  .inspector-cascade-title {
    color: var(--tera-cloud);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: none;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-cascade-title {
    color: var(--tera-light-text-strong);
  }

  .inspector-keyvalue-list {
    display: grid;
    gap: 4px;
  }

  .inspector-keyvalue-row {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 10px;
    font-size: 12px;
    line-height: 1.35;
  }

  .inspector-keyvalue-key {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
  }

  .inspector-keyvalue-value {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    overflow-wrap: anywhere;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-key {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-keyvalue-value {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-title {
    color: var(--tera-light-text-muted);
  }

  .inspector-ai-panel {
    display: grid;
    gap: 12px;
  }

  .inspector-ai-block {
    display: grid;
    gap: 8px;
  }

  .inspector-ai-title {
    color: var(--tera-mist);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .inspector-ai-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .inspector-ai-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.24);
    background: rgba(50, 215, 255, 0.1);
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.2;
  }

`;
