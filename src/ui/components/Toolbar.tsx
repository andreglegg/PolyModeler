import type { MutableRefObject } from 'react';
import type { UIPanel } from '../../store/uiStore';

interface ToolbarProps {
  activePanel: UIPanel;
  transformMenuOpen: boolean;
  transformEnabled: boolean;
  currentTransformMode: 'translate' | 'rotate' | 'scale';
  wireframe: boolean;
  onToggleShapes(): void;
  onToggleTransform(): void;
  onToggleColor(): void;
  onTransformMode(mode: 'translate' | 'rotate' | 'scale'): void;
  onWireframeToggle(): void;
  onDelete(): void;
  onExport(): void;
  transformMenuClass: string;
  transformGroupRef: MutableRefObject<HTMLDivElement | null>;
}

export const Toolbar = ({
  activePanel,
  transformMenuOpen,
  transformEnabled,
  currentTransformMode,
  wireframe,
  onToggleShapes,
  onToggleTransform,
  onToggleColor,
  onTransformMode,
  onWireframeToggle,
  onDelete,
  onExport,
  transformMenuClass,
  transformGroupRef,
}: ToolbarProps) => (
  <div id="toolbar">
    <button
      className={`btn ${activePanel === 'shapes' ? 'active' : ''}`}
      id="btn-shapes"
      title="Add Shape"
      onClick={(event) => {
        event.stopPropagation();
        onToggleShapes();
      }}
    >
      ➕
    </button>

    <div className="toolbar-group" id="transform-group" ref={transformGroupRef}>
      <button
        className={`btn ${transformMenuOpen || transformEnabled ? 'active' : ''}`}
        id="btn-transform"
        title="Transform"
        onClick={(event) => {
          event.stopPropagation();
          onToggleTransform();
        }}
      >
        ↔️
      </button>
      <div id="transform-menu" className={transformMenuClass}>
        <button
          className={`dropdown-item ${transformEnabled && currentTransformMode === 'translate' ? 'active' : ''}`}
          data-mode="translate"
          onClick={() => onTransformMode('translate')}
        >
          Move
        </button>
        <button
          className={`dropdown-item ${transformEnabled && currentTransformMode === 'rotate' ? 'active' : ''}`}
          data-mode="rotate"
          onClick={() => onTransformMode('rotate')}
        >
          Rotate
        </button>
        <button
          className={`dropdown-item ${transformEnabled && currentTransformMode === 'scale' ? 'active' : ''}`}
          data-mode="scale"
          onClick={() => onTransformMode('scale')}
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
        onToggleColor();
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
        onWireframeToggle();
      }}
    >
      ◻️
    </button>

    <button className="btn" id="btn-delete" title="Delete" onClick={onDelete}>
      🗑️
    </button>

    <button className="btn" id="btn-export" title="Export OBJ" onClick={onExport}>
      💾
    </button>
  </div>
);
