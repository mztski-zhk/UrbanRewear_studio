import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserObjects, type ClothObject, ApiError } from '@/services/api';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ShirtIcon, AlertTriangle } from 'lucide-react';

interface ObjectsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ObjectsPanel = ({ open, onOpenChange }: ObjectsPanelProps) => {
  const { token, user, isAuthenticated } = useAuth();
  const [objects, setObjects] = useState<ClothObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = useCallback(async () => {
    if (!token || !user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUserObjects(user.uid, token);
      setObjects(res.objects ?? []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load objects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (open && isAuthenticated) {
      fetchObjects();
    }
  }, [open, isAuthenticated, fetchObjects]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 sm:w-80 bg-card border-border p-0">
        <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <SheetTitle className="text-sm">My Clothes</SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchObjects}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="px-3 pb-4 space-y-2">
            {!isAuthenticated && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Log in to view your analyzed clothes.</p>
              </div>
            )}

            {isAuthenticated && loading && objects.length === 0 && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {isAuthenticated && error && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive/60" />
                <p className="text-xs text-destructive">{error}</p>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={fetchObjects}>
                  Retry
                </Button>
              </div>
            )}

            {isAuthenticated && !loading && !error && objects.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-12">
                No analyzed clothes yet. Use the AI panel to analyze your first garment.
              </p>
            )}

            {objects.map(obj => (
              <ObjectCard key={obj.id} obj={obj} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const ObjectCard = ({ obj }: { obj: ClothObject }) => {
  const status = obj.cloth_status;
  const createdDate = new Date(obj.created_at).toLocaleDateString();

  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary shrink-0">
          <ShirtIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {status.cloth_type || 'Unknown type'}
          </p>
          <p className="text-[10px] text-muted-foreground">{status.cloth_fabric || 'Unknown fabric'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {status.is_dirty_or_damaged && (
          <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Damaged</Badge>
        )}
        {status.suitable_for_redesign && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/15 text-primary border-0">Redesign</Badge>
        )}
        {status.suitable_for_upcycling && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-accent/15 text-accent border-0">Upcycle</Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{obj.file_available?.length ?? 0} file(s)</span>
        <span>{createdDate}</span>
      </div>
      <p className="text-[9px] text-muted-foreground font-mono truncate">ID: {obj.id.slice(0, 12)}...</p>
    </div>
  );
};

export default ObjectsPanel;
