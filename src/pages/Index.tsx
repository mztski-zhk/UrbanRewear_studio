// UrbanRewear Studio - Main Page
import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import TopToolbar from '@/components/canvas/TopToolbar';
import CanvasStage from '@/components/canvas/CanvasStage';
import BottomPanel from '@/components/canvas/BottomPanel';
import LayersPanel from '@/components/canvas/LayersPanel';
import VersionHistory from '@/components/canvas/VersionHistory';
import ObjectsGallery from '@/components/canvas/ObjectsGallery';
import SearchPanel from '@/components/canvas/SearchPanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Shirt,
  Recycle,
  Paintbrush,
  Package,
  Search,
  Image as ImageIcon,
  FileImage,
  Trash2,
  History,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { analyzeCloth, redesignCloth, type ClothCondition, getClothDetails, type RedesignResult, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

// Error Boundary component to prevent blank page crashes
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[v0] Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please refresh the page to continue
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Props for image preview component
interface ImagePreviewProps {
  file: File | null;
  label: string;
  onClear: () => void;
}

const ImagePreview = ({ file, label, onClear }: ImagePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  if (!file) return null;

  return (
    <div className="relative group">
      <img
        src={preview || ''}
        alt={label}
        className="w-full h-24 object-cover rounded-md border border-border"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 hover:bg-background"
          onClick={onClear}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <Badge
        variant="secondary"
        className="absolute bottom-1 left-1 text-[9px] h-4 bg-background/80"
      >
        {label}
      </Badge>
    </div>
  );
};

const AIPreview = () => {
  const { stageRef } = useCanvas();
  const guestId = useMemo(() => {
    const key = 'ur_guest_id';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    return id;
  }, []);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'analyze' | 'redesign' | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ClothCondition | null>(null);
  const [redesignResult, setRedesignResult] = useState<RedesignResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<ClothCondition[]>([]);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const afterFrontRef = useRef<HTMLInputElement>(null);
  const afterBackRef = useRef<HTMLInputElement>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [afterFrontFile, setAfterFrontFile] = useState<File | null>(null);
  const [afterBackFile, setAfterBackFile] = useState<File | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    if (stageRef.current && stageRef.current !== null) {
      try {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        if (dataUrl && dataUrl.length > 0) {
          setPreviewImage(dataUrl);
        }
      } catch (error) {
        // Silently fail
        // Silently fail - don't crash the app
      }
    }
  }, [stageRef]);

  // Simulate progress for better UX
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleAnalyze = useCallback(async () => {
    if (!frontFile || !backFile) {
      toast({
        title: 'Missing data',
        description: 'Please upload front and back images.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setLoadingAction('analyze');
    setAnalysisResult(null);
    try {
      const userId = guestId;
      const result = await analyzeCloth(userId, frontFile, backFile, null, useLocal);

      setAnalysisResult(result);
      if (getClothDetails(result)) {
        setAnalysisHistory(prev => [result, ...prev].slice(0, 5));
      }
      toast({
        title: 'Analysis complete',
        description: typeof result?.condition === 'string'
          ? result.condition
          : `Type: ${getClothDetails(result)?.cloth_type || 'Unknown'}`,
      });
    } catch (err) {

      const apiError = err instanceof ApiError ? err : null;
      toast({
        title: 'Analysis failed',
        description: apiError?.message || (err instanceof Error ? err.message : 'An error occurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }, [frontFile, backFile, useLocal, guestId]);

  const handleRedesign = useCallback(async () => {
    if (!frontFile || !backFile) {
      toast({
        title: 'Missing data',
        description: 'Please upload before images first.',
        variant: 'destructive',
      });
      return;
    }
    // For local AI, we need a file_id from a previous analysis
    if (useLocal && !analysisResult?.file_id) {
      toast({
        title: 'Analysis required',
        description: 'Please analyze the cloth first when using local AI.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setLoadingAction('redesign');
    setRedesignResult(null);
    try {
      const userId = guestId;
      const result = await redesignCloth(
        userId,
        {
          before_front: frontFile,
          before_back: backFile,
          after_front: afterFrontFile || undefined,
          after_back: afterBackFile || undefined,
        },
        null,
        useLocal,
        useLocal ? analysisResult?.file_id : undefined
      );

      setRedesignResult(result);
      toast({
        title: 'Redesign complete',
        description: 'AI suggestions are ready!',
      });
    } catch (err) {

      const apiError = err instanceof ApiError ? err : null;
      toast({
        title: 'Redesign failed',
        description: apiError?.message || (err instanceof Error ? err.message : 'An error occurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }, [frontFile, backFile, afterFrontFile, afterBackFile, useLocal, analysisResult, guestId]);

  const clearAll = () => {
    setFrontFile(null);
    setBackFile(null);
    setAfterFrontFile(null);
    setAfterBackFile(null);
    setAnalysisResult(null);
    setRedesignResult(null);
    setAnalysisHistory([]);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {useLocal && (
              <Badge variant="outline" className="text-[10px] h-5">
                <Zap className="h-3 w-3 mr-1" />
                Local AI
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ObjectsGallery
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Package className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <SearchPanel
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              }
            />
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="space-y-1">
            <Progress value={progress} className="h-1" />
            <p className="text-[10px] text-muted-foreground text-center">
              {loadingAction === 'analyze' ? 'Analyzing cloth condition...' : 'Generating redesign suggestions...'}
            </p>
          </div>
        )}

        {/* Canvas preview */}
        {previewImage && (
          <div className="rounded-lg border border-border overflow-hidden">
            <img
              src={previewImage}
              alt="Design preview"
              className="w-full max-h-40 object-contain bg-muted/30"
            />
          </div>
        )}

        {/* Main tabs */}
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="analyze" className="flex-1 text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="redesign" className="flex-1 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Redesign
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-xs">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Analyze tab */}
          <TabsContent value="analyze" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Front Image</Label>
                {frontFile ? (
                  <ImagePreview
                    file={frontFile}
                    label="Front"
                    onClear={() => setFrontFile(null)}
                  />
                ) : (
                  <>
                    <input
                      ref={frontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full h-24 flex-col gap-1"
                      onClick={() => frontRef.current?.click()}
                    >
                      <FileImage className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload Front</span>
                    </Button>
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Back Image</Label>
                {backFile ? (
                  <ImagePreview
                    file={backFile}
                    label="Back"
                    onClear={() => setBackFile(null)}
                  />
                ) : (
                  <>
                    <input
                      ref={backRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      variant="outline"
                      className="w-full h-24 flex-col gap-1"
                      onClick={() => backRef.current?.click()}
                    >
                      <FileImage className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload Back</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLocal}
                  onChange={(e) => setUseLocal(e.target.checked)}
                  className="rounded"
                />
                <Zap className="h-3 w-3" />
                Use local AI (faster)
              </label>
              {(frontFile || backFile) && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={clearAll}>
                  Clear all
                </Button>
              )}
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={loading || !frontFile || !backFile}
              className="w-full gradient-bg text-primary-foreground"
            >
              {loadingAction === 'analyze' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Analyze Condition
            </Button>

            {/* Analysis result */}
            {analysisResult && (
              <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    Cloth Condition
                  </h4>
                  {analysisResult?.file_id && (
                    <Badge variant="outline" className="text-[9px] h-4 font-mono">
                      {analysisResult.file_id.slice(0, 8)}
                    </Badge>
                  )}
                </div>

                <div className="grid gap-2">

                  {/* Raw string condition fallback */}
                  {typeof analysisResult?.condition === 'string' ? (
                    <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Condition</p>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{analysisResult.condition}</p>
                    </div>
                  ) : (
                    <>
                  {/* Type + Fabric row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Type</p>
                      <p className="text-xs font-medium capitalize flex items-center gap-1">
                        <Shirt className="h-3 w-3 text-primary shrink-0" />
                        {getClothDetails(analysisResult)?.cloth_type || 'Unknown'}
                      </p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Fabric</p>
                      <p className="text-xs font-medium">{getClothDetails(analysisResult)?.cloth_fabric || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Color row */}
                  {getClothDetails(analysisResult)?.cloth_color && (
                    <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Color</p>
                      <p className="text-xs font-medium">{getClothDetails(analysisResult)!.cloth_color}</p>
                    </div>
                  )}

                  {/* Image side + is_cloth row */}
                  <div className="grid grid-cols-2 gap-2">
                    {getClothDetails(analysisResult)?.image && (
                      <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Image Side</p>
                        <p className="text-xs font-medium capitalize">{getClothDetails(analysisResult)!.image}</p>
                      </div>
                    )}
                    <div className="rounded-md bg-muted/50 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Is Cloth</p>
                      <p className="text-xs font-medium">
                        {getClothDetails(analysisResult)?.is_cloth ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {getClothDetails(analysisResult)?.suitable_for_redesign && (
                      <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-0">
                        <Paintbrush className="h-3 w-3 mr-1" />
                        Redesign Ready
                      </Badge>
                    )}
                    {getClothDetails(analysisResult)?.suitable_for_upcycling && (
                      <Badge className="text-[10px] h-5 bg-accent/10 text-accent border-0">
                        <Recycle className="h-3 w-3 mr-1" />
                        Upcycle Ready
                      </Badge>
                    )}
                    {getClothDetails(analysisResult)?.is_dirty_or_damaged ? (
                      <Badge variant="destructive" className="text-[10px] h-5">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Repair
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] h-5 bg-green-500/10 text-green-600 border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Good Condition
                      </Badge>
                    )}
                  </div>

                  {/* Damage description */}
                  {getClothDetails(analysisResult)?.damage_description && (
                    <div className="rounded-md bg-destructive/5 p-2 space-y-0.5">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Damage Notes</p>
                      <p className="text-[11px] text-muted-foreground">
                        {getClothDetails(analysisResult)!.damage_description}
                      </p>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Redesign tab */}
          <TabsContent value="redesign" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Before (Original)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {frontFile ? (
                    <ImagePreview
                      file={frontFile}
                      label="Front"
                      onClear={() => setFrontFile(null)}
                    />
                  ) : (
                    <>
                      <input
                        ref={frontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex-col gap-1"
                        onClick={() => frontRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-[9px]">Front</span>
                      </Button>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  {backFile ? (
                    <ImagePreview
                      file={backFile}
                      label="Back"
                      onClear={() => setBackFile(null)}
                    />
                  ) : (
                    <>
                      <input
                        ref={backRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-20 flex-col gap-1"
                        onClick={() => backRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="text-[9px]">Back</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">After (Optional - Your Redesign)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  {afterFrontFile ? (
                    <ImagePreview
                      file={afterFrontFile}
                      label="After Front"
                      onClear={() => setAfterFrontFile(null)}
                    />
                  ) : (
                    <>
                      <input
                        ref={afterFrontRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAfterFrontFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-16 flex-col gap-1 border-dashed"
                        onClick={() => afterFrontRef.current?.click()}
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span className="text-[9px]">After Front</span>
                      </Button>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  {afterBackFile ? (
                    <ImagePreview
                      file={afterBackFile}
                      label="After Back"
                      onClear={() => setAfterBackFile(null)}
                    />
                  ) : (
                    <>
                      <input
                        ref={afterBackRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAfterBackFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        className="w-full h-16 flex-col gap-1 border-dashed"
                        onClick={() => afterBackRef.current?.click()}
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span className="text-[9px]">After Back</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLocal}
                  onChange={(e) => setUseLocal(e.target.checked)}
                  className="rounded"
                />
                <Zap className="h-3 w-3" />
                Use local AI
              </label>
            </div>

            {useLocal && !analysisResult?.file_id && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 rounded-md">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Local AI requires analyzing the cloth first. Go to the Analyze tab first.
              </p>
            )}

            <Button
              onClick={handleRedesign}
              disabled={loading || !frontFile || !backFile}
              className="w-full"
              variant="default"
            >
              {loadingAction === 'redesign' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Get Redesign Suggestions
            </Button>

            {/* Redesign result */}
            {redesignResult && (
              <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Redesign Suggestions
                  </h4>
                  <div className="flex gap-1">
                    {redesignResult?.file_id && (
                      <Badge variant="outline" className="text-[9px] h-4 font-mono">
                        {redesignResult.file_id.slice(0, 6)}
                      </Badge>
                    )}
                    {redesignResult?.after_file_id && (
                      <Badge variant="secondary" className="text-[9px] h-4 font-mono">
                        {redesignResult.after_file_id.slice(0, 6)}
                      </Badge>
                    )}
                  </div>
                </div>

                {redesignResult?.redesign_analysis?.cloth_details?.redesign_suggestions?.length ? (
                  <div className="space-y-2">
                    {redesignResult.redesign_analysis.cloth_details.redesign_suggestions.map((suggestion, i) => (
                      <div
                        key={i}
                        className="flex gap-2 p-2 rounded-md bg-primary/5 border-l-2 border-primary"
                      >
                        <Paintbrush className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No specific suggestions available
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="space-y-3 mt-3">
            {analysisHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <History className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No analysis history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analysisHistory.filter(item => getClothDetails(item) || typeof item?.condition === 'string').map((item, i) => (
                  <div
                    key={`${item?.file_id || 'item'}-${i}`}
                    className="rounded-lg border border-border bg-card p-2.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shirt className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">
                          {getClothDetails(item)?.cloth_type || 'Unknown'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-4">
                        {getClothDetails(item)?.cloth_fabric || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {getClothDetails(item)?.suitable_for_redesign && (
                        <Badge variant="secondary" className="text-[9px] h-4">
                          <Paintbrush className="h-2.5 w-2.5 mr-0.5" />
                          Redesign
                        </Badge>
                      )}
                      {getClothDetails(item)?.suitable_for_upcycling && (
                        <Badge variant="secondary" className="text-[9px] h-4">
                          <Recycle className="h-2.5 w-2.5 mr-0.5" />
                          Upcycle
                        </Badge>
                      )}
                    </div>
                    {item?.file_id && (
                      <p className="text-[9px] text-muted-foreground font-mono">
                        ID: {item.file_id.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};

const CanvasApp = () => {
  const { mode } = useCanvas();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopToolbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {mode === 'design' ? <CanvasStage /> : <AIPreview />}
      </div>
      {mode === 'design' && <BottomPanel />}
      <LayersPanel />
      <VersionHistory />
    </div>
  );
};

const Index = () => (
  <ErrorBoundary>
    <CanvasProvider>
      <CanvasApp />
    </CanvasProvider>
  </ErrorBoundary>
);

export default Index;
