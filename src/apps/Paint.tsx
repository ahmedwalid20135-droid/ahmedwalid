import React, { useState, useRef, useEffect } from 'react';
import {
  Paintbrush,
  PenTool,
  Eraser,
  Square,
  Circle,
  Minus,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';

type Tool = 'pencil' | 'brush' | 'eraser' | 'line' | 'rect' | 'circle';

const COLORS = [
  '#000000',
  '#ffffff',
  '#7f7f7f',
  '#c3c3c3',
  '#880015',
  '#b97a57',
  '#ed1c24',
  '#ffaec9',
  '#ff7f27',
  '#ffc90e',
  '#fff200',
  '#efe4b0',
  '#22b14c',
  '#b5e61d',
  '#00a2e8',
  '#99d9ea',
  '#3f48cc',
  '#7092be',
  '#a349a4',
  '#c8bfe7',
];

export const Paint: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#00a2e8');
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [statusMsg, setStatusMsg] = useState('');
  const snapshotRef = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const next = prev.slice(0, historyStep + 1);
      next.push(data);
      return next;
    });
    setHistoryStep((prev) => prev + 1);
  };

  const undo = () => {
    if (historyStep <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextStep = historyStep - 1;
    ctx.putImageData(history[nextStep], 0, 0);
    setHistoryStep(nextStep);
    soundManager.playClick();
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextStep = historyStep + 1;
    ctx.putImageData(history[nextStep], 0, 0);
    setHistoryStep(nextStep);
    soundManager.playClick();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPos(pos);

    // Save snapshot for shape previews
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'pencil' ? 1 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pencil' || tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoordinates(e);

    if (tool === 'brush' || tool === 'eraser' || tool === 'pencil') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (snapshotRef.current) {
      // Restore before drawing preview shape
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
        );
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    snapshotRef.current = null;
    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
    soundManager.playTrashEmpty();
  };

  const handleSaveToPictures = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const name = `Drawing_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.png`;
    fs.createFile(name, 'pictures', dataUrl, 'png');
    soundManager.playCameraShutter();
    setStatusMsg('Saved to Pictures!');
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Windows_Paint_${Date.now()}.png`;
    a.click();
    soundManager.playClick();
  };

  return (
    <div className="flex flex-col h-full bg-[#202020] text-white">
      {/* Ribbon Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#2b2b2b] border-b border-white/10 gap-2 select-none">
        {/* Tools */}
        <div className="flex items-center space-x-1 bg-black/20 p-1 rounded-md">
          <button
            onClick={() => setTool('brush')}
            className={`p-1.5 rounded transition ${
              tool === 'brush' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Brush"
          >
            <Paintbrush size={16} />
          </button>
          <button
            onClick={() => setTool('pencil')}
            className={`p-1.5 rounded transition ${
              tool === 'pencil' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Pencil"
          >
            <PenTool size={16} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded transition ${
              tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Eraser"
          >
            <Eraser size={16} />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded transition ${
              tool === 'line' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Line"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded transition ${
              tool === 'rect' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Rectangle"
          >
            <Square size={16} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded transition ${
              tool === 'circle' ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Circle"
          >
            <Circle size={16} />
          </button>
        </div>

        {/* Thickness */}
        <div className="flex items-center space-x-2 bg-black/20 px-2.5 py-1 rounded-md text-xs">
          <span className="text-white/60">Size:</span>
          <input
            type="range"
            min="1"
            max="32"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-16 accent-blue-500 cursor-pointer"
          />
          <span className="w-5 text-center font-mono">{lineWidth}px</span>
        </div>

        {/* Color Palette */}
        <div className="flex items-center space-x-2">
          {/* Active Color */}
          <div className="flex flex-col items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded border border-white/30 cursor-pointer bg-transparent p-0"
              title="Custom Color"
            />
          </div>

          {/* Quick Swatches Grid */}
          <div className="grid grid-cols-10 gap-1 p-1 bg-black/30 rounded-md">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-sm border ${
                  color.toLowerCase() === c.toLowerCase() ? 'border-white ring-1 ring-white' : 'border-black/30'
                } hover:scale-110 transition-transform`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-1.5 rounded text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-1.5 rounded text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded text-red-400 hover:bg-red-500/20"
            title="Clear Canvas"
          >
            <Trash2 size={15} />
          </button>
          <div className="h-5 w-px bg-white/20" />
          <button
            onClick={handleSaveToPictures}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition"
          >
            <Save size={13} />
            <span>Save to OS</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition"
          >
            <Download size={13} />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 overflow-auto bg-[#141414] p-4 flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          className="bg-white shadow-2xl rounded-sm cursor-crosshair max-w-full max-h-full object-contain"
        />
        {statusMsg && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1 animate-bounce">
            <Check size={13} />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-t border-white/10 text-[11px] text-white/60">
        <div>900 x 600px | Tool: {tool}</div>
        <div className="text-white/40">Windows Paint Simulator</div>
      </div>
    </div>
  );
};
