import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneConfig, CameraConfig, LightConfig, ControlsConfig } from '../config/scene.config';

/**
 * Manages the Three.js scene, camera, renderer, and controls
 * Responsible for the core 3D rendering infrastructure
 */
export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.setupLights();
    this.setupGrid();
    this.setupResizeHandler();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SceneConfig.BACKGROUND_COLOR);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      CameraConfig.FOV,
      this.container.clientWidth / this.container.clientHeight,
      CameraConfig.NEAR,
      CameraConfig.FAR
    );

    camera.position.set(
      CameraConfig.INITIAL_POSITION.x,
      CameraConfig.INITIAL_POSITION.y,
      CameraConfig.INITIAL_POSITION.z
    );
    camera.lookAt(CameraConfig.LOOK_AT.x, CameraConfig.LOOK_AT.y, CameraConfig.LOOK_AT.z);

    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = ControlsConfig.ENABLE_DAMPING;
    controls.dampingFactor = ControlsConfig.DAMPING_FACTOR;
    controls.maxPolarAngle = ControlsConfig.MAX_POLAR_ANGLE;
    return controls;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(
      LightConfig.AMBIENT_COLOR,
      LightConfig.AMBIENT_INTENSITY
    );
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      LightConfig.DIRECTIONAL_COLOR,
      LightConfig.DIRECTIONAL_INTENSITY
    );
    directionalLight.position.set(
      LightConfig.DIRECTIONAL_POSITION.x,
      LightConfig.DIRECTIONAL_POSITION.y,
      LightConfig.DIRECTIONAL_POSITION.z
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = LightConfig.SHADOW_CAMERA_NEAR;
    directionalLight.shadow.camera.far = LightConfig.SHADOW_CAMERA_FAR;
    this.scene.add(directionalLight);
  }

  private setupGrid(): void {
    const grid = new THREE.GridHelper(
      SceneConfig.GRID_SIZE,
      SceneConfig.GRID_DIVISIONS,
      SceneConfig.GRID_COLOR_1,
      SceneConfig.GRID_COLOR_2
    );
    this.scene.add(grid);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Update controls and render the scene
   */
  public update(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Add an object to the scene
   */
  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   */
  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Get the renderer's DOM element for event handling
   */
  public getRendererElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * Get the camera for raycasting
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the scene
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }
}
