import { escapeHtml } from "./shared.js";
import {
  buildComponentTree,
  collectComponentDrilldown,
  collectExpandableTreeKeys,
  collectMountedComponents,
  expandSelectedTreePath,
  resolveSelectedComponent,
  type ComponentTreeNode,
  type MountedComponentEntry
} from "./componentData.js";
import type { DevtoolsEventLike } from "./dataCollectors.js";

export interface ComponentsPanelViewState {
  mountedComponents: Map<string, { key: string; scope: string; instance: number; aiPreview?: string; lastSeenAt: number }>;
  componentTreeInitialized: boolean;
  expandedComponentNodeKeys: Set<string>;
  selectedComponentKey: string | null;
  componentSearchQuery: string;
  componentInspectorQuery: string;
  expandedInspectorSections: Set<string>;
  expandedValuePaths: Set<string>;
  events: DevtoolsEventLike[];
}

export interface ComponentsPanelView {
  componentsCount: number;
  visibleCount: number;
  selectedLabel: string;
  treeMarkup: string;
  inspectorMarkup: string;
}

export function buildComponentsPanelView<TState extends ComponentsPanelViewState>(
  state: TState,
  renderComponentDrilldownInspector: (
    state: TState,
    selected: MountedComponentEntry,
    drilldown: ReturnType<typeof collectComponentDrilldown>
  ) => string
): ComponentsPanelView {
  const components = collectMountedComponents(state.mountedComponents);
  const searchQuery = state.componentSearchQuery.trim().toLowerCase();
  const visibleComponents = searchQuery.length === 0
    ? components
    : components.filter((component) => {
      return component.scope.toLowerCase().includes(searchQuery)
        || component.key.toLowerCase().includes(searchQuery)
        || String(component.instance).includes(searchQuery);
    });

  const tree = buildComponentTree(visibleComponents);

  if (components.length === 0) {
    state.componentTreeInitialized = false;
  }

  if (!state.componentTreeInitialized && tree.roots.length > 0) {
    const expandableKeys = collectExpandableTreeKeys(tree.roots);
    for (const key of expandableKeys) {
      state.expandedComponentNodeKeys.add(key);
    }
    state.componentTreeInitialized = true;
  }

  const selected = resolveSelectedComponent(visibleComponents, state.selectedComponentKey);
  const selectedKey = selected?.key ?? null;

  expandSelectedTreePath(state.expandedComponentNodeKeys, selectedKey, tree.parentByKey);

  const drilldown = selected
    ? collectComponentDrilldown(state.events, selected.scope, selected.instance)
    : null;

  const treeMarkup = visibleComponents.length === 0
    ? `<div class="empty-state">${components.length === 0 ? "No components mounted." : "No components match the current filter."}</div>`
    : tree.roots.length === 0
    ? `<div class="empty-state">No component hierarchy available.</div>`
    : `
      <ul class="component-tree-list">
        ${renderComponentTree(tree.roots, selectedKey, state.expandedComponentNodeKeys)}
      </ul>
    `;

  const inspectorMarkup = !selected || !drilldown
    ? `<div class="empty-state">${visibleComponents.length === 0 ? "Adjust the component filter to continue." : "Select a component to inspect its state drill-down."}</div>`
    : renderComponentDrilldownInspector(state, selected, drilldown);

  return {
    componentsCount: components.length,
    visibleCount: visibleComponents.length,
    selectedLabel: selected ? `<${selected.scope}>` : "No component selected",
    treeMarkup,
    inspectorMarkup
  };
}

function renderComponentTree(
  nodes: ComponentTreeNode[],
  selectedComponentKey: string | null,
  expandedKeys: Set<string>,
  ancestorHasNext: boolean[] = []
): string {
  return nodes.map((node, index) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = hasChildren && expandedKeys.has(node.component.key);
    const isSelected = selectedComponentKey === node.component.key;
    const hasNextSibling = index < nodes.length - 1;
    const branchClass = ancestorHasNext.length === 0
      ? "is-root"
      : hasNextSibling
        ? "is-branching"
        : "is-terminal";
    const nodeClasses = ["component-tree-node"];
    if (hasChildren) {
      nodeClasses.push("has-children");
    }
    if (isExpanded) {
      nodeClasses.push("is-expanded");
    }

    const guides = ancestorHasNext.map((hasNext) => `
      <span class="tree-indent-guide ${hasNext ? "is-continuing" : ""}"></span>
    `).join("");

    return `
      <li class="${nodeClasses.join(" ")}">
        <div class="component-tree-row" data-tree-depth="${ancestorHasNext.length}">
          <span class="component-tree-guides">${guides}</span>
          <span class="component-tree-branch ${branchClass}" aria-hidden="true"></span>
          ${hasChildren ? `
            <button
              class="component-tree-toggle"
              data-action="toggle-component-node"
              data-tree-node-key="${escapeHtml(node.component.key)}"
              aria-label="${isExpanded ? "Collapse" : "Expand"} ${escapeHtml(node.component.scope)}"
            ><span class="component-tree-chevron" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span></button>
          ` : `<span class="component-tree-toggle is-placeholder" aria-hidden="true"></span>`}
          <button
            class="component-tree-select ${isSelected ? "is-active" : ""}"
            data-component-key="${escapeHtml(node.component.key)}"
            data-component-scope="${escapeHtml(node.component.scope)}"
            data-component-instance="${node.component.instance}"
          >
            <span class="component-tree-label">${escapeHtml(node.component.scope)}</span>
          </button>
        </div>
        ${node.component.aiPreview ? `<div class="muted-text ai-hint component-ai-hint">AI: ${escapeHtml(node.component.aiPreview)}</div>` : ""}
        ${hasChildren && isExpanded ? `
          <ul class="component-tree-list component-tree-children">
            ${renderComponentTree(node.children, selectedComponentKey, expandedKeys, [...ancestorHasNext, hasNextSibling])}
          </ul>
        ` : ""}
      </li>
    `;
  }).join("");
}
