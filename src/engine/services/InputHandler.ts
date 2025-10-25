import * as THREE from 'three';
import { SelectionConfig } from '../config/scene.config';

/**
 * Handles user input (mouse and touch) for object selection
 * Implements click detection with drag filtering
 */
export class InputHandler {
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private clickStart = { x: 0, y: 0, time: 0 };

  constructor(
    private element: HTMLCanvasElement,
    private camera: THREE.Camera,
    private onObjectClick: (object: THREE.Object3D | null) => void
  ) {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.element.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.element.addEventListener('pointerup', (e) => this.handlePointerUp(e));
  }

  private handlePointerDown(event: PointerEvent): void {
    this.clickStart = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    };
  }

  private handlePointerUp(event: PointerEvent): void {
    // Check if this was a click (not a drag)
    if (!this.isClick(event)) {
      return;
    }

    this.updatePointerPosition(event);
    const clickedObject = this.raycast();
    this.onObjectClick(clickedObject);
  }

  private isClick(event: PointerEvent): boolean {
    const dx = Math.abs(event.clientX - this.clickStart.x);
    const dy = Math.abs(event.clientY - this.clickStart.y);
    const dt = Date.now() - this.clickStart.time;

    return (
      dx < SelectionConfig.CLICK_THRESHOLD_PX &&
      dy < SelectionConfig.CLICK_THRESHOLD_PX &&
      dt < SelectionConfig.CLICK_THRESHOLD_MS
    );
  }

  private updatePointerPosition(event: PointerEvent): void {
    const rect = this.element.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private raycast(): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return null; // Will be set by caller with actual objects to test
  }

  /**
   * Perform raycasting against a set of objects
   */
  public raycastObjects(objects: THREE.Object3D[]): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(objects, false);

    if (intersects.length > 0 && intersects[0]) {
      return intersects[0].object;
    }

    return null;
  }

  /**
   * Get the current pointer position in normalized device coordinates
   */
  public getPointerPosition(): THREE.Vector2 {
    return this.pointer.clone();
  }
}
