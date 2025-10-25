import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import type { Mesh } from 'three';
import { PolyModeler, EventNames, type ModelSelectedEvent, type PrimitiveType } from '../engine';
import { useUIStore } from '../store/uiStore';

const SHAPES: Array<{ type: PrimitiveType; label: string; icon: string }> = [
  { type: 'box', label: 'Cube', icon: '📦' },
  { type: 'sphere', label: 'Sphere', icon: '⚪' },
  { type: 'cylinder', label: 'Cylinder', icon: '🔵' },
  { type: 'cone', label: 'Cone', icon: '🔺' },
  { type: 'torus', label: 'Torus', icon: '🍩' },
];

const COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#ffa07a',
  '#98d8c8',
  '#f7dc6f',
  '#a29bfe',
  '#fd79a8',
  '#fdcb6e',
  '#6c5ce7',
  '#00b894',
  '#e17055',
];

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

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [materialColor, setMaterialColor] = useState<string>('#ffffff');
  const [materialSupportsStandard, setMaterialSupportsStandard] = useState<boolean>(false);
  const [materialProps, setMaterialProps] = useState({
    roughness: 0.5,
    metalness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 1,
  });
  type HierarchyNode = {
    id: string;
    label: string;
    children: HierarchyNode[];
  };
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const hierarchyCollapsed = useUIStore((state) => state.hierarchyCollapsed);
  const toggleHierarchyCollapsedStore = useUIStore((state) => state.toggleHierarchyCollapsed);
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState({
    instructions: false,
    properties: false,
    materials: false,
    hierarchy: hierarchyCollapsed,
  });
  const [selectionProperties, setSelectionProperties] = useState<
    | null
    | {
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        scale: { x: number; y: number; z: number };
      }
  >(null);

  const updateSelectionProperties = useCallback(
    (model: Mesh | null) => {
      if (!model) {
        setSelectionProperties(null);
        setMaterialColor('#ffffff');
        setSelectedColor(null);
        setMaterialSupportsStandard(false);
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

      const material = model.material as THREE.Material & { color?: { getHexString: () => string } };
      if ('color' in material && material.color) {
        const hex = `#${material.color.getHexString()}`;
        setMaterialColor(hex);
        setSelectedColor(hex);
      }

      const standardMaterial = model.material as THREE.MeshStandardMaterial;
      if (standardMaterial && 'roughness' in standardMaterial) {
        setMaterialSupportsStandard(true);
        setMaterialProps({
          roughness: Number(standardMaterial.roughness.toFixed(2)),
          metalness: Number(standardMaterial.metalness.toFixed(2)),
          emissive: `#${standardMaterial.emissive.getHexString()}`,
          emissiveIntensity: Number(standardMaterial.emissiveIntensity.toFixed(2)),
        });
      } else {
        setMaterialSupportsStandard(false);
        setMaterialProps({
          roughness: 0.5,
          metalness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 1,
        });
      }

      setSelectedMeshId(model.uuid);
    },
    []
  );

  const syncHierarchy = useCallback(() => {
    const models = polyModelerRef.current?.getAllModels() ?? [];

    const buildTree = (meshes: Mesh[]): HierarchyNode[] =>
      meshes.map((mesh) => {
        const baseLabel = mesh.name || mesh.geometry?.type || 'Mesh';
        const cleanLabel = baseLabel.replace(/Geometry$/u, '');
        const children = (mesh.children as Mesh[]).filter((child) => child.isMesh);
        return {
          id: mesh.uuid,
          label: cleanLabel,
          children: buildTree(children),
        };
      });

    const tree = buildTree(models);
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
  }, []);

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
        const radians = (numericValue * Math.PI) / 180;
        selected.rotation[axis] = radians;
      } else {
        const clamped = Math.max(0.1, numericValue);
        selected.scale[axis] = clamped;
      }

      updateSelectionProperties(selected);
    },
    [updateSelectionProperties]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // Clean canvas container before initializing renderer to avoid duplicates in dev mode.
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
  }, [updateSelectionProperties]);

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

  const handleTransformButtonClick = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    closePanels();
    toggleTransformMenu();
  };

  const handleCanvasClick = (): void => {
    closeAll();
  };

  const handleTransformModeSelection = (mode: 'translate' | 'rotate' | 'scale'): void => {
    setTransformMode(mode);
    setTransformEnabled(true);
  };

  const handleColorSelection = (color: string): void => {
    const polyModeler = polyModelerRef.current;
    if (!polyModeler) {
      return;
    }

    polyModeler.setColor(color);
    setSelectedColor(color);
    setMaterialColor(color);
  };

  const handleMaterialColorChange = (color: string): void => {
    setMaterialColor(color);
    setSelectedColor(color);
    polyModelerRef.current?.setColor(color);
  };

  const handleWireframeCheckbox = (checked: boolean): void => {
    setWireframe(checked);
  };

  const handleMaterialPropChange = (
    prop: 'roughness' | 'metalness' | 'emissiveIntensity',
    value: number
  ): void => {
    setMaterialProps((prev) => ({ ...prev, [prop]: value }));
    if (prop === 'roughness') {
      polyModelerRef.current?.setMaterialRoughness(value);
    } else if (prop === 'metalness') {
      polyModelerRef.current?.setMaterialMetalness(value);
    } else {
      polyModelerRef.current?.setMaterialEmissiveIntensity(value);
    }
  };

  const handleEmissiveColorChange = (color: string): void => {
    setMaterialProps((prev) => ({ ...prev, emissive: color }));
    polyModelerRef.current?.setMaterialEmissive(color);
  };

  const handleDelete = (): void => {
    polyModelerRef.current?.deleteSelected();
    closeAll();
    syncHierarchy();
  };

  const handleExport = (): void => {
    polyModelerRef.current?.downloadOBJ();
  };

  const handleWireframeToggle = (): void => {
    setWireframe(!wireframe);
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

  const renderHierarchyNodes = (nodes: HierarchyNode[]): ReactNode =>
    nodes.map((node) => {
      const hasChildren = node.children.length > 0;
      const collapsed = collapsedNodes[node.id];
      return (
        <li key={node.id}>
          <div className={`hierarchy-item-row ${node.id === selectedMeshId ? 'active' : ''}`}>
            {hasChildren ? (
              <button
                type="button"
                className="hierarchy-toggle"
                onClick={() => handleHierarchyToggleNode(node.id)}
              >
                {collapsed ? '▸' : '▾'}
              </button>
            ) : (
              <span className="hierarchy-toggle placeholder" />
            )}
            <button
              type="button"
              className="hierarchy-label"
              onClick={() => handleHierarchySelect(node.id)}
            >
              {node.label}
            </button>
            {hasChildren ? <span className="hierarchy-count">{node.children.length}</span> : null}
            <div className="hierarchy-actions">
              <button
                type="button"
                className="hierarchy-action"
                disabled
                title="Rename (coming soon)"
              >
                ✎
              </button>
              <button
                type="button"
                className="hierarchy-action"
                disabled
                title="Duplicate (coming soon)"
              >
                ⧉
              </button>
            </div>
          </div>
          {hasChildren && !collapsed ? (
            <ul className="hierarchy-list nested">{renderHierarchyNodes(node.children)}</ul>
          ) : null}
        </li>
      );
    });

  const toggleSection = (section: keyof typeof collapsedSections): void => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    if (section === 'hierarchy') {
      toggleHierarchyCollapsedStore();
    }
  };

  return (
    <>
      <div id="app" ref={canvasRef} onClick={handleCanvasClick} />

      <div id="toolbar">
        <button
          className={`btn ${activePanel === 'shapes' ? 'active' : ''}`}
          id="btn-shapes"
          title="Add Shape"
          onClick={(event) => {
            event.stopPropagation();
            closeTransformMenu();
            togglePanel('shapes');
          }}
        >
          ➕
        </button>

        <div className="toolbar-group" id="transform-group" ref={transformGroupRef}>
          <button
            className={`btn ${transformMenuOpen || transformEnabled ? 'active' : ''}`}
            id="btn-transform"
            title="Transform"
            onClick={handleTransformButtonClick}
          >
            ↔️
          </button>
          <div id="transform-menu" className={transformMenuClass}>
            <button
              className={`dropdown-item ${transformEnabled && transformMode === 'translate' ? 'active' : ''}`}
              data-mode="translate"
              onClick={() => handleTransformModeSelection('translate')}
            >
              Move
            </button>
            <button
              className={`dropdown-item ${transformEnabled && transformMode === 'rotate' ? 'active' : ''}`}
              data-mode="rotate"
              onClick={() => handleTransformModeSelection('rotate')}
            >
              Rotate
            </button>
            <button
              className={`dropdown-item ${transformEnabled && transformMode === 'scale' ? 'active' : ''}`}
              data-mode="scale"
              onClick={() => handleTransformModeSelection('scale')}
            >
              Scale
            </button>
          </div>
        </div>

        <button
          className={`btn ${activePanel === 'color' ? 'active' : ''}`}
          id="btn-color"
          title="Color"
          onClick={(event) => {
            event.stopPropagation();
            closeTransformMenu();
            togglePanel('color');
          }}
        >
          🎨
        </button>

        <button
          className={`btn ${wireframe ? 'active' : ''}`}
          id="btn-wireframe"
          title="Wireframe"
          onClick={(event) => {
            event.stopPropagation();
            handleWireframeToggle();
          }}
        >
          ◻️
        </button>

        <button className="btn" id="btn-delete" title="Delete" onClick={handleDelete}>
          🗑️
        </button>

        <button className="btn" id="btn-export" title="Export OBJ" onClick={handleExport}>
          💾
        </button>
      </div>

      <div id="side-panel-container" onClick={(event) => event.stopPropagation()}>
        <div className={`side-panel-shell ${rightPanelVisible ? 'visible' : 'collapsed'}`}>
          <div id="side-panel">
            <div className="side-panel-header">
              <h3>Scene Panel</h3>
              <button
                className="side-panel-close"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleRightPanel();
                }}
                aria-label={rightPanelVisible ? 'Hide side panel' : 'Show side panel'}
              >
                ✕
              </button>
            </div>

            <section className="panel-section">
              <button
                className="section-header"
                onClick={() => toggleSection('instructions')}
                type="button"
              >
                <span>Instructions</span>
                <span className={`section-arrow ${collapsedSections.instructions ? 'collapsed' : ''}`}>
                  ▾
                </span>
              </button>
              <div className={`section-body ${collapsedSections.instructions ? 'collapsed' : ''}`}>
                <ul className="instruction-list">
                  <li>Click objects to select</li>
                  <li>Drag empty space to orbit</li>
                  <li>Scroll or pinch to zoom</li>
                  <li>Select a transform mode to enable the gizmo</li>
                </ul>
              </div>
            </section>

            <section className="panel-section">
              <button
                className="section-header"
                onClick={() => toggleSection('properties')}
                type="button"
              >
                <span>Properties</span>
                <span className={`section-arrow ${collapsedSections.properties ? 'collapsed' : ''}`}>
                  ▾
                </span>
              </button>
              <div className={`section-body ${collapsedSections.properties ? 'collapsed' : ''}`}>
                <p className={`panel-status ${hasSelection ? 'active' : ''}`}>
                  {hasSelection ? 'Object selected' : 'No selection'}
                </p>
                {selectionProperties ? (
                  <div className="properties-grid">
                    <div className="property-group">
                      <span className="property-label">Position</span>
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <label key={`position-${axis}`} className="property-row">
                          <span>{axis.toUpperCase()}</span>
                          <input
                            type="number"
                            step="0.05"
                            value={selectionProperties.position[axis]}
                            onChange={(event) => handlePropertyInput('position', axis, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="property-group">
                      <span className="property-label">Rotation</span>
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <label key={`rotation-${axis}`} className="property-row">
                          <span>{axis.toUpperCase()}</span>
                          <input
                            type="number"
                            step="1"
                            value={selectionProperties.rotation[axis]}
                            onChange={(event) => handlePropertyInput('rotation', axis, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="property-group">
                      <span className="property-label">Scale</span>
                      {(['x', 'y', 'z'] as const).map((axis) => (
                        <label key={`scale-${axis}`} className="property-row">
                          <span>{axis.toUpperCase()}</span>
                          <input
                            type="number"
                            step="0.05"
                            value={selectionProperties.scale[axis]}
                            onChange={(event) => handlePropertyInput('scale', axis, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="panel-empty">No object selected</p>
                )}
              </div>
            </section>

            <section className="panel-section">
              <button
                className="section-header"
                onClick={() => toggleSection('materials')}
                type="button"
              >
                <span>Materials</span>
                <span className={`section-arrow ${collapsedSections.materials ? 'collapsed' : ''}`}>
                  ▾
                </span>
              </button>
              <div className={`section-body ${collapsedSections.materials ? 'collapsed' : ''}`}>
                <div className="property-group">
                  <span className="property-label">Base</span>
                  <label className="material-row">
                    <span>Color</span>
                    <input
                      type="color"
                      value={materialColor}
                      disabled={!hasSelection}
                      onChange={(event) => handleMaterialColorChange(event.target.value)}
                    />
                  </label>
                  <label className="material-row material-checkbox">
                    <input
                      type="checkbox"
                      checked={wireframe}
                      onChange={(event) => handleWireframeCheckbox(event.target.checked)}
                    />
                    <span>Wireframe</span>
                  </label>
                </div>

                <div className="property-group">
                  <span className="property-label">Physical</span>
                  {materialSupportsStandard ? (
                    <>
                      <label className="material-slider">
                        <div className="material-slider-header">
                          <span>Roughness</span>
                          <span>{materialProps.roughness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={materialProps.roughness}
                          onChange={(event) =>
                            handleMaterialPropChange('roughness', Number(event.target.value))
                          }
                        />
                      </label>
                      <label className="material-slider">
                        <div className="material-slider-header">
                          <span>Metalness</span>
                          <span>{materialProps.metalness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={materialProps.metalness}
                          onChange={(event) =>
                            handleMaterialPropChange('metalness', Number(event.target.value))
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <p className="panel-empty">
                      Advanced material properties require MeshStandardMaterial
                    </p>
                  )}
                </div>

                <div className="property-group">
                  <span className="property-label">Emissive</span>
                  {materialSupportsStandard ? (
                    <>
                      <label className="material-row">
                        <span>Color</span>
                        <input
                          type="color"
                          value={materialProps.emissive}
                          onChange={(event) => handleEmissiveColorChange(event.target.value)}
                        />
                      </label>
                      <label className="material-slider">
                        <div className="material-slider-header">
                          <span>Intensity</span>
                          <span>{materialProps.emissiveIntensity.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5}
                          step={0.05}
                          value={materialProps.emissiveIntensity}
                          onChange={(event) =>
                            handleMaterialPropChange('emissiveIntensity', Number(event.target.value))
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <p className="panel-empty">Emissive settings unavailable for this material</p>
                  )}
                </div>
              </div>
            </section>

          <section className="panel-section">
            <button
              className="section-header"
              onClick={() => toggleSection('hierarchy')}
              type="button"
            >
              <span>Hierarchy</span>
              <span className={`section-arrow ${collapsedSections.hierarchy ? 'collapsed' : ''}`}>
                ▾
              </span>
            </button>
              <div className={`section-body ${collapsedSections.hierarchy ? 'collapsed' : ''}`}>
                {hierarchyTree.length > 0 ? (
                  <ul className="hierarchy-list root">{renderHierarchyNodes(hierarchyTree)}</ul>
                ) : (
                  <p className="panel-empty">Scene hierarchy coming soon</p>
                )}
              </div>
            </section>
          </div>
        </div>

        <button
          className={`side-panel-toggle ${rightPanelVisible ? 'expanded' : 'collapsed'}`}
          onClick={(event) => {
            event.stopPropagation();
            toggleRightPanel();
          }}
          aria-label={rightPanelVisible ? 'Hide side panel' : 'Show side panel'}
        >
          <span className="toggle-icon">{rightPanelVisible ? '›' : '‹'}</span>
        </button>
      </div>

      <div
        id="shapes-panel"
        className={`panel ${activePanel === 'shapes' ? 'visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Add Shape</h3>
        {SHAPES.map((shape) => (
          <button
            key={shape.type}
            className="shape-btn"
            data-shape={shape.type}
            onClick={() => handleAddShape(shape.type)}
          >
            <span>{shape.icon}</span>
            <span>{shape.label}</span>
          </button>
        ))}
      </div>

      <div
        id="color-panel"
        className={`panel ${activePanel === 'color' ? 'visible' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <h3>Color</h3>
        <div className="color-grid">
          {COLORS.map((color) => (
            <div
              key={color}
              className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
              style={{ background: color }}
              data-color={color}
              onClick={() => handleColorSelection(color)}
            />
          ))}
        </div>
      </div>

      <div
        id="selection-pill"
        className={`${hasSelection ? 'active' : ''} ${rightPanelVisible ? '' : 'panel-hidden'}`}
      >
        {hasSelection ? 'Object selected' : 'No selection'}
      </div>
    </>
  );
};
