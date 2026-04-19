import { collectRecentCodeReferences, formatAICodeReferenceLocation } from "../aiDebugContext.js";
import {
  formatAIAssistantCodeReferenceLocation,
  type AIAssistantCodeReference,
  type AIAssistantStructuredResponse
} from "../aiHelpers.js";
import { analyzeSafeDocumentContext, type SafeDocumentContext, type SafeDocumentDiagnostic } from "../documentContext.js";
import {
  collectMetaEntries,
  collectSignalRegistrySnapshot,
  type DevtoolsEventLike
} from "../inspector/dataCollectors.js";
import { escapeHtml } from "../inspector/shared.js";
import { getExtensionAIAssistantBridge, resolveExtensionAIAssistantTimeoutMs } from "../providers/extensionBridge.js";
import {
  collectAIAssistantTelemetry,
  collectAIPromptInputs,
  DEFAULT_AI_DIAGNOSTICS_SECTION,
  formatAIAssistantFallbackPath,
  formatAIAssistantOutcome,
  formatAIAssistantProvider,
  hasInspectableAIValue,
  resolveAIProviderDetails,
  type AIDiagnosticsSectionKey,
  type AIDiagnosticsStateLike
} from "./aiDiagnosticsModel.js";

export { DEFAULT_AI_DIAGNOSTICS_SECTION, type AIDiagnosticsSectionKey } from "./aiDiagnosticsModel.js";

