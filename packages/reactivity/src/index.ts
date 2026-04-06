/**
 * @file index.ts
 * @description
 * Entry point for the Nebula Reactivity System.
 * * This package provides the fine-grained primitives required to build
 * reactive interfaces with automatic dependency tracking and 
 * deep-diffing capabilities.
 */

// Core Tracking & Execution
export { effect, scheduleEffect } from "./effect";
export { 
  pushEffect, 
  popEffect, 
  currentEffect, 
  getCurrentEffect, // Essential for DX utilities
  type ReactiveEffect 
} from "./deps";

// Primitives
export { state } from "./state";
export { signal, type Signal } from "./signal";
export { ref, type Ref } from "./ref";

// Complex Reactivity
export { reactive, type Reactive } from "./reactive";
export { computed } from "./computed";
export { model } from "./model";

// DX Layer (Platform Agnostic)
export { onEffectCleanup } from "./dx/cleanup";
export { dispose } from "./dx/dispose";
export { watch } from "./dx/watch";
export { watchEffect } from "./dx/watchEffect";
export { contract } from "./dx/contract";

// DX Utilities
export { memo, markStatic, shallowRef } from "./memo";