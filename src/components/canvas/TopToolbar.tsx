import { useCanvas } from '@/contexts/CanvasContext';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Undo2, Redo2, Save, Download, Layers, History, Sun, Moon, Bug, Package, Search } from 'lucide-react';
import logo from '@/assets/logo.jpeg';
import { useRef } from 'react';
import AuthPanel from './AuthPanel';
import ObjectsGallery from './ObjectsGallery';
import SearchPanel from './SearchPanel';

const TopToolbar = () => {
  const {
    undo, redo, canUndo, canRedo, save, exportPNG, exportJSON, importJSON,
    setShowLayers, setShowVersions, mode, setMode,
  } = useCanvas();
  const { config, setTheme, toggleDebug } = useConfig();
  const { isAuthenticated } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = () => fileRef.current?.click();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => importJSON(ev.target?.result as string);
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <header className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-1.5">
        <img src={logo} alt="UrbanRewear" className="h-7 w-7 rounded-md object-cover" />
        <span className="gradient-text font-bold text-sm hidden sm:inline">{config.appName}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8">
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="flex bg-secondary rounded-md p-0.5 mx-1">
          <button
            onClick={() => setMode('design')}
            className={`px-2 py-1 text-[11px] rounded-sm transition-colors ${mode === 'design' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Design
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-2 py-1 text-[11px] rounded-sm transition-colors ${mode === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            AI
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => setTheme(config.theme === 'dark' ? 'light' : 'dark')}
        >
          {config.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {config.debugMode && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={toggleDebug}>
            <Bug className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={save} className="h-8 w-8">
          <Save className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportPNG}>Export PNG</DropdownMenuItem>
            <DropdownMenuItem onClick={exportJSON}>Export JSON</DropdownMenuItem>
            <DropdownMenuItem onClick={handleImport}>Import JSON</DropdownMenuItem>
            {!config.debugMode && (
              <DropdownMenuItem onClick={toggleDebug}>Enable Debug</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={() => setShowVersions(true)} className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowLayers(true)} className="h-8 w-8">
          <Layers className="h-4 w-4" />
        </Button>
        {isAuthenticated && (
          <>
            <SearchPanel
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="h-4 w-4" />
                </Button>
              }
            />
            <ObjectsGallery
              trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Package className="h-4 w-4" />
                </Button>
              }
            />
          </>
        )}
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
        <AuthPanel />
      </div>
    </header>
  );
};

export default TopToolbar;
