import { toggleLivePropValue, toggleLiveReactiveValue } from "../../../inspector/liveEditing.js";
import { buildComponentKey } from "../../../inspector/shared.js";

interface ShadowComponentsActionsState {
  expandedComponentNodeKeys: Set<string>;
  expandedComponentTreeVersion: number;
  selectedComponentKey: string | null;
}

interface ShadowComponentsActionsDependencies {
  target: HTMLElement;
  state: ShadowComponentsActionsState;
  render: () => void;
  notifyComponentSelection: (scope: string | null, instance: number | null, source: "panel" | "picker" | "clear") => void;
}

export function handleShadowComponentsAreaClick({
  target,
  state,
  render,
  notifyComponentSelection
}: ShadowComponentsActionsDependencies): boolean {
  const treeToggle = target.closest<HTMLElement>("[data-action='toggle-component-node']");
  if (treeToggle) {
    const key = treeToggle.dataset.treeNodeKey;
    if (key) {
      if (state.expandedComponentNodeKeys.has(key)) {
        state.expandedComponentNodeKeys.delete(key);
      } else {
        state.expandedComponentNodeKeys.add(key);
      }
      state.expandedComponentTreeVersion += 1;
      render();
    }
    return true;
  }

  const livePropToggle = target.closest<HTMLElement>("[data-action='toggle-live-prop']");
  if (livePropToggle) {
    const scope = livePropToggle.dataset.componentScope;
    const instanceRaw = livePropToggle.dataset.componentInstance;
    const propKey = livePropToggle.dataset.propKey;
    const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
    if (scope && propKey && Number.isFinite(instance) && toggleLivePropValue(scope, instance, propKey)) {
      render();
    }
    return true;
  }

  const liveReactiveToggle = target.closest<HTMLElement>("[data-action='toggle-live-reactive']");
  if (liveReactiveToggle) {
    const rid = liveReactiveToggle.dataset.reactiveRid;
    if (rid && toggleLiveReactiveValue(rid)) {
      render();
    }
    return true;
  }

  const componentButton = target.closest<HTMLElement>("[data-component-key]");
  if (componentButton) {
    const scope = componentButton.dataset.componentScope;
    const instanceRaw = componentButton.dataset.componentInstance;
    const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
    if (scope && Number.isFinite(instance)) {
      const selectedComponentKey = buildComponentKey(scope, instance);
      if (state.selectedComponentKey === selectedComponentKey) {
        state.selectedComponentKey = null;
        notifyComponentSelection(null, null, "clear");
      } else {
        state.selectedComponentKey = selectedComponentKey;
        notifyComponentSelection(scope, instance, "panel");
      }
      render();
    }
    return true;
  }

  return false;
}