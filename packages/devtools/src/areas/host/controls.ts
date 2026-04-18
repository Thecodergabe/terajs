type OverlayPosition = "bottom-left" | "bottom-right" | "bottom-center" | "top-left" | "top-right" | "top-center" | "center";
type OverlaySize = "normal" | "large";

export interface HostControlsState {
  hostControlsOpen: boolean;
  overlayPosition: OverlayPosition;
  overlayPanelSize: OverlaySize;
  persistOverlayPreferences: boolean;
}

export function renderHostControlsChrome(state: HostControlsState): string {
  if (!state.hostControlsOpen) {
    return "";
  }

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

  return `
    <div class="devtools-host-controls-panel" aria-label="Overlay controls">
      <div class="devtools-host-controls-header">
        <div>
          <div class="panel-title is-purple">Overlay Controls</div>
          <div class="panel-subtitle">Layout, persistence, and session actions</div>
        </div>
        <button class="toolbar-button" data-host-controls-toggle="true" aria-expanded="true" type="button">Close</button>
      </div>
      <div class="devtools-host-controls-grid">
        <section class="devtools-host-controls-section">
          <div class="devtools-host-controls-title">Overlay Position</div>
          <div class="button-row">
            ${positionChoices.map((choice) => `
              <button
                class="select-button ${state.overlayPosition === choice.value ? "is-selected" : ""}"
                data-layout-position="${choice.value}"
                type="button"
              >${choice.label}</button>
            `).join("")}
          </div>
        </section>
        <section class="devtools-host-controls-section">
          <div class="devtools-host-controls-title">Panel Size</div>
          <div class="button-row">
            ${panelSizes.map((choice) => `
              <button
                class="select-button ${state.overlayPanelSize === choice.value ? "is-selected" : ""}"
                data-layout-size="${choice.value}"
                type="button"
              >${choice.label}</button>
            `).join("")}
          </div>
        </section>
        <section class="devtools-host-controls-section">
          <div class="devtools-host-controls-title">Persist Preferences</div>
          <div class="muted-text">Store position and size in local storage for the next session.</div>
          <div class="button-row">
            <button
              class="toolbar-button ${state.persistOverlayPreferences ? "is-active" : ""}"
              data-layout-persist-toggle="true"
              type="button"
            >${state.persistOverlayPreferences ? "Enabled" : "Disabled"}</button>
          </div>
        </section>
        <section class="devtools-host-controls-section">
          <div class="devtools-host-controls-title">Session Actions</div>
          <div class="button-row">
            <button class="toolbar-button danger-button" data-clear-events="true" type="button">Clear All Events</button>
          </div>
        </section>
      </div>
    </div>
  `;
}