import type { PrimitiveType } from '../engine';

export const SHAPES: Array<{ type: PrimitiveType; label: string; icon: string }> = [
  { type: 'box', label: 'Cube', icon: '📦' },
  { type: 'sphere', label: 'Sphere', icon: '⚪' },
  { type: 'cylinder', label: 'Cylinder', icon: '🔵' },
  { type: 'cone', label: 'Cone', icon: '🔺' },
  { type: 'torus', label: 'Torus', icon: '🍩' },
];

export const PALETTE = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#ffa07a',
  '#98d8c8',
  '#f7dc6f',
  '#a29bfe',
  '#fd79a8',
  '#fdcb6e',
  '#6c5ce7',
  '#00b894',
  '#e17055',
];
