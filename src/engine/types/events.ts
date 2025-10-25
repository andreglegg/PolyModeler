import type * as THREE from 'three';

/**
 * Custom event types for the application
 */
export interface ModelSelectedEvent extends CustomEvent {
  detail: {
    model: THREE.Mesh | null;
  };
}

/**
 * Event type map for type-safe event handling
 */
export interface AppEvents {
  modelSelected: ModelSelectedEvent;
}

/**
 * Event names as constants for consistency
 */
export const EventNames = {
  MODEL_SELECTED: 'modelSelected',
} as const;
