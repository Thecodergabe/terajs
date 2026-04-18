import { overlayFabAndShellStyles } from "./overlayFabAndShellStyles.js";
import { overlayInspectorAndRuntimeStyles } from "./overlayInspectorAndRuntimeStyles.js";
import { overlayPanelAndContentStyles } from "./overlayPanelAndContentStyles.js";
import { overlayThemeAndScrollbarStyles } from "./overlayThemeAndScrollbarStyles.js";
import { overlayValueAndInteractiveStyles } from "./overlayValueAndInteractiveStyles.js";

export const overlayStyles = [
  overlayFabAndShellStyles,
  overlayPanelAndContentStyles,
  overlayInspectorAndRuntimeStyles,
  overlayValueAndInteractiveStyles,
  overlayThemeAndScrollbarStyles
].join("\n");
