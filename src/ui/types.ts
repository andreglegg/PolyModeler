import type { ReactNode } from 'react';
import type { Mesh } from 'three';

export type SelectionProperties = {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
};

export type MaterialState = {
  baseColor: string;
  supportsStandard: boolean;
  roughness: number;
  metalness: number;
  emissive: string;
  emissiveIntensity: number;
};

export type HierarchyNode = {
  id: string;
  label: string;
  children: HierarchyNode[];
};

export type CollapsedSections = {
  instructions: boolean;
  properties: boolean;
  materials: boolean;
  hierarchy: boolean;
};

export type HierarchyRenderer = (nodes: HierarchyNode[]) => ReactNode;

export type MeshSelectionHandler = (mesh: Mesh | null) => void;
