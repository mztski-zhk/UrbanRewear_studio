import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Star, Arrow, Text, Image as KImage, Transformer } from 'react-konva';
import { useCanvas } from '@/contexts/CanvasContext';
import { generateId, getDash, CanvasObject } from '@/types/canvas';
import { useConfig } from '@/contexts/ConfigContext';

const URLImage = ({ src, ...props }: { src: string; [key: string]: any }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);
  if (!image) return null;
  return <KImage image={image} {...props} />;
};

const CanvasStage = () => {
  const {
    tool, strokeColor, fillColor, strokeWidth, opacity, strokeStyle, sloppiness,
    fontSize, fontFamily, fontStyle: fStyle, objects, pushHistory, setObjectsDirect,
    selectedIds, setSelectedIds, backgroundImage, stageRef, setTool,
  } = useCanvas();
  const { config } = useConfig();

  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<any>(null);
  const isDrawing = useRef(false);
  const drawingId = useRef<string | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 400, height: 600 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setStageSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!backgroundImage) { setBgImage(null); return; }
    const img = new window.Image();
    img.src = backgroundImage;
    img.onload = () => setBgImage(img);
  }, [backgroundImage]);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    const nodes = selectedIds.map(id => stage.findOne('#' + id)).filter(Boolean);
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, objects]);

  const handleSelect = useCallback((id: string) => {
    if (tool !== 'select') return;
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    if (obj.groupId) {
      setSelectedIds(objects.filter(o => o.groupId === obj.groupId).map(o => o.id));
    } else {
      setSelectedIds([id]);
    }
  }, [tool, objects, setSelectedIds]);

  const handleDragEnd = useCallback((id: string, e: any) => {
    const newObjs = objects.map(o =>
      o.id === id ? { ...o, x: e.target.x(), y: e.target.y() } : o
    );
    pushHistory(newObjs);
  }, [objects, pushHistory]);

  const handleTransformEnd = useCallback((id: string, e: any) => {
    const node = e.target;
    const newObjs = objects.map(o => {
      if (o.id !== id) return o;
      return {
        ...o,
        x: node.x(), y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(), scaleY: node.scaleY(),
        ...(o.type === 'rect' ? { width: node.width(), height: node.height() } : {}),
      };
    });
    pushHistory(newObjs);
  }, [objects, pushHistory]);

  const handlePointerDown = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    if (tool === 'select') {
      if (e.target === stage) setSelectedIds([]);
      return;
    }

    if (tool === 'brush' || tool === 'eraser') {
      isDrawing.current = true;
      const id = generateId();
      drawingId.current = id;
      const obj: CanvasObject = {
        id, type: tool, x: 0, y: 0,
        points: [pos.x, pos.y],
        stroke: tool === 'eraser' ? '#000' : strokeColor,
        strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
        opacity: tool === 'eraser' ? 1 : opacity,
        dash: getDash(strokeStyle, strokeWidth),
        tension: sloppiness * 0.5,
        lineCap: 'round', lineJoin: 'round',
        globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        visible: true, locked: false, name: tool === 'eraser' ? 'Eraser' : 'Stroke',
        rotation: 0, scaleX: 1, scaleY: 1,
      };
      setObjectsDirect([...objects, obj]);
      return;
    }

    if (['line', 'arrow'].includes(tool)) {
      isDrawing.current = true;
      startPos.current = pos;
      const id = generateId();
      drawingId.current = id;
      const obj: CanvasObject = {
        id, type: tool as any, x: 0, y: 0,
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor, strokeWidth, opacity,
        dash: getDash(strokeStyle, strokeWidth),
        pointerLength: 10, pointerWidth: 10,
        visible: true, locked: false, name: tool === 'arrow' ? 'Arrow' : 'Line',
        rotation: 0, scaleX: 1, scaleY: 1,
      };
      setObjectsDirect([...objects, obj]);
      return;
    }

    if (['rect', 'circle', 'triangle', 'star', 'polygon'].includes(tool)) {
      isDrawing.current = true;
      startPos.current = pos;
      const id = generateId();
      drawingId.current = id;
      const obj: CanvasObject = {
        id, type: tool as any, x: pos.x, y: pos.y,
        width: 1, height: 1, radius: 1, innerRadius: 1, outerRadius: 1,
        sides: tool === 'polygon' ? 6 : 3,
        fill: fillColor === 'transparent' ? '' : fillColor,
        stroke: strokeColor, strokeWidth, opacity,
        dash: getDash(strokeStyle, strokeWidth),
        visible: true, locked: false, name: tool.charAt(0).toUpperCase() + tool.slice(1),
        rotation: 0, scaleX: 1, scaleY: 1,
      };
      setObjectsDirect([...objects, obj]);
      return;
    }

    if (tool === 'text') {
      const id = generateId();
      const obj: CanvasObject = {
        id, type: 'text', x: pos.x, y: pos.y,
        text: 'Text', fontSize, fontFamily, fontStyle: fStyle,
        fill: strokeColor, stroke: strokeColor,
        visible: true, locked: false, name: 'Text',
        opacity, rotation: 0, scaleX: 1, scaleY: 1,
      };
      pushHistory([...objects, obj]);
      setSelectedIds([id]);
      setTool('select');
      return;
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDrawing.current || !drawingId.current) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const id = drawingId.current;

    if (tool === 'brush' || tool === 'eraser') {
      setObjectsDirect(objects.map(o =>
        o.id === id ? { ...o, points: [...(o.points || []), pos.x, pos.y] } : o
      ));
      return;
    }

    if (['line', 'arrow'].includes(tool) && startPos.current) {
      setObjectsDirect(objects.map(o =>
        o.id === id ? { ...o, points: [startPos.current!.x, startPos.current!.y, pos.x, pos.y] } : o
      ));
      return;
    }

    if (startPos.current) {
      const dx = pos.x - startPos.current.x;
      const dy = pos.y - startPos.current.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setObjectsDirect(objects.map(o => {
        if (o.id !== id) return o;
        if (tool === 'rect') {
          return { ...o, x: Math.min(pos.x, startPos.current!.x), y: Math.min(pos.y, startPos.current!.y), width: Math.abs(dx), height: Math.abs(dy) };
        }
        return { ...o, radius, innerRadius: radius * 0.4, outerRadius: radius };
      }));
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    drawingId.current = null;
    startPos.current = null;
    pushHistory([...objects]);
  };

  const bgProps = bgImage ? (() => {
    const scale = Math.min(stageSize.width / bgImage.width, stageSize.height / bgImage.height);
    const w = bgImage.width * scale;
    const h = bgImage.height * scale;
    return { image: bgImage, x: (stageSize.width - w) / 2, y: (stageSize.height - h) / 2, width: w, height: h };
  })() : null;

  // Canvas bg fill adapts to theme
  const canvasBg = config.theme === 'dark' ? 'hsl(240, 10%, 8%)' : 'hsl(0, 0%, 95%)';

  const renderObject = (obj: CanvasObject) => {
    const common = {
      key: obj.id, id: obj.id,
      visible: obj.visible, opacity: obj.opacity,
      rotation: obj.rotation || 0,
      scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
      draggable: !obj.locked && tool === 'select',
      onClick: () => handleSelect(obj.id),
      onTap: () => handleSelect(obj.id),
      onDragEnd: (e: any) => handleDragEnd(obj.id, e),
      onTransformEnd: (e: any) => handleTransformEnd(obj.id, e),
    };

    switch (obj.type) {
      case 'brush':
      case 'eraser':
        return <Line {...common} points={obj.points} stroke={obj.stroke} strokeWidth={obj.strokeWidth} tension={obj.tension} lineCap="round" lineJoin="round" globalCompositeOperation={obj.globalCompositeOperation as any} dash={obj.dash} />;
      case 'line':
        return <Line {...common} points={obj.points} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={obj.dash} lineCap="round" />;
      case 'arrow':
        return <Arrow {...common} points={obj.points || []} stroke={obj.stroke} strokeWidth={obj.strokeWidth} fill={obj.stroke} pointerLength={obj.pointerLength} pointerWidth={obj.pointerWidth} dash={obj.dash} />;
      case 'rect':
        return <Rect {...common} x={obj.x} y={obj.y} width={obj.width} height={obj.height} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={obj.dash} />;
      case 'circle':
        return <Circle {...common} x={obj.x} y={obj.y} radius={obj.radius} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} dash={obj.dash} />;
      case 'triangle':
        return <RegularPolygon {...common} x={obj.x} y={obj.y} sides={3} radius={obj.radius} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
      case 'star':
        return <Star {...common} x={obj.x} y={obj.y} numPoints={5} innerRadius={obj.innerRadius} outerRadius={obj.outerRadius} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
      case 'polygon':
        return <RegularPolygon {...common} x={obj.x} y={obj.y} sides={obj.sides || 6} radius={obj.radius} fill={obj.fill} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
      case 'text':
        return <Text {...common} x={obj.x} y={obj.y} text={obj.text} fontSize={obj.fontSize} fontFamily={obj.fontFamily} fontStyle={obj.fontStyle} fill={obj.fill || obj.stroke} />;
      case 'image':
        return <URLImage {...common} src={obj.src!} x={obj.x} y={obj.y} width={obj.width} height={obj.height} />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full bg-muted/30 overflow-hidden touch-none">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ cursor: tool === 'brush' ? 'crosshair' : tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'default' }}
      >
        <Layer>
          <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill={canvasBg} />
          {bgProps && <KImage {...bgProps} />}
        </Layer>
        <Layer>
          {objects.map(renderObject)}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            borderStroke="hsl(190, 80%, 50%)"
            anchorStroke="hsl(270, 60%, 55%)"
            anchorFill="hsl(270, 60%, 55%)"
            anchorSize={8}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default CanvasStage;
