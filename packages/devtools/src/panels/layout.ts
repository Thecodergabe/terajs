import { escapeHtml } from "../inspector/shared.js";

export function renderPageShell(options: {
  title: string;
  accentClass: string;
  subtitle: string;
  pills?: string[];
  body: string;
  className?: string;
}): string {
  const pillsMarkup = options.pills && options.pills.length > 0
    ? `
      <div class="panel-hero-pills">
        ${options.pills.map((pill) => `<span class="panel-hero-pill">${escapeHtml(pill)}</span>`).join("")}
      </div>
    `
    : "";

  return `
    <div class="devtools-page ${options.className ?? ""}">
      <div class="panel-hero">
        <div class="panel-title ${options.accentClass}">${escapeHtml(options.title)}</div>
        <div class="panel-subtitle">${escapeHtml(options.subtitle)}</div>
        ${pillsMarkup}
      </div>
      <div class="panel-section-grid">
        ${options.body}
      </div>
    </div>
  `;
}

export function renderPageSection(title: string, content: string, className = ""): string {
  const cardClass = className.length > 0 ? `detail-card panel-section-card ${className}` : "detail-card panel-section-card";

  return `
    <section class="${cardClass}">
      <div class="panel-section-heading">${escapeHtml(title)}</div>
      ${content}
    </section>
  `;
}

export function renderMetricCard(label: string, value: string): string {
  return `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(value)}</div>
    </div>
  `;
}

export function renderEmptyPanel(title: string, subtitle: string, message: string): string {
  return `
    <div>
      <div class="panel-title is-blue">${escapeHtml(title)}</div>
      <div class="panel-subtitle">${escapeHtml(subtitle)}</div>
      <div class="empty-state">${escapeHtml(message)}</div>
    </div>
  `;
}