function renderAIKeyValueList(rows: Array<{ key: string; value: string }>): string {
  return `
    <div class="inspector-keyvalue-list">
      ${rows.map((row) => `
        <div class="inspector-keyvalue-row">
          <div class="inspector-keyvalue-key">${escapeHtml(row.key)}</div>
          <div class="inspector-keyvalue-value">${escapeHtml(row.value)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStructuredAIAssistantList(
  title: string,
  items: string[],
  label: string,
  tone: "issue-error" | "issue-warn" | ""
): string {
  if (items.length === 0) {
    return "";
  }

  return `
    <div class="ai-diagnostics-section-block">
      <div class="panel-title is-blue">${escapeHtml(title)}</div>
      <ul class="stack-list compact-list">
        ${items.map((item) => `
          <li class="stack-item ${tone}">
            <span class="item-label">[${escapeHtml(label)}]</span>
            <span>${escapeHtml(item)}</span>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderStructuredAIAssistantCodeReferences(references: AIAssistantCodeReference[]): string {
  if (references.length === 0) {
    return "";
  }

  return `
    <div class="ai-diagnostics-section-block">
      <div class="panel-title is-purple">AI code references</div>
      <ul class="stack-list compact-list">
        ${references.map((reference) => `
          <li class="stack-item issue-warn">
            <span class="item-label">[FILE]</span>
            <span class="accent-text is-cyan">${escapeHtml(formatAIAssistantCodeReferenceLocation(reference))}</span>
            <span>${escapeHtml(reference.reason)}</span>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}

function renderStructuredAIAssistantResponse(
  response: AIAssistantStructuredResponse,
  fallbackText: string | null
): string {
  const normalizedFallbackText = typeof fallbackText === "string" ? fallbackText.trim() : "";
  const showFallbackText = normalizedFallbackText.length > 0 && normalizedFallbackText !== response.summary;

  return `
    <div class="ai-diagnostics-section-block">
      <div class="panel-title is-cyan">AI summary</div>
      <div>${escapeHtml(response.summary)}</div>
    </div>
    ${renderStructuredAIAssistantList("Likely causes", response.likelyCauses, "CAUSE", "issue-warn")}
    ${renderStructuredAIAssistantCodeReferences(response.codeReferences)}
    ${renderStructuredAIAssistantList("Next checks", response.nextChecks, "CHECK", "")}
    ${renderStructuredAIAssistantList("Suggested fixes", response.suggestedFixes, "FIX", "")}
    ${showFallbackText ? `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-cyan">Raw assistant text</div>
        <pre class="ai-response">${escapeHtml(normalizedFallbackText)}</pre>
      </div>
    ` : ""}
  `;
}

export function renderAIDiagnosticsPanel(state: AIDiagnosticsStateLike): string {
  const extensionBridge = getExtensionAIAssistantBridge();
  const providerDetails = resolveAIProviderDetails(state);
  const assistantTelemetry = collectAIAssistantTelemetry(state.events);
  const snapshotSignals = collectSignalRegistrySnapshot();
  const metaEntries = collectMetaEntries(state.events);
  const componentAIMetadataCount = metaEntries.filter((entry) => !entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const routeAIMetadataCount = metaEntries.filter((entry) => entry.key.startsWith("route:") && hasInspectableAIValue(entry.ai)).length;
  const mountedAIPreviewCount = Array.from(state.mountedComponents.values()).filter((entry) => typeof entry.aiPreview === "string" && entry.aiPreview.trim().length > 0).length;
  const promptInputs = collectAIPromptInputs(state);
  const promptInputErrorCount = promptInputs.filter((input) => input.severity === "error").length;
  const promptInputWarnCount = promptInputs.filter((input) => input.severity === "warn").length;
  const codeReferences = collectRecentCodeReferences(state.events, 10);
  const documentContext = state.documentContext ?? null;
  const documentDiagnostics = state.documentDiagnostics ?? analyzeSafeDocumentContext(documentContext);
  const documentWarnCount = documentDiagnostics.filter((entry) => entry.severity === "warn").length;
  const documentInfoCount = documentDiagnostics.filter((entry) => entry.severity === "info").length;
  const extensionBridgeTimeoutMs = resolveExtensionAIAssistantTimeoutMs(state.aiAssistantTimeoutMs);
  const integrationWarnings: string[] = [];
  const canQueryExtensionAssistant = state.aiAssistantEnabled && providerDetails.hasExtensionBridge;
  const canRevealExtensionSession = typeof extensionBridge?.revealSession === "function";
  const vscodeRequestPending = state.aiStatus === "loading" && state.activeAIRequestTarget === "vscode";
  const debuggingPromptStatusLabel = state.aiPrompt
    ? "Debugging prompt ready"
    : "Copy debugging prompt available";
  const extensionBridgeStatusLabel = canQueryExtensionAssistant
    ? "VS Code bridge ready"
    : "VS Code bridge not attached";
  const extensionActionLabel = vscodeRequestPending ? "Asking Copilot..." : "Ask Copilot";
  const debuggingPromptHint = canRevealExtensionSession
    ? "Ask Copilot sends the current sanitized bundle straight through the attached VS Code bridge. Open VS Code Live Session only reveals the mirrored session, and Copy Debugging Prompt gives you the same payload for manual use."
    : canQueryExtensionAssistant
    ? "Ask Copilot sends the current sanitized bundle directly through the attached extension bridge, and Copy Debugging Prompt gives you the same payload for manual use."
    : "Copy Debugging Prompt packages the current sanitized bundle so you can paste it into your own agent, ticket, or debugging chat while you attach the VS Code bridge.";
  const extensionActionHint = canRevealExtensionSession
    ? "Ask Copilot sends the current sanitized diagnostics bundle straight through the attached extension and returns the response in DevTools. Open VS Code Live Session is only for viewing the mirrored session."
    : "Ask Copilot sends the same sanitized diagnostics bundle straight through the attached extension bridge.";
  const analysisSummary = state.aiStructuredResponse
    ? "Structured response ready"
    : state.aiResponse
    ? "Response ready"
    : state.aiStatus === "loading"
    ? state.activeAIRequestTarget === "vscode"
      ? "VS Code AI running"
      : "Running"
    : state.aiPrompt
    ? "Prompt ready"
    : canQueryExtensionAssistant || canRevealExtensionSession
    ? "Ready to sync"
    : "Prompt-first";

  let assistantOutputMarkup = "";
  if (state.aiStatus === "loading") {
    assistantOutputMarkup = `<div class="empty-state">${escapeHtml(
      state.activeAIRequestTarget === "vscode"
        ? "Waiting for the attached VS Code bridge to respond with the current sanitized diagnostics bundle..."
        : "Running the selected assistant with the current sanitized diagnostics bundle..."
    )}</div>`;
  } else if (state.aiError) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-red">Assistant request failed</div>
        <div class="stack-item issue-error">
          <span class="item-label">[ERROR]</span>
          <span>${escapeHtml(state.aiError)}</span>
        </div>
      </div>
    `;
  } else if (state.aiStructuredResponse) {
    assistantOutputMarkup = renderStructuredAIAssistantResponse(state.aiStructuredResponse, state.aiResponse);
  } else if (state.aiResponse) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-cyan">Assistant response</div>
        <pre class="ai-response">${escapeHtml(state.aiResponse)}</pre>
      </div>
    `;
  } else if (state.aiPrompt) {
    assistantOutputMarkup = `
      <div class="ai-diagnostics-section-block">
        <div class="panel-title is-cyan">Debugging prompt ready</div>
        <div class="muted-text">${escapeHtml(canQueryExtensionAssistant ? "The current session bundle is ready to send to the attached Copilot bridge or to copy for manual use." : "The current session bundle is ready to copy into your own agent or debugging chat.")}</div>
      </div>
    `;
  } else {
    assistantOutputMarkup = `
      <div class="empty-state">${escapeHtml(canQueryExtensionAssistant ? "Ask Copilot or copy the debugging prompt to capture the active runtime state." : "Copy the debugging prompt to package the current runtime evidence for an external assistant.")}</div>
    `;
  }

  if (!state.aiAssistantEnabled) {
    integrationWarnings.push("Assistant execution is disabled in the DevTools overlay options.");
  } else if (!providerDetails.hasExtensionBridge) {
    integrationWarnings.push("VS Code bridge is not attached. Copy Debugging Prompt still packages the current sanitized bundle while you reconnect the live receiver.");
  }

  if (componentAIMetadataCount === 0 && routeAIMetadataCount === 0 && mountedAIPreviewCount === 0) {
    integrationWarnings.push("No component or route AI metadata is currently visible in the mounted app state.");
  }

  if (!documentContext || (documentContext.metaTags.length === 0 && documentContext.linkTags.length === 0 && !documentContext.title)) {
    integrationWarnings.push("No safe document head context is currently available, so AI triage will lean more heavily on route and signal diagnostics.");
  }

  const navItems: Array<{
    key: AIDiagnosticsSectionKey;
    title: string;
    summary: string;
    description: string;
  }> = [
    {
      key: "analysis-output",
      title: "Analysis Output",
      summary: analysisSummary,
      description: "Open the mirrored VS Code session, run the bridge-backed assistant, or copy the current debugging prompt."
    },
    {
      key: "session-mode",
      title: "Session Mode",
      summary: providerDetails.label,
      description: "Provider state, integration coverage, and why this session is provider-backed or prompt-first."
    },
    {
      key: "prompt-inputs",
      title: "Prompt Inputs",
      summary: `${promptInputs.length} items`,
      description: "The runtime warnings, likely causes, and document diagnostics included in the next analysis run."
    },
    {
      key: "code-references",
      title: "Code References",
      summary: `${codeReferences.length} refs`,
      description: "Recent issue-linked source locations that AI and IDE tools can use to jump straight to likely implementation files."
    },
    {
      key: "provider-telemetry",
      title: "Provider Telemetry",
      summary: `${assistantTelemetry.requestCount} requests`,
      description: "Request counts, last provider path, delivery mode, and the most recent assistant outcome."
    },
    {
      key: "metadata-checks",
      title: "Metadata Checks",
      summary: `${documentWarnCount} warn / ${documentInfoCount} info`,
      description: "Document-head diagnostics derived from the safe metadata snapshot for the current page."
    },
    {
      key: "document-context",
      title: "Document Context",
      summary: `${documentContext?.metaTags.length ?? 0} meta / ${documentContext?.linkTags.length ?? 0} links`,
      description: "The safe head-only context exported into the AI bundle, including allowlisted meta tags and links."
    }
  ];

  const activeSection = navItems.some((item) => item.key === state.activeAIDiagnosticsSection)
    ? state.activeAIDiagnosticsSection
    : DEFAULT_AI_DIAGNOSTICS_SECTION;
  const activeNavItem = navItems.find((item) => item.key === activeSection) ?? navItems[0];

  let detailMarkup = "";

  switch (activeSection) {
    case "session-mode": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Session mode</div>
          ${renderAIKeyValueList([
            { key: "Provider mode:", value: providerDetails.label },
            { key: "Snapshot signals:", value: String(snapshotSignals.length) },
            { key: "AI metadata:", value: String(componentAIMetadataCount + routeAIMetadataCount) },
            { key: "Prompt inputs:", value: String(promptInputs.length) },
            { key: "VS Code bridge:", value: providerDetails.hasExtensionBridge ? "Attached" : "Not attached" },
            { key: "Built-in model:", value: providerDetails.builtInModel },
            { key: "Current insight:", value: state.aiLikelyCause ?? "No reactive error detected yet." },
            { key: "Active path:", value: providerDetails.activePath },
            { key: "Model:", value: state.aiAssistantModel },
            { key: "Timeout:", value: providerDetails.hasExtensionBridge ? `${state.aiAssistantTimeoutMs}ms (${extensionBridgeTimeoutMs}ms for VS Code bridge)` : `${state.aiAssistantTimeoutMs}ms` },
            { key: "How it works:", value: providerDetails.hasExtensionBridge ? "DevTools assembles keyed signal snapshots, sanity metrics, recent issue events, and safe document head context into one diagnostics bundle, then mirrors that sanitized session live into the attached VS Code bridge." : "DevTools assembles keyed signal snapshots, sanity metrics, recent issue events, and safe document head context into one diagnostics bundle." }
          ])}
          <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Integration coverage</div>
          ${renderAIKeyValueList([
            { key: "Mounted AI previews:", value: String(mountedAIPreviewCount) },
            { key: "Component AI metadata:", value: String(componentAIMetadataCount) },
            { key: "Route AI metadata:", value: String(routeAIMetadataCount) },
            { key: "Prompt ready:", value: state.aiPrompt ? "Yes" : "No" }
          ])}
          ${integrationWarnings.length === 0 ? `<div class="empty-state">AI-aware metadata is visible and the panel is ready to help triage integration issues.</div>` : `
            <ul class="stack-list compact-list">
              ${integrationWarnings.map((warning) => `
                <li class="stack-item issue-warn">
                  <span class="item-label">[CHECK]</span>
                  <span>${escapeHtml(warning)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "prompt-inputs": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Evidence included in prompt</div>
          ${renderAIKeyValueList([
            { key: "Prompt inputs:", value: String(promptInputs.length) },
            { key: "Error inputs:", value: String(promptInputErrorCount) },
            { key: "Warning inputs:", value: String(promptInputWarnCount) },
            { key: "Document inputs:", value: String((state.documentDiagnostics ?? []).length) }
          ])}
          ${promptInputs.length === 0 ? `<div class="empty-state">No recent errors, warnings, or likely-cause hints are queued for AI triage yet.</div>` : `
            <ul class="stack-list log-list">
              ${promptInputs.map((input) => `
                <li class="stack-item ${input.severity === "error" ? "issue-error" : input.severity === "warn" ? "issue-warn" : ""}">
                  <span class="item-label">[${escapeHtml(input.label)}]</span>
                  <span>${escapeHtml(input.summary)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "code-references": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Source locations exported to AI and IDE tools</div>
          ${renderAIKeyValueList([
            { key: "Code references:", value: String(codeReferences.length) },
            { key: "How to use:", value: "Use these files and lines to jump directly into likely failure points from VS Code or the AI assistant." }
          ])}
          ${codeReferences.length === 0 ? `<div class="empty-state">No recent issue events are carrying source locations yet.</div>` : `
            <ul class="stack-list compact-list">
              ${codeReferences.map((reference) => `
                <li class="stack-item ${reference.level === "error" ? "issue-error" : "issue-warn"}">
                  <span class="item-label">[${escapeHtml(reference.level.toUpperCase())}]</span>
                  <span class="accent-text is-cyan">${escapeHtml(formatAICodeReferenceLocation(reference))}</span>
                  <span>${escapeHtml(reference.summary)}</span>
                  <span class="muted-text">${escapeHtml(reference.eventType)}</span>
                </li>
              `).join("")}
            </ul>
          `}
        </div>
      `;
      break;
    }

    case "provider-telemetry": {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Request path</div>
          ${renderAIKeyValueList([
            { key: "Requests:", value: String(assistantTelemetry.requestCount) },
            { key: "Successes:", value: String(assistantTelemetry.successCount) },
            { key: "Failures:", value: String(assistantTelemetry.errorCount) },
            { key: "Skipped:", value: String(assistantTelemetry.skippedCount) },
            ...(assistantTelemetry.lastRequest ? [
              { key: "Last provider:", value: formatAIAssistantProvider(assistantTelemetry.lastRequest.provider) },
              { key: "Delivery mode:", value: assistantTelemetry.lastRequest.delivery },
              { key: "Fallback path:", value: formatAIAssistantFallbackPath(assistantTelemetry.lastRequest.fallbackPath) },
              { key: "Prompt chars:", value: String(assistantTelemetry.lastRequest.promptChars ?? 0) },
              { key: "Snapshot signals:", value: String(assistantTelemetry.lastRequest.signalCount ?? 0) },
              { key: "Recent events:", value: String(assistantTelemetry.lastRequest.recentEventCount ?? 0) }
            ] : [])
          ])}
          ${assistantTelemetry.lastRequest ? "" : `<div class="empty-state">No provider-backed assistant request has run yet.</div>`}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-blue">Last outcome</div>
          ${assistantTelemetry.lastOutcome ? renderAIKeyValueList([
            { key: "Last outcome:", value: formatAIAssistantOutcome(assistantTelemetry.lastOutcome) },
            { key: "Last latency:", value: assistantTelemetry.lastOutcome.durationMs === null ? "n/a" : `${assistantTelemetry.lastOutcome.durationMs}ms` },
            { key: "HTTP status:", value: assistantTelemetry.lastOutcome.statusCode === null ? "n/a" : String(assistantTelemetry.lastOutcome.statusCode) },
            { key: "Last message:", value: assistantTelemetry.lastOutcome.message ?? "none" }
          ]) : `<div class="empty-state">No assistant outcome has been recorded yet.</div>`}
        </div>
      `;
      break;
    }

    case "metadata-checks": {
      detailMarkup = documentDiagnostics.length === 0 ? `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: "0" },
            { key: "Info:", value: "0" },
            { key: "Description:", value: "OK" },
            { key: "Canonical:", value: "OK" }
          ])}
          <div class="empty-state">Safe document head checks look healthy for the current page.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Warnings:", value: String(documentWarnCount) },
            { key: "Info:", value: String(documentInfoCount) },
            { key: "Meta tags:", value: String(documentContext?.metaTags.length ?? 0) },
            { key: "Head links:", value: String(documentContext?.linkTags.length ?? 0) }
          ])}
          <div class="panel-title is-purple">Metadata checks</div>
          <ul class="stack-list compact-list">
            ${documentDiagnostics.map((diagnostic) => `
              <li class="stack-item ${diagnostic.severity === "warn" ? "issue-warn" : ""}">
                <span class="item-label">[${escapeHtml(diagnostic.severity.toUpperCase())}]</span>
                <span class="accent-text is-purple">${escapeHtml(diagnostic.message)}</span>
                ${diagnostic.detail ? `<span>${escapeHtml(diagnostic.detail)}</span>` : ""}
              </li>
            `).join("")}
          </ul>
        </div>
      `;
      break;
    }

    case "document-context": {
      detailMarkup = !documentContext ? `
        <div class="ai-diagnostics-section-block">
          <div class="empty-state">No safe document head context captured yet.</div>
        </div>
      ` : `
        <div class="ai-diagnostics-section-block">
          ${renderAIKeyValueList([
            { key: "Title present:", value: documentContext.title ? "Yes" : "No" },
            { key: "Meta tags:", value: String(documentContext.metaTags.length) },
            { key: "Head links:", value: String(documentContext.linkTags.length) },
            { key: "Query keys:", value: String(documentContext.queryKeys.length) },
            { key: "Title:", value: documentContext.title || "Untitled document" },
            { key: "Path:", value: documentContext.path },
            { key: "Language:", value: documentContext.lang ?? "not set" },
            { key: "Text direction:", value: documentContext.dir ?? "not set" },
            { key: "Hash:", value: documentContext.hash ?? "none" },
            { key: "Query keys:", value: documentContext.queryKeys.length === 0 ? "none" : documentContext.queryKeys.join(", ") }
          ])}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Allowlisted meta tags</div>
          ${documentContext.metaTags.length === 0
            ? `<div class="empty-state">No allowlisted head meta tags were captured.</div>`
            : `<ul class="stack-list compact-list">${documentContext.metaTags.map((tag) => `
                <li class="stack-item performance-item">
                  <span class="accent-text is-purple">${escapeHtml(tag.key)}</span>
                  <span class="muted-text">${escapeHtml(tag.source)}</span>
                  <span>${escapeHtml(tag.value)}</span>
                </li>
              `).join("")}</ul>`}
        </div>
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Allowlisted head links</div>
          ${documentContext.linkTags.length === 0
            ? `<div class="empty-state">No allowlisted head links were captured.</div>`
            : `<ul class="stack-list compact-list">${documentContext.linkTags.map((tag) => `
                <li class="stack-item performance-item">
                  <span class="accent-text is-purple">${escapeHtml(tag.rel)}</span>
                  <span class="muted-text">${escapeHtml(tag.sameOrigin ? "same-origin" : "cross-origin")}</span>
                  <span>${escapeHtml(tag.href)}</span>
                </li>
              `).join("")}</ul>`}
        </div>
      `;
      break;
    }

    case "analysis-output":
    default: {
      detailMarkup = `
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-cyan">Run analysis</div>
          <div class="ai-connection-row">
            <span class="ai-connection-pill ${state.aiPrompt ? "is-ready" : "is-idle"}">${escapeHtml(debuggingPromptStatusLabel)}</span>
            <span class="ai-connection-pill ${canQueryExtensionAssistant ? "is-ready" : "is-idle"}">${escapeHtml(extensionBridgeStatusLabel)}</span>
          </div>
          <div class="button-row">
            ${canRevealExtensionSession ? `<button class="toolbar-button" data-action="open-vscode-session" type="button">Open VS Code Live Session</button>` : ""}
            ${canQueryExtensionAssistant ? `<button class="toolbar-button ${vscodeRequestPending ? "is-loading" : ""}" data-action="ask-vscode-ai" type="button" ${state.aiStatus === "loading" ? "disabled" : ""} ${vscodeRequestPending ? 'aria-busy="true"' : ""}>${escapeHtml(extensionActionLabel)}</button>` : ""}
            <button class="toolbar-button" data-action="copy-debugging-prompt" type="button">Copy Debugging Prompt</button>
          </div>
          <div class="muted-text ai-hint">${escapeHtml(debuggingPromptHint)}</div>
          ${canQueryExtensionAssistant ? `<div class="muted-text ai-hint">${escapeHtml(vscodeRequestPending ? "The attached extension is thinking through the current sanitized diagnostics bundle now." : extensionActionHint)}</div>` : ""}
          <div class="muted-text ai-hint">${escapeHtml(providerDetails.detail)}</div>
        </div>
        ${assistantOutputMarkup}
        <div class="ai-diagnostics-section-block">
          <div class="panel-title is-purple">Debugging prompt payload</div>
          ${state.aiPrompt
            ? `<pre class="ai-prompt">${escapeHtml(state.aiPrompt)}</pre>`
            : `<div class="empty-state">Use Copy Debugging Prompt or Ask Copilot to assemble the current diagnostics bundle.</div>`}
        </div>
      `;
      break;
    }
  }

  return `
    <div class="ai-diagnostics-layout">
      <aside class="components-tree-pane ai-diagnostics-nav-pane" aria-label="AI diagnostics sections">
        <div class="components-screen-body">
          <div class="ai-diagnostics-nav-list">
            ${navItems.map((item) => `
              <button
                class="ai-diagnostics-nav-button ${activeSection === item.key ? "is-active" : ""}"
                data-ai-section="${item.key}"
                type="button"
              >
                <span class="ai-diagnostics-nav-title">${escapeHtml(item.title)}</span>
                <span class="ai-diagnostics-nav-summary">${escapeHtml(item.summary)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </aside>

      <section
        class="components-inspector-pane ai-diagnostics-detail-pane"
        aria-label="AI diagnostics detail"
        data-ai-active-section="${activeSection}"
      >
        <div class="components-screen-header">
          <div class="components-screen-header-row">
            <div>
              <div class="panel-title is-cyan">${escapeHtml(activeNavItem.title)}</div>
              <div class="panel-subtitle">${escapeHtml(activeNavItem.description)}</div>
            </div>
          </div>
        </div>
        <div class="components-screen-body">
          <div class="ai-diagnostics-detail-stack">
            ${detailMarkup}
          </div>
        </div>
      </section>
    </div>
  `;
}