import { useCanvas } from '@/contexts/CanvasContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const LayersPanel = () => {
  const {
    objects, showLayers, setShowLayers, selectedIds, setSelectedIds,
    moveLayerUp, moveLayerDown, toggleVisibility, toggleLock, setTool,
  } = useCanvas();

  const handleSelect = (id: string) => {
    setSelectedIds([id]);
    setTool('select');
  };

  return (
    <Sheet open={showLayers} onOpenChange={setShowLayers}>
      <SheetContent side="right" className="w-64 bg-card border-border p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-sm">Layers ({objects.length})</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="px-2 pb-4 space-y-1">
            {[...objects].reverse().map(obj => (
              <div
                key={obj.id}
                onClick={() => handleSelect(obj.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                  selectedIds.includes(obj.id) ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                <span className="flex-1 truncate">{obj.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); toggleVisibility(obj.id); }}>
                  {obj.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); toggleLock(obj.id); }}>
                  {obj.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveLayerUp(obj.id); }}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveLayerDown(obj.id); }}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {objects.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No layers yet</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default LayersPanel;
