import * as THREE from 'three';
import type { Axis } from '../types/primitives';
import { EventNames } from '../types/events';
import { SelectionConfig } from '../config/scene.config';

/**
 * Manages object selection and transformations
 * Handles selection state, visual feedback, and transform operations
 */
export class SelectionManager {
  private selectedModel: THREE.Mesh | null = null;
  private selectionBox: THREE.BoxHelper | null = null;

  /**
   * Select a model and update visual feedback
   */
  public select(model: THREE.Mesh | null, scene: THREE.Scene): void {
    // Remove old selection box
    this.clearSelection(scene);

    this.selectedModel = model;

    // Add new selection box
    if (this.selectedModel) {
      this.selectionBox = new THREE.BoxHelper(this.selectedModel, SelectionConfig.SELECTION_COLOR);
      scene.add(this.selectionBox);
    }

    // Emit selection event
    this.emitSelectionEvent();
  }

  /**
   * Clear the current selection
   */
  private clearSelection(scene: THREE.Scene): void {
    if (this.selectionBox) {
      scene.remove(this.selectionBox);
      this.selectionBox = null;
    }
  }

  /**
   * Update the selection box (call every frame)
   */
  public update(): void {
    if (this.selectionBox && this.selectedModel) {
      this.selectionBox.update();
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
   * Emit a custom event when selection changes
   */
  private emitSelectionEvent(): void {
    window.dispatchEvent(
      new CustomEvent(EventNames.MODEL_SELECTED, {
        detail: { model: this.selectedModel },
      })
    );
  }
}
