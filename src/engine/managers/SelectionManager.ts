import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import type { Axis } from '../types/primitives';
import { EventNames } from '../types/events';
import { SelectionConfig } from '../config/scene.config';

/**
 * Manages object selection and transformations
 * Handles selection state, visual feedback, and transform operations
 */
export class SelectionManager {
  private selectedModel: THREE.Mesh | null = null;
  private selectionOverlay: THREE.LineSegments | null = null;
  private transformControls: TransformControls;
  private transformEnabled = false;
  private onSelectionUpdated?: (model: THREE.Mesh | null) => void;

  constructor(transformControls: TransformControls) {
    this.transformControls = transformControls;

    this.transformControls.addEventListener('change', () => {
      if (this.selectedModel) {
        this.onSelectionUpdated?.(this.selectedModel);
      }
    });
  }

  /**
   * Select a model and update visual feedback
   */
  public select(model: THREE.Mesh | null, scene: THREE.Scene): void {
    // Remove old selection box
    this.clearSelection(scene);

    this.selectedModel = model;

    // Add new selection box
    if (this.selectedModel) {
      this.selectionOverlay = this.createOutline(this.selectedModel);
      scene.add(this.selectionOverlay);
      if (this.transformEnabled) {
        this.transformControls.attach(this.selectedModel);
      } else {
        this.transformControls.detach();
      }
    }

    // Emit selection event
    this.emitSelectionEvent();
    this.onSelectionUpdated?.(this.selectedModel);
  }

  /**
   * Clear the current selection
   */
  private clearSelection(scene: THREE.Scene): void {
    if (this.selectionOverlay) {
      scene.remove(this.selectionOverlay);
      this.selectionOverlay.geometry.dispose();
      (this.selectionOverlay.material as THREE.Material).dispose();
      this.selectionOverlay = null;
    }

    this.transformControls.detach();
    this.selectedModel = null;
    this.onSelectionUpdated?.(null);
  }

  /**
   * Update the selection box (call every frame)
   */
  public update(): void {
    if (this.selectionOverlay && this.selectedModel) {
      this.updateOutline(this.selectionOverlay, this.selectedModel);
    }
  }

  /**
   * Get the currently selected model
   */
  public getSelected(): THREE.Mesh | null {
    return this.selectedModel;
  }

  /**
   * Check if a model is currently selected
   */
  public hasSelection(): boolean {
    return this.selectedModel !== null;
  }

  /**
   * Move the selected model along an axis
   */
  public move(axis: Axis, delta: number): void {
    if (this.selectedModel) {
      this.selectedModel.position[axis] += delta;
    }
  }

  /**
   * Rotate the selected model around an axis
   */
  public rotate(axis: Axis, delta: number): void {
    if (this.selectedModel) {
      this.selectedModel.rotation[axis] += delta;
    }
  }

  /**
   * Scale the selected model uniformly
   */
  public scale(delta: number): void {
    if (this.selectedModel) {
      const newScale = Math.max(0.1, this.selectedModel.scale.x + delta);
      this.selectedModel.scale.setScalar(newScale);
    }
  }

  /**
   * Set the color of the selected model
   */
  public setColor(color: string): void {
    if (this.selectedModel) {
      const material = this.selectedModel.material as THREE.MeshStandardMaterial;
      material.color.set(color);
    }
  }

  /**
   * Switch the transform gizmo mode
   */
  public setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformControls.setMode(mode);
  }

  public setTransformEnabled(enabled: boolean): void {
    this.transformEnabled = enabled;

    if (!this.selectedModel) {
      this.transformControls.detach();
      return;
    }

    if (enabled) {
      this.transformControls.attach(this.selectedModel);
    } else {
      this.transformControls.detach();
    }

    this.onSelectionUpdated?.(this.selectedModel);
  }

  public setSelectionUpdateHandler(handler: (model: THREE.Mesh | null) => void): void {
    this.onSelectionUpdated = handler;
  }

  /**
   * Emit a custom event when selection changes
   */
  private emitSelectionEvent(): void {
    window.dispatchEvent(
      new CustomEvent(EventNames.MODEL_SELECTED, {
        detail: { model: this.selectedModel },
      })
    );
  }

  private createOutline(mesh: THREE.Mesh): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(mesh.geometry, 15);
    const material = new THREE.LineBasicMaterial({
      color: SelectionConfig.SELECTION_COLOR,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      opacity: 1,
    });
    const outline = new THREE.LineSegments(geometry, material);
    outline.matrixAutoUpdate = false;
    outline.renderOrder = 9999;
    this.updateOutline(outline, mesh);
    return outline;
  }

  private updateOutline(outline: THREE.LineSegments, mesh: THREE.Mesh): void {
    outline.matrix.copy(mesh.matrixWorld);
    outline.updateMatrixWorld(true);
  }
}
