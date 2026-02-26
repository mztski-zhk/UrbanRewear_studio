import { useState } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import { Tool } from '@/types/canvas';
import {
  MousePointer2, Paintbrush, Eraser, Minus, Square,
  Circle, Triangle, Star, MoveRight, Hexagon, Type, ImagePlus, ChevronUp,
} from 'lucide-react';
import ToolOptions from './ToolOptions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SHAPE_TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'rect', icon: Square, label: 'Rect' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'star', icon: Star, label: 'Star' },
  { id: 'polygon', icon: Hexagon, label: 'Polygon' },
];

const TOOLS: { id: Tool | 'shapes'; icon: any; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'brush', icon: Paintbrush, label: 'Brush' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'shapes', icon: Square, label: 'Shapes' },
  { id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: ImagePlus, label: 'Image' },
];

const BottomPanel = () => {
  const { tool, setTool } = useCanvas();
  const [shapesOpen, setShapesOpen] = useState(false);
  const activeShape = SHAPE_TOOLS.find(s => s.id === tool);
  const ShapeIcon = activeShape?.icon || Square;

  const isShapeTool = SHAPE_TOOLS.some(s => s.id === tool);

  return (
    <div className="shrink-0 border-t border-border bg-card safe-area-bottom">
      <ToolOptions />
      <div className="flex gap-0.5 px-1 py-1.5 justify-center overflow-x-auto">
        {TOOLS.map(t => {
          if (t.id === 'shapes') {
            const active = isShapeTool;
            return (
              <Popover key="shapes" open={shapesOpen} onOpenChange={setShapesOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[40px] ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <ShapeIcon className="h-4 w-4" />
                    <span className="text-[9px] leading-none flex items-center gap-0.5">
                      {activeShape?.label || 'Shapes'} <ChevronUp className="h-2 w-2" />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-auto p-1" align="center">
                  <div className="flex gap-0.5">
                    {SHAPE_TOOLS.map(s => {
                      const SIcon = s.icon;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setTool(s.id); setShapesOpen(false); }}
                          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[40px] ${
                            tool === s.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          <SIcon className="h-4 w-4" />
                          <span className="text-[9px] leading-none">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          const Icon = t.icon;
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id as Tool)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[40px] ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px] leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomPanel;
