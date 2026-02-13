import { useCanvas } from '@/contexts/CanvasContext';
import { Tool } from '@/types/canvas';
import {
  MousePointer2, Paintbrush, Eraser, Minus, Square,
  Circle, Triangle, Star, MoveRight, Hexagon, Type, ImagePlus,
} from 'lucide-react';
import ToolOptions from './ToolOptions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'brush', icon: Paintbrush, label: 'Brush' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'rect', icon: Square, label: 'Rect' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: ImagePlus, label: 'Image' },
];

const BottomPanel = () => {
  const { tool, setTool } = useCanvas();

  return (
    <div className="shrink-0 border-t border-border bg-card">
      <ToolOptions />
      <ScrollArea className="w-full">
        <div className="flex gap-1 px-2 py-2 justify-center">
          {TOOLS.map(t => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[44px] ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] leading-none">{t.label}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default BottomPanel;
