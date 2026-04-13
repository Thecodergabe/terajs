import { getReactiveByRid } from "@terajs/shared";

export interface RuntimeMonitorEvent {
  type: string;
  payload?: Record<string, unknown>;
}

export interface RuntimeMonitorIdentity {
  scope: string;
  instance: number;
}

type RuntimeMonitorKind = "computed" | "watch" | "watchEffect" | "effect";

interface RuntimeMonitorInspectorEntry {
  id: string;
  name: string;
  kind: RuntimeMonitorKind;
  latestEventType: string;
  latestSummary: string;
  scoped: boolean;
  updates: number;
  latestValue?: string;
  latestValueType?: string;
  history: string[];
}

export interface RuntimeMonitorRenderUtils {
  buildComponentKey(scope: string, instance: number): string;
  readComponentIdentity(event: RuntimeMonitorEvent): RuntimeMonitorIdentity | null;
  matchesInspectorQuery(query: string, ...values: unknown[]): boolean;
  readUnknown(record: Record<string, unknown> | undefined, key: string): unknown;
  readString(record: Record<string, unknown> | undefined, key: string): string | undefined;
  readNumber(record: Record<string, unknown> | undefined, key: string): number | undefined;
  shortJson(value: unknown): string;
  safeString(value: unknown): string;
  escapeHtml(value: string): string;
  describeValueType(value: unknown): string;
}

export function renderInspectorRuntimeMonitor(
  events: RuntimeMonitorEvent[],
  scope: string,
  instance: number,
  query: string,
  utils: RuntimeMonitorRenderUtils
): string {
  const componentKey = utils.buildComponentKey(scope, instance);
  const aggregates = new Map<string, RuntimeMonitorInspectorEntry>();

  for (const event of events) {
    const payload = event.payload ?? {};
    const isComputedEvent = event.type.startsWith("computed:");
    const isEffectEvent = event.type.startsWith("effect:");
    const isWatchEvent = event.type.startsWith("watch:") || event.type.startsWith("watchEffect:");

    if (!isComputedEvent && !isEffectEvent && !isWatchEvent) {
      continue;
    }

    const scoped = eventTouchesComponentRuntime(event, scope, instance, componentKey, utils);
    const kind = runtimeMonitorKindFromType(event.type);

    const rid = isComputedEvent
      ? readRuntimeMonitorRid(payload, utils) ?? readEffectRidFromPayload(payload, utils) ?? event.type
      : readRuntimeMonitorRid(payload, utils) ?? readEffectRidFromPayload(payload, utils);

    const rawName = isComputedEvent
      ? deriveRuntimeComputedName(rid ?? "computed")
      : deriveRuntimeEventName(event, kind, utils);
    const name = sanitizeRuntimeMonitorName(rawName, kind);

    const id = buildRuntimeMonitorEntryId(kind, rid, name);
    let entry = aggregates.get(id);
    if (!entry) {
      entry = {
        id,
        name,
        kind,
        latestEventType: event.type,
        latestSummary: "",
        scoped,
        updates: 0,
        latestValue: undefined,
        latestValueType: undefined,
        history: []
      };
      aggregates.set(id, entry);
    }

    entry.name = name;
    entry.latestEventType = event.type;
    entry.scoped = entry.scoped || scoped;
    entry.updates += 1;

    const latestValue = readRuntimeLatestValue(event, rid, utils);
    if (latestValue.value !== undefined) {
      entry.latestValue = latestValue.value;
    }

    if (latestValue.valueType !== undefined) {
      entry.latestValueType = latestValue.valueType;
    }

    const historyEntry = summarizeRuntimeHistoryEntry(event, latestValue.value, utils);
    pushRuntimeHistory(entry.history, historyEntry);
    entry.latestSummary = historyEntry;
  }

  const rows = Array.from(aggregates.values());
  const componentRows = rows.some((entry) => entry.scoped)
    ? rows.filter((entry) => entry.scoped)
    : rows;

  const visibleRows = componentRows
    .filter((entry) => query.length === 0 || utils.matchesInspectorQuery(
      query,
      entry.name,
      formatRuntimeMonitorKind(entry.kind),
      formatRuntimeMonitorKindLabel(entry.kind),
      formatRuntimeMonitorDisplayLabel(entry),
      formatRuntimeMonitorReturnType(entry),
      entry.latestSummary,
      entry.latestValue,
      entry.latestEventType,
      entry.history.join(" ")
    ))
    .sort((left, right) => Number(right.scoped) - Number(left.scoped) || right.updates - left.updates || left.name.localeCompare(right.name))
    .slice(0, 12);

  if (visibleRows.length === 0) {
    return "";
  }

  return `
    <div class="inspector-control-list">
      ${visibleRows.map((entry) => renderRuntimeMonitorInspectorEntry(entry, utils)).join("")}
    </div>
  `;
}

