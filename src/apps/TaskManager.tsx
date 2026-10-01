import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Layers,
  Power,
  RotateCw,
  Search,
  Check,
  X,
  Plus,
  Play,
  Square,
  Shield,
  Clock,
  Sliders,
  Maximize2,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { WindowInstance, AppId } from '../types/os';
import { soundManager } from '../services/sound';
import { APPS_CATALOG } from '../components/StartMenu';

interface TaskManagerProps {
  windows: WindowInstance[];
  onCloseWindow: (id: string) => void;
  onFocusWindow?: (id: string) => void;
  onOpenApp?: (appId: AppId, data?: any) => void;
}

interface ProcessItem {
  id: string;
  name: string;
  type: 'app' | 'background';
  windowId?: string;
  appId?: AppId;
  icon: string;
  cpu: number;
  memory: number; // in MB
  disk: number; // in MB/s
  network: number; // in Mbps
  status: 'Running' | 'Active' | 'Suspended';
}

const SYSTEM_PROCESSES: Omit<ProcessItem, 'cpu' | 'memory' | 'disk' | 'network'>[] = [
  { id: 'sys_dwm', name: 'Desktop Window Manager (dwm.exe)', type: 'background', icon: '🪟', status: 'Running' },
  { id: 'sys_explorer', name: 'Windows Explorer (explorer.exe)', type: 'background', icon: '📁', status: 'Running' },
  { id: 'sys_nv', name: 'NVIDIA RTX Display Container (nvcontainer.exe)', type: 'background', icon: '🟢', status: 'Running' },
  { id: 'sys_gfn', name: 'NVIDIA GeForce NOW Cloud Engine (geforcenow.exe)', type: 'background', icon: '🎮', status: 'Running' },
  { id: 'sys_audio', name: 'Windows Audio Engine (audiodg.exe)', type: 'background', icon: '🔊', status: 'Running' },
  { id: 'sys_dl', name: 'Universal Downloader Subsystem', type: 'background', icon: '📥', status: 'Running' },
  { id: 'sys_fs', name: 'Virtual Storage Manager (ntfs.sys)', type: 'background', icon: '💾', status: 'Running' },
  { id: 'sys_net', name: 'Wi-Fi 6E Wireless Service (wlan.sys)', type: 'background', icon: '📶', status: 'Running' },
  { id: 'sys_sec', name: 'Microsoft Defender Core (MsMpEng.exe)', type: 'background', icon: '🛡️', status: 'Running' },
];

