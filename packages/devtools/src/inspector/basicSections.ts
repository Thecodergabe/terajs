import { escapeHtml, matchesInspectorQuery } from "./shared.js";
import { renderValueExplorer } from "./valueExplorer.js";

export interface InspectorSelectedComponent {
  scope: string;
  instance: number;
}

export interface InspectorDrilldownSnapshot {
  mounts: number;
  updates: number;
  unmounts: number;
  errors: number;
  reactiveState: Array<{ key: string; preview: string }>;
  routeSnapshot?: unknown;
  metaSnapshot?: unknown;
  domPreview: string[];
  recent: Array<{ type: string; summary: string }>;
}

export function renderInspectorOverviewPanel(
  selected: InspectorSelectedComponent,
  drilldown: InspectorDrilldownSnapshot,
  query: string
): string {
  const identitySource = {
    scope: selected.scope,
    instance: selected.instance,
    mounts: drilldown.mounts,
    updates: drilldown.updates,
    unmounts: drilldown.unmounts,
    reactiveKeys: drilldown.reactiveState.length,
    errors: drilldown.errors
  };

  if (query.length > 0 && !matchesInspectorQuery(query, "identity", identitySource)) {
    return "";
  }

  return `
    <div class="inspector-keyvalue-list">
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">scope</span><span class="inspector-keyvalue-value">${escapeHtml(selected.scope)}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">instance</span><span class="inspector-keyvalue-value">${selected.instance}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">mounts</span><span class="inspector-keyvalue-value">${drilldown.mounts}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">updates</span><span class="inspector-keyvalue-value">${drilldown.updates}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">unmounts</span><span class="inspector-keyvalue-value">${drilldown.unmounts}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">reactive keys</span><span class="inspector-keyvalue-value">${drilldown.reactiveState.length}</span></div>
      <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">errors</span><span class="inspector-keyvalue-value">${drilldown.errors}</span></div>
    </div>
  `;
}

export function renderInspectorRoutePanel(
  drilldown: InspectorDrilldownSnapshot,
  query: string,
  expandedValuePaths: Set<string>
): string {
  const routeSnapshot = drilldown.routeSnapshot ?? {};
  if (query.length > 0 && !matchesInspectorQuery(query, "routing", routeSnapshot)) {
    return "";
  }

  return renderValueExplorer(routeSnapshot, "route", expandedValuePaths);
}

export function renderInspectorMetaPanel(
  drilldown: InspectorDrilldownSnapshot,
  query: string,
  expandedValuePaths: Set<string>
): string {
  const metaSnapshot = drilldown.metaSnapshot ?? {};
  if (query.length > 0 && !matchesInspectorQuery(query, "meta", metaSnapshot)) {
    return "";
  }

  return renderValueExplorer(metaSnapshot, "meta", expandedValuePaths);
}

export function renderInspectorDomPanel(drilldown: InspectorDrilldownSnapshot, query: string): string {
  const visibleDomPreview = query.length === 0
    ? drilldown.domPreview
    : drilldown.domPreview.filter((line) => line.toLowerCase().includes(query));

  return visibleDomPreview.length === 0
    ? `<div class="empty-state">${query.length > 0 ? "No DOM snapshot lines match the current filter." : "No DOM snapshot available for this component yet."}</div>`
    : `<pre class="inspector-code">${escapeHtml(visibleDomPreview.join("\n"))}</pre>`;
}

export function renderInspectorActivityPanel(drilldown: InspectorDrilldownSnapshot, query: string): string {
  const visibleRecent = query.length === 0
    ? drilldown.recent
    : drilldown.recent.filter((entry) => matchesInspectorQuery(query, entry.type, entry.summary));

  return visibleRecent.length === 0
    ? `<div class="empty-state">${query.length > 0 ? "No activity entries match the current filter." : "No component-specific events captured yet."}</div>`
    : `
      <ul class="stack-list activity-feed">
        ${visibleRecent.map((entry) => `
          <li class="stack-item">
            <span class="item-label">[${escapeHtml(entry.type)}]</span>
            <span>${escapeHtml(entry.summary)}</span>
          </li>
        `).join("")}
      </ul>
    `;
}
