import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Cpu,
  Activity,
  Flame,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Tv,
  Wifi,
  Shield,
  Layers,
  Check,
  ChevronRight,
  Info,
  Clock,
  Gauge,
  Power,
  RefreshCw,
  Monitor,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import confetti from 'canvas-confetti';

interface NvidiaGeForceAppProps {
  initialTab?: 'cloud' | 'rtx_demo' | 'hardware';
}

interface RTXGame {
  id: string;
  title: string;
  badge: string;
  rtxFeatures: string[];
  bannerUrl: string;
  fps: number;
  resolution: string;
  genre: string;
  desc: string;
}

const RTX_GAMES: RTXGame[] = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077: Phantom Liberty',
    badge: 'Full Path Tracing · DLSS 3.5',
    rtxFeatures: ['Ray Tracing Overdrive', 'Ray Reconstruction', 'Frame Generation', 'Reflex'],
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    fps: 144,
    resolution: '3840x2160 (4K)',
    genre: 'Open World RPG',
    desc: 'Night City transformed with full path-traced lighting, neon reflections, and AI-accelerated Ray Reconstruction.',
  },
  {
    id: 'wukong',
    title: 'Black Myth: Wukong',
    badge: 'Full Ray Tracing · 4K HDR',
    rtxFeatures: ['Full Path Tracing', 'Ray Traced Water Caustics', 'DLSS 3.5', 'Reflex'],
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    fps: 120,
    resolution: '3840x2160 (4K)',
    genre: 'Action RPG',
    desc: 'Unreal Engine 5 graphical tour-de-force with hyper-realistic particle physics, lighting bounces, and forest atmosphere.',
  },
  {
    id: 'portal',
    title: 'Portal with RTX',
    badge: 'Pure Path Traced RTX Re-imagining',
    rtxFeatures: ['Complete Path Tracing', 'Volumetric Ray Lighting', 'DLSS 3.5', 'NVIDIA Reflex'],
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    fps: 165,
    resolution: '3840x2160 (4K)',
    genre: 'Puzzle Masterpiece',
    desc: 'Experience Aperture Science with every photon simulated using real-time NVIDIA RTX path tracing.',
  },
  {
    id: 'alanwake2',
    title: 'Alan Wake 2',
    badge: 'DirectX 12 Ultimate · RTX Path Tracing',
    rtxFeatures: ['Full Path Tracing', 'Direct Lighting & Shadows', 'DLSS 3.5', 'Transparency RT'],
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    fps: 135,
    resolution: '3840x2160 (4K)',
    genre: 'Psychological Survival Horror',
    desc: 'Mind-bending psychological thriller utilizing cutting-edge RTX ray tracing and DLSS Ray Reconstruction.',
  },
  {
    id: 'forza',
    title: 'Forza Horizon 5 RTX',
    badge: 'Ray Traced Car Reflections · 144 FPS',
    rtxFeatures: ['Ray Traced Reflections', 'Ray Traced Audio', 'DLSS 3 Super Resolution', 'Reflex'],
    bannerUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
    fps: 160,
    resolution: '3840x2160 (4K)',
    genre: 'Racing Simulation',
    desc: 'Photorealistic hypercar races across dynamic Mexico climates with ray-traced paintwork and cockpit glass reflections.',
  },
];

