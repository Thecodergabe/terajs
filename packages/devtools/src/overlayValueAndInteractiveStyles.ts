export const overlayValueAndInteractiveStyles = `
  .runtime-history-panel {
    display: grid;
    gap: 10px;
    margin-top: 4px;
    padding: 10px 12px;
    border: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(7, 18, 35, 0.72), rgba(5, 11, 24, 0.88));
    min-width: 0;
  }

  .runtime-history-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .runtime-history-heading {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .runtime-history-title {
    color: var(--tera-cloud);
    font-family: var(--tera-heading-font);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .runtime-history-caption {
    color: var(--tera-mist);
    font-size: 11px;
    line-height: 1.45;
  }

  .runtime-history-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(50, 215, 255, 0.24);
    background: rgba(50, 215, 255, 0.1);
    color: var(--tera-cyan);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .runtime-history-scroll {
    max-height: 156px;
    min-width: 0;
    overflow: auto;
    overscroll-behavior: contain;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(67, 140, 255, 0.55) rgba(7, 17, 33, 0.42);
  }

  .runtime-history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .runtime-history-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid rgba(50, 215, 255, 0.14);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.64);
    min-width: 0;
  }

  .runtime-history-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(50, 215, 255, 0.12);
    color: var(--tera-cyan);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .runtime-history-text {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .runtime-history-empty {
    padding: 10px 12px;
    border: 1px dashed rgba(50, 215, 255, 0.22);
    border-radius: 10px;
    background: rgba(4, 9, 19, 0.38);
    color: var(--tera-mist);
    font-size: 12px;
    line-height: 1.45;
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-panel {
    background: var(--tera-light-panel-alt);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-title {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-caption {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-count {
    border-color: var(--tera-light-border);
    background: var(--tera-light-accent-soft);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll {
    scrollbar-color: rgba(47, 109, 255, 0.5) rgba(214, 226, 246, 0.85);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-item {
    background: var(--tera-light-panel-raised);
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-badge {
    background: var(--tera-light-accent-soft);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-text {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .runtime-history-empty {
    background: var(--tera-light-panel-raised-soft);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .components-screen-pill {
    background: rgba(255, 255, 255, 0.86);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge {
    background: var(--tera-light-accent-soft);
    border-color: var(--tera-light-border);
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-badge.is-root {
    background: var(--tera-light-accent-soft-strong);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .component-tree-meta {
    color: var(--tera-light-text-muted);
  }

  .reactive-feed,
  .activity-feed {
    margin: 0;
    max-height: 320px;
  }

  .inspector-control-list {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown {
    border-left: 1px solid rgba(50, 215, 255, 0.18);
    padding-left: 10px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown-summary {
    list-style: none;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;
    padding: 3px 0 3px 14px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-dropdown-label {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .inspector-dropdown-origin {
    color: var(--tera-cyan);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid rgba(50, 215, 255, 0.28);
    border-radius: 999px;
    padding: 1px 6px;
    line-height: 1.2;
  }

  .inspector-dropdown-summary::marker,
  .inspector-dropdown-summary::-webkit-details-marker {
    display: none;
  }

  .inspector-dropdown-summary::before {
    content: "\\25B8";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    color: var(--tera-cyan);
    font-size: 12px;
    line-height: 1;
  }

  .inspector-dropdown[open] > .inspector-dropdown-summary::before {
    content: "\\25BE";
  }

  .inspector-dropdown-key {
    color: var(--tera-cloud);
    font-family: var(--tera-code-font);
    font-size: 12px;
    font-weight: 500;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .inspector-dropdown-type {
    color: var(--tera-mist);
    font-size: 11px;
    text-transform: lowercase;
    letter-spacing: 0.02em;
  }

  .inspector-dropdown-body {
    display: grid;
    gap: 6px;
    padding: 2px 0 6px 14px;
    min-width: 0;
    max-width: 100%;
  }

  .inspector-inline-edit-row {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
  }

  .inspector-inline-value {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .inspector-live-input {
    min-width: min(200px, 100%);
    max-width: 100%;
    border: 1px solid rgba(50, 215, 255, 0.24);
    border-radius: 6px;
    background: rgba(6, 16, 34, 0.72);
    color: var(--tera-cloud);
    padding: 4px 8px;
    font: inherit;
    font-size: 12px;
  }

  .inspector-live-input:focus {
    outline: 2px solid rgba(50, 215, 255, 0.36);
    outline-offset: 1px;
  }

  .inspector-toggle-button {
    min-width: 76px;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .reactive-feed-item {
    align-items: flex-start;
  }

  .value-explorer {
    display: grid;
    gap: 2px;
    min-width: 0;
    max-width: 100%;
  }

  .value-node,
  .value-leaf {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .value-node-toggle,
  .value-leaf {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font: inherit;
    font-size: 12px;
    color: var(--tera-mist);
    min-width: 0;
    max-width: 100%;
  }

  .value-node-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .value-node-toggle:hover {
    background: rgba(50, 215, 255, 0.06);
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
    color: var(--tera-cloud);
  }

  .value-type {
    justify-self: end;
    color: var(--tera-mist);
    font-size: 11px;
    font-family: var(--tera-code-font);
  }

  .value-separator {
    color: var(--tera-mist);
    justify-self: center;
  }

  .value-node-children {
    display: grid;
    gap: 2px;
    padding: 0 0 0 16px;
    min-width: 0;
    max-width: 100%;
  }

  .value-preview {
    grid-column: 3;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    overflow-wrap: anywhere;
  }

  .value-empty {
    padding: 2px 0;
    background: transparent;
    border: 0;
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown {
    border-color: var(--tera-light-border);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-origin {
    color: var(--tera-light-accent-strong);
    border-color: var(--tera-light-border-strong);
    background: var(--tera-light-accent-soft);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-summary::before {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-key {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-dropdown-type {
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-inline-value {
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-live-input {
    background: var(--tera-light-panel-raised);
    border-color: var(--tera-light-border);
    color: var(--tera-light-text-strong);
  }

  .inspector-section {
    border-left: 1px solid var(--tera-border);
    border-radius: 0;
    background: transparent;
    overflow: visible;
    padding-left: 10px;
    min-width: 0;
    max-width: 100%;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section {
    border-color: var(--tera-light-border);
  }

  .inspector-section-toggle {
    width: 100%;
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--tera-cloud);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .inspector-section-toggle:hover {
    color: #e9f7ff;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-toggle {
    color: var(--tera-light-text-strong);
    border-radius: 6px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-toggle:hover {
    color: var(--tera-light-accent-strong);
    background: linear-gradient(90deg, rgba(47, 109, 255, 0.08), rgba(90, 79, 212, 0.06), rgba(50, 215, 255, 0.03));
  }

  .inspector-section-chevron {
    width: 14px;
    color: var(--tera-cyan);
    font-size: 12px;
    display: inline-grid;
    place-items: center;
  }

  .inspector-section-heading {
    min-width: 0;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .inspector-section-title {
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-chevron {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-title {
    color: var(--tera-light-text-strong);
  }

  .inspector-section-summary {
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-section-summary {
    color: var(--tera-light-text-muted);
  }

  .inspector-section-body {
    padding: 2px 0 6px 14px;
    display: grid;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
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

  .inspector-json {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    overflow-x: hidden;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-code {
    background: var(--tera-light-panel-raised-soft);
    color: var(--tera-light-text-strong);
    border-color: var(--tera-light-border-strong);
  }

  .inspector-grid {
    display: grid;
    gap: 6px;
    font-size: 12px;
  }

  #terajs-devtools-root[data-theme="light"] .value-node-toggle,
  #terajs-devtools-root[data-theme="light"] .value-leaf {
    color: var(--tera-light-text-soft);
  }

  #terajs-devtools-root[data-theme="light"] .value-node-toggle:hover {
    background: linear-gradient(90deg, rgba(47, 109, 255, 0.08), rgba(90, 79, 212, 0.06), rgba(50, 215, 255, 0.03));
  }

  #terajs-devtools-root[data-theme="light"] .value-node-chevron {
    color: var(--tera-light-accent-strong);
  }

  #terajs-devtools-root[data-theme="light"] .value-key {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .value-type,
  #terajs-devtools-root[data-theme="light"] .value-separator,
  #terajs-devtools-root[data-theme="light"] .value-preview,
  #terajs-devtools-root[data-theme="light"] .value-empty {
    color: var(--tera-light-text-muted);
  }

`;
