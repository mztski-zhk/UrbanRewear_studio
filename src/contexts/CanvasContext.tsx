import React, { createContext, useContext, useReducer, useState, useCallback, useRef, useEffect } from 'react';
import { CanvasObject, DesignVersion, Tool, StrokeStyle, generateId } from '@/types/canvas';

interface HistoryState {
  past: CanvasObject[][];
  present: CanvasObject[];
  future: CanvasObject[][];
}

type HistoryAction =
  | { type: 'PUSH'; objects: CanvasObject[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET'; objects: CanvasObject[] }
  | { type: 'LOAD'; objects: CanvasObject[] };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'PUSH':
      return { past: [...state.past, state.present], present: action.objects, future: [] };
    case 'UNDO':
      if (state.past.length === 0) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
    case 'REDO':
      if (state.future.length === 0) return state;
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
    case 'SET':
      return { ...state, present: action.objects };
    case 'LOAD':
      return { past: [], present: action.objects, future: [] };
    default:
      return state;
  }
}

interface CanvasContextType {
  tool: Tool;
  setTool: (t: Tool) => void;
  strokeColor: string;
  setStrokeColor: (c: string) => void;
  fillColor: string;
  setFillColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  strokeStyle: StrokeStyle;
  setStrokeStyle: (s: StrokeStyle) => void;
  sloppiness: number;
  setSloppiness: (s: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontStyle: string;
  setFontStyle: (s: string) => void;
  objects: CanvasObject[];
  pushHistory: (objs: CanvasObject[]) => void;
  setObjectsDirect: (objs: CanvasObject[]) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  backgroundImage: string | null;
  setBackgroundImage: (src: string | null) => void;
  mode: 'design' | 'preview';
  setMode: (m: 'design' | 'preview') => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  reflectHorizontal: () => void;
  reflectVertical: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  save: () => void;
  exportPNG: () => void;
  exportJSON: () => void;
  importJSON: (json: string) => void;
  versions: DesignVersion[];
  saveVersion: () => void;
  loadVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  recentColors: string[];
  addRecentColor: (c: string) => void;
  showLayers: boolean;
  setShowLayers: (s: boolean) => void;
  showVersions: boolean;
  setShowVersions: (s: boolean) => void;
  stageRef: React.MutableRefObject<any>;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used within CanvasProvider');
  return ctx;
};

export const CanvasProvider = ({ children }: { children: React.ReactNode }) => {
  const [historyState, dispatch] = useReducer(historyReducer, { past: [], present: [], future: [] });
  const objects = historyState.present;

  const [tool, setTool] = useState<Tool>('select');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [strokeStyle, setStrokeStyle] = useState<StrokeStyle>('solid');
  const [sloppiness, setSloppiness] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontStyle, setFontStyle] = useState('normal');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'design' | 'preview'>('design');
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showLayers, setShowLayers] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const stageRef = useRef<any>(null);

  const pushHistory = useCallback((newObjects: CanvasObject[]) => {
    dispatch({ type: 'PUSH', objects: newObjects });
  }, []);

  const setObjectsDirect = useCallback((newObjects: CanvasObject[]) => {
    dispatch({ type: 'SET', objects: newObjects });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const addRecentColor = useCallback((color: string) => {
    setRecentColors(prev => [color, ...prev.filter(c => c !== color)].slice(0, 10));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(objects.filter(o => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  }, [objects, selectedIds, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const dupes = objects.filter(o => selectedIds.includes(o.id)).map(o => ({
      ...o, id: generateId(), x: o.x + 20, y: o.y + 20, name: o.name + ' copy',
    }));
    pushHistory([...objects, ...dupes]);
    setSelectedIds(dupes.map(d => d.id));
  }, [objects, selectedIds, pushHistory]);

  const reflectHorizontal = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(objects.map(o => selectedIds.includes(o.id) ? { ...o, scaleX: (o.scaleX || 1) * -1 } : o));
  }, [objects, selectedIds, pushHistory]);

  const reflectVertical = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(objects.map(o => selectedIds.includes(o.id) ? { ...o, scaleY: (o.scaleY || 1) * -1 } : o));
  }, [objects, selectedIds, pushHistory]);

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const gid = generateId();
    pushHistory(objects.map(o => selectedIds.includes(o.id) ? { ...o, groupId: gid } : o));
  }, [objects, selectedIds, pushHistory]);

  const ungroupSelected = useCallback(() => {
    pushHistory(objects.map(o => selectedIds.includes(o.id) ? { ...o, groupId: undefined } : o));
  }, [objects, selectedIds, pushHistory]);

  const moveLayerUp = useCallback((id: string) => {
    const idx = objects.findIndex(o => o.id === id);
    if (idx >= objects.length - 1) return;
    const arr = [...objects];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    pushHistory(arr);
  }, [objects, pushHistory]);

  const moveLayerDown = useCallback((id: string) => {
    const idx = objects.findIndex(o => o.id === id);
    if (idx <= 0) return;
    const arr = [...objects];
    [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];
    pushHistory(arr);
  }, [objects, pushHistory]);

  const toggleVisibility = useCallback((id: string) => {
    pushHistory(objects.map(o => o.id === id ? { ...o, visible: !o.visible } : o));
  }, [objects, pushHistory]);

  const toggleLock = useCallback((id: string) => {
    pushHistory(objects.map(o => o.id === id ? { ...o, locked: !o.locked } : o));
  }, [objects, pushHistory]);

  const save = useCallback(() => {
    localStorage.setItem('urbanrewear_save', JSON.stringify({ objects, backgroundImage }));
  }, [objects, backgroundImage]);

  const exportPNG = useCallback(() => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'urbanrewear-design.png';
    link.href = uri;
    link.click();
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ objects, backgroundImage }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'urbanrewear-design.json';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, [objects, backgroundImage]);

  const importJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.objects) dispatch({ type: 'LOAD', objects: data.objects });
      if (data.backgroundImage) setBackgroundImage(data.backgroundImage);
    } catch (e) { console.error('Import failed', e); }
  }, []);

  const saveVersion = useCallback(() => {
    const v: DesignVersion = {
      id: generateId(), name: `Version ${versions.length + 1}`,
      timestamp: Date.now(), objects: structuredClone(objects), backgroundImage,
    };
    const newV = [...versions, v];
    setVersions(newV);
    localStorage.setItem('urbanrewear_versions', JSON.stringify(newV));
  }, [objects, backgroundImage, versions]);

  const loadVersion = useCallback((id: string) => {
    const v = versions.find(ver => ver.id === id);
    if (!v) return;
    dispatch({ type: 'LOAD', objects: v.objects });
    setBackgroundImage(v.backgroundImage);
  }, [versions]);

  const deleteVersion = useCallback((id: string) => {
    const newV = versions.filter(v => v.id !== id);
    setVersions(newV);
    localStorage.setItem('urbanrewear_versions', JSON.stringify(newV));
  }, [versions]);

  // Load saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('urbanrewear_save');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.objects?.length) dispatch({ type: 'LOAD', objects: data.objects });
        if (data.backgroundImage) setBackgroundImage(data.backgroundImage);
      }
      const sv = localStorage.getItem('urbanrewear_versions');
      if (sv) setVersions(JSON.parse(sv));
    } catch (e) { console.error('Load failed', e); }
  }, []);

  // Auto-save
  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem('urbanrewear_save', JSON.stringify({ objects, backgroundImage }));
    }, 30000);
    return () => clearInterval(t);
  }, [objects, backgroundImage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
        if (e.key === 's') { e.preventDefault(); save(); }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIds, deleteSelected, save]);

  const value: CanvasContextType = {
    tool, setTool, strokeColor, setStrokeColor, fillColor, setFillColor,
    strokeWidth, setStrokeWidth, opacity, setOpacity, strokeStyle, setStrokeStyle,
    sloppiness, setSloppiness, fontSize, setFontSize, fontFamily, setFontFamily,
    fontStyle, setFontStyle, objects, pushHistory, setObjectsDirect,
    selectedIds, setSelectedIds, backgroundImage, setBackgroundImage,
    mode, setMode, undo, redo, canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0, deleteSelected, duplicateSelected,
    reflectHorizontal, reflectVertical, groupSelected, ungroupSelected,
    moveLayerUp, moveLayerDown, toggleVisibility, toggleLock,
    save, exportPNG, exportJSON, importJSON,
    versions, saveVersion, loadVersion, deleteVersion,
    recentColors, addRecentColor, showLayers, setShowLayers,
    showVersions, setShowVersions, stageRef,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};
