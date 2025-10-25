import { SHAPES } from '../constants';
import type { PrimitiveType } from '../../engine';

interface ShapesPanelProps {
  visible: boolean;
  onAddShape: (type: PrimitiveType) => void;
  onClose: () => void;
}

export const ShapesPanel = ({ visible, onAddShape, onClose }: ShapesPanelProps) => (
  <div id="shapes-panel" className={`panel ${visible ? 'visible' : ''}`}>
    <h3>Add Shape</h3>
    {SHAPES.map((shape) => (
      <button
        key={shape.type}
        className="shape-btn"
        data-shape={shape.type}
        onClick={() => {
          onAddShape(shape.type);
          onClose();
        }}
      >
        <span>{shape.icon}</span>
        <span>{shape.label}</span>
      </button>
    ))}
  </div>
);
