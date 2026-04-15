export const LIVE_DEVTOOLS_TABS = [
  "Components",
  "AI Diagnostics"
] as const;

export type FutureDevtoolsAreaHostKind = "iframe";

export interface FutureDevtoolsAreaIntent {
  id: string;
  title: string;
  hostKind: FutureDevtoolsAreaHostKind;
  intent: string;
}

export const FUTURE_DEVTOOLS_AREAS: readonly FutureDevtoolsAreaIntent[] = [
  {
    id: "signals",
    title: "Signals",
    hostKind: "iframe",
    intent: "Reactive registry, ownership, and signal inspection without coupling it to the in-page picker workspace."
  },
  {
    id: "meta",
    title: "Meta",
    hostKind: "iframe",
    intent: "Page and route metadata diagnostics built around safe exported document and routing context."
  },
  {
    id: "issues",
    title: "Issues",
    hostKind: "iframe",
    intent: "A triage-first issue inbox that aggregates runtime, router, and integration failures into actionable groups."
  },
  {
    id: "logs",
    title: "Logs",
    hostKind: "iframe",
    intent: "A retained runtime event explorer with better filtering, grouping, and export workflows than the current placeholder log view."
  },
  {
    id: "timeline",
    title: "Timeline",
    hostKind: "iframe",
    intent: "A time-ordered playback surface for render, effect, routing, and queue activity."
  },
  {
    id: "router",
    title: "Router",
    hostKind: "iframe",
    intent: "Router state, route matches, navigation attempts, and route metadata diagnostics."
  },
  {
    id: "queue",
    title: "Queue",
    hostKind: "iframe",
    intent: "Mutation queue visibility, conflicts, retries, and failure analysis."
  },
  {
    id: "performance",
    title: "Performance",
    hostKind: "iframe",
    intent: "Performance metrics, hotspots, and renderer timing summaries tuned for longer-form analysis."
  },
  {
    id: "sanity-check",
    title: "Sanity Check",
    hostKind: "iframe",
    intent: "A health dashboard for effect balance, debug listener counts, and release-readiness checks."
  }
];