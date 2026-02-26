import { useCanvas } from '@/contexts/CanvasContext';
import { useConfig } from '@/contexts/ConfigContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRESET_COLORS, FONT_FAMILIES, StrokeStyle, generateId } from '@/types/canvas';
import {
  Copy, Trash2, FlipHorizontal, FlipVertical, Group, Ungroup,
  Bold, Italic, ImagePlus,
} from 'lucide-react';
import { useRef } from 'react';

const ToolOptions = () => {
  const {
    tool, strokeColor, setStrokeColor, fillColor, setFillColor,
    strokeWidth, setStrokeWidth, opacity, setOpacity,
    strokeStyle, setStrokeStyle, sloppiness, setSloppiness,
    fontSize, setFontSize, fontFamily, setFontFamily, fontStyle, setFontStyle,
    selectedIds, objects, pushHistory, setSelectedIds, setTool,
    deleteSelected, duplicateSelected, reflectHorizontal, reflectVertical,
    groupSelected, ungroupSelected, addRecentColor, recentColors,
    setBackgroundImage, setObjectsDirect,
  } = useCanvas();
  const { config } = useConfig();
  const clothRef = useRef<HTMLInputElement>(null);
  const assetRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (color: string) => {
    setStrokeColor(color);
    addRecentColor(color);
  };

  const handleClothUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBackgroundImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 200;
        let w = img.width, h = img.height;
        if (w > maxW) { const s = maxW / w; w *= s; h *= s; }
        const obj = {
          id: generateId(), type: 'image' as const,
          x: 50, y: 50, width: w, height: h, src: ev.target?.result as string,
          visible: true, locked: false, name: file.name,
          opacity: 1, rotation: 0, scaleX: 1, scaleY: 1,
        };
        pushHistory([...objects, obj]);
        setSelectedIds([obj.id]);
        setTool('select');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedText = selectedIds.length === 1 ? objects.find(o => o.id === selectedIds[0] && o.type === 'text') : null;

  const updateSelectedText = (updates: Record<string, any>) => {
    const newObjs = objects.map(o => selectedIds.includes(o.id) ? { ...o, ...updates } : o);
    pushHistory(newObjs);
  };

  if (tool === 'select' && selectedIds.length === 0) return null;

  return (
    <div className="animate-slide-up bg-card border-t border-border px-3 py-2 space-y-2">
      {/* Select tool actions */}
      {tool === 'select' && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" onClick={duplicateSelected}><Copy className="h-3.5 w-3.5 mr-1" />Dupe</Button>
          <Button variant="ghost" size="sm" onClick={deleteSelected}><Trash2 className="h-3.5 w-3.5 mr-1" />Del</Button>
          <Button variant="ghost" size="sm" onClick={reflectHorizontal}><FlipHorizontal className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={reflectVertical}><FlipVertical className="h-3.5 w-3.5" /></Button>
          {selectedIds.length > 1 && (
            <Button variant="ghost" size="sm" onClick={groupSelected}><Group className="h-3.5 w-3.5 mr-1" />Group</Button>
          )}
          {objects.some(o => selectedIds.includes(o.id) && o.groupId) && (
            <Button variant="ghost" size="sm" onClick={ungroupSelected}><Ungroup className="h-3.5 w-3.5 mr-1" />Ungroup</Button>
          )}
          {selectedText && (
            <div className="w-full flex flex-wrap gap-2 mt-1">
              <Input
                value={selectedText.text || ''}
                onChange={e => updateSelectedText({ text: e.target.value })}
                className="h-8 text-xs flex-1 min-w-[100px]"
                placeholder="Text content"
              />
              <Select value={selectedText.fontFamily || 'Arial'} onValueChange={v => updateSelectedText({ fontFamily: v })}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number" value={selectedText.fontSize || 24} min={8} max={200}
                onChange={e => updateSelectedText({ fontSize: Number(e.target.value) })}
                className="h-8 w-14 text-xs"
              />
              <Button variant={selectedText.fontStyle?.includes('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
                onClick={() => updateSelectedText({ fontStyle: selectedText.fontStyle?.includes('bold') ? selectedText.fontStyle.replace('bold', '').trim() || 'normal' : (selectedText.fontStyle === 'normal' ? 'bold' : 'bold ' + selectedText.fontStyle) })}>
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button variant={selectedText.fontStyle?.includes('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
                onClick={() => updateSelectedText({ fontStyle: selectedText.fontStyle?.includes('italic') ? selectedText.fontStyle.replace('italic', '').trim() || 'normal' : (selectedText.fontStyle === 'normal' ? 'italic' : selectedText.fontStyle + ' italic') })}>
                <Italic className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Brush / Eraser */}
      {(tool === 'brush' || tool === 'eraser') && (
        <div className="space-y-2">
          {tool === 'brush' && <ColorRow colors={PRESET_COLORS} recentColors={recentColors} selected={strokeColor} onChange={handleColorChange} />}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Size</span>
            <Slider value={[strokeWidth]} onValueChange={v => setStrokeWidth(v[0])} min={1} max={50} step={1} className="flex-1" />
            <span className="text-xs w-6 text-right">{strokeWidth}</span>
          </div>
          {tool === 'brush' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">Opacity</span>
                <Slider value={[opacity * 100]} onValueChange={v => setOpacity(v[0] / 100)} min={5} max={100} step={5} className="flex-1" />
                <span className="text-xs w-6 text-right">{Math.round(opacity * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">Style</span>
                {(['solid', 'dashed', 'dotted'] as StrokeStyle[]).map(s => (
                  <Button key={s} variant={strokeStyle === s ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setStrokeStyle(s)}>{s}</Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">Sketchy</span>
                <Slider value={[sloppiness * 100]} onValueChange={v => setSloppiness(v[0] / 100)} min={0} max={100} step={10} className="flex-1" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Shape tools */}
      {['line', 'rect', 'circle', 'triangle', 'star', 'arrow', 'polygon'].includes(tool) && (
        <div className="space-y-2">
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-muted-foreground">Stroke</span>
            <input type="color" value={strokeColor} onChange={e => { setStrokeColor(e.target.value); addRecentColor(e.target.value); }} className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" />
            {tool !== 'line' && tool !== 'arrow' && (
              <>
                <span className="text-xs text-muted-foreground ml-2">Fill</span>
                <input type="color" value={fillColor === 'transparent' ? '#000000' : fillColor} onChange={e => setFillColor(e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" />
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setFillColor('transparent')}>No fill</Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12">Size</span>
            <Slider value={[strokeWidth]} onValueChange={v => setStrokeWidth(v[0])} min={1} max={20} step={1} className="flex-1" />
            <span className="text-xs w-6 text-right">{strokeWidth}</span>
          </div>
        </div>
      )}

      {/* Text tool */}
      {tool === 'text' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tap on canvas to place text</p>
          <ColorRow colors={PRESET_COLORS} recentColors={recentColors} selected={strokeColor} onChange={handleColorChange} />
          <div className="flex gap-2 flex-wrap">
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger className="h-8 text-xs flex-1 min-w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={fontSize} min={8} max={200} onChange={e => setFontSize(Number(e.target.value))} className="h-8 w-14 text-xs" />
            <Button variant={fontStyle.includes('bold') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
              onClick={() => setFontStyle(fontStyle.includes('bold') ? fontStyle.replace('bold', '').trim() || 'normal' : fontStyle === 'normal' ? 'bold' : 'bold ' + fontStyle)}>
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button variant={fontStyle.includes('italic') ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8"
              onClick={() => setFontStyle(fontStyle.includes('italic') ? fontStyle.replace('italic', '').trim() || 'normal' : fontStyle === 'normal' ? 'italic' : fontStyle + ' italic')}>
              <Italic className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image tool */}
      {tool === 'image' && (
        <div className="flex gap-2 flex-wrap">
          {config.allowClothUpload && (
            <Button variant="secondary" size="sm" onClick={() => clothRef.current?.click()} className="text-xs">
              <ImagePlus className="h-3.5 w-3.5 mr-1" /> Upload Clothing
            </Button>
          )}
          {!config.allowClothUpload && (
            <p className="text-xs text-muted-foreground py-1">Clothing images are loaded from backend.</p>
          )}
          <Button variant="secondary" size="sm" onClick={() => assetRef.current?.click()} className="text-xs">
            <ImagePlus className="h-3.5 w-3.5 mr-1" /> Upload Asset
          </Button>
          {config.allowClothUpload && <input ref={clothRef} type="file" accept="image/*" className="hidden" onChange={handleClothUpload} />}
          <input ref={assetRef} type="file" accept="image/*" className="hidden" onChange={handleAssetUpload} />
        </div>
      )}
    </div>
  );
};

const ColorRow = ({ colors, recentColors, selected, onChange }: {
  colors: string[]; recentColors: string[]; selected: string; onChange: (c: string) => void;
}) => (
  <div className="space-y-1">
    <div className="flex gap-1 flex-wrap">
      {colors.map(c => (
        <button key={c} onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-sm border transition-transform ${selected === c ? 'border-accent scale-110' : 'border-border'}`}
          style={{ backgroundColor: c }} />
      ))}
      <label className="w-6 h-6 rounded-sm border border-border gradient-bg cursor-pointer relative overflow-hidden">
        <input type="color" value={selected} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </div>
    {recentColors.length > 0 && (
      <div className="flex gap-1">
        <span className="text-[10px] text-muted-foreground mr-1">Recent:</span>
        {recentColors.map(c => (
          <button key={c} onClick={() => onChange(c)}
            className={`w-4 h-4 rounded-sm border ${selected === c ? 'border-accent' : 'border-border'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
    )}
  </div>
);

export default ToolOptions;
