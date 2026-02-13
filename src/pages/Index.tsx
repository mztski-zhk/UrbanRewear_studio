import { CanvasProvider, useCanvas } from '@/contexts/CanvasContext';
import TopToolbar from '@/components/canvas/TopToolbar';
import CanvasStage from '@/components/canvas/CanvasStage';
import BottomPanel from '@/components/canvas/BottomPanel';
import LayersPanel from '@/components/canvas/LayersPanel';
import VersionHistory from '@/components/canvas/VersionHistory';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const AIPreview = () => {
  const { stageRef, objects, backgroundImage } = useCanvas();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (stageRef.current) {
      setPreviewImage(stageRef.current.toDataURL({ pixelRatio: 2 }));
    }
  }, []);

  const handleSendToAI = () => {
    console.log('Send to AI:', { objectCount: objects.length, hasBackground: !!backgroundImage });
    alert('AI redesign request sent! (Placeholder — connect your backend to process)');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 overflow-auto">
      {previewImage ? (
        <img src={previewImage} alt="Design preview" className="max-w-full max-h-[50vh] rounded-lg border border-border shadow-lg" />
      ) : (
        <div className="w-64 h-64 rounded-lg bg-secondary flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No design yet</p>
        </div>
      )}
      <Button onClick={handleSendToAI} size="lg" className="gradient-bg text-primary-foreground font-semibold px-8 shadow-lg">
        <Sparkles className="h-5 w-5 mr-2" /> Send to AI
      </Button>
      <p className="text-muted-foreground text-xs text-center max-w-xs">
        AI will reimagine your clothing design. Results will appear here once connected to a backend.
      </p>
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