function renderRuntimeMonitorInspectorEntry(
  entry: RuntimeMonitorInspectorEntry,
  utils: RuntimeMonitorRenderUtils
): string {
  const typeLabel = formatRuntimeMonitorReturnType(entry);
  const latestValueRow = `<div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">current value</span><span class="inspector-keyvalue-value">${utils.escapeHtml(entry.latestValue ?? "(not reported)")}</span></div>`;
  const historyRows = entry.history
    .slice()
    .reverse()
    .map((item, index) => `
      <li class="runtime-history-item">
        <span class="runtime-history-badge">${String(index + 1).padStart(2, "0")}</span>
        <span class="runtime-history-text">${utils.escapeHtml(item)}</span>
      </li>
    `)
    .join("");
  const historyMarkup = `
    <section class="runtime-history-panel" aria-label="Recent runtime history">
      <div class="runtime-history-header">
        <div class="runtime-history-heading">
          <span class="runtime-history-title">history</span>
          <span class="runtime-history-caption">Most recent first. Older entries stay available inside the scroll area.</span>
        </div>
        <span class="runtime-history-count">${entry.history.length} entries</span>
      </div>
      ${entry.history.length === 0
        ? `<div class="runtime-history-empty">No history captured yet.</div>`
        : `
          <div class="runtime-history-scroll">
            <ol class="runtime-history-list">
              ${historyRows}
            </ol>
          </div>
        `}
    </section>
  `;

  return `
    <details class="inspector-dropdown">
      <summary class="inspector-dropdown-summary">
        <span class="inspector-dropdown-label">
          <span class="inspector-dropdown-origin">${utils.escapeHtml(formatRuntimeMonitorKindLabel(entry.kind))}</span>
          <span class="inspector-dropdown-key">${utils.escapeHtml(entry.name)}</span>
          <span class="inspector-dropdown-type">: ${utils.escapeHtml(typeLabel)}</span>
        </span>
      </summary>
      <div class="inspector-dropdown-body">
        <div class="inspector-keyvalue-list">
          <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">last activity</span><span class="inspector-keyvalue-value">${utils.escapeHtml(humanizeRuntimeMonitorEventType(entry.latestEventType))}</span></div>
          <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">scope</span><span class="inspector-keyvalue-value">${entry.scoped ? "scoped" : "global"}</span></div>
          <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">summary</span><span class="inspector-keyvalue-value">${utils.escapeHtml(entry.latestSummary || humanizeRuntimeMonitorEventType(entry.latestEventType))}</span></div>
          <div class="inspector-keyvalue-row"><span class="inspector-keyvalue-key">updates</span><span class="inspector-keyvalue-value">${entry.updates}</span></div>
          ${latestValueRow}
        </div>
        ${historyMarkup}
      </div>
    </details>
  `;
}

function pushRuntimeHistory(history: string[], item: string): void {
  const normalized = item.trim();
  if (!normalized) {
    return;
  }

  if (history[history.length - 1] === normalized) {
    return;
  }

  history.push(normalized);
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
}

function readRuntimeLatestValue(
  event: RuntimeMonitorEvent,
  rid: string | undefined,
  utils: RuntimeMonitorRenderUtils
): {
  value?: string;
  valueType?: string;
} {
  const payload = event.payload ?? {};
  const direct =
    utils.readUnknown(payload, "newValue") ??
    utils.readUnknown(payload, "next") ??
    utils.readUnknown(payload, "value");

  if (direct !== undefined) {
    return {
      value: utils.shortJson(direct),
      valueType: utils.describeValueType(direct)
    };
  }

  if (event.type.startsWith("computed:")) {
    const current = rid ? getReactiveByRid(rid)?.currentValue : undefined;
    if (current !== undefined) {
      return {
        value: utils.shortJson(current),
        valueType: utils.describeValueType(current)
      };
    }
  }

  return {};
}