export const TaskManager: React.FC<TaskManagerProps> = ({
  windows,
  onCloseWindow,
  onFocusWindow,
  onOpenApp,
}) => {
  const [activeTab, setActiveTab] = useState<'processes' | 'performance' | 'startup' | 'services'>('processes');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Performance Tab state
  const [perfCategory, setPerfCategory] = useState<'cpu' | 'memory' | 'disk' | 'wifi' | 'gpu'>('cpu');
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.floor(Math.random() * 15 + 8)));
  const [memHistory, setMemHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.floor(Math.random() * 5 + 28)));
  const [gpuHistory, setGpuHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.floor(Math.random() * 20 + 25)));
  const [uptimeSeconds, setUptimeSeconds] = useState(1482);

  // Run new task modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [runInput, setRunInput] = useState('');

  // Startup apps state
  const [startupApps, setStartupApps] = useState([
    { id: 'aura', name: 'Aura Virtual Window', publisher: 'Windows Shell', status: 'Enabled', impact: 'Medium' },
    { id: 'defender', name: 'Microsoft Defender Security', publisher: 'Microsoft Corporation', status: 'Enabled', impact: 'Low' },
    { id: 'audio', name: 'Web Audio Harmonic Engine', publisher: 'Virtual Audio Driver', status: 'Enabled', impact: 'Low' },
    { id: 'downloader', name: 'Universal Downloader Service', publisher: 'Win11 Subsystem', status: 'Enabled', impact: 'Low' },
    { id: 'edge', name: 'Microsoft Edge Web Assistant', publisher: 'Microsoft Corporation', status: 'Disabled', impact: 'None' },
  ]);

  // Live simulation tick for CPU, Memory, Uptime
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((s) => s + 1);
      setCpuHistory((prev) => {
        const nextVal = Math.max(4, Math.min(85, Math.floor(prev[prev.length - 1] + (Math.random() * 12 - 6))));
        return [...prev.slice(1), nextVal];
      });
      setMemHistory((prev) => {
        const nextVal = Math.max(20, Math.min(65, Math.floor(prev[prev.length - 1] + (Math.random() * 4 - 2))));
        return [...prev.slice(1), nextVal];
      });
      setGpuHistory((prev) => {
        const nextVal = Math.max(12, Math.min(96, Math.floor(prev[prev.length - 1] + (Math.random() * 14 - 7))));
        return [...prev.slice(1), nextVal];
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Build dynamic process list based on currently open windows
  const appProcesses: ProcessItem[] = windows.map((win, idx) => {
    // Deterministic pseudo-random resource usage per app
    const hash = (win.id.charCodeAt(win.id.length - 1) || 5) + idx * 7;
    const cpu = Number(((hash % 12) + 0.8).toFixed(1));
    const memory = 45 + (hash % 180);
    const disk = Number(((hash % 5) * 0.1).toFixed(1));
    const network = Number(((hash % 8) * 0.2).toFixed(1));

    return {
      id: win.id,
      name: `${win.title} (${win.appId}.exe)`,
      type: 'app',
      windowId: win.id,
      appId: win.appId,
      icon: win.icon,
      cpu,
      memory,
      disk,
      network,
      status: 'Active',
    };
  });

  const backgroundProcesses: ProcessItem[] = SYSTEM_PROCESSES.map((sys, idx) => {
    const cpu = Number((((idx * 3 + 2) % 5) * 0.4).toFixed(1));
    const memory = 15 + ((idx * 17) % 60);
    return {
      ...sys,
      cpu,
      memory,
      disk: 0.1,
      network: 0.0,
    };
  });

  const allProcesses = [...appProcesses, ...backgroundProcesses];
  const filteredProcesses = allProcesses.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalCpu = Math.min(99, appProcesses.reduce((acc, p) => acc + p.cpu, 4.2)).toFixed(1);
  const totalMemory = (appProcesses.reduce((acc, p) => acc + p.memory, 4200) / 1024).toFixed(1);

  const handleEndTask = () => {
    if (!selectedProcessId) return;
    soundManager.playClick();

    const proc = allProcesses.find((p) => p.id === selectedProcessId);
    if (!proc) return;

    if (proc.windowId) {
      onCloseWindow(proc.windowId);
      soundManager.playDing();
      setStatusToast(`Ended process: ${proc.name}`);
      setSelectedProcessId(null);
    } else {
      soundManager.playError();
      setStatusToast(`Cannot terminate critical system process: ${proc.name}`);
    }
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleRunTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!runInput.trim() || !onOpenApp) return;
    soundManager.playClick();

    const cmd = runInput.trim().toLowerCase();
    const appMatch = APPS_CATALOG.find(
      (a) => a.id.toLowerCase() === cmd || a.name.toLowerCase().includes(cmd)
    );

    if (appMatch) {
      onOpenApp(appMatch.id);
      setStatusToast(`Started process: ${appMatch.name}`);
    } else if (cmd === 'cmd' || cmd === 'powershell') {
      onOpenApp('terminal');
      setStatusToast('Started Terminal process');
    } else if (cmd === 'calc') {
      onOpenApp('calculator');
      setStatusToast('Started Calculator process');
    } else {
      // Default to opening Chrome search for command
      onOpenApp('chrome', { query: cmd });
      setStatusToast(`Searching web for executable: ${cmd}`);
    }

    setShowRunModal(false);
    setRunInput('');
    setTimeout(() => setStatusToast(null), 3000);
  };

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderSvgChart = (data: number[], color: string) => {
    const width = 360;
    const height = 140;
    const max = 100;
    const step = width / (data.length - 1);

    const points = data
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / max) * (height - 10) - 5;
        return `${x},${y}`;
      })
      .join(' ');

    const fillPoints = `0,${height} ${points} ${width},${height}`;

    return (
      <svg className="w-full h-36 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={`grad_${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            y1={height * ratio}
            x2={width}
            y2={height * ratio}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Gradient Fill Area */}
        <polygon points={fillPoints} fill={`url(#grad_${color})`} />

        {/* Line Stroke */}
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white select-none font-sans text-xs">
      {/* Top Header & Navigation Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252525] border-b border-white/10">
        <div className="flex items-center space-x-1">
          {[
            { id: 'processes', label: 'Processes', icon: Activity },
            { id: 'performance', label: 'Performance', icon: Cpu },
            { id: 'startup', label: 'Startup Apps', icon: Clock },
            { id: 'services', label: 'Services', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {statusToast && (
            <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 animate-pulse">
              {statusToast}
            </span>
          )}

          <button
            onClick={() => {
              soundManager.playClick();
              setShowRunModal(true);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded-lg text-white text-xs transition"
            title="Launch a new application or task"
          >
            <Plus size={13} />
            <span>Run new task</span>
          </button>

          <button
            onClick={handleEndTask}
            disabled={!selectedProcessId}
            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-lg text-xs font-semibold shadow transition"
            title="Terminate the selected process"
          >
            <Square size={12} fill="currentColor" />
            <span>End task</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ========================================================= */}
        {/* TAB 1: PROCESSES LIST (RUNNING APPS & RESOURCE CONSUMPTION)*/}
        {/* ========================================================= */}
        {activeTab === 'processes' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Search & Overall Stats */}
            <div className="px-4 py-2 bg-[#222] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2 w-64 bg-[#181818] border border-white/10 rounded-lg px-2.5 py-1">
                <Search size={13} className="text-white/40" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter processes..."
                  className="bg-transparent text-xs text-white outline-none w-full"
                />
              </div>

              <div className="flex items-center space-x-6 text-[11px] text-white/60">
                <span>Apps: <strong className="text-white">{appProcesses.length}</strong></span>
                <span>Background: <strong className="text-white">{backgroundProcesses.length}</strong></span>
                <span>Total CPU: <strong className="text-amber-400">{totalCpu}%</strong></span>
                <span>RAM In Use: <strong className="text-blue-400">{totalMemory} GB</strong></span>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#252525] border-b border-white/10 text-[11px] font-semibold text-white/60">
              <div className="col-span-5">Name</div>
              <div className="col-span-2 text-right">Status</div>
              <div className="col-span-1 text-right">CPU</div>
              <div className="col-span-2 text-right">Memory</div>
              <div className="col-span-1 text-right">Disk</div>
              <div className="col-span-1 text-right">Network</div>
            </div>

            {/* Processes Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {/* App Processes Group */}
              <div className="px-4 py-1.5 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Apps ({appProcesses.length})
              </div>

              {appProcesses.length === 0 && (
                <div className="p-4 text-center text-xs text-white/40">
                  No active application windows open. Open apps via Start menu or click "Run new task".
                </div>
              )}

              {filteredProcesses
                .filter((p) => p.type === 'app')
                .map((proc) => {
                  const isSelected = selectedProcessId === proc.id;
                  return (
                    <div
                      key={proc.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedProcessId(proc.id);
                      }}
                      onDoubleClick={() => {
                        if (proc.windowId && onFocusWindow) {
                          onFocusWindow(proc.windowId);
                        }
                      }}
                      className={`grid grid-cols-12 gap-2 px-4 py-2 items-center cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600/30 border-l-4 border-blue-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="col-span-5 flex items-center space-x-2.5 truncate">
                        <span className="text-base shrink-0">{proc.icon}</span>
                        <span className="font-medium text-white truncate">{proc.name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {proc.status}
                        </span>
                      </div>
                      <div className="col-span-1 text-right font-mono text-white/80">{proc.cpu}%</div>
                      <div className="col-span-2 text-right font-mono text-white/80">{proc.memory} MB</div>
                      <div className="col-span-1 text-right font-mono text-white/50">{proc.disk} MB/s</div>
                      <div className="col-span-1 text-right font-mono text-white/50">{proc.network} Mbps</div>
                    </div>
                  );
                })}

              {/* Background Processes Group */}
              <div className="px-4 py-1.5 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/40 mt-2">
                Windows Background Processes ({backgroundProcesses.length})
              </div>

              {filteredProcesses
                .filter((p) => p.type === 'background')
                .map((proc) => {
                  const isSelected = selectedProcessId === proc.id;
                  return (
                    <div
                      key={proc.id}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedProcessId(proc.id);
                      }}
                      className={`grid grid-cols-12 gap-2 px-4 py-2 items-center cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600/30 border-l-4 border-blue-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="col-span-5 flex items-center space-x-2.5 truncate">
                        <span className="text-base shrink-0">{proc.icon}</span>
                        <span className="text-white/80 truncate">{proc.name}</span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] text-white/50">System</span>
                      </div>
                      <div className="col-span-1 text-right font-mono text-white/50">{proc.cpu}%</div>
                      <div className="col-span-2 text-right font-mono text-white/50">{proc.memory} MB</div>
                      <div className="col-span-1 text-right font-mono text-white/30">{proc.disk} MB/s</div>
                      <div className="col-span-1 text-right font-mono text-white/30">{proc.network} Mbps</div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PERFORMANCE (REAL-TIME GRAPHS & HARDWARE COUNTERS) */}
        {/* ========================================================= */}
        {activeTab === 'performance' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Hardware Sidebar */}
            <div className="w-56 bg-[#222] border-r border-white/10 flex flex-col p-2 space-y-1.5 shrink-0 overflow-y-auto">
              {[
                {
                  id: 'cpu',
                  title: 'CPU',
                  val: `${cpuHistory[cpuHistory.length - 1]}%`,
                  sub: '3.40 GHz Virtual 8-Core',
                  color: '#3b82f6',
                  icon: Cpu,
                },
                {
                  id: 'memory',
                  title: 'Memory',
                  val: `${(memHistory[memHistory.length - 1] * 0.16).toFixed(1)}/16.0 GB (${memHistory[memHistory.length - 1]}%)`,
                  sub: 'Virtual DDR5 5600 MHz',
                  color: '#8b5cf6',
                  icon: Layers,
                },
                {
                  id: 'disk',
                  title: 'Disk 0 (SSD)',
                  val: '2%',
                  sub: 'Virtual LocalStorage',
                  color: '#10b981',
                  icon: HardDrive,
                },
                {
                  id: 'wifi',
                  title: 'Wi-Fi 6E',
                  val: '866 Mbps',
                  sub: 'Connected',
                  color: '#f59e0b',
                  icon: Wifi,
                },
                {
                  id: 'gpu',
                  title: 'GPU 0',
                  val: `${gpuHistory[gpuHistory.length - 1]}% (58°C)`,
                  sub: 'NVIDIA GeForce RTX 4090',
                  color: '#76b900',
                  icon: Cpu,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = perfCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundManager.playClick();
                      setPerfCategory(item.id as any);
                    }}
                    className={`p-3 rounded-xl text-left transition flex items-start space-x-3 border ${
                      isSelected
                        ? 'bg-white/10 border-blue-500 shadow'
                        : 'bg-white/5 border-transparent hover:bg-white/8'
                    }`}
                  >
                    <Icon size={18} style={{ color: item.color }} className="mt-0.5 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-white text-xs">{item.title}</div>
                      <div className="text-[11px] font-semibold text-white/90 font-mono mt-0.5">{item.val}</div>
                      <div className="text-[10px] text-white/50 truncate mt-0.5">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Graph & Detail Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {perfCategory === 'cpu' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">CPU</h2>
                      <div className="text-xs text-white/60">Virtual 8-Core Processor @ 3.40 GHz</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-blue-400">
                        {cpuHistory[cpuHistory.length - 1]}%
                      </div>
                      <div className="text-[11px] text-white/50">60 Seconds Utilization Graph</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] rounded-2xl border border-white/10 shadow-inner">
                    {renderSvgChart(cpuHistory, '#3b82f6')}
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Base Speed</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">3.40 GHz</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Cores / Threads</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">8 / 16</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Processes</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">{allProcesses.length}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Up Time</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                        {formatUptime(uptimeSeconds)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {perfCategory === 'memory' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">Memory</h2>
                      <div className="text-xs text-white/60">16.0 GB Virtual DDR5 Memory</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-purple-400">
                        {(memHistory[memHistory.length - 1] * 0.16).toFixed(1)} GB
                      </div>
                      <div className="text-[11px] text-white/50">{memHistory[memHistory.length - 1]}% in use</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] rounded-2xl border border-white/10 shadow-inner">
                    {renderSvgChart(memHistory, '#8b5cf6')}
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Speed</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">5600 MHz</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Slots Used</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">2 of 2</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Form Factor</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">SODIMM</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Hardware Reserved</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">142 MB</div>
                    </div>
                  </div>
                </div>
              )}

              {perfCategory === 'disk' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">Disk 0 (C: D:)</h2>
                      <div className="text-xs text-white/60">Virtual LocalStorage NVMe Drive</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-emerald-400">2%</div>
                      <div className="text-[11px] text-white/50">Active Time</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] rounded-2xl border border-white/10 shadow-inner">
                    {renderSvgChart([1, 2, 4, 1, 0, 5, 2, 8, 3, 1, 2, 4, 1, 0, 2], '#10b981')}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Capacity</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">512 MB Partition</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Formatted</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">NTFS Virtual</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Read / Write Speed</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">340 MB/s</div>
                    </div>
                  </div>
                </div>
              )}

              {perfCategory === 'wifi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-white">Wi-Fi 6E</h2>
                      <div className="text-xs text-white/60">Intel Wi-Fi 6E AX211 160MHz</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-amber-400">866 Mbps</div>
                      <div className="text-[11px] text-white/50">Link Speed (Full Signal)</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] rounded-2xl border border-white/10 shadow-inner">
                    {renderSvgChart([2, 5, 8, 4, 12, 18, 6, 4, 15, 8, 5, 9, 3, 10, 4], '#f59e0b')}
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">SSID</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">Win11_Ultra_WiFi</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Protocol</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">802.11ax (6 GHz)</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">IPv4 Address</div>
                      <div className="text-base font-bold font-mono text-amber-400 mt-0.5">192.168.1.145</div>
                    </div>
                  </div>
                </div>
              )}

              {perfCategory === 'gpu' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-white">GPU 0</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#76b900] text-black">
                          RTX ON
                        </span>
                      </div>
                      <div className="text-xs text-white/60">NVIDIA GeForce RTX 4090 D (24 GB GDDR6X)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-[#76b900]">
                        {gpuHistory[gpuHistory.length - 1]}%
                      </div>
                      <div className="text-[11px] text-white/50">3D &amp; Ray Tracing Utilization</div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] rounded-2xl border border-white/10 shadow-inner">
                    {renderSvgChart(gpuHistory, '#76b900')}
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">GPU Memory</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">14.2 / 24.0 GB</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">GPU Temperature</div>
                      <div className="text-base font-bold font-mono text-[#76b900] mt-0.5">58°C (Optimal)</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">Driver Version</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">565.90 WHQL</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[10px] text-white/50 uppercase">DirectX</div>
                      <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">12 Ultimate</div>
                    </div>
                  </div>

                  {onOpenApp && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onOpenApp('nvidia');
                        }}
                        className="px-4 py-2 bg-[#76b900] hover:bg-[#68a300] text-black font-extrabold rounded-xl shadow transition text-xs flex items-center space-x-1.5"
                      >
                        <span>Open NVIDIA GeForce NOW RTX Control Panel</span>
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STARTUP APPS (MANAGE BOOT PROCESSES)               */}
        {/* ========================================================= */}
        {activeTab === 'startup' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Startup Applications</h2>
                <div className="text-xs text-white/50">Enable or disable apps that launch automatically when Win11 Web OS boots.</div>
              </div>
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
              <div className="grid grid-cols-12 gap-2 p-3 bg-white/5 text-[11px] font-semibold text-white/60">
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Publisher</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Startup Impact</div>
              </div>

              {startupApps.map((app) => (
                <div key={app.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 text-xs">
                  <div className="col-span-5 font-semibold text-white truncate">{app.name}</div>
                  <div className="col-span-3 text-white/50 truncate">{app.publisher}</div>
                  <div className="col-span-2">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setStartupApps((prev) =>
                          prev.map((a) =>
                            a.id === app.id
                              ? { ...a, status: a.status === 'Enabled' ? 'Disabled' : 'Enabled' }
                              : a
                          )
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                        app.status === 'Enabled'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {app.status}
                    </button>
                  </div>
                  <div className="col-span-2 text-right text-white/60 font-medium">
                    {app.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SERVICES                                           */}
        {/* ========================================================= */}
        {activeTab === 'services' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Windows Services</h2>
                <div className="text-xs text-white/50">Core operating system daemons and subsystem services.</div>
              </div>
            </div>

            <div className="divide-y divide-white/10 border border-white/10 rounded-2xl overflow-hidden bg-white/5">
              {[
                { name: 'AudioSrv', desc: 'Windows Audio Core Service', status: 'Running' },
                { name: 'CryptSvc', desc: 'Cryptographic Services & Key Storage', status: 'Running' },
                { name: 'Dhcp', desc: 'DHCP Client Network Resolver', status: 'Running' },
                { name: 'Dnscache', desc: 'DNS Client Web Cache', status: 'Running' },
                { name: 'Spooler', desc: 'Print Spooler Subsystem', status: 'Stopped' },
                { name: 'WinDefend', desc: 'Microsoft Defender Antivirus Service', status: 'Running' },
                { name: 'wuauserv', desc: 'Windows Update Orchestration Service', status: 'Running' },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between p-3 hover:bg-white/5 text-xs">
                  <div>
                    <div className="font-bold text-white">{svc.name}</div>
                    <div className="text-[11px] text-white/50">{svc.desc}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      svc.status === 'Running'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Run New Task Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#262626] border border-white/20 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <span>Create New Task</span>
              </h3>
              <button
                onClick={() => setShowRunModal(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleRunTask} className="space-y-4">
              <div>
                <p className="text-xs text-white/70 mb-2">
                  Type the name of a program, folder, or document, and Windows will open it for you.
                </p>
                <label className="block text-[11px] text-white/50 mb-1">Open:</label>
                <input
                  type="text"
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  placeholder="e.g. chrome, explorer, notepad, cmd, paint"
                  autoFocus
                  required
                  className="w-full bg-[#181818] border border-white/20 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunModal(false)}
                  className="flex-1 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold shadow transition"
                >
                  OK / Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
