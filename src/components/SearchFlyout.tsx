import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Globe,
  FileText,
  Folder,
  Settings as SettingsIcon,
  Activity,
  Cpu,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Play,
  Shield,
  Layers,
  Clock,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { AppId, FSItem, SystemSettings } from '../types/os';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { APPS_CATALOG } from './StartMenu';
import { appManager } from '../services/appManager';

interface SearchFlyoutProps {
  onOpenApp: (appId: AppId, data?: any) => void;
  onClose: () => void;
  taskbarAlignment: 'center' | 'left';
  settings?: SystemSettings;
}

type SearchTab = 'all' | 'apps' | 'documents' | 'web' | 'settings';

interface SearchResultItem {
  id: string;
  type: 'app' | 'file' | 'web' | 'setting';
  title: string;
  subtitle: string;
  icon: string | React.ReactNode;
  appId?: AppId;
  fsItem?: FSItem;
  settingAction?: () => void;
  webQuery?: string;
  isBestMatch?: boolean;
}

// Aliases for intelligent search, including typos like "taskmanegment"
const APP_ALIASES: Record<string, string[]> = {
  taskmanager: [
    'task',
    'taskmanegment',
    'taskmanagement',
    'task manager',
    'taskmgr',
    'processes',
    'process',
    'kill',
    'cpu',
    'ram',
    'memory',
    'performance',
    'activity',
    'tasks',
    'services',
    'startup',
    'end task',
  ],
  chrome: [
    'chrome',
    'google',
    'browser',
    'web',
    'internet',
    'search',
    'surf',
    'download',
    'install chrome',
    'download chrome',
    'install google chrome',
    'download google chrome',
  ],
  browser: ['edge', 'microsoft edge', 'web', 'browser', 'internet', 'bing'],
  explorer: ['explorer', 'files', 'file', 'folders', 'folder', 'pc', 'this pc', 'drives', 'storage', 'c:'],
  notepad: ['note', 'notes', 'notepad', 'text', 'editor', 'txt', 'document', 'write'],
  paint: ['paint', 'draw', 'drawing', 'art', 'sketch', 'image', 'png', 'canvas'],
  terminal: ['terminal', 'cmd', 'powershell', 'cli', 'bash', 'command', 'prompt', 'code'],
  calculator: ['calculator', 'calc', 'math', 'calculate', 'numbers', 'addition'],
  mediaplayer: ['media', 'music', 'player', 'songs', 'audio', 'sound', 'lo-fi', 'mp3'],
  virtualwindow: ['window', 'aura', 'rain', 'scenic', 'glass', 'condensation', 'relax'],
  settings: ['settings', 'config', 'control panel', 'wallpaper', 'theme', 'display', 'personalize'],
  store: ['store', 'microsoft store', 'shop', 'apps', 'install', 'download apps'],
  vscode: ['vscode', 'vs code', 'code', 'editor', 'html', 'javascript', 'developer', 'programming'],
  weatherpro: ['weather', 'forecast', 'radar', 'temperature', 'rain', 'sunny', 'climate'],
  clock: ['clock', 'alarms', 'alarm', 'timer', 'stopwatch', 'time'],
  camera: ['camera', 'photo', 'webcam', 'picture', 'selfie', 'snapshot'],
  minesweeper: ['minesweeper', 'mines', 'bomb', 'game', 'puzzle'],
  game2048: ['2048', 'game', 'puzzle', 'tiles', 'numbers'],
  trash: ['trash', 'recycle', 'bin', 'delete', 'deleted'],
  nvidia: ['nivida', 'nvidia', 'geforce', 'gforce', 'geforce now', 'gforce now', 'rtx', 'card', 'gpu', 'graphics', 'graphic', 'ray tracing', 'dlss', 'video card', '4090', 'rtx on', 'gaming'],
};

