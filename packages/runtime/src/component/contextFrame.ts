/**
 * @file contextStack.ts
 * @description
 * Manages the hierarchical state for Provide/Inject.
 * Each 'frame' is a plain object that prototypically inherits from its parent.
 */

/** The active stack of context frames during the render/setup phase */
export const contextStack: any[] = [Object.create(null)];

/**
 * Pushes a new frame onto the stack.
 * The new frame inherits all properties from the current top frame.
 */
export function pushContextFrame(): void {
  const parentFrame = contextStack[contextStack.length - 1];
  // Prototypical inheritance allows 'inject' to look up the chain automatically
  const newFrame = Object.create(parentFrame);
  contextStack.push(newFrame);
}

/**
 * Pops the top frame off the stack once a component's setup is complete.
 */
export function popContextFrame(): void {
  if (contextStack.length > 1) {
    contextStack.pop();
  }
}

/**
 * Returns the current active frame.
 */
export function getCurrentFrame(): any {
  return contextStack[contextStack.length - 1];
}