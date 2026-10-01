import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  ExternalLink,
  Download,
  Folder,
  Sparkles,
  ArrowRight,
  Check,
  RotateCw,
  Globe,
  HardDrive,
  ShieldCheck,
  Cpu,
  Monitor,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { appManager } from '../services/appManager';
import { AppId } from '../types/os';
import confetti from 'canvas-confetti';

export interface DashboardTile {
  id: string;
  name: string;
  url: string;
  icon: string;
  isWide?: boolean;
  colorClass?: string; // 'orange' | 'blue' | 'emerald' | 'purple' | 'default'
  customBg?: string;
  desc?: string;
}

interface WindowsStartPageProps {
  onNavigate: (url: string, title?: string) => void;
  brandName?: string;
  searchPlaceholder?: string;
  onOpenApp?: (appId: AppId, data?: any) => void;
}

const DEFAULT_TILES: DashboardTile[] = [
  // Row 1
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    icon: '📺',
    isWide: true,
    colorClass: 'orange',
    desc: 'Watch videos, music & livestreams',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: '💻',
    isWide: false,
    colorClass: 'default',
    desc: 'Code repositories & open source',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://reddit.com',
    icon: '🤖',
    isWide: false,
    colorClass: 'default',
    desc: 'Community discussions & topics',
  },

  // Row 2
  {
    id: 'outlook',
    name: 'Outlook',
    url: 'https://live.com',
    icon: '✉️',
    isWide: false,
    colorClass: 'blue',
    desc: 'Email, calendar & contacts',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Special:Random',
    icon: '📚',
    isWide: false,
    colorClass: 'default',
    desc: 'Free encyclopedia knowledge',
  },
  {
    id: 'news',
    name: 'News',
    url: 'https://news.ycombinator.com',
    icon: '📰',
    isWide: true,
    colorClass: 'default',
    desc: 'Global headlines & technology',
  },

  // Row 3
  {
    id: 'downloads',
    name: 'Win11 Downloads',
    url: 'chrome://downloads',
    icon: '📥',
    isWide: true,
    colorClass: 'emerald',
    desc: 'Download anything to PC or Win11',
  },
  {
    id: 'weather',
    name: 'Weather',
    url: 'https://weather.forecast',
    icon: '⛅',
    isWide: false,
    colorClass: 'default',
    desc: 'Radar & 7-day forecast',
  },
  {
    id: 'maps',
    name: 'World Map',
    url: 'https://www.openstreetmap.org',
    icon: '🗺️',
    isWide: false,
    colorClass: 'default',
    desc: 'Live street map explorer',
  },
];

