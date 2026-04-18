import { buildComponentKey } from "../../../inspector/shared.js";
import { applyLivePropInput, applyLiveReactiveInput } from "../../../inspector/liveEditing.js";

interface ComponentSelectionState {
  activeTab: string;
  selectedComponentKey: string | null;
}

interface ComponentsInputState {
  componentSearchQuery: string;
  componentInspectorQuery: string;
}

export function createShadowComponentsPickedHandler<TState extends ComponentSelectionState>(
  state: TState,
  render: () => void
): EventListener {
  return (rawEvent: Event) => {
    const customEvent = rawEvent as CustomEvent<unknown>;
    const detail = customEvent.detail;
    if (!detail || typeof detail !== "object") {
      return;
    }

    const payload = detail as Record<string, unknown>;
    const scope = typeof payload.scope === "string" ? payload.scope : null;
    const instance = typeof payload.instance === "number" ? payload.instance : null;
    if (!scope || instance === null) {
      return;
    }

    state.activeTab = "Components";
    state.selectedComponentKey = buildComponentKey(scope, instance);
    render();
  };
}

export function handleShadowComponentsAreaInput<TState extends ComponentsInputState>(
  state: TState,
  render: () => void,
  target: HTMLInputElement
): boolean {
  if (target.dataset.componentSearchQuery === "true") {
    state.componentSearchQuery = target.value;
    render();
    return true;
  }

  if (target.dataset.componentInspectorQuery === "true") {
    state.componentInspectorQuery = target.value;
    render();
    return true;
  }

  return false;
}

export function handleShadowComponentsAreaChange(
  render: () => void,
  target: HTMLInputElement
): boolean {
  if (target.dataset.livePropInput === "true") {
    const scope = target.dataset.componentScope;
    const instanceRaw = target.dataset.componentInstance;
    const propKey = target.dataset.propKey;
    const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
    if (scope && propKey && Number.isFinite(instance) && applyLivePropInput(scope, instance, propKey, target.value)) {
      render();
    }
    return true;
  }

  if (target.dataset.liveReactiveInput === "true") {
    const rid = target.dataset.reactiveRid;
    if (rid && applyLiveReactiveInput(rid, target.value)) {
      render();
    }
    return true;
  }

  return false;
}

export function createShadowComponentsHoverHandlers(
  notifyComponentHover: (scope: string | null, instance: number | null) => void
): { handleMouseOver: EventListener; handleMouseOut: EventListener } {
  const handleMouseOver: EventListener = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const hovered = readHoveredComponent(target);
    if (!hovered) {
      return;
    }

    notifyComponentHover(hovered.scope, hovered.instance);
  };

  const handleMouseOut: EventListener = (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const componentButton = target.closest<HTMLElement>("[data-component-key]");
    if (!componentButton) {
      return;
    }

    const relatedTarget = (domEvent as MouseEvent).relatedTarget;
    if (relatedTarget instanceof Element && componentButton.contains(relatedTarget)) {
      return;
    }

    notifyComponentHover(null, null);
  };

  return {
    handleMouseOver,
    handleMouseOut
  };
}

function readHoveredComponent(target: HTMLElement): { scope: string; instance: number } | null {
  const componentButton = target.closest<HTMLElement>("[data-component-key]");
  if (!componentButton) {
    return null;
  }

  const scope = componentButton.dataset.componentScope;
  const instanceRaw = componentButton.dataset.componentInstance;
  const instance = instanceRaw ? Number(instanceRaw) : Number.NaN;
  if (!scope || !Number.isFinite(instance)) {
    return null;
  }

  return {
    scope,
    instance
  };
}