function summarizeRuntimeHistoryEntry(
  event: RuntimeMonitorEvent,
  latestValue: string | undefined,
  utils: RuntimeMonitorRenderUtils
): string {
  const detail = describeRuntimeMonitorEvent(event, utils);
  if (detail.length > 0) {
    return detail;
  }

  if (latestValue !== undefined && event.type === "computed:recomputed") {
    return `recomputed ${latestValue}`;
  }

  if (latestValue !== undefined && event.type === "watch:source") {
    return `source ${latestValue}`;
  }

  return humanizeRuntimeMonitorEventType(event.type);
}

function runtimeMonitorKindFromType(type: string): RuntimeMonitorKind {
  if (type.startsWith("watchEffect:")) {
    return "watchEffect";
  }

  if (type.startsWith("watch:")) {
    return "watch";
  }

  if (type.startsWith("computed:")) {
    return "computed";
  }

  return "effect";
}

function formatRuntimeMonitorKind(kind: RuntimeMonitorKind): string {
  if (kind === "watchEffect") {
    return "watchEffect";
  }

  return kind;
}

function formatRuntimeMonitorKindLabel(kind: RuntimeMonitorKind): string {
  if (kind === "watchEffect") {
    return "watch effect";
  }

  return kind;
}

function formatRuntimeMonitorDisplayLabel(entry: RuntimeMonitorInspectorEntry): string {
  return `${formatRuntimeMonitorKindLabel(entry.kind)} ${entry.name}`;
}

function formatRuntimeMonitorReturnType(entry: RuntimeMonitorInspectorEntry): string {
  if (entry.latestValueType && entry.latestValueType.length > 0) {
    return entry.latestValueType;
  }

  if (entry.kind === "effect") {
    return "void";
  }

  return "unknown";
}

function sanitizeRuntimeMonitorName(name: string, kind: RuntimeMonitorKind): string {
  if (!isInternalRuntimeIdentifier(name, kind)) {
    return name;
  }

  return formatRuntimeMonitorKind(kind);
}

function buildRuntimeMonitorEntryId(kind: RuntimeMonitorKind, rid: string | undefined, name: string): string {
  if (rid) {
    const simplified = simplifyRuntimeRid(rid, name);
    if (!isInternalRuntimeIdentifier(simplified, kind)) {
      return `${kind}:${rid}`;
    }
  }

  return `${kind}:${name}`;
}

