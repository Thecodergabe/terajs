/**
 * @file devtoolsApp.ts
 * @description
 * Inline DevTools UI that runs inside the iframe.
 * Renders a live event stream using plain DOM APIs.
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
   */
  function render(): void {
    container.innerHTML = "";

    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];

      const row = document.createElement("div");
      row.className = "event-row";

      const time = document.createElement("span");
      time.textContent = new Date(e.timestamp).toLocaleTimeString();

      const type = document.createElement("span");
      type.className = "event-type";
      type.textContent = e.type;

      row.appendChild(time);
      row.appendChild(type);
      container.appendChild(row);
    }
  }

  /**
   * Receives debug events from the parent window.
   */
  window.addEventListener("message", (ev: MessageEvent) => {
    const data = ev.data;
    if (!data || data.__nebula_debug !== true) return;

    const event = data.event as DebugEvent;
    events.push(event);

    if (events.length > 500) events.shift();

    render();
  });
}