export const SearchFlyout: React.FC<SearchFlyoutProps> = ({
  onOpenApp,
  onClose,
  taskbarAlignment,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [installedApps, setInstalledApps] = useState<AppId[]>(() => appManager.getInstalledAppIds());
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input automatically on mount
  useEffect(() => {
    inputRef.current?.focus();
    return appManager.subscribe(() => {
      setInstalledApps(appManager.getInstalledAppIds());
    });
  }, []);

  // Top featured apps when query is empty
  const topApps: { id: AppId; name: string; icon: string; category: string; desc: string }[] = [
    {
      id: 'taskmanager',
      name: 'Task Manager',
      icon: '📊',
      category: 'System Resource Monitor',
      desc: 'Monitor processes, CPU, RAM, & terminate tasks',
    },
    {
      id: 'nvidia',
      name: 'NVIDIA GeForce NOW',
      icon: '🟢',
      category: 'RTX Cloud Gaming & GPU',
      desc: 'RTX 4090 cloud streaming, Ray Tracing & DLSS 3.5',
    },
    {
      id: 'chrome',
      name: 'Google Chrome',
      icon: '🌐',
      category: 'Web Browser & Downloads',
      desc: 'Universal web search & file download manager',
    },
    {
      id: 'explorer',
      name: 'File Explorer',
      icon: '📁',
      category: 'System Storage',
      desc: 'Browse files, downloads, & system drives',
    },
    {
      id: 'terminal',
      name: 'Terminal',
      icon: '💻',
      category: 'System Shell',
      desc: 'PowerShell, commands, and dev tools',
    },
    {
      id: 'notepad',
      name: 'Notepad',
      icon: '📝',
      category: 'Text Editor',
      desc: 'Fast text editing and file creation',
    },
  ];

  // Recent quick search tags
  const quickSearches = [
    'NVIDIA GeForce RTX',
    'Task Manager',
    'Download wallpapers',
    'System CPU & RAM',
    'File Explorer',
    'Google Search',
  ];

  // Perform multi-dimensional search
  const trimmed = query.trim().toLowerCase();

  const getResults = (): SearchResultItem[] => {
    if (!trimmed) return [];

    const results: SearchResultItem[] = [];

    // 1. Search Apps (with fuzzy keyword & alias support)
    APPS_CATALOG.forEach((app) => {
      const aliases = APP_ALIASES[app.id] || [];
      const nameMatch = app.name.toLowerCase().includes(trimmed);
      const aliasMatch = aliases.some(
        (a) => a.includes(trimmed) || trimmed.includes(a)
      );

      if (nameMatch || aliasMatch) {
        const isExact =
          app.name.toLowerCase() === trimmed ||
          app.id.toLowerCase() === trimmed ||
          aliases.includes(trimmed);

        results.push({
          id: `app_${app.id}`,
          type: 'app',
          title: app.name,
          subtitle: `Application · ${app.category}`,
          icon: app.icon,
          appId: app.id,
          isBestMatch: isExact,
        });
      }
    });

    // 2. Search Virtual Filesystem
    const allFiles = fs.getAllItems();
    allFiles.forEach((file) => {
      if (file.name.toLowerCase().includes(trimmed)) {
        results.push({
          id: `file_${file.id}`,
          type: 'file',
          title: file.name,
          subtitle: file.type === 'folder' ? 'Folder' : `File (${file.fileType || 'doc'})`,
          icon: file.type === 'folder' ? '📁' : file.fileType === 'png' ? '🖼️' : '📄',
          fsItem: file,
        });
      }
    });

    // 3. Search Settings
    const settingsMatches = [
      { name: 'Taskbar Alignment & Settings', sub: 'Personalization · Taskbar', target: 'settings' as AppId },
      { name: 'Desktop Wallpapers & Themes', sub: 'Personalization · Background', target: 'settings' as AppId },
      { name: 'Task Manager & Process Management', sub: 'System · Performance', target: 'taskmanager' as AppId },
      { name: 'Battery & Power Options', sub: 'System · Power & Battery', target: 'settings' as AppId },
      { name: 'Sound & Volume Settings', sub: 'System · Sound', target: 'settings' as AppId },
    ].filter((s) => s.name.toLowerCase().includes(trimmed) || s.sub.toLowerCase().includes(trimmed));

    settingsMatches.forEach((s, idx) => {
      results.push({
        id: `set_${idx}`,
        type: 'setting',
        title: s.name,
        subtitle: s.sub,
        icon: '⚙️',
        appId: s.target,
      });
    });

    // 4. Always offer Web Search & Download as a first-class result
    results.push({
      id: `web_${trimmed}`,
      type: 'web',
      title: `Search the web for "${query.trim()}"`,
      subtitle: 'Google Chrome · Live results, Reader mode & instant downloads',
      icon: '🌐',
      webQuery: query.trim(),
    });

    // Filter by active tab
    if (activeTab === 'apps') return results.filter((r) => r.type === 'app');
    if (activeTab === 'documents') return results.filter((r) => r.type === 'file');
    if (activeTab === 'web') return results.filter((r) => r.type === 'web');
    if (activeTab === 'settings') return results.filter((r) => r.type === 'setting');

    // Sort: Best Match or Apps first, then Files, Settings, Web
    return results.sort((a, b) => {
      if (a.isBestMatch && !b.isBestMatch) return -1;
      if (!a.isBestMatch && b.isBestMatch) return 1;
      return 0;
    });
  };

  const results = getResults();
  const selectedResult = results[selectedResultIndex] || results[0];

  const handleExecuteResult = (item: SearchResultItem) => {
    soundManager.playClick();
    if (item.type === 'app' && item.appId) {
      onOpenApp(item.appId);
    } else if (item.type === 'file' && item.fsItem) {
      if (item.fsItem.type === 'folder') {
        onOpenApp('explorer', { folderId: item.fsItem.id });
      } else {
        onOpenApp('notepad', { fileId: item.fsItem.id });
      }
    } else if (item.type === 'web') {
      onOpenApp('chrome', { query: item.webQuery || query.trim() });
    } else if (item.type === 'setting' && item.appId) {
      onOpenApp(item.appId);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && selectedResult) {
        handleExecuteResult(selectedResult);
      } else if (trimmed) {
        soundManager.playClick();
        onOpenApp('chrome', { query: query.trim() });
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const positionClass =
    taskbarAlignment === 'center'
      ? 'left-1/2 transform -translate-x-1/2'
      : 'left-3';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed bottom-14 ${positionClass} w-[720px] max-w-[95vw] h-[540px] max-h-[85vh] bg-[#202020f5] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl text-white z-[9000] select-none animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden`}
    >
      {/* Top Search Input Header */}
      <div className="p-4 pb-2 bg-[#252525e6] border-b border-white/10">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-blue-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedResultIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type here to search apps, task management, files, and web..."
            className="w-full bg-[#181818] border border-white/15 focus:border-blue-500 rounded-full pl-11 pr-10 py-2.5 text-xs text-white placeholder-white/40 outline-none shadow-inner transition"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedResultIndex(0);
                inputRef.current?.focus();
              }}
              className="absolute right-3.5 p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-1 mt-3 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'apps', label: 'Apps' },
            { id: 'documents', label: 'Documents' },
            { id: 'web', label: 'Web & Downloads' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as SearchTab);
                  setSelectedResultIndex(0);
                }}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* ========================================================= */}
        {/* SCENARIO 1: DEFAULT EMPTY SEARCH (TOP APPS & QUICK TILES) */}
        {/* ========================================================= */}
        {!trimmed ? (
          <div className="flex-1 p-5 overflow-y-auto space-y-6">
            {/* Top Apps Section */}
            <div>
              <div className="text-xs font-semibold text-white/70 mb-3 px-1 flex items-center justify-between">
                <span>Top Apps</span>
                <span className="text-[11px] text-white/40">Quick launch</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {topApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      soundManager.playClick();
                      onOpenApp(app.id);
                      onClose();
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-xl border transition text-left group ${
                      app.id === 'taskmanager'
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-blue-500/30 hover:border-blue-400'
                        : 'bg-[#262626] border-white/5 hover:border-white/20 hover:bg-[#2d2d2d]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow shrink-0">
                      {app.icon}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-semibold text-xs text-white group-hover:text-blue-400 transition truncate flex items-center space-x-1.5">
                        <span>{app.name}</span>
                        {app.id === 'taskmanager' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-normal">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">{app.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Searches Pill Row */}
            <div>
              <div className="text-xs font-semibold text-white/70 mb-2.5 px-1">
                Recent &amp; Quick Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playClick();
                      setQuery(item);
                      inputRef.current?.focus();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white/90 hover:text-white transition"
                  >
                    <Search size={12} className="text-blue-400" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Web Search & Universal Downloader Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Download size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Universal Web Search &amp; Downloader
                  </div>
                  <div className="text-[11px] text-white/60">
                    Search for anything, browse reader mode, and download files directly into Win11 storage or local disk.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenApp('chrome');
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 transition"
              >
                Open Chrome
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* SCENARIO 2: LIVE SEARCH RESULTS (DUAL COLUMN PREVIEW)     */
          /* ========================================================= */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Results List */}
            <div className="w-1/2 border-r border-white/10 overflow-y-auto p-2 space-y-1">
              {results.length === 0 ? (
                <div className="p-6 text-center text-xs text-white/40">
                  No matching apps or files found. Press Enter to search on the web.
                </div>
              ) : (
                results.map((res, idx) => {
                  const isSelected = selectedResultIndex === idx;
                  return (
                    <div
                      key={res.id}
                      onClick={() => {
                        setSelectedResultIndex(idx);
                        soundManager.playClick();
                      }}
                      onDoubleClick={() => handleExecuteResult(res)}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600/30 border border-blue-500/50'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-xl shrink-0">
                        {typeof res.icon === 'string' ? res.icon : res.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-xs text-white truncate">
                            {res.title}
                          </span>
                          {res.isBestMatch && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider shrink-0">
                              Best Match
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-white/50 truncate">
                          {res.subtitle}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-white/30 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Preview Pane & Actions */}
            <div className="w-1/2 p-5 flex flex-col justify-between overflow-y-auto bg-[#1b1b1b]">
              {selectedResult ? (
                <div className="space-y-4">
                  {/* Big Header */}
                  <div className="flex items-center space-x-3.5 pb-4 border-b border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow">
                      {typeof selectedResult.icon === 'string' ? selectedResult.icon : selectedResult.icon}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white leading-tight">
                        {selectedResult.title}
                      </div>
                      <div className="text-xs text-blue-400 font-medium">
                        {selectedResult.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Context Specific Quick Actions */}
                  {selectedResult.type === 'app' && (
                    <div className="space-y-2 text-xs">
                      {selectedResult.appId === 'taskmanager' ? (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl space-y-2">
                          <div className="font-semibold text-blue-300 flex items-center space-x-1.5">
                            <Activity size={14} />
                            <span>Windows Task Management</span>
                          </div>
                          <div className="text-[11px] text-white/70">
                            Monitor running processes, view real-time CPU &amp; RAM graphs, end unresponsive tasks, and manage startup programs.
                          </div>
                        </div>
                      ) : null}

                      <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                        Actions
                      </div>
                      <button
                        onClick={() => handleExecuteResult(selectedResult)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                      >
                        <span className="font-medium text-white">Open</span>
                        <Play size={13} className="text-emerald-400" />
                      </button>

                      {selectedResult.appId === 'taskmanager' && (
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onOpenApp('taskmanager');
                            onClose();
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                        >
                          <span className="font-medium text-white">View Processes &amp; End Tasks</span>
                          <Cpu size={13} className="text-blue-400" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          appManager.installApp(selectedResult.appId as AppId);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                      >
                        <span className="font-medium text-white">Pin to Desktop / Taskbar</span>
                        <Sparkles size={13} className="text-amber-400" />
                      </button>
                    </div>
                  )}

                  {selectedResult.type === 'web' && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl space-y-2">
                        <div className="font-semibold text-blue-300 flex items-center space-x-1.5">
                          <Globe size={14} />
                          <span>Search &amp; Universal Downloader</span>
                        </div>
                        <div className="text-[11px] text-white/70">
                          Search any topic or question. Web pages open cleanly in Reader View without iframe restrictions, with options to download content as TXT, Markdown, HTML, or JSON.
                        </div>
                      </div>

                      <button
                        onClick={() => handleExecuteResult(selectedResult)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition text-xs"
                      >
                        <span>Search in Google Chrome</span>
                        <ExternalLink size={13} />
                      </button>

                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onOpenApp('browser', { query: selectedResult.webQuery });
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                      >
                        <span>Open in Microsoft Edge</span>
                        <Globe size={13} className="text-blue-400" />
                      </button>
                    </div>
                  )}

                  {selectedResult.type === 'file' && selectedResult.fsItem && (
                    <div className="space-y-2 text-xs">
                      <div className="text-[11px] text-white/50">
                        Location: Virtual File System · {selectedResult.fsItem.parentId || 'Desktop'}
                      </div>
                      <button
                        onClick={() => handleExecuteResult(selectedResult)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                      >
                        <span className="font-medium text-white">Open File</span>
                        <Play size={13} className="text-emerald-400" />
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onOpenApp('explorer', { folderId: selectedResult.fsItem?.parentId || 'desktop' });
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-left text-xs"
                      >
                        <span className="font-medium text-white">Open file location</span>
                        <Folder size={13} className="text-amber-400" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-white/30 my-auto">
                  Select a result to view details and actions
                </div>
              )}

              {/* Bottom Primary Open Button */}
              {selectedResult && (
                <div className="pt-4 border-t border-white/10 mt-auto">
                  <button
                    onClick={() => handleExecuteResult(selectedResult)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:scale-98 transition text-white font-semibold rounded-xl text-xs shadow flex items-center justify-center space-x-1.5"
                  >
                    <span>Open {selectedResult.type === 'web' ? 'Web Search' : selectedResult.title}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
