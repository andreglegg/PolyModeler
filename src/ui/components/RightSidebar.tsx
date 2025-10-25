import type { ReactNode } from 'react';
import type { CollapsedSections, HierarchyNode, MaterialState, SelectionProperties } from '../types';

interface RightSidebarProps {
  visible: boolean;
  onToggleVisibility(): void;
  collapsedSections: CollapsedSections;
  onToggleSection: (section: keyof CollapsedSections) => void;
  hasSelection: boolean;
  selectionProperties: SelectionProperties | null;
  onPropertyChange: (group: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: string) => void;
  materialState: MaterialState;
  onMaterialColorChange: (color: string) => void;
  onMaterialPropChange: (prop: 'roughness' | 'metalness' | 'emissiveIntensity', value: number) => void;
  onEmissiveColorChange: (color: string) => void;
  wireframe: boolean;
  onWireframeChange: (checked: boolean) => void;
  hierarchy: HierarchyNode[];
  collapsedNodes: Record<string, boolean>;
  onToggleHierarchyNode: (id: string) => void;
  onSelectHierarchyNode: (id: string) => void;
  selectedMeshId: string | null;
}

export const RightSidebar = ({
  visible,
  onToggleVisibility,
  collapsedSections,
  onToggleSection,
  hasSelection,
  selectionProperties,
  onPropertyChange,
  materialState,
  onMaterialColorChange,
  onMaterialPropChange,
  onEmissiveColorChange,
  wireframe,
  onWireframeChange,
  hierarchy,
  collapsedNodes,
  onToggleHierarchyNode,
  onSelectHierarchyNode,
  selectedMeshId,
}: RightSidebarProps) => {
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
                onClick={() => onToggleHierarchyNode(node.id)}
              >
                {collapsed ? '▸' : '▾'}
              </button>
            ) : (
              <span className="hierarchy-toggle placeholder" />
            )}
            <button
              type="button"
              className="hierarchy-label"
              onClick={() => onSelectHierarchyNode(node.id)}
            >
              {node.label}
            </button>
            {hasChildren ? <span className="hierarchy-count">{node.children.length}</span> : null}
            <div className="hierarchy-actions">
              <button type="button" className="hierarchy-action" disabled title="Rename (coming soon)">
                ✎
              </button>
              <button type="button" className="hierarchy-action" disabled title="Duplicate (coming soon)">
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

  return (
    <div id="side-panel-container" onClick={(event) => event.stopPropagation()}>
      <div className={`side-panel-shell ${visible ? 'visible' : 'collapsed'}`}>
        <div id="side-panel">
          <div className="side-panel-header">
            <h3>Scene Panel</h3>
            <button
              className="side-panel-close"
              onClick={(event) => {
                event.stopPropagation();
                onToggleVisibility();
              }}
              aria-label={visible ? 'Hide side panel' : 'Show side panel'}
            >
              ✕
            </button>
          </div>

          <section className="panel-section">
            <button className="section-header" onClick={() => onToggleSection('instructions')} type="button">
              <span>Instructions</span>
              <span className={`section-arrow ${collapsedSections.instructions ? 'collapsed' : ''}`}>▾</span>
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
            <button className="section-header" onClick={() => onToggleSection('properties')} type="button">
              <span>Properties</span>
              <span className={`section-arrow ${collapsedSections.properties ? 'collapsed' : ''}`}>▾</span>
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
                          onChange={(event) => onPropertyChange('position', axis, event.target.value)}
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
                          onChange={(event) => onPropertyChange('rotation', axis, event.target.value)}
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
                          onChange={(event) => onPropertyChange('scale', axis, event.target.value)}
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
            <button className="section-header" onClick={() => onToggleSection('materials')} type="button">
              <span>Materials</span>
              <span className={`section-arrow ${collapsedSections.materials ? 'collapsed' : ''}`}>▾</span>
            </button>
            <div className={`section-body ${collapsedSections.materials ? 'collapsed' : ''}`}>
              <div className="property-group">
                <span className="property-label">Base</span>
                <label className="material-row">
                  <span>Color</span>
                  <input
                    type="color"
                    value={materialState.baseColor}
                    disabled={!hasSelection}
                    onChange={(event) => onMaterialColorChange(event.target.value)}
                  />
                </label>
                <label className="material-row material-checkbox">
                  <input
                    type="checkbox"
                    checked={wireframe}
                    onChange={(event) => onWireframeChange(event.target.checked)}
                  />
                  <span>Wireframe</span>
                </label>
              </div>

              <div className="property-group">
                <span className="property-label">Physical</span>
                {materialState.supportsStandard ? (
                  <>
                    <label className="material-slider">
                      <div className="material-slider-header">
                        <span>Roughness</span>
                        <span>{materialState.roughness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={materialState.roughness}
                        onChange={(event) =>
                          onMaterialPropChange('roughness', Number(event.target.value))
                        }
                      />
                    </label>
                    <label className="material-slider">
                      <div className="material-slider-header">
                        <span>Metalness</span>
                        <span>{materialState.metalness.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={materialState.metalness}
                        onChange={(event) =>
                          onMaterialPropChange('metalness', Number(event.target.value))
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
                {materialState.supportsStandard ? (
                  <>
                    <label className="material-row">
                      <span>Color</span>
                      <input
                        type="color"
                        value={materialState.emissive}
                        onChange={(event) => onEmissiveColorChange(event.target.value)}
                      />
                    </label>
                    <label className="material-slider">
                      <div className="material-slider-header">
                        <span>Intensity</span>
                        <span>{materialState.emissiveIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.05}
                        value={materialState.emissiveIntensity}
                        onChange={(event) =>
                          onMaterialPropChange('emissiveIntensity', Number(event.target.value))
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
            <button className="section-header" onClick={() => onToggleSection('hierarchy')} type="button">
              <span>Hierarchy</span>
              <span className={`section-arrow ${collapsedSections.hierarchy ? 'collapsed' : ''}`}>▾</span>
            </button>
            <div className={`section-body ${collapsedSections.hierarchy ? 'collapsed' : ''}`}>
              {hierarchy.length > 0 ? (
                <ul className="hierarchy-list root">{renderHierarchyNodes(hierarchy)}</ul>
              ) : (
                <p className="panel-empty">Scene hierarchy coming soon</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <button
        className={`side-panel-toggle ${visible ? 'expanded' : 'collapsed'}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleVisibility();
        }}
        aria-label={visible ? 'Hide side panel' : 'Show side panel'}
      >
        <span className="toggle-icon">{visible ? '›' : '‹'}</span>
      </button>
    </div>
  );
};
