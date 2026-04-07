import type { Router } from "@terajs/router";

import { jsx } from "./jsx-runtime";

export interface LinkProps {
  router: Router;
  to: string;
  replace?: boolean;
  target?: string;
  rel?: string;
  download?: string | boolean;
  children?: any;
  onClick?: (event: MouseEvent) => void;
  [key: string]: unknown;
}

function isModifiedEvent(event: MouseEvent): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

function isExternalTarget(target: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(target) || target.startsWith("//");
}

function shouldHandleNavigation(event: MouseEvent, props: LinkProps): boolean {
  if (event.defaultPrevented) {
    return false;
  }

  if (event.button !== 0 || isModifiedEvent(event)) {
    return false;
  }

  if (props.target && props.target !== "_self") {
    return false;
  }

  if (props.download) {
    return false;
  }

  if (isExternalTarget(props.to)) {
    return false;
  }

  return true;
}

export function Link(props: LinkProps): Node {
  const { router, to, replace, onClick, children, ...rest } = props;

  return jsx("a", {
    ...rest,
    href: to,
    onClick: async (event: MouseEvent) => {
      onClick?.(event);
      if (!shouldHandleNavigation(event, props)) {
        return;
      }

      event.preventDefault();
      if (replace) {
        await router.replace(to);
        return;
      }

      await router.navigate(to);
    },
    children
  });
}