export const NvidiaGeForceApp: React.FC<NvidiaGeForceAppProps> = ({ initialTab = 'cloud' }) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'rtx_demo' | 'hardware'>(initialTab);
  const [selectedGame, setSelectedGame] = useState<RTXGame>(RTX_GAMES[0]);
  const [isPlayingStream, setIsPlayingStream] = useState(false);

  // RTX Real-Time Demo States
  const [rtxEnabled, setRtxEnabled] = useState(true);
  const [dlssEnabled, setDlssEnabled] = useState(true);
  const [reflexEnabled, setReflexEnabled] = useState(true);
  const [bounces, setBounces] = useState(3);
  const [demoColor, setDemoColor] = useState<'neon' | 'cyberpunk' | 'sunset'>('neon');

  // Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkScore, setBenchmarkScore] = useState<number | null>(null);

  // Hardware tuning mode
  const [tuningProfile, setTuningProfile] = useState<'quiet' | 'balanced' | 'overclock'>('balanced');
  const [fanSpeedRpm, setFanSpeedRpm] = useState(1450);

  // Live Canvas Ray Tracing Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lightPosRef = useRef({ x: 180, y: 100, vx: 1.5, vy: 1.2 });

  // Stream simulation timer
  const [streamStats, setStreamStats] = useState({
    fps: 144,
    ping: 9,
    bitrate: 75,
    packetLoss: '0.00%',
    codec: 'AV1 10-Bit HDR',
    server: 'EU Central (Frankfurt RTX 4080 Rig #412)',
  });

  // Real-time canvas procedural ray tracing animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    const render = () => {
      t += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // Update light position
      const light = lightPosRef.current;
      light.x += light.vx;
      light.y += light.vy;
      if (light.x < 60 || light.x > width - 60) light.vx *= -1;
      if (light.y < 40 || light.y > height - 120) light.vy *= -1;

      // Clear background
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, width, height);

      // Floor grid with perspective ray bounces
      ctx.strokeStyle = rtxEnabled ? 'rgba(118, 185, 0, 0.25)' : 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const horizonY = height * 0.65;

      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo((x - width / 2) * 2.5 + width / 2, height);
        ctx.stroke();
      }
      for (let y = horizonY; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Spheres positions
      const sphere1 = { x: width * 0.35 + Math.sin(t) * 15, y: horizonY - 20, r: 48 };
      const sphere2 = { x: width * 0.65 + Math.cos(t * 0.8) * 20, y: horizonY - 45, r: 65 };
      const sphere3 = { x: width * 0.5 + Math.sin(t * 1.2) * 35, y: horizonY + 25, r: 35 };

      // Render Ray Traced Shadows
      if (rtxEnabled) {
        [sphere1, sphere2, sphere3].forEach((s) => {
          const shadowX = s.x + (s.x - light.x) * 0.35;
          const shadowY = horizonY + (s.y - horizonY + s.r) * 0.6 + 25;
          const grad = ctx.createRadialGradient(shadowX, shadowY, 5, shadowX, shadowY, s.r * 1.3);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(shadowX, shadowY, s.r * 1.1, s.r * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Sphere 1: Metallic RTX Chrome Sphere (reflects light & other spheres)
      const grad1 = ctx.createRadialGradient(
        sphere1.x - sphere1.r * 0.35,
        sphere1.y - sphere1.r * 0.35,
        sphere1.r * 0.1,
        sphere1.x,
        sphere1.y,
        sphere1.r
      );
      if (rtxEnabled) {
        grad1.addColorStop(0, '#ffffff');
        grad1.addColorStop(0.3, demoColor === 'neon' ? '#76b900' : demoColor === 'cyberpunk' ? '#00e5ff' : '#ff9100');
        grad1.addColorStop(0.8, '#182408');
        grad1.addColorStop(1, '#050702');
      } else {
        grad1.addColorStop(0, '#bbbbbb');
        grad1.addColorStop(0.7, '#444444');
        grad1.addColorStop(1, '#111111');
      }

      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(sphere1.x, sphere1.y, sphere1.r, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 2: Emerald Glass / Specular Caustics
      const grad2 = ctx.createRadialGradient(
        sphere2.x - sphere2.r * 0.3,
        sphere2.y - sphere2.r * 0.3,
        sphere2.r * 0.05,
        sphere2.x,
        sphere2.y,
        sphere2.r
      );
      if (rtxEnabled) {
        grad2.addColorStop(0, '#c7ff70');
        grad2.addColorStop(0.4, '#76b900');
        grad2.addColorStop(0.85, '#2e4900');
        grad2.addColorStop(1, '#0c1400');
      } else {
        grad2.addColorStop(0, '#777777');
        grad2.addColorStop(1, '#222222');
      }

      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(sphere2.x, sphere2.y, sphere2.r, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 3: Foreground Glass Orb
      const grad3 = ctx.createRadialGradient(
        sphere3.x - sphere3.r * 0.3,
        sphere3.y - sphere3.r * 0.3,
        5,
        sphere3.x,
        sphere3.y,
        sphere3.r
      );
      grad3.addColorStop(0, '#ffffff');
      grad3.addColorStop(0.5, rtxEnabled ? '#00e5ff' : '#888');
      grad3.addColorStop(1, '#051118');
      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.arc(sphere3.x, sphere3.y, sphere3.r, 0, Math.PI * 2);
      ctx.fill();

      // Ray Tracing Light Source (glowing emitter)
      const lightGrad = ctx.createRadialGradient(light.x, light.y, 2, light.x, light.y, 45);
      lightGrad.addColorStop(0, '#ffffff');
      lightGrad.addColorStop(0.3, rtxEnabled ? '#76b900' : '#ffffaa');
      lightGrad.addColorStop(1, 'rgba(118, 185, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, 45, 0, Math.PI * 2);
      ctx.fill();

      // Render Ray Vectors connecting light to spheres (Ray tracing visualization)
      if (rtxEnabled) {
        ctx.lineWidth = 1.2;
        [sphere1, sphere2, sphere3].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(light.x, light.y);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = 'rgba(118, 185, 0, 0.45)';
          ctx.stroke();

          // Reflected Ray Bounce
          if (bounces >= 2) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            const bounceX = s.x + (s.x - light.x) * 1.5;
            const bounceY = height;
            ctx.lineTo(bounceX, bounceY);
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
            ctx.stroke();
          }
        });
      }

      // HUD Overlay on Canvas
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = rtxEnabled ? '#76b900' : '#888888';
      ctx.fillText(`RTX: ${rtxEnabled ? 'ACTIVE (Path Traced)' : 'DISABLED (Raster)'}`, 14, 25);

      const fpsText = dlssEnabled ? (rtxEnabled ? '144 FPS (DLSS 3.5 Frame Gen)' : '185 FPS') : (rtxEnabled ? '42 FPS (Native RT)' : '80 FPS');
      ctx.fillStyle = '#ffffff';
      ctx.fillText(fpsText, 14, 45);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = reflexEnabled ? '#00e5ff' : '#aaaaaa';
      ctx.fillText(`NVIDIA Reflex: ${reflexEnabled ? '8.4 ms' : '38.2 ms'}`, 14, 62);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [rtxEnabled, dlssEnabled, reflexEnabled, bounces, demoColor]);

  // Handle Benchmark
  const runBenchmark = () => {
    soundManager.playClick();
    setIsBenchmarking(true);
    setBenchmarkProgress(0);
    setBenchmarkScore(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setBenchmarkProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsBenchmarking(false);
        const score = Math.floor(34800 + Math.random() * 850);
        setBenchmarkScore(score);
        soundManager.playDing();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#76b900', '#ffffff', '#00e5ff'],
        });
      }
    }, 80);
  };

  return (
    <div className="flex flex-col h-full bg-[#101012] text-white select-none font-sans text-xs">
      {/* Top NVIDIA Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#17171a] border-b border-[#76b900]/30 shadow-md">
        <div className="flex items-center space-x-3">
          {/* NVIDIA Green Logo Badge */}
          <div className="w-8 h-8 rounded-lg bg-[#76b900] flex items-center justify-center font-black text-black text-sm tracking-tighter shadow-lg shadow-[#76b900]/20">
            NV
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-wider text-white">NVIDIA GEFORCE</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#76b900] text-black">
                RTX ON
              </span>
            </div>
            <div className="text-[10px] text-white/50 flex items-center space-x-2">
              <span>GeForce NOW Cloud Gaming</span>
              <span>•</span>
              <span className="text-[#76b900] font-medium">RTX 4090 Ultimate SuperPOD</span>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-[#0c0c0e] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('cloud');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'cloud'
                ? 'bg-[#76b900] text-black shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv size={14} />
            <span>GeForce NOW</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('rtx_demo');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'rtx_demo'
                ? 'bg-[#76b900] text-black shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={14} />
            <span>RTX Ray Tracing Lab</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('hardware');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'hardware'
                ? 'bg-[#76b900] text-black shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={14} />
            <span>GPU Hardware Monitor</span>
          </button>
        </div>

        {/* Quick Hardware Badge */}
        <div className="hidden md:flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1 text-[#76b900]">
            <Flame size={14} />
            <span>58°C</span>
          </span>
          <span className="text-white/40">|</span>
          <span className="text-cyan-400">144 FPS</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">24GB VRAM</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ========================================================= */}
        {/* TAB 1: GEFORCE NOW CLOUD GAMING LIBRARY & STREAMING       */}
        {/* ========================================================= */}
        {activeTab === 'cloud' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stream HUD active state */}
            {isPlayingStream ? (
              <div className="flex-1 flex flex-col bg-black relative">
                {/* Active Game Stream Simulation Screen */}
                <div
                  className="flex-1 bg-cover bg-center relative flex flex-col justify-between p-6"
                  style={{ backgroundImage: `url(${selectedGame.bannerUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 pointer-events-none" />

                  {/* Top Overlay HUD */}
                  <div className="relative z-10 flex items-center justify-between bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-white text-sm">{selectedGame.title}</span>
                      <span className="px-2 py-0.5 bg-[#76b900] text-black font-extrabold text-[10px] rounded">
                        4K 144Hz HDR
                      </span>
                    </div>

                    <div className="flex items-center space-x-5 font-mono text-[11px] text-white/90">
                      <span className="text-[#76b900] font-bold">144 FPS</span>
                      <span className="text-cyan-300">Ping: 8ms</span>
                      <span className="text-white/70">AV1 75 Mbps</span>
                      <span className="text-emerald-400">Loss: 0.00%</span>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setIsPlayingStream(false);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition text-xs"
                    >
                      Exit Session
                    </button>
                  </div>

                  {/* Center Interactive Simulation Prompt */}
                  <div className="relative z-10 my-auto text-center space-y-3 max-w-lg mx-auto bg-black/75 backdrop-blur-md p-6 rounded-3xl border border-[#76b900]/40 shadow-2xl">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#76b900]/20 text-[#76b900] font-bold text-xs border border-[#76b900]/40">
                      <Sparkles size={14} />
                      <span>Ray Tracing Overdrive Active</span>
                    </div>
                    <h3 className="text-2xl font-black text-white">{selectedGame.title}</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                      Streaming at crystal-clear 4K resolution with zero input lag powered by the NVIDIA GeForce RTX 4090 Ultimate SuperPOD cloud cluster.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-2 bg-white/10 rounded-xl text-left">
                        <span className="text-[10px] text-white/50 block">Ray Reconstruction</span>
                        <span className="text-xs font-bold text-[#76b900]">DLSS 3.5 AI Denoiser</span>
                      </div>
                      <div className="p-2 bg-white/10 rounded-xl text-left">
                        <span className="text-[10px] text-white/50 block">Latency Engine</span>
                        <span className="text-xs font-bold text-cyan-400">NVIDIA Reflex (8ms)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="relative z-10 flex items-center justify-between text-white/60 text-[11px]">
                    <span>Press ESC to minimize stream session</span>
                    <span>Server: {streamStats.server}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Games Showcase Library */
              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                {/* Hero Banner */}
                <div
                  className="rounded-2xl p-6 bg-cover bg-center border border-[#76b900]/30 shadow-2xl relative overflow-hidden flex flex-col justify-end min-h-[200px]"
                  style={{ backgroundImage: `url(${selectedGame.bannerUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none" />

                  <div className="relative z-10 max-w-lg space-y-2">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#76b900] text-black font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                      <span>Featured RTX Title</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{selectedGame.title}</h2>
                    <p className="text-xs text-white/80 line-clamp-2">{selectedGame.desc}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedGame.rtxFeatures.map((feat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white/15 text-[10px] text-white font-medium border border-white/10"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setIsPlayingStream(true);
                        }}
                        className="px-5 py-2.5 bg-[#76b900] hover:bg-[#68a300] active:scale-95 text-black font-extrabold rounded-xl shadow-lg transition flex items-center space-x-2 text-xs"
                      >
                        <Play size={15} fill="currentColor" />
                        <span>Play on GeForce NOW (RTX 4090)</span>
                      </button>

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setActiveTab('rtx_demo');
                        }}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition flex items-center space-x-1.5 text-xs"
                      >
                        <Sparkles size={14} />
                        <span>Inspect Ray Tracing Lab</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Game Catalog Grid */}
                <div>
                  <div className="text-xs font-bold text-white/80 mb-3 px-1 flex items-center justify-between">
                    <span>GeForce NOW RTX Cloud Library (Instant Launch)</span>
                    <span className="text-[11px] text-[#76b900] font-medium">1,800+ Games Supported</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {RTX_GAMES.map((game) => {
                      const isSelected = selectedGame.id === game.id;
                      return (
                        <div
                          key={game.id}
                          onClick={() => {
                            soundManager.playClick();
                            setSelectedGame(game);
                          }}
                          className={`group rounded-xl border overflow-hidden cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-[#1e1e24] border-[#76b900] shadow-lg shadow-[#76b900]/10'
                              : 'bg-[#18181b] border-white/10 hover:border-white/25 hover:bg-[#202024]'
                          }`}
                        >
                          <div className="h-28 bg-cover bg-center relative" style={{ backgroundImage: `url(${game.bannerUrl})` }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/30" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-bold text-[#76b900] border border-[#76b900]/40">
                              {game.badge}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-2">
                            <div>
                              <h4 className="font-bold text-xs text-white group-hover:text-[#76b900] transition">
                                {game.title}
                              </h4>
                              <span className="text-[10px] text-white/50">{game.genre}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono text-white/70 pt-1 border-t border-white/5">
                              <span>Target: <strong className="text-white">{game.fps} FPS</strong></span>
                              <span className="text-cyan-400">{game.resolution}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                soundManager.playClick();
                                setSelectedGame(game);
                                setIsPlayingStream(true);
                              }}
                              className="w-full py-1.5 bg-[#76b900]/15 hover:bg-[#76b900] hover:text-black text-[#76b900] font-bold rounded-lg transition text-xs flex items-center justify-center space-x-1 mt-1"
                            >
                              <Play size={12} fill="currentColor" />
                              <span>Launch RTX Stream</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INTERACTIVE REAL-TIME RTX RAY TRACING LAB          */}
        {/* ========================================================= */}
        {activeTab === 'rtx_demo' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Interactive Canvas Viewer */}
            <div className="flex-1 p-5 flex flex-col justify-between overflow-hidden bg-black/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#76b900] animate-pulse" />
                  <span className="font-bold text-xs text-white">Live Real-Time Ray Tracing Shader Viewport</span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-white/60">
                  <span>Engine: <strong>DirectX Raytracing (DXR)</strong></span>
                  <span>•</span>
                  <span>Light bounces: <strong className="text-[#76b900]">{bounces}</strong></span>
                </div>
              </div>

              {/* Real-time Ray Tracing Canvas */}
              <div className="flex-1 rounded-2xl overflow-hidden border border-white/15 relative shadow-2xl flex items-center justify-center bg-[#070709]">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={380}
                  className="w-full h-full object-contain cursor-crosshair"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const scaleX = 640 / rect.width;
                    const scaleY = 380 / rect.height;
                    lightPosRef.current.x = (e.clientX - rect.left) * scaleX;
                    lightPosRef.current.y = (e.clientY - rect.top) * scaleY;
                  }}
                />

                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-white/70">
                  Tip: Move your mouse inside the canvas to reposition the real-time ray-traced photon emitter!
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="flex items-center justify-between mt-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-white/50">Preset Color:</span>
                  {(['neon', 'cyberpunk', 'sunset'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setDemoColor(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        demoColor === c
                          ? 'bg-[#76b900] text-black'
                          : 'bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-white/50">Ray Bounces:</span>
                  {[1, 2, 3, 4].map((b) => (
                    <button
                      key={b}
                      onClick={() => setBounces(b)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        bounces === b
                          ? 'bg-[#76b900] text-black'
                          : 'bg-white/10 text-white/70 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Controls Sidebar */}
            <div className="w-72 bg-[#17171a] border-l border-white/10 p-5 overflow-y-auto space-y-5 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders size={16} className="text-[#76b900]" />
                  <span>RTX Feature Controls</span>
                </h3>
                <p className="text-[11px] text-white/50 mt-1">
                  Toggle real-time AI and ray tracing features to see dynamic performance impact.
                </p>
              </div>

              {/* Feature Toggle 1: Ray Tracing */}
              <div className="p-3.5 rounded-xl bg-[#202025] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Full Ray Tracing</span>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setRtxEnabled(!rtxEnabled);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      rtxEnabled ? 'bg-[#76b900]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                        rtxEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-white/60">
                  Simulates realistic light bounces, reflections on spheres, and photorealistic shadow penumbras.
                </p>
              </div>

              {/* Feature Toggle 2: DLSS 3.5 Frame Generation */}
              <div className="p-3.5 rounded-xl bg-[#202025] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white">DLSS 3.5 AI Frame Gen</span>
                    <span className="block text-[9px] text-[#76b900] font-semibold">Ray Reconstruction</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setDlssEnabled(!dlssEnabled);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      dlssEnabled ? 'bg-[#76b900]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                        dlssEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-white/60">
                  Uses Tensor Cores to generate complete new frames, multiplying frame rates from 42 FPS to 144 FPS.
                </p>
              </div>

              {/* Feature Toggle 3: NVIDIA Reflex */}
              <div className="p-3.5 rounded-xl bg-[#202025] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">NVIDIA Reflex Latency</span>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setReflexEnabled(!reflexEnabled);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      reflexEnabled ? 'bg-cyan-500' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                        reflexEnabled ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-white/60">
                  Reduces system latency down to 8.4 ms for competitive-grade response times.
                </p>
              </div>

              {/* Real-time Benchmark Action */}
              <div className="pt-2">
                <button
                  onClick={runBenchmark}
                  disabled={isBenchmarking}
                  className="w-full py-2.5 bg-gradient-to-r from-[#76b900] to-emerald-500 hover:opacity-95 text-black font-extrabold rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Gauge size={15} />
                  <span>{isBenchmarking ? `Benchmarking (${benchmarkProgress}%)` : 'Run RTX Ray Tracing Benchmark'}</span>
                </button>

                {isBenchmarking && (
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-[#76b900] transition-all duration-100"
                      style={{ width: `${benchmarkProgress}%` }}
                    />
                  </div>
                )}

                {benchmarkScore && !isBenchmarking && (
                  <div className="mt-3 p-3 bg-[#76b900]/15 border border-[#76b900] rounded-xl text-center space-y-1 animate-in fade-in">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#76b900]">
                      RTX Benchmark Score
                    </div>
                    <div className="text-xl font-black font-mono text-white">
                      {benchmarkScore.toLocaleString()} Pts
                    </div>
                    <div className="text-[10px] text-white/70">
                      Tier: <strong>Titanium God-Tier (Top 1% Worldwide)</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: HARDWARE MONITOR & GPU CONTROL PANEL              */}
        {/* ========================================================= */}
        {activeTab === 'hardware' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* GPU Identity Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#17171a] via-[#1c1c22] to-[#17171a] border border-[#76b900]/40 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-[#76b900] flex items-center justify-center text-black font-black text-xl shadow-lg shadow-[#76b900]/30">
                  RTX
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-black text-white">NVIDIA GeForce RTX 4090 D 24GB</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#76b900] text-black">
                      Ada Lovelace
                    </span>
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">
                    16,384 CUDA Cores · 512 4th Gen Tensor Cores · 128 3rd Gen RT Cores · 24GB GDDR6X 384-Bit
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#76b900] font-bold">Driver Version: 565.90 WHQL</div>
                <div className="text-[10px] text-white/40">DirectX 12 Ultimate / Vulkan 1.3</div>
              </div>
            </div>

            {/* Hardware Telemetry Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#19191d] rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] text-white/50 flex items-center space-x-1.5">
                  <Flame size={13} className="text-amber-400" />
                  <span>GPU Temperature</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">58°C</div>
                <div className="text-[10px] text-emerald-400">Hotspot: 67°C (Optimal)</div>
              </div>

              <div className="p-4 bg-[#19191d] rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] text-white/50 flex items-center space-x-1.5">
                  <Activity size={13} className="text-blue-400" />
                  <span>GPU Clock</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {tuningProfile === 'overclock' ? '2,715 MHz' : '2,550 MHz'}
                </div>
                <div className="text-[10px] text-white/60">Memory: 21,000 MHz</div>
              </div>

              <div className="p-4 bg-[#19191d] rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] text-white/50 flex items-center space-x-1.5">
                  <Zap size={13} className="text-amber-400" />
                  <span>Board Power (TGP)</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {tuningProfile === 'overclock' ? '385W' : '295W'}
                </div>
                <div className="text-[10px] text-white/60">Limit: 450W Maximum</div>
              </div>

              <div className="p-4 bg-[#19191d] rounded-2xl border border-white/10 space-y-1">
                <div className="text-[11px] text-white/50 flex items-center space-x-1.5">
                  <Layers size={13} className="text-purple-400" />
                  <span>Dedicated VRAM</span>
                </div>
                <div className="text-2xl font-bold font-mono text-white">14.2 / 24.0 GB</div>
                <div className="text-[10px] text-cyan-400">GDDR6X (1,008 GB/s Bandwidth)</div>
              </div>
            </div>

            {/* Performance Tuning & Fan Profiles */}
            <div className="p-5 rounded-2xl bg-[#19191d] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">NVIDIA Performance Tuning Profiles</h3>
                  <div className="text-xs text-white/50">One-click GPU clock presets and acoustic fan profiles</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'quiet',
                    name: 'Whisper Silent',
                    sub: '0 RPM Fan Stop · 45°C limit',
                    icon: '🤫',
                  },
                  {
                    id: 'balanced',
                    name: 'NVIDIA Balanced',
                    sub: 'Optimal RTX performance & temps',
                    icon: '⚖️',
                  },
                  {
                    id: 'overclock',
                    name: 'RTX Titan Overclock',
                    sub: '+165 MHz Core · +600 MHz VRAM',
                    icon: '⚡',
                  },
                ].map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      soundManager.playClick();
                      setTuningProfile(prof.id as any);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      tuningProfile === prof.id
                        ? 'bg-[#76b900]/20 border-[#76b900] shadow-md'
                        : 'bg-white/5 border-transparent hover:bg-white/8'
                    }`}
                  >
                    <div className="text-xl mb-1">{prof.icon}</div>
                    <div className="font-bold text-xs text-white">{prof.name}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{prof.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 bg-[#0e0e10] border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-[#76b900] font-semibold">
            <Shield size={13} />
            <span>NVIDIA GeForce RTX Engine Ready</span>
          </span>
          <span>•</span>
          <span>Cloud Gaming SuperPOD Online</span>
        </div>

        <div className="flex items-center space-x-2">
          <span>GeForce Driver: <strong>565.90 WHQL</strong></span>
        </div>
      </div>
    </div>
  );
};
