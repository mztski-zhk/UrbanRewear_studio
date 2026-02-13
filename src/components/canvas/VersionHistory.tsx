import { useCanvas } from '@/contexts/CanvasContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, RotateCcw, Plus } from 'lucide-react';

const VersionHistory = () => {
  const { versions, showVersions, setShowVersions, saveVersion, loadVersion, deleteVersion } = useCanvas();

  return (
    <Dialog open={showVersions} onOpenChange={setShowVersions}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center justify-between">
            Version History
            <Button size="sm" variant="secondary" onClick={saveVersion} className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Save Version
            </Button>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2">
            {versions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No saved versions yet</p>
            )}
            {[...versions].reverse().map(v => (
              <div key={v.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50 text-xs">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-muted-foreground">{new Date(v.timestamp).toLocaleString()}</p>
                  <p className="text-muted-foreground">{v.objects.length} objects</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { loadVersion(v.id); setShowVersions(false); }}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteVersion(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default VersionHistory;
