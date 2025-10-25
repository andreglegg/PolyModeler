// src/pages/Viewer.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

interface TouchState {
    initialDistance: number;
    lastTouches: Touch[];
}

export function loadThreeViewer(container: HTMLElement) {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.target.set(0, 0, 0);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Models array
    const models: THREE.Mesh[] = [];
    let selectedModel: THREE.Mesh | null = null;

    // Transform Controls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
        orbitControls.enabled = !event.value;
    });
    scene.add(transformControls);

    // Raycaster for selection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Add starting cube and select it
    const startCube = addPrimitive('box');
    selectModel(startCube);

    function addPrimitive(type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus') {
        let geometry: THREE.BufferGeometry;

        switch(type) {
            case 'box':
                geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
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
            color: Math.random() * 0xffffff,
            flatShading: true,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.y = 1;

        scene.add(mesh);
        models.push(mesh);

        return mesh;
    }

    function selectModel(model: THREE.Mesh | null) {
        console.log('selectModel called with:', model);

        if (selectedModel) {
            (selectedModel.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }

        selectedModel = model;

        if (selectedModel) {
            console.log('Attaching transform controls to:', selectedModel);
            (selectedModel.material as THREE.MeshStandardMaterial).emissive.setHex(0x333333);
            transformControls.attach(selectedModel);
            console.log('Transform controls attached, visible:', transformControls.visible);
        } else {
            console.log('Detaching transform controls');
            transformControls.detach();
        }
    }

    // Click/tap handling for object selection
    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    function handlePointerDown(event: PointerEvent) {
        pointerDownPos = { x: event.clientX, y: event.clientY };
        pointerDownTime = Date.now();
    }

    function handlePointerUp(event: PointerEvent) {
        // Skip if we're dragging the transform controls
        if (transformControls.dragging) {
            return;
        }

        // Check if this was a click (not a drag)
        const deltaX = Math.abs(event.clientX - pointerDownPos.x);
        const deltaY = Math.abs(event.clientY - pointerDownPos.y);
        const deltaTime = Date.now() - pointerDownTime;

        // If moved more than 5px or took more than 300ms, it's a drag, not a click
        if (deltaX > 5 || deltaY > 5 || deltaTime > 300) {
            return;
        }

        // Calculate pointer position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the raycaster
        raycaster.setFromCamera(pointer, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(models, false);

        console.log('Click detected, intersects:', intersects.length);

        if (intersects.length > 0) {
            console.log('Selecting object:', intersects[0].object);
            selectModel(intersects[0].object as THREE.Mesh);
        } else {
            console.log('Deselecting');
            selectModel(null);
        }
    }

    // Event listeners
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        orbitControls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Export functions
    function exportToOBJ(): string {
        let objContent = '# PolyModeler Export\n';
        let vertexOffset = 1;

        models.forEach((model, modelIndex) => {
            objContent += `\no model_${modelIndex}\n`;

            const geometry = model.geometry;
            const position = geometry.attributes.position;
            const index = geometry.index;

            // Write vertices
            for (let i = 0; i < position.count; i++) {
                const x = position.getX(i);
                const y = position.getY(i);
                const z = position.getZ(i);
                objContent += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
            }

            // Write faces
            if (index) {
                for (let i = 0; i < index.count; i += 3) {
                    const a = index.getX(i) + vertexOffset;
                    const b = index.getX(i + 1) + vertexOffset;
                    const c = index.getX(i + 2) + vertexOffset;
                    objContent += `f ${a} ${b} ${c}\n`;
                }
            } else {
                for (let i = 0; i < position.count; i += 3) {
                    const a = i + vertexOffset;
                    const b = i + 1 + vertexOffset;
                    const c = i + 2 + vertexOffset;
                    objContent += `f ${a} ${b} ${c}\n`;
                }
            }

            vertexOffset += position.count;
        });

        return objContent;
    }

    function downloadFile(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Transform controls for selected model
    function moveSelectedModel(axis: 'x' | 'y' | 'z', delta: number) {
        if (selectedModel) {
            selectedModel.position[axis] += delta;
        }
    }

    function rotateSelectedModel(axis: 'x' | 'y' | 'z', delta: number) {
        if (selectedModel) {
            selectedModel.rotation[axis] += delta;
        }
    }

    function scaleSelectedModel(delta: number) {
        if (selectedModel) {
            const newScale = Math.max(0.1, selectedModel.scale.x + delta);
            selectedModel.scale.set(newScale, newScale, newScale);
        }
    }

    // Export API
    return {
        addPrimitive,
        selectModel,
        getSelectedModel: () => selectedModel,
        getModels: () => models,
        deleteSelected: () => {
            if (selectedModel) {
                scene.remove(selectedModel);
                const index = models.indexOf(selectedModel);
                if (index > -1) models.splice(index, 1);
                selectModel(null);
            }
        },
        setWireframe: (enabled: boolean) => {
            models.forEach(model => {
                (model.material as THREE.MeshStandardMaterial).wireframe = enabled;
            });
        },
        exportOBJ: () => {
            const objContent = exportToOBJ();
            downloadFile(objContent, 'model.obj', 'text/plain');
        },
        setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => {
            transformControls.setMode(mode);
        },
        moveSelectedModel,
        rotateSelectedModel,
        scaleSelectedModel
    };
}
