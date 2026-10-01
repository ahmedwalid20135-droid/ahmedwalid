import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Check,
  Star,
  Play,
  Trash2,
  Sparkles,
  ShoppingBag,
  Layers,
  Gamepad2,
  HardDrive,
  ArrowRight,
} from 'lucide-react';
import { AppId } from '../types/os';
import { appManager, STORE_CATALOG, StoreAppInfo, CORE_APP_IDS } from '../services/appManager';
import { soundManager } from '../services/sound';

interface MicrosoftStoreProps {
  onOpenApp: (appId: AppId) => void;
}

export const MicrosoftStore: React.FC<MicrosoftStoreProps> = ({ onOpenApp }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'apps' | 'games' | 'library'>('home');
  const [search, setSearch] = useState('');
  const [downloadingAppId, setDownloadingAppId] = useState<AppId | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [installedIds, setInstalledIds] = useState<AppId[]>(() => appManager.getInstalledAppIds());
  const [selectedApp, setSelectedApp] = useState<StoreAppInfo | null>(null);

  useEffect(() => {
    return appManager.subscribe(() => {
      setInstalledIds(appManager.getInstalledAppIds());
    });
  }, []);

  const handleDownloadApp = (app: StoreAppInfo) => {
    soundManager.playClick();
    setDownloadingAppId(app.id);
    setDownloadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadProgress(100);
        setTimeout(() => {
          appManager.installApp(app.id);
          setDownloadingAppId(null);
        }, 100);
      } else {
        setDownloadProgress(progress);
      }
    }, 200);
  };

  const handleUninstall = (appId: AppId) => {
    soundManager.playClick();
    appManager.uninstallApp(appId);
  };

  const filteredApps = STORE_CATALOG.filter((app) => {
    const matchSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'games') return matchSearch && app.category === 'Games';
    if (activeTab === 'apps') return matchSearch && app.category !== 'Games';
    if (activeTab === 'library') return matchSearch && installedIds.includes(app.id);
    return matchSearch;
  });

  return (
    <div className="flex h-full bg-[#1e1e1e] text-white select-none">
      {/* Left Navigation Sidebar */}
      <div className="w-56 bg-[#181818] border-r border-white/10 p-3 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Store Logo */}
          <div className="flex items-center space-x-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">Microsoft Store</div>
              <div className="text-[10px] text-white/50">Win11 Web OS</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {[
              { id: 'home', label: 'Home & Featured', icon: Sparkles },
              { id: 'apps', label: 'Applications', icon: Layers },
              { id: 'games', label: 'Games', icon: Gamepad2 },
              { id: 'library', label: 'Library & Installed', icon: HardDrive },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab(tab.id as any);
                    setSelectedApp(null);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border-l-2 border-blue-500 shadow-sm'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storage footprint badge */}
        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs">
          <div className="flex justify-between text-[11px] text-white/60">
            <span>Storage Used</span>
            <span className="font-mono text-white font-semibold">
              {appManager.getTotalStorageUsedMB()} MB
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (appManager.getTotalStorageUsedMB() / 256) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-white/40">Virtual LocalStorage Drive</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#202020]">
        {/* Top Search Header */}
        <div className="px-6 py-3 border-b border-white/10 bg-[#1c1c1c] flex items-center justify-between">
          <div className="relative w-80">
            <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps, games, utilities..."
              className="w-full bg-[#141414] border border-white/10 focus:border-blue-500 rounded-full pl-9 pr-4 py-1.5 text-xs text-white outline-none transition"
            />
          </div>
          <div className="text-xs text-white/50">
            {installedIds.length} apps installed on OS storage
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Featured Hero Banner if on Home and no search */}
          {activeTab === 'home' && !search && (
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-purple-900/60 border border-white/15 p-6 mb-6 shadow-2xl">
              <div className="max-w-md space-y-2 z-10 relative">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
                  Featured App of the Day
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  2048 Puzzle &amp; VS Code Lite
                </h2>
                <p className="text-xs text-white/70 leading-relaxed">
                  Download new games and creative tools directly onto your Win11 Web OS storage. Open and run them with one click.
                </p>
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      const app = STORE_CATALOG.find((a) => a.id === 'game2048');
                      if (app) handleDownloadApp(app);
                    }}
                    disabled={installedIds.includes('game2048')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center space-x-1.5"
                  >
                    {installedIds.includes('game2048') ? (
                      <>
                        <Check size={14} />
                        <span>Installed</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Get 2048 Free</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('apps')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition"
                  >
                    Browse All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              {activeTab === 'library'
                ? 'Installed on Win11 OS Storage'
                : activeTab === 'games'
                ? 'Games Collection'
                : activeTab === 'apps'
                ? 'Applications'
                : 'Top Free Apps & Games'}
            </h3>
            <span className="text-xs text-white/40">{filteredApps.length} results</span>
          </div>

          {/* Apps Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => {
              const isInstalled = installedIds.includes(app.id);
              const isDownloading = downloadingAppId === app.id;

              return (
                <div
                  key={app.id}
                  className="bg-[#242424] hover:bg-[#2a2a2a] border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-md group"
                >
                  <div>
                    {/* Top Row: Icon + Meta */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {app.name}
                        </h4>
                        <div className="text-[11px] text-white/50 truncate">{app.developer}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                            FREE
                          </span>
                          <span className="flex items-center text-amber-400 text-xs font-semibold">
                            <Star size={12} fill="currentColor" className="mr-0.5" />
                            {app.rating}
                          </span>
                          <span className="text-white/40 text-[10px]">• {app.category}</span>
                          <span className="text-white/40 text-[10px]">• {app.sizeMB} MB</span>
                        </div>
                      </div>
                    </div>

                    {/* App Description */}
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed mb-3">
                      {app.description}
                    </p>
                  </div>

                  {/* Actions & Progress Bar */}
                  <div className="pt-2 border-t border-white/5">
                    {isDownloading ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-blue-400 font-medium">Downloading &amp; Installing...</span>
                          <span className="font-mono text-white/70">{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-200"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : isInstalled ? (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onOpenApp(app.id);
                          }}
                          className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
                        >
                          <Play size={13} fill="currentColor" />
                          <span>Open</span>
                        </button>

                        {!app.isCore && (
                          <button
                            onClick={() => handleUninstall(app.id)}
                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Uninstall from OS storage"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        {app.isCore && (
                          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                            Built-in OS Core
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownloadApp(app)}
                        className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-white/10 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                      >
                        <Download size={14} />
                        <span>Download to Win11 Storage (Free)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
