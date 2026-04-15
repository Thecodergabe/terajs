import {
  createShadowComponentsHoverHandlers,
  createShadowComponentsPickedHandler,
  handleShadowComponentsAreaChange,
  handleShadowComponentsAreaInput
} from "./areas/shadow/components/domHandlers.js";

type InputState = {
  componentSearchQuery: string;
  componentInspectorQuery: string;
  timelineCursor: number;
};

export function createComponentPickedHandler<TState extends { activeTab: string; selectedComponentKey: string | null }>(
  state: TState,
  render: () => void
): EventListener {
  return createShadowComponentsPickedHandler(state, render);
}

export function createInputHandler<TState extends InputState>(state: TState, render: () => void): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (handleShadowComponentsAreaInput(state, render, target)) {
      return;
    }

    if (target.dataset.timelineCursor !== "true") {
      return;
    }

    state.timelineCursor = Number(target.value);
    render();
  };
}

export function createChangeHandler(render: () => void): EventListener {
  return (domEvent: Event) => {
    const target = domEvent.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (handleShadowComponentsAreaChange(render, target)) {
      return;
    }
  };
}

export function createHoverHandlers(
  notifyComponentHover: (scope: string | null, instance: number | null) => void
): { handleMouseOver: EventListener; handleMouseOut: EventListener } {
  return createShadowComponentsHoverHandlers(notifyComponentHover);
}
