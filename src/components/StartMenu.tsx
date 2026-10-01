import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Power,
  RotateCcw,
  Sparkles,
  Lock,
  Moon,
  Folder,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Cpu,
  Settings as SettingsIcon,
  User,
  LogOut,
  Users,
  UserPlus,
  Sliders,
} from 'lucide-react';
import { AppId, FSItem } from '../types/os';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { appManager } from '../services/appManager';
import { accountManager, UserAccount } from '../services/accountManager';
import { ChromeLogo } from './ChromeLogo';

interface StartMenuProps {
  onOpenApp: (appId: AppId, data?: any) => void;
  onTriggerBSOD: () => void;
  onRestart: () => void;
  onShutdown?: () => void;
  onSleep?: () => void;
  onLock?: () => void;
  onClose: () => void;
  taskbarAlignment: 'center' | 'left';
  deviceName?: string;
}

export const APPS_CATALOG: { id: AppId; name: string; icon: string; category: string }[] = [
  { id: 'explorer', name: 'File Explorer', icon: '📁', category: 'System' },
  { id: 'chrome', name: 'Google Chrome', icon: '🌐', category: 'Internet' },
  { id: 'taskmanager', name: 'Task Manager', icon: '📊', category: 'System' },
  { id: 'terminal', name: 'Terminal', icon: '💻', category: 'System' },
  { id: 'notepad', name: 'Notepad', icon: '📝', category: 'Productivity' },
  { id: 'settings', name: 'Settings', icon: '⚙️', category: 'System' },
  { id: 'nvidia', name: 'NVIDIA GeForce NOW', icon: '🟢', category: 'Games' },
  { id: 'store', name: 'Microsoft Store', icon: '🛍️', category: 'Store' },
  { id: 'browser', name: 'Microsoft Edge', icon: '🌐', category: 'Internet' },
  { id: 'paint', name: 'Paint', icon: '🎨', category: 'Creative' },
  { id: 'calculator', name: 'Calculator', icon: '🧮', category: 'Utilities' },
  { id: 'vscode', name: 'VS Code Lite', icon: '💻', category: 'Development' },
  { id: 'weatherpro', name: 'Weather Radar', icon: '⛅', category: 'Utilities' },
  { id: 'virtualwindow', name: 'Aura Window', icon: '🪟', category: 'Atmosphere' },
  { id: 'mediaplayer', name: 'Media Player', icon: '🎵', category: 'Media' },
  { id: 'camera', name: 'Camera', icon: '📷', category: 'Media' },
  { id: 'clock', name: 'Alarms & Clock', icon: '⏰', category: 'Utilities' },
  { id: 'minesweeper', name: 'Minesweeper', icon: '💣', category: 'Games' },
  { id: 'game2048', name: '2048 Game', icon: '🔢', category: 'Games' },
  { id: 'trash', name: 'Recycle Bin', icon: '🗑️', category: 'System' },
];

const SEARCH_ALIASES: Record<string, string[]> = {
  taskmanager: ['task', 'taskmanegment', 'taskmanagement', 'task manager', 'taskmgr', 'processes', 'process', 'kill', 'cpu', 'ram', 'memory', 'activity', 'performance', 'manager', 'end task'],
  chrome: ['chrome', 'google', 'browser', 'web', 'internet', 'search', 'download'],
  browser: ['edge', 'browser', 'web', 'bing', 'internet'],
  explorer: ['files', 'folder', 'folders', 'pc', 'my pc', 'this pc', 'drives', 'c:'],
  terminal: ['cmd', 'powershell', 'cli', 'bash', 'terminal', 'command'],
  calculator: ['calc', 'math', 'calculator'],
  notepad: ['notes', 'note', 'text', 'txt', 'editor'],
  paint: ['draw', 'art', 'sketch', 'paint', 'image'],
  vscode: ['code', 'html', 'js', 'editor', 'dev', 'vscode'],
  settings: ['config', 'settings', 'wallpaper', 'theme', 'personalize'],
  nvidia: ['nivida', 'nvidia', 'geforce', 'gforce', 'geforce now', 'gforce now', 'rtx', 'card', 'gpu', 'graphics', 'graphic', 'ray tracing', 'dlss', 'video card', '4090', 'rtx on'],
};

