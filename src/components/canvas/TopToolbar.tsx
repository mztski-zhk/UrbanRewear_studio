import { useCanvas } from '@/contexts/CanvasContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Undo2, Redo2, Save, Download, Layers, History, Sun, Moon, Bug, Search, ShirtIcon } from 'lucide-react';
import logo from '@/assets/logo.jpeg';
import { useEffect, useRef, useState } from 'react';
import { healthCheck } from '@/services/api';
import AuthPanel from './AuthPanel';
import ObjectsPanel from './ObjectsPanel';
import SearchPanel from './SearchPanel';

type BackendStatus = 'ok' | 'unreachable' | 'checking';

const HEALTH_INTERVAL = 60_000; // 60 seconds

const TopToolbar = () => {
  const {
    undo, redo, canUndo, canRedo, save, exportPNG, exportJSON, importJSON,
    setShowLayers, setShowVersions, mode, setMode,
  } = useCanvas();
  const { config, setTheme, toggleDebug } = useConfig();
  const fileRef = useRef<HTMLInputElement>(null);

  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [showObjects, setShowObjects] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Health check polling
  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const res = await healthCheck();
        if (mounted) setBackendStatus(res.status === 'ok' ? 'ok' : 'unreachable');
      } catch {
        if (mounted) setBackendStatus('unreachable');
      }
    };

    check();
    const interval = setInterval(check, HEALTH_INTERVAL);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

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

  const statusColor = backendStatus === 'ok'
    ? 'bg-green-500'
    : backendStatus === 'unreachable'
      ? 'bg-destructive'
      : 'bg-yellow-500 animate-pulse';

  const statusLabel = backendStatus === 'ok'
    ? 'Backend connected'
    : backendStatus === 'unreachable'
      ? 'Backend unreachable'
      : 'Checking backend...';

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5">
          <img src={logo} alt="UrbanRewear" className="h-7 w-7 rounded-md object-cover" />
          <span className="gradient-text font-bold text-sm hidden sm:inline">{config.appName}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`inline-block h-2 w-2 rounded-full ${statusColor} ml-1 shrink-0`}
                role="status"
                aria-label={statusLabel}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {statusLabel}
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(true)}>
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Search clothes</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowObjects(true)}>
                <ShirtIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">My clothes</TooltipContent>
          </Tooltip>

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
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
          <AuthPanel />
        </div>
      </header>

      {/* Side panels */}
      <ObjectsPanel open={showObjects} onOpenChange={setShowObjects} />
      <SearchPanel open={showSearch} onOpenChange={setShowSearch} />
    </TooltipProvider>
  );
};

export default TopToolbar;
