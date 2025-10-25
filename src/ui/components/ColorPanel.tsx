import { PALETTE } from '../constants';

interface ColorPanelProps {
  visible: boolean;
  selectedColor: string | null;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

export const ColorPanel = ({ visible, selectedColor, onSelectColor, onClose }: ColorPanelProps) => (
  <div id="color-panel" className={`panel ${visible ? 'visible' : ''}`}>
    <h3>Color</h3>
    <div className="color-grid">
      {PALETTE.map((color) => (
        <div
          key={color}
          className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
          style={{ background: color }}
          data-color={color}
          onClick={() => {
            onSelectColor(color);
            onClose();
          }}
        />
      ))}
    </div>
  </div>
);
