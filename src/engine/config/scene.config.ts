/**
 * Scene configuration constants
 */
export const SceneConfig = {
  BACKGROUND_COLOR: 0x1a1a1a,
  GRID_SIZE: 20,
  GRID_DIVISIONS: 20,
  GRID_COLOR_1: 0x444444,
  GRID_COLOR_2: 0x222222,
} as const;

/**
 * Camera configuration constants
 */
export const CameraConfig = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  INITIAL_POSITION: { x: 6, y: 6, z: 6 },
  LOOK_AT: { x: 0, y: 0, z: 0 },
} as const;

/**
 * Lighting configuration constants
 */
export const LightConfig = {
  AMBIENT_COLOR: 0xffffff,
  AMBIENT_INTENSITY: 0.5,
  DIRECTIONAL_COLOR: 0xffffff,
  DIRECTIONAL_INTENSITY: 1,
  DIRECTIONAL_POSITION: { x: 5, y: 10, z: 7 },
  SHADOW_CAMERA_NEAR: 0.1,
  SHADOW_CAMERA_FAR: 50,
} as const;

/**
 * Controls configuration constants
 */
export const ControlsConfig = {
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.05,
  MAX_POLAR_ANGLE: Math.PI / 2,
} as const;

/**
 * Selection configuration constants
 */
export const SelectionConfig = {
  SELECTION_COLOR: 0x00ff00,
  CLICK_THRESHOLD_PX: 5,
  CLICK_THRESHOLD_MS: 300,
} as const;

/**
 * Axis helper configuration
 */
export const AxisConfig = {
  LENGTH: 5,
  LINE_WIDTH: 2,
  X_COLOR: 0xff5050,
  Y_COLOR: 0x50ff50,
  Z_COLOR: 0x5050ff,
} as const;

/**
 * Material configuration constants
 */
export const MaterialConfig = {
  DEFAULT_SATURATION: 0.7,
  DEFAULT_LIGHTNESS: 0.6,
  FLAT_SHADING: true,
} as const;

/**
 * Primitive spawn configuration
 */
export const PrimitiveConfig = {
  INITIAL_Y_POSITION: 0.5,
  SPAWN_RANGE: 4,
} as const;
