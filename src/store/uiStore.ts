import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type TransformMode = 'translate' | 'rotate' | 'scale';
export type UIPanel = 'shapes' | 'color' | null;

export interface UIState {
  transformMode: TransformMode;
  wireframe: boolean;
  activePanel: UIPanel;
  transformMenuOpen: boolean;
  hasSelection: boolean;
  transformEnabled: boolean;
  rightPanelVisible: boolean;
  hierarchyCollapsed: boolean;
  setTransformMode: (mode: TransformMode) => void;
  togglePanel: (panel: Exclude<UIPanel, null>) => void;
  closePanels: () => void;
  setWireframe: (enabled: boolean) => void;
  toggleTransformMenu: () => void;
  closeTransformMenu: () => void;
  closeAll: () => void;
  setHasSelection: (hasSelection: boolean) => void;
  setTransformEnabled: (enabled: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelVisible: (visible: boolean) => void;
  toggleHierarchyCollapsed: () => void;
}

export const useUIStore = create(
  subscribeWithSelector<UIState>((set, get) => ({
    transformMode: 'translate',
    wireframe: false,
    activePanel: null,
    transformMenuOpen: false,
    hasSelection: false,
    transformEnabled: false,
    rightPanelVisible: true,
    hierarchyCollapsed: false,
    setTransformMode: (mode) => {
      set({
        transformMode: mode,
        transformMenuOpen: false,
      });
    },
    togglePanel: (panel) => {
      const { activePanel } = get();
      set({
        activePanel: activePanel === panel ? null : panel,
        transformMenuOpen: false,
      });
    },
    closePanels: () => {
      set({ activePanel: null });
    },
    setWireframe: (enabled) => {
      set({ wireframe: enabled });
    },
    toggleTransformMenu: () => {
      const { transformMenuOpen } = get();
      set({
        transformMenuOpen: !transformMenuOpen,
        activePanel: null,
      });
    },
    closeTransformMenu: () => {
      set({ transformMenuOpen: false });
    },
    closeAll: () => {
      set({
        activePanel: null,
        transformMenuOpen: false,
      });
    },
    setHasSelection: (hasSelection) => {
      set((state) => ({
        hasSelection,
        transformMenuOpen: hasSelection ? state.transformMenuOpen : false,
        transformEnabled: hasSelection ? state.transformEnabled : false,
      }));
    },
    setTransformEnabled: (enabled) => {
      set({ transformEnabled: enabled });
    },
    toggleRightPanel: () => {
      set((state) => ({ rightPanelVisible: !state.rightPanelVisible }));
    },
    setRightPanelVisible: (visible) => {
      set({ rightPanelVisible: visible });
    },
    toggleHierarchyCollapsed: () => {
      set((state) => ({ hierarchyCollapsed: !state.hierarchyCollapsed }));
    },
  }))
);
