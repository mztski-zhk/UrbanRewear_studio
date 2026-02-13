export type Tool =
  | 'select' | 'brush' | 'eraser'
  | 'line' | 'rect' | 'circle' | 'triangle' | 'star' | 'arrow' | 'polygon'
  | 'text' | 'image';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface CanvasObject {
  id: string;
  type: Tool;
  x: number;
  y: number;
  visible: boolean;
  locked: boolean;
  name: string;
  opacity: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  // Line/brush
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  dash?: number[];
  tension?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  globalCompositeOperation?: string;
  // Shape
  width?: number;
  height?: number;
  radius?: number;
  innerRadius?: number;
  outerRadius?: number;
  sides?: number;
  fill?: string;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  // Image
  src?: string;
  // Arrow
  pointerLength?: number;
  pointerWidth?: number;
  // Group
  groupId?: string;
}

export interface DesignVersion {
  id: string;
  name: string;
  timestamp: number;
  objects: CanvasObject[];
  backgroundImage: string | null;
}

export const generateId = () => Math.random().toString(36).substring(2, 11);

export const getDash = (style: StrokeStyle, width: number): number[] => {
  switch (style) {
    case 'dashed': return [width * 3, width * 2];
    case 'dotted': return [width, width * 2];
    default: return [];
  }
};

export const PRESET_COLORS = [
  '#ffffff', '#e2e2e2', '#a0a0a0', '#505050', '#000000',
  '#ff4444', '#ff8844', '#ffcc00', '#44cc44', '#00cccc',
  '#4488ff', '#8844ff', '#cc44cc', '#ff44aa', '#884400',
];

export const FONT_FAMILIES = [
  'Arial', 'Georgia', 'Courier New', 'Verdana', 'Impact',
  'Trebuchet MS', 'Comic Sans MS', 'Times New Roman',
];
