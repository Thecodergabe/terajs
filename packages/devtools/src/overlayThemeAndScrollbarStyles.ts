export const overlayThemeAndScrollbarStyles = `
  @media (min-width: 901px) {
    .devtools-shell {
      --tera-sidebar-width: 136px;
      --tera-components-tree-width: clamp(240px, 28vw, 320px);
      --tera-components-column-padding: 14px;
    }

    .devtools-body {
      flex-direction: row;
    }

    .components-screen {
      grid-template-columns: var(--tera-sidebar-width) var(--tera-components-tree-width) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
    }

    .components-screen.is-inspector-hidden {
      grid-template-columns: var(--tera-sidebar-width) minmax(0, 1fr);
    }

    .components-screen-sidebar {
      grid-column: 1;
      grid-row: 1;
    }

    .components-screen-sidebar .devtools-tabs {
      width: 100%;
      height: 100%;
    }

    .components-screen-tree {
      grid-column: 2;
      grid-row: 1;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
    }

    .components-screen-inspector {
      grid-column: 3;
      grid-row: 1;
    }

    .components-screen-header-row {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }

    .components-screen-search,
    .components-screen-filter {
      width: min(270px, 52%);
    }

    .components-screen-tree .components-screen-search {
      width: 100%;
    }

    .devtools-tabs {
      width: 132px;
      border-right: 1px solid var(--tera-border);
      border-bottom: 0;
      flex-direction: column;
      overflow: auto;
      padding: 8px;
    }

    .panel-section-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .metrics-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ai-diagnostics-layout {
      grid-template-columns: minmax(250px, 33%) minmax(0, 67%);
      grid-template-rows: minmax(0, 1fr);
    }

    .signals-layout {
      grid-template-columns: minmax(250px, 33%) minmax(0, 67%);
      grid-template-rows: minmax(0, 1fr);
    }

    .ai-diagnostics-layout .components-tree-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    .signals-summary-pane {
      border-right: 1px solid rgba(50, 215, 255, 0.26);
      border-bottom: 0;
    }

    #terajs-devtools-root[data-theme="light"] .ai-diagnostics-layout .components-tree-pane {
      border-right-color: var(--tera-light-border);
    }

    #terajs-devtools-root[data-theme="light"] .signals-summary-pane {
      border-right-color: var(--tera-light-border);
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

  #terajs-devtools-root[data-theme="light"] .panel-title.is-blue,
  #terajs-devtools-root[data-theme="light"] .panel-title.is-cyan {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .is-blue { color: var(--tera-light-accent-strong); }
  #terajs-devtools-root[data-theme="light"] .is-green { color: var(--tera-light-mint-ink); }
  #terajs-devtools-root[data-theme="light"] .is-purple { color: var(--tera-light-purple-ink); }
  #terajs-devtools-root[data-theme="light"] .is-red { color: var(--tera-light-red-ink); }
  #terajs-devtools-root[data-theme="light"] .is-cyan { color: var(--tera-light-cyan-ink); }
  #terajs-devtools-root[data-theme="light"] .is-amber { color: var(--tera-light-amber-ink); }

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
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .inspector-ai-tag {
    border-color: var(--tera-light-border);
    background: rgba(47, 109, 255, 0.08);
    color: var(--tera-light-text-soft);
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

  .inspector-cascade .stack-item {
    background: transparent;
    border: 0;
    border-left: 1px solid rgba(50, 215, 255, 0.18);
    border-radius: 0;
    padding: 2px 0 2px 10px;
  }

  #terajs-devtools-root[data-theme="light"] .inspector-cascade .stack-item {
    border-left-color: rgba(54, 118, 210, 0.22);
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

  #terajs-devtools-root[data-theme="light"] .iframe-results-item {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.72);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-error {
    border-color: rgba(206, 76, 119, 0.24);
    background: linear-gradient(180deg, rgba(255, 224, 232, 0.88), rgba(255, 255, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item.is-warn {
    border-color: rgba(219, 157, 50, 0.24);
    background: linear-gradient(180deg, rgba(255, 244, 216, 0.92), rgba(255, 255, 255, 0.94));
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-title,
  #terajs-devtools-root[data-theme="light"] .timeline-control-count {
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .iframe-results-item-meta,
  #terajs-devtools-root[data-theme="light"] .iframe-results-item-summary,
  #terajs-devtools-root[data-theme="light"] .timeline-control-note {
    color: var(--tera-light-text-muted);
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

  .ai-connection-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
  }

  .ai-connection-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(147, 167, 203, 0.2);
    background: rgba(7, 18, 35, 0.58);
    color: var(--tera-mist);
    font-family: var(--tera-code-font);
    font-size: 11px;
    line-height: 1.2;
  }

  .ai-connection-pill::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: rgba(147, 167, 203, 0.5);
    flex: 0 0 auto;
  }

  .ai-connection-pill.is-ready {
    border-color: rgba(50, 215, 255, 0.24);
    background: rgba(50, 215, 255, 0.1);
    color: var(--tera-cloud);
  }

  .ai-connection-pill.is-ready::before {
    background: var(--tera-cyan);
    box-shadow: 0 0 10px rgba(50, 215, 255, 0.45);
  }

  .ai-connection-pill.is-idle::before {
    background: rgba(147, 167, 203, 0.52);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill {
    border-color: var(--tera-light-border);
    background: rgba(255, 255, 255, 0.82);
    color: var(--tera-light-text-muted);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill.is-ready {
    background: rgba(47, 109, 255, 0.08);
    color: var(--tera-light-text-strong);
  }

  #terajs-devtools-root[data-theme="light"] .ai-connection-pill.is-ready::before {
    background: var(--tera-light-accent-strong);
    box-shadow: 0 0 10px rgba(47, 109, 255, 0.2);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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

  #terajs-devtools-root::-webkit-scrollbar,
  .devtools-panel::-webkit-scrollbar,
  .devtools-tabs::-webkit-scrollbar,
  .components-screen-body::-webkit-scrollbar,
  .stack-list::-webkit-scrollbar,
  .signals-list::-webkit-scrollbar,
  .ai-prompt::-webkit-scrollbar,
  .ai-response::-webkit-scrollbar,
  .inspector-code::-webkit-scrollbar,
  .runtime-history-scroll::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  #terajs-devtools-root::-webkit-scrollbar-track,
  .devtools-panel::-webkit-scrollbar-track,
  .devtools-tabs::-webkit-scrollbar-track,
  .components-screen-body::-webkit-scrollbar-track,
  .stack-list::-webkit-scrollbar-track,
  .signals-list::-webkit-scrollbar-track,
  .ai-prompt::-webkit-scrollbar-track,
  .ai-response::-webkit-scrollbar-track,
  .inspector-code::-webkit-scrollbar-track,
  .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(9, 20, 39, 0.46);
    border-radius: 999px;
  }

  #terajs-devtools-root::-webkit-scrollbar-thumb,
  .devtools-panel::-webkit-scrollbar-thumb,
  .devtools-tabs::-webkit-scrollbar-thumb,
  .components-screen-body::-webkit-scrollbar-thumb,
  .stack-list::-webkit-scrollbar-thumb,
  .signals-list::-webkit-scrollbar-thumb,
  .ai-prompt::-webkit-scrollbar-thumb,
  .ai-response::-webkit-scrollbar-thumb,
  .inspector-code::-webkit-scrollbar-thumb,
  .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(55, 139, 255, 0.88), rgba(50, 215, 255, 0.76));
    border-radius: 999px;
    border: 2px solid rgba(9, 20, 39, 0.46);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-track,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-track {
    background: rgba(206, 220, 243, 0.88);
  }

  #terajs-devtools-root[data-theme="light"]::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-panel::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .devtools-tabs::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .components-screen-body::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .stack-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .signals-list::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-prompt::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .ai-response::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .inspector-code::-webkit-scrollbar-thumb,
  #terajs-devtools-root[data-theme="light"] .runtime-history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(64, 126, 213, 0.9), rgba(39, 174, 217, 0.86));
    border-color: rgba(206, 220, 243, 0.88);
  }
`;