function isInternalRuntimeIdentifier(value: string, kind: RuntimeMonitorKind): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  const compact = normalized.replace(/\s+/g, "");
  const normalizedKind = formatRuntimeMonitorKind(kind).toLowerCase();
  if (compact === normalizedKind) {
    return true;
  }

  return /^(effect|watch|watcheffect|computed)([#:_-]?\d+)?$/.test(compact);
}

function deriveRuntimeComputedName(rid: string): string {
  const info = getReactiveByRid(rid);
  const keyedName = info?.meta.key;
  if (typeof keyedName === "string" && keyedName.trim().length > 0) {
    return normalizeRuntimeName(keyedName, "computed");
  }

  const simplified = normalizeRuntimeName(simplifyRuntimeRid(rid, "computed"), "computed");
  return isInternalRuntimeIdentifier(simplified, "computed") ? "computed" : simplified;
}

function deriveRuntimeEventName(
  event: RuntimeMonitorEvent,
  kind: RuntimeMonitorKind,
  utils: RuntimeMonitorRenderUtils
): string {
  const payload = event.payload ?? {};
  const rid = readRuntimeMonitorRid(payload, utils) ?? readEffectRidFromPayload(payload, utils);
  const fallback = formatRuntimeMonitorKind(kind);
  const ridName = rid
    ? normalizeRuntimeName(simplifyRuntimeRid(rid, fallback), fallback)
    : undefined;

  if (ridName && !isInternalRuntimeIdentifier(ridName, kind)) {
    return ridName;
  }

  if (kind === "watch" || kind === "watchEffect") {
    const sourceHint =
      readRuntimeFunctionHint(utils.readUnknown(payload, "source")) ??
      readRuntimeFunctionHint(utils.readUnknown(payload, "fn")) ??
      readRuntimeFunctionHint(utils.readUnknown(payload, "callback")) ??
      readRuntimeFunctionHint(utils.readUnknown(payload, "effect"));

    if (sourceHint) {
      return normalizeRuntimeName(sourceHint, kind === "watchEffect" ? "watchEffect" : "watch");
    }

    if (utils.readUnknown(payload, "oldValue") !== undefined || utils.readUnknown(payload, "newValue") !== undefined) {
      return "value";
    }

    return kind === "watchEffect" ? "watchEffect" : "watch";
  }

  if (kind === "effect") {
    const sourceHint =
      readRuntimeFunctionHint(utils.readUnknown(payload, "effect")) ??
      readRuntimeFunctionHint(utils.readUnknown(payload, "fn")) ??
      readRuntimeFunctionHint(utils.readUnknown(payload, "runner"));

    if (sourceHint) {
      return normalizeRuntimeName(sourceHint, "effect");
    }

    return ridName ?? "effect";
  }

  return ridName ?? formatRuntimeMonitorKind(kind);
}

function simplifyRuntimeRid(rid: string, fallback: string): string {
  const pivot = rid.lastIndexOf(".");
  if (pivot >= 0 && pivot < rid.length - 1) {
    const suffix = rid.slice(pivot + 1);
    return suffix.length > 0 ? suffix : fallback;
  }

  return rid || fallback;
}

function readRuntimeFunctionHint(value: unknown): string | undefined {
  if (typeof value !== "function") {
    return undefined;
  }

  const directName = value.name.trim();
  if (directName.length > 0 && directName !== "anonymous") {
    return directName;
  }

  const raw = Function.prototype.toString.call(value).replace(/\s+/g, " ").trim();
  const arrowPivot = raw.indexOf("=>");
  if (arrowPivot >= 0 && arrowPivot < raw.length - 2) {
    const expression = raw.slice(arrowPivot + 2).trim();
    if (expression.startsWith("{")) {
      return undefined;
    }

    const normalized = expression;

    if (normalized.length > 0 && isRuntimeExpressionHint(normalized)) {
      return normalized.length > 64 ? `${normalized.slice(0, 64)}...` : normalized;
    }
  }

  return undefined;
}

function isRuntimeExpressionHint(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  if (/[;{}]/.test(normalized)) {
    return false;
  }

  const lower = normalized.toLowerCase();
  return !lower.startsWith("const ")
    && !lower.startsWith("let ")
    && !lower.startsWith("var ")
    && !lower.startsWith("return ")
    && !lower.includes("debug.emit(")
    && !lower.includes("=>");
}

function normalizeRuntimeName(raw: string, fallback: string): string {
  let value = raw.trim();
  if (value.length === 0) {
    return fallback;
  }

  value = value.replace(/^return\s+/, "");
  value = value.replace(/\s+/g, " ");
  value = value.replace(/\?\.value\b/g, "");
  value = value.replace(/\.value\b/g, "");
  value = value.replace(/[;]+$/, "");

  if (value.startsWith("{") && value.endsWith("}")) {
    value = value.slice(1, -1).trim();
  }

  if (value.startsWith("(") && value.endsWith(")")) {
    value = value.slice(1, -1).trim();
  }

  const genericNames = new Set(["effect", "effectFn", "runner", "callback", "source", "fn", "value", "watch", "watchEffect"]);
  if (genericNames.has(value)) {
    return fallback;
  }

  if (value.length > 56) {
    return `${value.slice(0, 56)}...`;
  }

  return value || fallback;
}

function eventTouchesComponentRuntime(
  event: RuntimeMonitorEvent,
  scope: string,
  instance: number,
  componentKey: string,
  utils: RuntimeMonitorRenderUtils
): boolean {
  const payload = event.payload ?? {};
  const rid = readRuntimeMonitorRid(payload, utils);
  if (rid?.includes(componentKey)) {
    return true;
  }

  const effectRid = readEffectRidFromPayload(payload, utils);
  if (effectRid?.includes(componentKey)) {
    return true;
  }

  const identity = utils.readComponentIdentity(event);
  if (identity?.scope === scope && identity.instance === instance) {
    return true;
  }

  const meta = utils.readUnknown(payload, "meta");
  if (matchesScopeInstanceRecord(meta, scope, instance, utils)) {
    return true;
  }

  const owner = utils.readUnknown(payload, "owner");
  if (matchesScopeInstanceRecord(owner, scope, instance, utils)) {
    return true;
  }

  const context = utils.readUnknown(payload, "context");
  if (matchesScopeInstanceRecord(context, scope, instance, utils)) {
    return true;
  }

  return utils.safeString(payload).includes(componentKey);
}

function matchesScopeInstanceRecord(
  value: unknown,
  scope: string,
  instance: number,
  utils: RuntimeMonitorRenderUtils
): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return utils.readString(record, "scope") === scope && utils.readNumber(record, "instance") === instance;
}

