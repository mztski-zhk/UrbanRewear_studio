import { useState, useEffect, useMemo } from 'react';
import { getUserObjects, type ClothObject, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Shirt,
  Package,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Recycle,
  Paintbrush,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ObjectsGalleryProps {
  trigger?: React.ReactNode;
}

const ObjectsGallery = ({ trigger }: ObjectsGalleryProps) => {
  const guestId = useMemo(() => {
    const key = 'ur_guest_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  }, []);
  const guestToken = useMemo(() => {
    const key = 'ur_guest_token';
    let token = sessionStorage.getItem(key);
    if (!token) {
      token = `guest_${crypto.randomUUID()}`;
      sessionStorage.setItem(key, token);
    }
    return token;
  }, []);
  const [open, setOpen] = useState(false);
  const [objects, setObjects] = useState<ClothObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserObjects(guestId, guestToken);
      setObjects(response.objects || []);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load objects';
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchObjects();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Package className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Analyzed Clothes
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchObjects}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-2">
          {loading && objects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading your clothes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchObjects}>
                Try Again
              </Button>
            </div>
          ) : objects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Shirt className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                No analyzed clothes yet.<br />
                Upload images in the AI tab to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {objects.map((obj) => (
                <ClothCard key={obj.id} cloth={obj} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const ClothCard = ({ cloth }: { cloth: ClothObject }) => {
  const status = cloth.cloth_status;
  
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
            <Shirt className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {status?.cloth_type || 'Unknown Type'}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {cloth.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        {status?.is_dirty_or_damaged ? (
          <Badge variant="destructive" className="text-[10px] h-5">
            <XCircle className="h-3 w-3 mr-1" />
            Damaged
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] h-5 bg-accent/20 text-accent">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Good
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span>Fabric:</span>
          <span className="text-foreground font-medium">
            {status?.cloth_fabric || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span>Files:</span>
          <span className="text-foreground font-medium">
            {cloth.file_available?.length || 0}
          </span>
        </div>
      </div>

      {/* Suitability badges */}
      <div className="flex flex-wrap gap-1.5">
        {status?.suitable_for_redesign && (
          <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
            <Paintbrush className="h-3 w-3 mr-1" />
            Redesign
          </Badge>
        )}
        {status?.suitable_for_upcycling && (
          <Badge variant="outline" className="text-[10px] h-5 border-accent/30 text-accent">
            <Recycle className="h-3 w-3 mr-1" />
            Upcycle
          </Badge>
        )}
        {status?.is_dirty_or_damaged && status?.damage_description && (
          <Badge variant="outline" className="text-[10px] h-5 border-destructive/30 text-destructive">
            {status.damage_description}
          </Badge>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
        <Calendar className="h-3 w-3" />
        {cloth.created_at
          ? format(new Date(cloth.created_at), 'MMM d, yyyy HH:mm')
          : 'Unknown date'}
      </div>
    </div>
  );
};

export default ObjectsGallery;
