import * as THREE from 'three';
import { SceneManager } from './core/SceneManager';
import { ModelManager } from './managers/ModelManager';
import { SelectionManager } from './managers/SelectionManager';
import { InputHandler } from './services/InputHandler';
import { ExportService } from './services/ExportService';
import type { PrimitiveType, Axis } from './types/primitives';

/**
 * Main application class - Orchestrates all managers and services
 * Follows the Facade pattern to provide a simple API for the UI
 */
export class PolyModeler {
  private sceneManager: SceneManager;
  private modelManager: ModelManager;
  private selectionManager: SelectionManager;
  private inputHandler: InputHandler;

  constructor(
    container: HTMLElement,
    private onSelectionUpdated?: (model: THREE.Mesh | null) => void
  ) {
    // Initialize managers
    this.sceneManager = new SceneManager(container);
    this.modelManager = new ModelManager();
    this.selectionManager = new SelectionManager(this.sceneManager.getTransformControls());
    this.selectionManager.setSelectionUpdateHandler((model) => this.onSelectionUpdated?.(model));

    // Initialize input handler with selection callback
    this.inputHandler = new InputHandler(
      this.sceneManager.getRendererElement(),
      this.sceneManager.getCamera(),
      (object) => this.handleObjectClick(object)
    );

    // Start the application
    this.start();
  }

  /**
   * Start the application (add initial model, begin animation loop)
   */
  private start(): void {
    // Add initial cube
    this.addPrimitive('box', {
      x: 0,
      y: 0,
      z: 0,
    });

    // Start animation loop
    this.animate();
  }

  /**
   * Handle click events from the input handler
   */
  private handleObjectClick(_object: THREE.Object3D | null): void {
    const models = this.modelManager.getAllModels();
    const clickedMesh = this.inputHandler.raycastObjects(models);

    if (clickedMesh) {
      this.selectModel(clickedMesh as THREE.Mesh);
    } else {
      this.selectModel(null);
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // Update all managers
    this.sceneManager.update();
    this.selectionManager.update();
  };

  // ===== Public API for UI =====

  /**
   * Add a primitive shape to the scene
   */
  public addPrimitive(
    type: PrimitiveType,
    position?: THREE.Vector3 | { x: number; y: number; z: number }
  ): THREE.Mesh {
    const mesh = this.modelManager.createPrimitive(type, position);
    this.sceneManager.add(mesh);
    return mesh;
  }

  /**
   * Select a model (or deselect if null)
   */
  public selectModel(model: THREE.Mesh | null): void {
    this.selectionManager.select(model, this.sceneManager.getScene());
  }

  /**
   * Get the currently selected model
   */
  public getSelectedModel(): THREE.Mesh | null {
    return this.selectionManager.getSelected();
  }

  /**
   * Delete the selected model
   */
  public deleteSelected(): void {
    const selected = this.selectionManager.getSelected();
    if (selected) {
      this.sceneManager.remove(selected);
      this.modelManager.removeModel(selected);
      this.selectModel(null);
    }
  }

  /**
   * Set the color of the selected model
   */
  public setColor(color: string): void {
    this.selectionManager.setColor(color);
  }

  public setMaterialRoughness(value: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const material = selected.material as THREE.Material & { roughness?: number };
    if (typeof material.roughness === 'number') {
      material.roughness = value;
      this.onSelectionUpdated?.(selected);
    }
  }

  public setMaterialMetalness(value: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const material = selected.material as THREE.Material & { metalness?: number };
    if (typeof material.metalness === 'number') {
      material.metalness = value;
      this.onSelectionUpdated?.(selected);
    }
  }

  public setMaterialEmissive(color: string): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const material = selected.material as THREE.Material & { emissive?: THREE.Color };
    if (material.emissive instanceof THREE.Color) {
      material.emissive.set(color);
      this.onSelectionUpdated?.(selected);
    }
  }

  public setMaterialEmissiveIntensity(value: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const material = selected.material as THREE.Material & { emissiveIntensity?: number };
    if (typeof material.emissiveIntensity === 'number') {
      material.emissiveIntensity = value;
      this.onSelectionUpdated?.(selected);
    }
  }

  /**
   * Toggle wireframe mode for all models
   */
  public setWireframe(enabled: boolean): void {
    this.modelManager.setWireframeMode(enabled);
  }

  /**
   * Move the selected model
   */
  public moveSelected(axis: Axis, delta: number): void {
    this.selectionManager.move(axis, delta);
  }

  /**
   * Rotate the selected model
   */
  public rotateSelected(axis: Axis, delta: number): void {
    this.selectionManager.rotate(axis, delta);
  }

  /**
   * Scale the selected model
   */
  public scaleSelected(delta: number): void {
    this.selectionManager.scale(delta);
  }

  /**
   * Switch transform gizmo mode
   */
  public setTransformMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.selectionManager.setTransformMode(mode);
  }

  public setTransformEnabled(enabled: boolean): void {
    this.selectionManager.setTransformEnabled(enabled);
  }

  public setPosition(axis: Axis, value: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    selected.position[axis] = value;
    this.onSelectionUpdated?.(selected);
  }

  public setRotation(axis: Axis, valueDegrees: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const radians = (valueDegrees * Math.PI) / 180;
    selected.rotation[axis] = radians;
    this.onSelectionUpdated?.(selected);
  }

  public setScale(axis: Axis, value: number): void {
    const selected = this.selectionManager.getSelected();
    if (!selected) {
      return;
    }
    const clamped = Math.max(0.1, value);
    selected.scale[axis] = clamped;
    this.onSelectionUpdated?.(selected);
  }

  public getAllModels(): THREE.Mesh[] {
    return this.modelManager.getAllModels();
  }

  public selectModelById(id: string): void {
    const mesh = this.modelManager.getAllModels().find((model) => model.uuid === id) ?? null;
    this.selectModel(mesh);
  }

  /**
   * Export all models as OBJ format
   */
  public exportOBJ(): string {
    return ExportService.exportToOBJ(this.modelManager.getAllModels());
  }

  /**
   * Export and download all models as OBJ file
   */
  public downloadOBJ(): void {
    ExportService.exportAndDownload(this.modelManager.getAllModels());
  }

  /**
   * Get statistics about the current scene
   */
  public getStats(): { modelCount: number; hasSelection: boolean } {
    return {
      modelCount: this.modelManager.getModelCount(),
      hasSelection: this.selectionManager.hasSelection(),
    };
  }
}
