import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class PolyModeler {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private models: THREE.Mesh[] = [];
  private selectedModel: THREE.Mesh | null = null;
  private selectionBox: THREE.BoxHelper | null = null;

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(6, 6, 6);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2;

    // Grid
    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(grid);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    this.scene.add(dirLight);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Events
    this.setupEvents();

    // Add initial cube
    const cube = this.addPrimitive('box');
    this.selectModel(cube);

    // Start animation
    this.animate();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  private setupEvents() {
    let clickStart = { x: 0, y: 0, time: 0 };

    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      clickStart = { x: e.clientX, y: e.clientY, time: Date.now() };
    });

    this.renderer.domElement.addEventListener('pointerup', (e) => {
      const dx = Math.abs(e.clientX - clickStart.x);
      const dy = Math.abs(e.clientY - clickStart.y);
      const dt = Date.now() - clickStart.time;

      // Only select if it's a click, not a drag
      if (dx < 5 && dy < 5 && dt < 300) {
        this.handleClick(e);
      }
    });
  }

  private handleClick(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.models, false);

    if (intersects.length > 0 && intersects[0]) {
      this.selectModel(intersects[0].object as THREE.Mesh);
    } else {
      this.selectModel(null);
    }
  }

  addPrimitive(type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus'): THREE.Mesh {
    let geometry: THREE.BufferGeometry;

    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 8, 6);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1, 8);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 12);
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = 1;
    mesh.position.x = (Math.random() - 0.5) * 4;
    mesh.position.z = (Math.random() - 0.5) * 4;

    this.scene.add(mesh);
    this.models.push(mesh);

    return mesh;
  }

  selectModel(model: THREE.Mesh | null) {
    // Remove old selection box
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox);
      this.selectionBox = null;
    }

    this.selectedModel = model;

    // Add new selection box
    if (this.selectedModel) {
      this.selectionBox = new THREE.BoxHelper(this.selectedModel, 0x00ff00);
      this.scene.add(this.selectionBox);
    }

    // Emit event for UI
    window.dispatchEvent(
      new CustomEvent('modelSelected', {
        detail: { model: this.selectedModel },
      })
    );
  }

  getSelectedModel(): THREE.Mesh | null {
    return this.selectedModel;
  }

  deleteSelected() {
    if (this.selectedModel) {
      this.scene.remove(this.selectedModel);
      const index = this.models.indexOf(this.selectedModel);
      if (index > -1) this.models.splice(index, 1);
      this.selectModel(null);
    }
  }

  setColor(color: string) {
    if (this.selectedModel) {
      (this.selectedModel.material as THREE.MeshStandardMaterial).color.set(color);
    }
  }

  setWireframe(enabled: boolean) {
    this.models.forEach((model) => {
      (model.material as THREE.MeshStandardMaterial).wireframe = enabled;
    });
  }

  moveSelected(axis: 'x' | 'y' | 'z', delta: number) {
    if (this.selectedModel) {
      this.selectedModel.position[axis] += delta;
    }
  }

  rotateSelected(axis: 'x' | 'y' | 'z', delta: number) {
    if (this.selectedModel) {
      this.selectedModel.rotation[axis] += delta;
    }
  }

  scaleSelected(delta: number) {
    if (this.selectedModel) {
      const newScale = Math.max(0.1, this.selectedModel.scale.x + delta);
      this.selectedModel.scale.setScalar(newScale);
    }
  }

  exportOBJ(): string {
    let obj = '# PolyModeler Export\n\n';
    let vertexOffset = 1;

    this.models.forEach((model, i) => {
      obj += `o model_${i}\n`;

      const position = model.geometry.attributes.position;
      if (!position) return;

      const worldMatrix = model.matrixWorld;

      // Vertices
      for (let j = 0; j < position.count; j++) {
        const vertex = new THREE.Vector3(position.getX(j), position.getY(j), position.getZ(j));
        vertex.applyMatrix4(worldMatrix);
        obj += `v ${vertex.x.toFixed(6)} ${vertex.y.toFixed(6)} ${vertex.z.toFixed(6)}\n`;
      }

      // Faces
      const index = model.geometry.index;
      if (index) {
        for (let j = 0; j < index.count; j += 3) {
          const a = index.getX(j) + vertexOffset;
          const b = index.getX(j + 1) + vertexOffset;
          const c = index.getX(j + 2) + vertexOffset;
          obj += `f ${a} ${b} ${c}\n`;
        }
      } else {
        for (let j = 0; j < position.count; j += 3) {
          obj += `f ${j + vertexOffset} ${j + 1 + vertexOffset} ${j + 2 + vertexOffset}\n`;
        }
      }

      vertexOffset += position.count;
      obj += '\n';
    });

    return obj;
  }

  downloadOBJ() {
    const objData = this.exportOBJ();
    const blob = new Blob([objData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model.obj';
    link.click();
    URL.revokeObjectURL(url);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();

    // Update selection box
    if (this.selectionBox && this.selectedModel) {
      this.selectionBox.update();
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    const container = this.renderer.domElement.parentElement!;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
}