export const WindowsStartPage: React.FC<WindowsStartPageProps> = ({
  onNavigate,
  brandName = 'Windows Start Page',
  searchPlaceholder = 'Type to search or download Chrome...',
  onOpenApp,
}) => {
  const [timeStr, setTimeStr] = useState('00:00');
  const [dateStr, setDateStr] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isChromeInstalled, setIsChromeInstalled] = useState<boolean>(() =>
    appManager.isInstalled('chrome')
  );

  // Installer simulation state
  const [installState, setInstallState] = useState<{
    inProgress: boolean;
    step: string;
    progress: number;
    completed: boolean;
  }>({
    inProgress: false,
    step: '',
    progress: 0,
    completed: false,
  });

  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const [tiles, setTiles] = useState<DashboardTile[]>(() => {
    try {
      const saved = localStorage.getItem('win11_start_page_tiles');
      return saved ? JSON.parse(saved) : DEFAULT_TILES;
    } catch (_) {
      return DEFAULT_TILES;
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTileName, setNewTileName] = useState('');
  const [newTileUrl, setNewTileUrl] = useState('');
  const [newTileIcon, setNewTileIcon] = useState('🌐');
  const [newTileWide, setNewTileWide] = useState(false);
  const [newTileColor, setNewTileColor] = useState('default');

  // Sync installation state with appManager
  useEffect(() => {
    return appManager.subscribe(() => {
      setIsChromeInstalled(appManager.isInstalled('chrome'));
    });
  }, []);

  // Real-time clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours: any = now.getHours();
      let minutes: any = now.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes;
      hours = hours < 10 ? '0' + hours : hours;
      setTimeStr(`${hours}:${minutes}`);

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      };
      setDateStr(now.toLocaleDateString('en-US', options));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveTiles = (newTiles: DashboardTile[]) => {
    setTiles(newTiles);
    try {
      localStorage.setItem('win11_start_page_tiles', JSON.stringify(newTiles));
    } catch (_) {}
  };

  const handleTileClick = (e: React.MouseEvent, tile: DashboardTile) => {
    e.preventDefault();
    soundManager.playClick();
    onNavigate(tile.url, tile.name);
  };

  // Helper to open native browser tab or route safely
  const handleRouting = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = url;
    }
  };

  // Direct installation execution function
  const downloadChrome = () => {
    soundManager.playClick();

    if (installState.inProgress) return;

    setInstallState({
      inProgress: true,
      step: 'Connecting to Google Chrome distribution network...',
      progress: 15,
      completed: false,
    });

    setTimeout(() => {
      setInstallState((prev) => ({
        ...prev,
        step: 'Downloading ChromeSetup.exe package (18.5 MB)...',
        progress: 45,
      }));

      // Write installer file to Win11 filesystem
      const setupContent = `[Google Chrome Installer Package]\nVersion=131.0.6778.86\nChannel=Stable\nPlatform=Win11-x64\nCreated=${new Date().toISOString()}\nTarget=System32/chrome.exe\nStatus=Verified_Package`;
      fs.createFile('ChromeSetup.exe', 'downloads', setupContent, 'sys');
    }, 600);

    setTimeout(() => {
      setInstallState((prev) => ({
        ...prev,
        step: 'Deploying V8 engine & Chromium binaries to Win11 OS...',
        progress: 80,
      }));
    }, 1300);

    setTimeout(() => {
      // Register app in system
      appManager.installApp('chrome');
      setIsChromeInstalled(true);

      setInstallState({
        inProgress: false,
        step: 'Google Chrome installed successfully!',
        progress: 100,
        completed: true,
      });

      soundManager.playDing();

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      setNotificationToast('Google Chrome is installed & ready! Setup saved to Downloads.');
      setTimeout(() => setNotificationToast(null), 5000);
    }, 2000);
  };

  const executeSearch = () => {
    const rawInput = searchInput.trim();
    if (!rawInput) return;

    const lowerInput = rawInput.toLowerCase();

    // Smart scanner logic detects if user wants the browser setup installation
    if (
      lowerInput.includes('install google chrome') ||
      lowerInput.includes('download chrome') ||
      lowerInput.includes('install chrome') ||
      lowerInput.includes('download google chrome') ||
      lowerInput.includes('get chrome')
    ) {
      downloadChrome();
    } else {
      // Check if user specifically requested an external search or navigate inside simulator
      soundManager.playClick();
      onNavigate(rawInput);
    }
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleLaunchChrome = () => {
    soundManager.playClick();
    if (onOpenApp) {
      onOpenApp('chrome');
    } else {
      onNavigate('chrome://newtab', 'Google Chrome');
    }
  };

  const handleAddTile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTileName.trim() || !newTileUrl.trim()) return;
    soundManager.playClick();

    let finalUrl = newTileUrl.trim();
    if (
      !finalUrl.startsWith('http://') &&
      !finalUrl.startsWith('https://') &&
      !finalUrl.startsWith('chrome://') &&
      !finalUrl.startsWith('edge://')
    ) {
      finalUrl = `https://${finalUrl}`;
    }

    const newTile: DashboardTile = {
      id: `tile_${Date.now()}`,
      name: newTileName.trim(),
      url: finalUrl,
      icon: newTileIcon.trim() || '🌐',
      isWide: newTileWide,
      colorClass: newTileColor,
    };

    saveTiles([...tiles, newTile]);
    setShowAddModal(false);
    setNewTileName('');
    setNewTileUrl('');
    setNewTileIcon('🌐');
    setNewTileWide(false);
    setNewTileColor('default');
  };

  const handleDeleteTile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    soundManager.playClick();
    saveTiles(tiles.filter((t) => t.id !== id));
  };

  const getColorClasses = (colorClass?: string) => {
    switch (colorClass) {
      case 'orange':
        return 'bg-[#d83b01] hover:bg-[#b83201] text-white border-transparent';
      case 'blue':
        return 'bg-[#0078d4] hover:bg-[#0063b1] text-white border-transparent';
      case 'emerald':
        return 'bg-[#107c41] hover:bg-[#0e6b37] text-white border-transparent';
      case 'purple':
        return 'bg-[#8764b8] hover:bg-[#744da9] text-white border-transparent';
      default:
        return 'bg-white/10 hover:bg-white/20 text-white border-white/5 hover:border-[#0078d4]';
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-start p-6 bg-[#0f0f12] text-[#e4e4e7] select-none overflow-y-auto font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif]">
      {/* Real-time Clock Header */}
      <div className="text-center mb-6 mt-2">
        <div className="text-5xl sm:text-6xl font-light tracking-tight text-white drop-shadow-md">
          {timeStr}
        </div>
        <div className="text-xs sm:text-sm text-neutral-400 mt-1 font-normal tracking-wide">
          {dateStr || 'Loading Date...'}
        </div>
      </div>

      {/* Main Search & Downloader Wrapper */}
      <div className="w-full max-w-[680px] text-center mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-[#a855f7] to-[#3b82f6] bg-clip-text text-transparent">
          Universal Search Engine
        </h1>
        <div className="text-sm text-[#a1a1aa] mb-6">
          Enter keywords to browse or trigger application packages
        </div>

        {/* Search Module Box */}
        <form
          onSubmit={handleSubmitSearch}
          className="flex bg-[#1e1e24] border-2 border-[#2e2e38] rounded-xl p-1.5 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] focus-within:border-[#3b82f6] focus-within:shadow-[0_0_15px_rgba(59,130,246,0.3)] mb-5"
        >
          <input
            type="text"
            id="queryInput"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
            autoComplete="off"
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-base text-white placeholder-[#71717a]"
          />
          <button
            type="submit"
            className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white border-none px-6 py-2.5 text-[15px] font-semibold rounded-lg cursor-pointer transition hover:opacity-90 flex items-center justify-center space-x-1.5 shrink-0 shadow-md"
          >
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>

        {/* Quick Search Tags & Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-5 text-xs">
          <span className="text-neutral-500 mr-1 text-[11px]">Quick Triggers:</span>
          {[
            { label: '🤖 Install Chrome', query: 'install google chrome' },
            { label: '📥 Win11 Downloads', url: 'chrome://downloads' },
            { label: '📰 Tech News', url: 'https://news.ycombinator.com' },
            { label: '📚 Wikipedia AI', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
            { label: '⚡ React Docs', url: 'https://react.dev' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.query) {
                  setSearchInput(item.query);
                  downloadChrome();
                } else if (item.url) {
                  onNavigate(item.url);
                }
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition text-[11px]"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Dedicated Chrome Downloader Banner Widget */}
        <div className="bg-gradient-to-r from-[#1e1e24] to-[#272730] border border-[#3f3f46] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-[0_4px_15px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white text-[15px]">
                Google Chrome Browser Utility
              </span>
              {isChromeInstalled && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  INSTALLED
                </span>
              )}
            </div>
            <span className="text-[#a1a1aa] text-[13px]">
              Deploy the setup file package onto your current OS environment
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
            {installState.inProgress ? (
              <div className="flex items-center space-x-2 bg-emerald-600/30 border border-emerald-500/50 px-4 py-2 rounded-lg text-emerald-300 text-xs font-semibold">
                <RotateCw size={14} className="animate-spin" />
                <span>Installing ({installState.progress}%)...</span>
              </div>
            ) : isChromeInstalled ? (
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleLaunchChrome}
                  className="flex-1 sm:flex-initial bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition border-none cursor-pointer flex items-center justify-center space-x-1.5 shadow"
                >
                  <span>🚀 Open Chrome</span>
                </button>
                <button
                  type="button"
                  onClick={downloadChrome}
                  className="bg-white/10 hover:bg-white/15 text-white/80 hover:text-white px-3 py-2.5 text-xs rounded-lg transition"
                  title="Redownload ChromeSetup.exe into Win11"
                >
                  <Download size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={downloadChrome}
                className="w-full sm:w-auto bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2.5 text-sm font-semibold rounded-lg transition border-none cursor-pointer flex items-center justify-center space-x-1.5 shadow"
              >
                <span>🤖 Install Chrome</span>
              </button>
            )}
          </div>
        </div>

        {/* Installation Progress Bar (Active when downloading) */}
        {installState.inProgress && (
          <div className="mt-3 bg-[#1e1e24] border border-[#2e2e38] rounded-xl p-3 text-left space-y-1.5 animate-in fade-in">
            <div className="flex justify-between text-xs text-neutral-300">
              <span className="font-mono text-emerald-400">{installState.step}</span>
              <span className="font-bold text-white">{installState.progress}%</span>
            </div>
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${installState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notificationToast && (
          <div className="mt-3 bg-emerald-600/90 border border-emerald-400 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-medium animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <Check size={16} />
              <span>{notificationToast}</span>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenApp && (
                <button
                  onClick={() => onOpenApp('explorer', { folderId: 'downloads' })}
                  className="underline hover:text-emerald-100 font-semibold text-xs cursor-pointer"
                >
                  View Downloads
                </button>
              )}
              <button
                onClick={() => setNotificationToast(null)}
                className="p-1 hover:bg-emerald-700 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Search Engine Bar External Fallback Helper */}
        <div className="flex items-center justify-between mt-3 px-1 text-xs text-neutral-400">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-neutral-500">Engine:</span>
            <span className="font-semibold text-[#3b82f6] flex items-center space-x-1">
              <span>Google Search Subsystem</span>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] text-emerald-400 font-medium">Bypass Sandbox Routing</span>
          </div>

          <button
            onClick={() => {
              const q = searchInput.trim();
              const url = q ? `https://google.com/search?q=${encodeURIComponent(q)}` : 'https://google.com';
              handleRouting(url);
            }}
            className="text-[11px] text-[#3b82f6] hover:underline flex items-center space-x-1 transition font-medium cursor-pointer"
            title="Open query in a new external browser tab"
          >
            <span>Open in Google.com</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Windows Dashboard Tiles Grid */}
      <div className="w-full max-w-[680px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Speed Dial Shortcuts
          </span>
          <button
            onClick={() => {
              soundManager.playClick();
              setShowAddModal(true);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer font-medium"
          >
            <Plus size={14} />
            <span>Add Shortcut</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 justify-center w-full">
          {tiles.map((tile) => {
            const isWide = tile.isWide;
            const colorStyles = getColorClasses(tile.colorClass);

            return (
              <div
                key={tile.id}
                onClick={(e) => handleTileClick(e, tile)}
                className={`group relative flex flex-col items-center justify-center h-[120px] rounded-xl border text-decoration-none transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.03] active:scale-[0.98] ${
                  isWide ? 'col-span-2 w-full' : 'col-span-1'
                } ${colorStyles}`}
              >
                {/* Delete Tile Button on hover */}
                <button
                  onClick={(e) => handleDeleteTile(e, tile.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 hover:bg-red-600 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition z-10"
                  title="Remove Shortcut"
                >
                  <X size={12} />
                </button>

                <span className="text-3xl mb-1.5 drop-shadow-sm group-hover:scale-110 transition-transform">
                  {tile.icon}
                </span>
                <span className="text-xs font-semibold tracking-wide text-white drop-shadow">
                  {tile.name}
                </span>
                {tile.desc && isWide && (
                  <span className="text-[10px] text-white/80 mt-0.5 truncate max-w-[90%] px-2">
                    {tile.desc}
                  </span>
                )}
              </div>
            );
          })}

          {/* Add Tile Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowAddModal(true);
            }}
            className="flex flex-col items-center justify-center h-[120px] rounded-xl border border-dashed border-white/20 hover:border-[#3b82f6] bg-[#1e1e24]/60 hover:bg-[#1e1e24] text-white/50 hover:text-white transition duration-200 cursor-pointer shadow-sm"
            title="Add Custom Website Shortcut"
          >
            <Plus size={22} className="mb-1" />
            <span className="text-xs font-medium">Add Tile</span>
          </button>
        </div>
      </div>

      {/* Footer System Note */}
      <div className="mt-8 mb-4 text-center text-[11px] text-neutral-500 flex items-center space-x-2">
        <span>Win11 Web OS</span>
        <span>•</span>
        <span>Universal Web Search &amp; Downloader Subsystem</span>
        <span>•</span>
        <span>Sandbox Safe</span>
      </div>

      {/* Add Custom Tile Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e24] border border-[#3f3f46] rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm">Add New Start Shortcut</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddTile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">Shortcut Name</label>
                <input
                  type="text"
                  value={newTileName}
                  onChange={(e) => setNewTileName(e.target.value)}
                  placeholder="e.g. Netflix, Twitch, Twitter"
                  required
                  className="w-full bg-[#121216] border border-white/15 focus:border-[#3b82f6] rounded-lg px-3 py-2 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">Website URL or Search</label>
                <input
                  type="text"
                  value={newTileUrl}
                  onChange={(e) => setNewTileUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full bg-[#121216] border border-white/15 focus:border-[#3b82f6] rounded-lg px-3 py-2 outline-none text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    value={newTileIcon}
                    onChange={(e) => setNewTileIcon(e.target.value)}
                    placeholder="🌐"
                    className="w-full bg-[#121216] border border-white/15 focus:border-[#3b82f6] rounded-lg px-3 py-2 outline-none text-white text-center text-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-1">Color Theme</label>
                  <select
                    value={newTileColor}
                    onChange={(e) => setNewTileColor(e.target.value)}
                    className="w-full bg-[#121216] border border-white/15 focus:border-[#3b82f6] rounded-lg px-2.5 py-2 outline-none text-white"
                  >
                    <option value="default">Neutral Glass</option>
                    <option value="blue">Windows Blue</option>
                    <option value="orange">Orange Red</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="purple">Royal Purple</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="tileWideCheck"
                  checked={newTileWide}
                  onChange={(e) => setNewTileWide(e.target.checked)}
                  className="accent-[#3b82f6] rounded"
                />
                <label htmlFor="tileWideCheck" className="text-white/80 cursor-pointer">
                  Double-Wide Tile (spans 2 columns)
                </label>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl font-semibold shadow transition cursor-pointer"
                >
                  Add Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
