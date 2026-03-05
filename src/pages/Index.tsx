import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import TopToolbar from '@/components/canvas/TopToolbar';
import CanvasStage from '@/components/canvas/CanvasStage';
import BottomPanel from '@/components/canvas/BottomPanel';
import LayersPanel from '@/components/canvas/LayersPanel';
import VersionHistory from '@/components/canvas/VersionHistory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeCloth, redesignCloth, type ClothCondition, type RedesignResult, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const AIPreview = () => {
  const { stageRef, objects, backgroundImage } = useCanvas();
  const { token, user, isAuthenticated } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ClothCondition | null>(null);
  const [redesignResult, setRedesignResult] = useState<RedesignResult | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    if (stageRef.current) {
      setPreviewImage(stageRef.current.toDataURL({ pixelRatio: 2 }));
    }
  }, []);

  const handleAnalyze = async () => {
    if (!token || !user || !frontFile || !backFile) {
      toast({ title: 'Missing data', description: 'Please upload front and back images and log in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeCloth(user.uid, frontFile, backFile, token, useLocal);
      setAnalysisResult(result);
      toast({ title: 'Analysis complete', description: `Type: ${result.condition.cloth_details.cloth_type}` });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Analysis failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRedesign = async () => {
    if (!token || !user || !frontFile || !backFile) {
      toast({ title: 'Missing data', description: 'Please upload images first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setRedesignResult(null);
    try {
      const result = await redesignCloth(
        user.uid,
        { before_front: frontFile, before_back: backFile },
        token,
        useLocal
      );
      setRedesignResult(result);
      toast({ title: 'Redesign complete', description: 'AI suggestions are ready!' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Redesign failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm text-center">Log in to use AI cloth analysis & redesign.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-4 p-4 overflow-auto">
      {/* Canvas preview */}
      {previewImage && (
        <img src={previewImage} alt="Design preview" className="max-w-full max-h-[30vh] rounded-lg border border-border shadow-lg" />
      )}

      {/* Image upload */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Front Image</Label>
            <div className="mt-1">
              <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={e => setFrontFile(e.target.files?.[0] || null)} />
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => frontRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> {frontFile ? frontFile.name.slice(0, 15) : 'Front'}
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Back Image</Label>
            <div className="mt-1">
              <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={e => setBackFile(e.target.files?.[0] || null)} />
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => backRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> {backFile ? backFile.name.slice(0, 15) : 'Back'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={useLocal} onChange={e => setUseLocal(e.target.checked)} className="rounded" />
            Use local AI (faster)
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAnalyze} disabled={loading || !frontFile || !backFile} className="flex-1 h-9 text-xs gradient-bg text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Analyze Condition</>}
          </Button>
          <Button onClick={handleRedesign} disabled={loading || !frontFile || !backFile} variant="outline" className="flex-1 h-9 text-xs">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3 w-3 mr-1" /> Redesign</>}
          </Button>
        </div>
      </div>

      {/* Analysis result */}
      {analysisResult && (
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-3 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-accent" /> Condition Analysis
          </h4>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {Object.entries(analysisResult.condition.cloth_details).map(([key, val]) => (
              <div key={key} className="flex justify-between col-span-2 py-0.5 border-b border-border/50">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="text-foreground font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">File ID: {analysisResult.file_id}</p>
        </div>
      )}

      {/* Redesign result */}
      {redesignResult && (
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-3 space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Redesign Suggestions
          </h4>
          {redesignResult.redesign_analysis?.cloth_details.redesign_suggestions.map((s, i) => (
            <p key={i} className="text-[11px] text-foreground pl-2 border-l-2 border-primary/40">{s}</p>
          ))}
          <p className="text-[10px] text-muted-foreground">File: {redesignResult.file_id} → {redesignResult.after_file_id}</p>
        </div>
      )}
    </div>
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
  <CanvasProvider>
    <CanvasApp />
  </CanvasProvider>
);

export default Index;