export const StartMenu: React.FC<StartMenuProps> = ({
  onOpenApp,
  onTriggerBSOD,
  onRestart,
  onShutdown,
  onSleep,
  onLock,
  onClose,
  taskbarAlignment,
  deviceName = 'Lenovo',
}) => {
  const [search, setSearch] = useState('');
  const [showAllApps, setShowAllApps] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => accountManager.getCurrentUser());
  const [installedList, setInstalledList] = useState<AppId[]>(appManager.getInstalledAppIds());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const unsubApp = appManager.subscribe(() => {
      setInstalledList(appManager.getInstalledAppIds());
    });
    const unsubAcc = accountManager.subscribe(() => {
      setCurrentUser(accountManager.getCurrentUser());
    });
    return () => {
      unsubApp();
      unsubAcc();
    };
  }, []);

  const trimmed = search.trim().toLowerCase();

  const filteredApps = APPS_CATALOG.filter((app) => {
    if (!trimmed) {
      return installedList.includes(app.id);
    }
    const nameMatch = app.name.toLowerCase().includes(trimmed);
    const aliases = SEARCH_ALIASES[app.id] || [];
    const aliasMatch = aliases.some((a) => a.includes(trimmed) || trimmed.includes(a));
    return nameMatch || aliasMatch;
  });

  const recentFiles = fs.getItems('desktop').slice(0, 4);

  const positionClass =
    taskbarAlignment === 'center'
      ? 'left-1/2 transform -translate-x-1/2'
      : 'left-3';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed bottom-14 ${positionClass} w-[540px] max-w-[95vw] bg-[#222222f5] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-6 text-white z-[9000] select-none animate-in fade-in zoom-in-95 duration-150 flex flex-col space-y-4`}
    >
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/50" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (filteredApps.length > 0 && trimmed) {
                soundManager.playClick();
                onOpenApp(filteredApps[0].id);
                onClose();
              } else if (trimmed) {
                soundManager.playClick();
                onOpenApp('chrome', { query: search.trim() });
                onClose();
              }
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
          placeholder="Type here to search apps, task management, files, and web..."
          className="w-full bg-[#161616] border border-white/10 focus:border-blue-500 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 outline-none shadow-inner transition"
        />
      </div>

      {/* Web Search & Download Quick Action */}
      {trimmed.length > 0 && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenApp('chrome', { query: search.trim() });
            onClose();
          }}
          className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 hover:border-blue-400 transition text-left text-xs group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow">
              <Search size={14} />
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-blue-300 transition">
                Search the web for &ldquo;{search.trim()}&rdquo;
              </div>
              <div className="text-[10px] text-blue-200">
                Live web results, Reader view &amp; instant file downloads
              </div>
            </div>
          </div>
          <span className="text-[11px] text-blue-400 font-medium group-hover:underline">
            Search Web &gt;
          </span>
        </button>
      )}

      {/* Apps Section: Pinned or All Apps */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-white/90">
            {showAllApps ? 'All Applications (A-Z)' : 'Pinned Apps'}
          </span>
          <button
            onClick={() => {
              soundManager.playClick();
              setShowAllApps(!showAllApps);
            }}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-white/5 transition"
          >
            {showAllApps ? (
              <>
                <ChevronLeft size={13} />
                <span>Back to Pinned</span>
              </>
            ) : (
              <>
                <span>All apps</span>
                <ChevronRight size={13} />
              </>
            )}
          </button>
        </div>

        {showAllApps ? (
          /* Alphabetical All Apps List */
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1 divide-y divide-white/5">
            {[...APPS_CATALOG]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    soundManager.playClick();
                    onOpenApp(app.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:scale-98 transition text-left text-xs group"
                >
                  <div className="flex items-center space-x-3">
                    {app.id === 'chrome' ? (
                      <ChromeLogo size={22} />
                    ) : (
                      <span className="text-xl">{app.icon}</span>
                    )}
                    <div>
                      <div className="font-medium text-white group-hover:text-blue-400 transition">
                        {app.name}
                      </div>
                      <div className="text-[10px] text-white/40">{app.category}</div>
                    </div>
                  </div>
                  {app.id === 'taskmanager' && (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">
                      System Tool
                    </span>
                  )}
                </button>
              ))}
          </div>
        ) : (
          /* Grid Pinned Apps */
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            {filteredApps.map((app) => (
              <button
                key={app.id}
                onClick={() => {
                  soundManager.playClick();
                  onOpenApp(app.id);
                  onClose();
                }}
                className={`flex flex-col items-center p-2 rounded-xl hover:bg-white/10 active:scale-95 transition text-center group relative ${
                  app.id === 'taskmanager' ? 'bg-blue-600/10 border border-blue-500/20 hover:border-blue-400' : ''
                }`}
              >
                <div className="w-10 h-10 flex items-center justify-center text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                  {app.id === 'chrome' ? (
                    <ChromeLogo size={28} />
                  ) : (
                    app.icon
                  )}
                </div>
                <span className="text-[11px] text-white/90 font-medium truncate max-w-full leading-tight">
                  {app.name}
                </span>
                {app.id === 'taskmanager' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recommended / Recent Files */}
      {!search && !showAllApps && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-xs font-semibold text-white/90 mb-2 px-1">
            Recommended
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => {
                  soundManager.playClick();
                  onOpenApp('notepad', { fileId: file.id });
                  onClose();
                }}
                className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition text-xs"
              >
                <div className="text-lg">📄</div>
                <div className="truncate">
                  <div className="font-medium text-white/90 truncate">{file.name}</div>
                  <div className="text-[10px] text-white/40">Recently modified</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User & Power Footer */}
      <div className="border-t border-white/10 pt-3 flex items-center justify-between relative">
        <div className="relative">
          <div
            onClick={() => {
              soundManager.playClick();
              setShowUserMenu(!showUserMenu);
              setShowPowerMenu(false);
            }}
            className="flex items-center space-x-2.5 p-1 -m-1 rounded-xl hover:bg-white/10 transition cursor-pointer group"
            title="User Account Options (Settings, Switch user, Sign out)"
          >
            {currentUser.avatarPhotoUrl ? (
              <img
                src={currentUser.avatarPhotoUrl}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-lg object-cover shadow group-hover:scale-105 transition-transform border border-white/20"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-extrabold text-xs shadow tracking-wider group-hover:scale-105 transition-transform"
                style={{ backgroundColor: currentUser.avatarColor || '#e11424' }}
              >
                {currentUser.avatarEmoji || currentUser.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                <span>{currentUser.displayName}</span>
                <span className="text-[10px] text-white/50 bg-white/10 px-1 rounded">
                  {currentUser.role === 'Administrator' ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="text-[10px] text-white/50 flex items-center space-x-1">
                <span className="font-semibold text-white/80">{deviceName || 'Lenovo Legion G14'}</span>
                <span>•</span>
                <span>Saved Files Active</span>
              </div>
            </div>
          </div>

          {/* User Account Options Flyout */}
          {showUserMenu && (
            <div className="absolute left-0 bottom-12 w-64 bg-[#232323f5] backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2 text-xs space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-white/10 flex items-center space-x-2.5">
                {currentUser.avatarPhotoUrl ? (
                  <img
                    src={currentUser.avatarPhotoUrl}
                    alt={currentUser.displayName}
                    className="w-9 h-9 rounded-xl object-cover shadow border border-white/20"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow"
                    style={{ backgroundColor: currentUser.avatarColor || '#e11424' }}
                  >
                    {currentUser.avatarEmoji || currentUser.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="font-semibold text-white truncate">{currentUser.displayName}</div>
                  <div className="text-[11px] text-white/50 truncate">@{currentUser.username} • {currentUser.role}</div>
                </div>
              </div>

              {/* Change Profile Photo & Name */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowUserMenu(false);
                  onClose();
                  onOpenApp('settings', { tab: 'accounts' });
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-blue-600/20 text-left transition text-blue-300 hover:text-blue-200 cursor-pointer"
              >
                <Sliders size={15} className="text-blue-400 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Change Name &amp; Photo</div>
                  <div className="text-[10px] text-white/50">Edit display name, upload avatar photo, PIN &amp; password</div>
                </div>
              </button>

              {/* Lock PC */}
              {onLock && (
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowUserMenu(false);
                    onClose();
                    onLock();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
                >
                  <Lock size={15} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Lock PC</div>
                    <div className="text-[10px] text-white/40">Lock session with Windows Hello</div>
                  </div>
                </button>
              )}

              {/* Sign out / Switch user */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowUserMenu(false);
                  accountManager.logout();
                  onClose();
                  if (onLock) onLock();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
              >
                <LogOut size={15} className="text-rose-400 shrink-0" />
                <div>
                  <div className="font-medium text-xs">Sign out / Switch account</div>
                  <div className="text-[10px] text-white/40">Switch profile or sign in with another user</div>
                </div>
              </button>

              {/* Add / Sign up new account */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowUserMenu(false);
                  onClose();
                  onOpenApp('settings', { tab: 'accounts' });
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-left transition text-emerald-400 cursor-pointer"
              >
                <UserPlus size={15} className="shrink-0" />
                <div>
                  <div className="font-medium text-xs">Sign up new account</div>
                  <div className="text-[10px] text-white/40">Create another profile for files & apps</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          {/* Quick Task Manager button in Start Footer */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenApp('taskmanager');
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition cursor-pointer"
            title="Task Manager (Ctrl+Shift+Esc)"
          >
            <Activity size={17} />
          </button>

          {/* Quick Settings button in Start Footer */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenApp('settings');
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition cursor-pointer"
            title="Settings"
          >
            <SettingsIcon size={17} />
          </button>

          {/* Power Button & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPowerMenu(!showPowerMenu)}
              className="p-2 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition cursor-pointer"
              title="Power Options (Sleep, Shut down, Restart)"
            >
              <Power size={17} />
            </button>

            {/* Power Options Menu */}
            {showPowerMenu && (
              <div className="absolute right-0 bottom-12 w-52 bg-[#232323f5] backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-1.5 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>{deviceName || 'Lenovo'} Power</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Lock (Windows Hello) */}
                {onLock && (
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setShowPowerMenu(false);
                      onClose();
                      onLock();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
                  >
                    <Lock size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="font-medium text-xs">Lock</div>
                      <div className="text-[10px] text-white/40">Windows Hello Lock Screen (Win+L / Ctrl+L)</div>
                    </div>
                  </button>
                )}

                {/* Sleep */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowPowerMenu(false);
                    onClose();
                    if (onSleep) onSleep();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
                >
                  <Moon size={15} className="text-blue-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Sleep</div>
                    <div className="text-[10px] text-white/40">Put {deviceName || 'Lenovo'} to sleep</div>
                  </div>
                </button>

                {/* Shut down */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowPowerMenu(false);
                    onClose();
                    if (onShutdown) onShutdown();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
                >
                  <Power size={15} className="text-[#e11424] shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Shut down</div>
                    <div className="text-[10px] text-white/40">Closes apps and turns off PC</div>
                  </div>
                </button>

                {/* Restart */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setShowPowerMenu(false);
                    onClose();
                    onRestart();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition text-white/90 hover:text-white cursor-pointer"
                >
                  <RotateCcw size={15} className="text-blue-400 shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Restart</div>
                    <div className="text-[10px] text-white/40">Reboots {deviceName || 'Lenovo'} subsystem</div>
                  </div>
                </button>

                <div className="border-t border-white/10 pt-1" />

                {/* BSOD Crash Easter Egg */}
                <button
                  onClick={() => {
                    soundManager.playError();
                    setShowPowerMenu(false);
                    onClose();
                    onTriggerBSOD();
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl hover:bg-red-500/20 text-left text-red-400 transition cursor-pointer"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="text-[11px]">Trigger BSOD Screen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
