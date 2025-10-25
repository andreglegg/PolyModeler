import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
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

  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    // Clean canvas container before initializing renderer to avoid duplicates in dev mode.
    canvasRef.current.innerHTML = '';
    const polyModeler = new PolyModeler(canvasRef.current);
    polyModelerRef.current = polyModeler;

    return () => {
      polyModelerRef.current = null;
      canvasRef.current?.replaceChildren();
    };
  }, []);

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
      setHasSelection(Boolean(modelEvent.detail?.model));
    };

    window.addEventListener(EventNames.MODEL_SELECTED, handleModelSelected as EventListener);
    return () => {
      window.removeEventListener(EventNames.MODEL_SELECTED, handleModelSelected as EventListener);
    };
  }, []);

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

    const mesh = polyModeler.addPrimitive(shape);
    polyModeler.selectModel(mesh);
    closeAll();
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
  };

  const handleDelete = (): void => {
    polyModelerRef.current?.deleteSelected();
    closeAll();
  };

  const handleExport = (): void => {
    polyModelerRef.current?.downloadOBJ();
  };

  const handleWireframeToggle = (): void => {
    setWireframe(!wireframe);
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

      <div id="info">
        <h3>PolyModeler</h3>
        <p>Click to select</p>
        <p>Drag to orbit</p>
        <p>Scroll to zoom</p>
        <div id="selection-info" className={hasSelection ? '' : 'empty'}>
          {hasSelection ? 'Object selected' : 'No selection'}
        </div>
      </div>
    </>
  );
};