function readRuntimeMonitorRid(payload: Record<string, unknown>, utils: RuntimeMonitorRenderUtils): string | undefined {
  return utils.readString(payload, "rid") ?? utils.readString(payload, "key") ?? utils.readString(payload, "reactiveRid");
}

function readEffectRidFromPayload(payload: Record<string, unknown>, utils: RuntimeMonitorRenderUtils): string | undefined {
  const candidates = [
    utils.readUnknown(payload, "effect"),
    utils.readUnknown(payload, "fn"),
    utils.readUnknown(payload, "runner"),
    utils.readUnknown(payload, "source"),
    utils.readUnknown(payload, "callback")
  ];

  for (const candidate of candidates) {
    const rid = readRidFromMetaCarrier(candidate);
    if (rid) {
      return rid;
    }
  }

  return utils.readString(payload, "effectRid");
}

function readRidFromMetaCarrier(candidate: unknown): string | undefined {
  if (!candidate || (typeof candidate !== "function" && typeof candidate !== "object")) {
    return undefined;
  }

  const record = candidate as Record<string, unknown>;
  const meta = record._meta;
  if (!meta || typeof meta !== "object") {
    return undefined;
  }

  const rid = (meta as Record<string, unknown>).rid;
  return typeof rid === "string" ? rid : undefined;
}

function describeRuntimeMonitorEvent(event: RuntimeMonitorEvent, utils: RuntimeMonitorRenderUtils): string {
  const payload = event.payload ?? {};
  const oldValue = utils.readUnknown(payload, "oldValue") ?? utils.readUnknown(payload, "prev");
  const newValue =
    utils.readUnknown(payload, "newValue") ??
    utils.readUnknown(payload, "next") ??
    utils.readUnknown(payload, "value");

  if (oldValue !== undefined && newValue !== undefined) {
    return `${utils.shortJson(oldValue)} -> ${utils.shortJson(newValue)}`;
  }

  if (event.type === "watch:source") {
    const initialized = utils.readUnknown(payload, "initialized");
    if (typeof initialized === "boolean") {
      return initialized ? "source evaluated (update)" : "source evaluated (initial)";
    }
  }

  if (event.type === "effect:getCurrent") {
    const current = utils.readUnknown(payload, "effect");
    return current ? "current effect available" : "no active effect";
  }

  if (newValue !== undefined) {
    return `value ${utils.shortJson(newValue)}`;
  }

  const message = utils.readString(payload, "message");
  if (message) {
    return message;
  }

  return "";
}

function humanizeRuntimeMonitorEventType(type: string): string {
  const known: Record<string, string> = {
    "computed:recomputed": "recomputed",
    "effect:create": "created",
    "effect:cleanup": "cleanup",
    "effect:run": "ran",
    "effect:schedule": "scheduled",
    "effect:dispose": "disposed",
    "effect:cleanup:register": "cleanup registered",
    "effect:getCurrent": "current effect checked",
    "watch:create": "watch created",
    "watch:source": "source evaluated",
    "watch:callback": "callback ran",
    "watch:cleanup": "cleanup registered",
    "watch:stop": "watch stopped",
    "watchEffect:create": "watchEffect created",
    "watchEffect:run": "watchEffect ran",
    "watchEffect:cleanup": "watchEffect cleanup",
    "watchEffect:stop": "watchEffect stopped"
  };

  return known[type] ?? type.replaceAll(":", " ");
}
