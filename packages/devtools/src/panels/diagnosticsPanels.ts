import { computePerformanceMetrics, computeRouterMetrics } from "../analytics.js";
import { computeSanityMetrics, DEFAULT_SANITY_THRESHOLDS } from "../sanity.js";
import { getDebugListenerCount } from "@terajs/shared";
import {
  collectRouteIssues,
  collectRouteSnapshot,
  collectRouteTimeline,
  queueEventSummary,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { escapeHtml, shortJson } from "../inspector/shared.js";
import { renderMetricCard, renderPageSection, renderPageShell } from "./layout.js";

type OverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type OverlaySize = "normal" | "large";

interface SettingsStateLike {
  overlayPosition: OverlayPosition;
  overlayPanelSize: OverlaySize;
  persistOverlayPreferences: boolean;
}

interface AIDiagnosticsStateLike {
  aiStatus: "idle" | "loading" | "ready" | "error";
  aiLikelyCause: string | null;
  aiResponse: string | null;
  aiError: string | null;
  aiPrompt: string | null;
}

export function renderRouterPanel(events: DevtoolsEventLike[]): string {
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

export function renderPerformancePanel(events: DevtoolsEventLike[]): string {
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

export function renderQueuePanel(events: DevtoolsEventLike[]): string {
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

export function renderSanityPanel(events: DevtoolsEventLike[]): string {
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

export function renderSettingsPanel(state: SettingsStateLike): string {
  const positionChoices: Array<{ value: OverlayPosition; label: string }> = [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "center", label: "Center" }
  ];

  const panelSizes: Array<{ value: OverlaySize; label: string }> = [
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

export function renderAIDiagnosticsPanel(state: AIDiagnosticsStateLike): string {
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
