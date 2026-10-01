import React, { useState, useEffect, useRef } from 'react';
import {
  CloudRain,
  Sun,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Sparkles,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface WindowScene {
  id: string;
  name: string;
  category: string;
  bgUrl: string;
  soundType: 'rain' | 'ocean' | 'fire';
  defaultRain: boolean;
  accentColor: string;
  description: string;
}

const SCENES: WindowScene[] = [
  {
    id: 'tokyo-rain',
    name: 'Rainy Tokyo Cyber Street',
    category: 'City',
    bgUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1600&q=80',
    soundType: 'rain',
    defaultRain: true,
    accentColor: '#38bdf8',
    description: 'Neon reflections glistening on wet asphalt as rain falls gently.',
  },
  {
    id: 'cozy-cabin',
    name: 'Cozy Mountain Cabin',
    category: 'Cozy',
    bgUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1600&q=80',
    soundType: 'fire',
    defaultRain: false,
    accentColor: '#fb923c',
    description: 'Snow covered pine forest outside a warm wood-cabin fireplace.',
  },
  {
    id: 'tropical-beach',
    name: 'Sunset Seaside Breeze',
    category: 'Nature',
    bgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    soundType: 'ocean',
    defaultRain: false,
    accentColor: '#f59e0b',
    description: 'Gentle golden hour waves washing over tranquil warm sands.',
  },
  {
    id: 'autumn-mist',
    name: 'Misty Autumn Lake',
    category: 'Nature',
    bgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    soundType: 'rain',
    defaultRain: true,
    accentColor: '#10b981',
    description: 'Golden birch leaves whispering through dense atmospheric fog.',
  },
  {
    id: 'deep-space',
    name: 'Orbital Space Viewport',
    category: 'Sci-Fi',
    bgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    soundType: 'ocean',
    defaultRain: false,
    accentColor: '#818cf8',
    description: 'Earth spinning silently below among distant luminous nebulae.',
  },
];

export const VirtualWindow: React.FC = () => {
  const [selectedScene, setSelectedScene] = useState<WindowScene>(SCENES[0]);
  const [hasRain, setHasRain] = useState(true);
  const [rainSpeed, setRainSpeed] = useState(30);
  const [blindsOpen, setBlindsOpen] = useState(100); // 0 to 100%
  const [lightning, setLightning] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [ambientVol, setAmbientVol] = useState(0.5);
  const [fogEnabled, setFogEnabled] = useState(true);

  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isWipingRef = useRef(false);
  const audioNodeRef = useRef<{ stop: () => void; setVolume: (v: number) => void } | null>(null);

  // Initialize Fog Canvas (User can wipe fog with mouse!)
  const resetFog = () => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(230, 240, 255, 0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle condensation texture
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 2 + 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    resetFog();
  }, [selectedScene]);

  // Rain Drops Animation
  useEffect(() => {
    if (!hasRain) return;
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 500;

    interface Drop {
      x: number;
      y: number;
      l: number;
      speed: number;
      opacity: number;
    }

    const count = rainSpeed * 2;
    const drops: Drop[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      l: Math.random() * 20 + 10,
      speed: Math.random() * 8 + 7,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(220, 235, 255, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      drops.forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.l);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 0.5;

        if (d.y > canvas.height) {
          d.y = -d.l;
          d.x = Math.random() * canvas.width;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [hasRain, rainSpeed]);

  // Occasional subtle lightning flash
  useEffect(() => {
    if (!hasRain) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLightning(true);
        setTimeout(() => setLightning(false), 80);
        setTimeout(() => {
          setLightning(true);
          setTimeout(() => setLightning(false), 50);
        }, 140);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [hasRain]);

  // Handle ambient audio
  useEffect(() => {
    if (isAudioActive) {
      if (audioNodeRef.current) audioNodeRef.current.stop();
      audioNodeRef.current = soundManager.createAmbientNode(selectedScene.soundType);
      audioNodeRef.current.setVolume(ambientVol);
    } else {
      if (audioNodeRef.current) {
        audioNodeRef.current.stop();
        audioNodeRef.current = null;
      }
    }
    return () => {
      if (audioNodeRef.current) {
        audioNodeRef.current.stop();
        audioNodeRef.current = null;
      }
    };
  }, [isAudioActive, selectedScene, ambientVol]);

  // Mouse wipe on glass condensation
  const wipeGlass = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isWipingRef.current || !fogEnabled) return;
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    const grad = ctx.createRadialGradient(x, y, 5, x, y, 32);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-white select-none overflow-hidden">
      {/* Top Scene Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1c1c1c] border-b border-white/10 z-20 text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                setSelectedScene(scene);
                setHasRain(scene.defaultRain);
                soundManager.playClick();
              }}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition flex items-center space-x-1.5 ${
                selectedScene.id === scene.id
                  ? 'bg-blue-600 text-white font-medium shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              <span>{scene.name}</span>
            </button>
          ))}
        </div>

        {/* Ambient Audio Toggle */}
        <div className="flex items-center space-x-2 pl-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setIsAudioActive(!isAudioActive);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs transition ${
              isAudioActive
                ? 'bg-emerald-600 text-white'
                : 'bg-white/10 hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            {isAudioActive ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{isAudioActive ? 'Sound On' : 'Mute'}</span>
          </button>
        </div>
      </div>

      {/* Main Window Viewport & Glass Simulation */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {/* Scenic Background View */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
          style={{ backgroundImage: `url(${selectedScene.bgUrl})` }}
        />

        {/* Lightning Flash Overlay */}
        {lightning && (
          <div className="absolute inset-0 bg-white/60 pointer-events-none z-10 transition-opacity" />
        )}

        {/* Rain Streaks Canvas */}
        {hasRain && (
          <canvas
            ref={rainCanvasRef}
            className="absolute inset-0 pointer-events-none z-10"
          />
        )}

        {/* Window Glass Pane & Wipeable Fog */}
        {fogEnabled && (
          <canvas
            ref={fogCanvasRef}
            width={800}
            height={500}
            onMouseDown={() => (isWipingRef.current = true)}
            onMouseUp={() => (isWipingRef.current = false)}
            onMouseMove={wipeGlass}
            onMouseLeave={() => (isWipingRef.current = false)}
            className="absolute inset-0 w-full h-full cursor-crosshair z-20"
          />
        )}

        {/* Window Blind / Shade Animation */}
        <div
          className="absolute top-0 left-0 right-0 bg-[#282522] border-b-8 border-[#3b342e] shadow-2xl transition-all duration-300 z-30"
          style={{ height: `${100 - blindsOpen}%` }}
        >
          <div className="w-full h-full flex flex-col justify-around opacity-40 px-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-0.5 bg-black/60 w-full" />
            ))}
          </div>
        </div>

        {/* Realistic Window Frame Muntins (Window crossbars) */}
        <div className="absolute inset-0 pointer-events-none z-25 border-[16px] border-[#222120] shadow-inner">
          {/* Vertical divider */}
          <div className="absolute top-0 bottom-0 left-1/2 w-3 -ml-1.5 bg-[#222120] shadow-md" />
          {/* Horizontal divider */}
          <div className="absolute left-0 right-0 top-1/2 h-3 -mt-1.5 bg-[#222120] shadow-md" />
        </div>

        {/* Interactive Tip Banner */}
        <div className="absolute bottom-4 left-6 z-40 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] text-white/80 pointer-events-none shadow-lg">
          💡 Click &amp; drag on the glass to wipe away condensation fog!
        </div>
      </div>

      {/* Atmospheric Controller Bar */}
      <div className="px-4 py-2.5 bg-[#181818] border-t border-white/10 flex flex-wrap items-center justify-between text-xs gap-3 z-30">
        {/* Weather Controls */}
        <div className="flex items-center space-x-4">
          {/* Rain toggle */}
          <button
            onClick={() => setHasRain(!hasRain)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition ${
              hasRain ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-white/60 hover:text-white'
            }`}
          >
            <CloudRain size={14} />
            <span>Rain {hasRain ? 'On' : 'Off'}</span>
          </button>

          {/* Fog toggle */}
          <button
            onClick={() => setFogEnabled(!fogEnabled)}
            className={`flex items-center space-x-1.5 px-2 py-1 rounded transition ${
              fogEnabled ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-white/60 hover:text-white'
            }`}
          >
            <span>Fog Glass</span>
          </button>

          {/* Re-fog Button */}
          <button
            onClick={resetFog}
            className="flex items-center space-x-1 text-white/60 hover:text-white transition"
            title="Reset condensation on glass"
          >
            <RefreshCw size={13} />
            <span>Reset Fog</span>
          </button>
        </div>

        {/* Blinds Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-white/60 text-[11px]">Blinds:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={blindsOpen}
            onChange={(e) => setBlindsOpen(Number(e.target.value))}
            className="w-20 accent-blue-500 cursor-pointer h-1"
          />
          <span className="text-[11px] font-mono text-white/60">{blindsOpen}%</span>
        </div>

        {/* Scene description */}
        <div className="text-[11px] text-white/50 italic truncate max-w-xs">
          {selectedScene.description}
        </div>
      </div>
    </div>
  );
};
