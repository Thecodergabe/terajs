/**
 * @file app.ts
 * @description
 * Inline DevTools UI that runs inside the iframe.
 * Renders a live event stream using plain DOM APIs for zero-dependency debugging.
 */

export interface DebugEvent {
  type: string;
  timestamp: number;
  payload: unknown;
}

/**
 * Initializes the DevTools UI inside the iframe.
 * Must be executed after DOMContentLoaded.
 */
export function initDevtoolsApp(): void {
  const root = document.getElementById("nebula-devtools-root");

  if (!root) {
    throw new Error(
      "Nebula DevTools: #nebula-devtools-root not found in iframe document."
    );
  }

  const container = root as HTMLDivElement;
  const events: DebugEvent[] = [];

  /**
   * Renders the event list into the UI.
   * Simple reverse-chronological list of framework activity.
   */
  function render(): void {
    // Clear the container for a fresh render
    container.innerHTML = "";

    // Render from newest to oldest
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];

      const row = document.createElement("div");
      row.className = "event-row";
      row.style.display = "flex";
      row.style.gap = "10px";
      row.style.fontFamily = "monospace";
      row.style.padding = "4px 8px";
      row.style.borderBottom = "1px solid #333";

      const time = document.createElement("span");
      time.style.color = "#888";
      time.textContent = `[${new Date(e.timestamp).toLocaleTimeString()}]`;

      const type = document.createElement("span");
      type.className = "event-type";
      type.style.fontWeight = "bold";
      type.style.color = e.type.startsWith("error") ? "#ff5555" : "#55ff55";
      type.textContent = e.type;

      row.appendChild(time);
      row.appendChild(type);
      container.appendChild(row);
    }
  }

  /**
   * Receives debug events from the parent window via postMessage.
   */
  window.addEventListener("message", (ev: MessageEvent) => {
    const data = ev.data;
    
    // Security/Internal check to ensure we only process Nebula events
    if (!data || data.__nebula_debug !== true) return;

    const event = data.event as DebugEvent;
    events.push(event);

    // Memory management: Cap the history at 500 events
    if (events.length > 500) {
      events.shift();
    }

    render();
  });
}