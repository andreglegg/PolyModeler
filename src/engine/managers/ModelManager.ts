import * as THREE from 'three';
import type { PrimitiveType } from '../types/primitives';
import { MaterialConfig, PrimitiveConfig } from '../config/scene.config';

/**
 * Factory for creating primitive geometries
 */
class GeometryFactory {
  static create(type: PrimitiveType): THREE.BufferGeometry {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere':
        return new THREE.SphereGeometry(0.5, 8, 6);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      case 'cone':
        return new THREE.ConeGeometry(0.5, 1, 8);
      case 'torus':
        return new THREE.TorusGeometry(0.5, 0.2, 8, 12);
    }
  }
}

/**
 * Manages 3D models in the scene
 * Handles creation, deletion, and model state
 */
export class ModelManager {
  private models: THREE.Mesh[] = [];

  /**
   * Create and add a primitive mesh to the scene
   */
  public createPrimitive(
    type: PrimitiveType,
    position?: THREE.Vector3 | { x: number; y: number; z: number }
  ): THREE.Mesh {
    const geometry = GeometryFactory.create(type);
    const material = this.createMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = type;

    this.configureMesh(mesh, position);
    this.models.push(mesh);

    return mesh;
  }

  private createMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(
        Math.random(),
        MaterialConfig.DEFAULT_SATURATION,
        MaterialConfig.DEFAULT_LIGHTNESS
      ),
      flatShading: MaterialConfig.FLAT_SHADING,
    });
  }

  private configureMesh(
    mesh: THREE.Mesh,
    position?: THREE.Vector3 | { x: number; y: number; z: number }
  ): void {
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (position) {
      mesh.position.set(position.x, position.y, position.z);
    } else {
      mesh.position.y = PrimitiveConfig.INITIAL_Y_POSITION;
      mesh.position.x = (Math.random() - 0.5) * PrimitiveConfig.SPAWN_RANGE;
      mesh.position.z = (Math.random() - 0.5) * PrimitiveConfig.SPAWN_RANGE;
    }
  }

  /**
   * Remove a model from the collection
   */
  public removeModel(model: THREE.Mesh): void {
    const index = this.models.indexOf(model);
    if (index > -1) {
      this.models.splice(index, 1);
    }
  }

  /**
   * Get all models
   */
  public getAllModels(): THREE.Mesh[] {
    return [...this.models];
  }

  /**
   * Set wireframe mode for all models
   */
  public setWireframeMode(enabled: boolean): void {
    this.models.forEach((model) => {
      const material = model.material as THREE.MeshStandardMaterial;
      material.wireframe = enabled;
    });
  }

  /**
   * Get the count of models
   */
  public getModelCount(): number {
    return this.models.length;
  }
}
