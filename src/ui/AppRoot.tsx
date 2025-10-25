import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Mesh } from 'three';
import { PolyModeler, EventNames, type ModelSelectedEvent, type PrimitiveType } from '../engine';
import { useUIStore } from '../store/uiStore';
import { Toolbar } from './components/Toolbar';
import { ShapesPanel } from './components/ShapesPanel';
import { ColorPanel } from './components/ColorPanel';
import { RightSidebar } from './components/RightSidebar';
import type { CollapsedSections, HierarchyNode, MaterialState, SelectionProperties } from './types';

const DEFAULT_MATERIAL_STATE: MaterialState = {
  baseColor: '#ffffff',
  supportsStandard: false,
  roughness: 0.5,
  metalness: 0.5,
  emissive: '#000000',
  emissiveIntensity: 1,
};

export const AppRoot = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const transformGroupRef = useRef<HTMLDivElement | null>(null);
  const polyModelerRef = useRef<PolyModeler | null>(null);

  const activePanel = useUIStore((state) => state.activePanel);
  const togglePanel = useUIStore((state) => state.togglePanel);
  const closePanels = useUIStore((state) => state.closePanels);
  const transformMenuOpen = useUIStore((state) => state.transformMenuOpen);
  const toggleTransformMenu = useUIStore((state) => state.toggleTransformMenu);
  const closeTransformMenu = useUIStore((state) => state.closeTransformMenu);
  const closeAll = useUIStore((state) => state.closeAll);
  const transformMode = useUIStore((state) => state.transformMode);
  const setTransformMode = useUIStore((state) => state.setTransformMode);
  const wireframe = useUIStore((state) => state.wireframe);
  const setWireframe = useUIStore((state) => state.setWireframe);
  const hasSelection = useUIStore((state) => state.hasSelection);
  const setHasSelection = useUIStore((state) => state.setHasSelection);
  const transformEnabled = useUIStore((state) => state.transformEnabled);
  const setTransformEnabled = useUIStore((state) => state.setTransformEnabled);
  const rightPanelVisible = useUIStore((state) => state.rightPanelVisible);
  const toggleRightPanel = useUIStore((state) => state.toggleRightPanel);
  const hierarchyCollapsed = useUIStore((state) => state.hierarchyCollapsed);
  const toggleHierarchyCollapsedStore = useUIStore((state) => state.toggleHierarchyCollapsed);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [materialState, setMaterialState] = useState<MaterialState>(DEFAULT_MATERIAL_STATE);
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<CollapsedSections>({
    instructions: false,
    properties: false,
    materials: false,
    hierarchy: hierarchyCollapsed,
  });
  const [selectionProperties, setSelectionProperties] = useState<SelectionProperties | null>(null);

  const updateSelectionProperties = useCallback(
    (model: Mesh | null) => {
      if (!model) {
        setSelectionProperties(null);
        setMaterialState(DEFAULT_MATERIAL_STATE);
        setSelectedColor(null);
        setSelectedMeshId(null);
        return;
      }

      setSelectionProperties({
        position: {
          x: Number(model.position.x.toFixed(2)),
          y: Number(model.position.y.toFixed(2)),
          z: Number(model.position.z.toFixed(2)),
        },
        rotation: {
          x: Number(((model.rotation.x * 180) / Math.PI).toFixed(1)),
          y: Number(((model.rotation.y * 180) / Math.PI).toFixed(1)),
          z: Number(((model.rotation.z * 180) / Math.PI).toFixed(1)),
        },
        scale: {
          x: Number(model.scale.x.toFixed(2)),
          y: Number(model.scale.y.toFixed(2)),
          z: Number(model.scale.z.toFixed(2)),
        },
      });

      const material = model.material as THREE.MeshStandardMaterial;
      const baseColor = 'color' in material && material.color ? `#${material.color.getHexString()}` : '#ffffff';
      const supportsStandard = material && 'roughness' in material;

      setMaterialState({
        baseColor,
        supportsStandard,
        roughness: supportsStandard ? Number(material.roughness.toFixed(2)) : 0.5,
        metalness: supportsStandard ? Number(material.metalness.toFixed(2)) : 0.5,
        emissive: supportsStandard ? `#${material.emissive.getHexString()}` : '#000000',
        emissiveIntensity: supportsStandard ? Number(material.emissiveIntensity.toFixed(2)) : 1,
      });
      setSelectedColor(baseColor);
      setSelectedMeshId(model.uuid);
    },
    []
  );

  const buildHierarchyTree = useCallback((meshes: Mesh[]): HierarchyNode[] =>
    meshes.map((mesh) => {
      const label = (mesh.name || mesh.geometry?.type || 'Mesh').replace(/Geometry$/u, '');
      const children = (mesh.children as Mesh[]).filter((child) => child.isMesh);
      return {
        id: mesh.uuid,
        label,
        children: buildHierarchyTree(children),
      };
    }), []);

  const syncHierarchy = useCallback(() => {
    const models = polyModelerRef.current?.getAllModels() ?? [];
    const tree = buildHierarchyTree(models);
    setHierarchyTree(tree);
    setCollapsedNodes((prev) => {
      const next = { ...prev };
      const register = (nodes: HierarchyNode[]) => {
        nodes.forEach((node) => {
          if (!(node.id in next)) {
            next[node.id] = false;
          }
          register(node.children);
        });
      };
      register(tree);
      return next;
    });
  }, [buildHierarchyTree]);

  const handlePropertyInput = useCallback(
    (
      group: 'position' | 'rotation' | 'scale',
      axis: 'x' | 'y' | 'z',
      value: string
    ) => {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return;
      }

      const selected = polyModelerRef.current?.getSelectedModel();
      if (!selected) {
        return;
      }

      setSelectionProperties((prev) => {
        if (!prev) {
          return prev;
        }
        const next = {
          position: { ...prev.position },
          rotation: { ...prev.rotation },
          scale: { ...prev.scale },
        };
        next[group][axis] = numericValue;
        return next;
      });

      if (group === 'position') {
        selected.position[axis] = numericValue;
      } else if (group === 'rotation') {
        selected.rotation[axis] = (numericValue * Math.PI) / 180;
      } else {
        selected.scale[axis] = Math.max(0.1, numericValue);
      }

      updateSelectionProperties(selected);
    },
    [updateSelectionProperties]
  );

  const handleMaterialColorChange = useCallback((color: string) => {
    setMaterialState((prev) => ({ ...prev, baseColor: color }));
    setSelectedColor(color);
    polyModelerRef.current?.setColor(color);
  }, []);

  const handleMaterialPropChange = useCallback(
    (prop: 'roughness' | 'metalness' | 'emissiveIntensity', value: number) => {
      setMaterialState((prev) => ({ ...prev, [prop]: value }));
      if (prop === 'roughness') {
        polyModelerRef.current?.setMaterialRoughness(value);
      } else if (prop === 'metalness') {
        polyModelerRef.current?.setMaterialMetalness(value);
      } else {
        polyModelerRef.current?.setMaterialEmissiveIntensity(value);
      }
    },
    []
  );

  const handleEmissiveColorChange = useCallback((color: string) => {
    setMaterialState((prev) => ({ ...prev, emissive: color }));
    polyModelerRef.current?.setMaterialEmissive(color);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.innerHTML = '';
    const polyModeler = new PolyModeler(canvasRef.current, updateSelectionProperties);
    polyModelerRef.current = polyModeler;
    syncHierarchy();

    return () => {
      polyModelerRef.current = null;
      canvasRef.current?.replaceChildren();
    };
  }, [syncHierarchy, updateSelectionProperties]);

  useEffect(() => {
    if (!polyModelerRef.current) {
      return;
    }
    polyModelerRef.current.setTransformMode(transformMode);
  }, [transformMode]);

  useEffect(() => {
    if (!polyModelerRef.current) {
      return;
    }
    polyModelerRef.current.setWireframe(wireframe);
  }, [wireframe]);

  useEffect(() => {
    if (!polyModelerRef.current) {
      return;
    }
    polyModelerRef.current.setTransformEnabled(transformEnabled && hasSelection);
  }, [transformEnabled, hasSelection]);

  useEffect(() => {
    const handleModelSelected = (event: Event): void => {
      const modelEvent = event as ModelSelectedEvent;
      const model = modelEvent.detail?.model ?? null;
      setHasSelection(Boolean(model));
      updateSelectionProperties(model as Mesh | null);
    };

    window.addEventListener(EventNames.MODEL_SELECTED, handleModelSelected as EventListener);
    return () => {
      window.removeEventListener(EventNames.MODEL_SELECTED, handleModelSelected as EventListener);
    };
  }, [setHasSelection, updateSelectionProperties]);

  useEffect(() => {
    setCollapsedSections((prev) => ({ ...prev, hierarchy: hierarchyCollapsed }));
  }, [hierarchyCollapsed]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: PointerEvent): void => {
      if (!useUIStore.getState().transformMenuOpen) {
        return;
      }

      const target = event.target;
      const group = transformGroupRef.current;
      if (!group || !(target instanceof Node)) {
        useUIStore.getState().closeTransformMenu();
        return;
      }

      if (!group.contains(target)) {
        useUIStore.getState().closeTransformMenu();
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!hasSelection) {
      setSelectedColor(null);
    }
  }, [hasSelection]);

  const transformMenuClass = useMemo(
    () => (transformMenuOpen ? 'visible' : ''),
    [transformMenuOpen]
  );

  const handleAddShape = (shape: PrimitiveType): void => {
    const polyModeler = polyModelerRef.current;
    if (!polyModeler) {
      return;
    }

    const mesh = polyModeler.addPrimitive(shape, { x: 0, y: 0, z: 0 });
    polyModeler.selectModel(mesh);
    closeAll();
    syncHierarchy();
  };

  const handleTransformModeSelection = (mode: 'translate' | 'rotate' | 'scale'): void => {
    setTransformMode(mode);
    setTransformEnabled(true);
  };

  const handleCanvasClick = (): void => {
    closeAll();
  };

  const handleColorSelection = (color: string): void => {
    const polyModeler = polyModelerRef.current;
    if (!polyModeler) {
      return;
    }

    polyModeler.setColor(color);
    setSelectedColor(color);
    setMaterialState((prev) => ({ ...prev, baseColor: color }));
  };

  const handleWireframeToggle = (): void => {
    setWireframe(!wireframe);
  };

  const handleWireframeCheckbox = (checked: boolean): void => {
    setWireframe(checked);
  };

  const handleDelete = (): void => {
    polyModelerRef.current?.deleteSelected();
    closeAll();
    syncHierarchy();
  };

  const handleExport = (): void => {
    polyModelerRef.current?.downloadOBJ();
  };

  const handleHierarchySelect = (id: string): void => {
    polyModelerRef.current?.selectModelById(id);
    setCollapsedNodes((prev) => {
      const next = { ...prev };
      const expandPath = (nodes: HierarchyNode[]): boolean => {
        for (const node of nodes) {
          if (node.id === id) {
            return true;
          }
          if (expandPath(node.children)) {
            next[node.id] = false;
            return true;
          }
        }
        return false;
      };
      expandPath(hierarchyTree);
      return next;
    });
  };

  const handleHierarchyToggleNode = (id: string): void => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (section: keyof CollapsedSections): void => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    if (section === 'hierarchy') {
      toggleHierarchyCollapsedStore();
    }
  };

  return (
    <>
      <div id="app" ref={canvasRef} onClick={handleCanvasClick} />

      <Toolbar
        activePanel={activePanel}
        transformMenuOpen={transformMenuOpen}
        transformEnabled={transformEnabled}
        currentTransformMode={transformMode}
        wireframe={wireframe}
        transformMenuClass={transformMenuClass}
        transformGroupRef={transformGroupRef}
        onToggleShapes={() => {
          closeTransformMenu();
          togglePanel('shapes');
        }}
        onToggleTransform={() => {
          closePanels();
          toggleTransformMenu();
        }}
        onToggleColor={() => {
          closeTransformMenu();
          togglePanel('color');
        }}
        onTransformMode={handleTransformModeSelection}
        onWireframeToggle={handleWireframeToggle}
        onDelete={handleDelete}
        onExport={handleExport}
      />

      <RightSidebar
        visible={rightPanelVisible}
        onToggleVisibility={toggleRightPanel}
        collapsedSections={collapsedSections}
        onToggleSection={toggleSection}
        hasSelection={hasSelection}
        selectionProperties={selectionProperties}
        onPropertyChange={handlePropertyInput}
        materialState={materialState}
        onMaterialColorChange={handleMaterialColorChange}
        onMaterialPropChange={handleMaterialPropChange}
        onEmissiveColorChange={handleEmissiveColorChange}
        wireframe={wireframe}
        onWireframeChange={handleWireframeCheckbox}
        hierarchy={hierarchyTree}
        collapsedNodes={collapsedNodes}
        onToggleHierarchyNode={handleHierarchyToggleNode}
        onSelectHierarchyNode={handleHierarchySelect}
        selectedMeshId={selectedMeshId}
      />

      <ShapesPanel
        visible={activePanel === 'shapes'}
        onAddShape={handleAddShape}
        onClose={() => togglePanel('shapes')}
      />

      <ColorPanel
        visible={activePanel === 'color'}
        selectedColor={selectedColor ?? materialState.baseColor}
        onSelectColor={handleColorSelection}
        onClose={() => togglePanel('color')}
      />

      <div
        id="selection-pill"
        className={`${hasSelection ? 'active' : ''} ${rightPanelVisible ? '' : 'panel-hidden'}`}
      >
        {hasSelection ? 'Object selected' : 'No selection'}
      </div>
    </>
  );
};
