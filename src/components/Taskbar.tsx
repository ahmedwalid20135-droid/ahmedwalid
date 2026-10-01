import React, { useState, useEffect } from 'react';
import {
  Search,
  CloudSun,
  Wifi,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  ChevronUp,
  Bell,
  X,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AppId, WindowInstance, SystemSettings } from '../types/os';
import { soundManager } from '../services/sound';
import { APPS_CATALOG } from './StartMenu';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ChromeLogo } from './ChromeLogo';

interface TaskbarProps {
  windows: WindowInstance[];
  activeWindowId: string | null;
  settings: SystemSettings;
  isStartOpen: boolean;
  isSearchOpen?: boolean;
  isWidgetsOpen: boolean;
  isQuickSettingsOpen: boolean;
  isCalendarOpen: boolean;
  unreadCount: number;
  onToggleStart: () => void;
  onToggleSearch?: () => void;
  onToggleWidgets: () => void;
  onToggleQuickSettings: () => void;
  onToggleCalendar: () => void;
  onOpenApp: (appId: AppId, data?: any) => void;
  onFocusWindow: (id: string) => void;
  onMinimizeWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onShowDesktop: () => void;
  onUpdateSettings?: (settings: Partial<SystemSettings>) => void;
  onShutdown?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onLock?: () => void;
  deviceName?: string;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  windows,
  activeWindowId,
  settings,
  isStartOpen,
  isSearchOpen = false,
  isWidgetsOpen,
  isQuickSettingsOpen,
  isCalendarOpen,
  unreadCount,
  onToggleStart,
  onToggleSearch,
  onToggleWidgets,
  onToggleQuickSettings,
  onToggleCalendar,
  onOpenApp,
  onFocusWindow,
  onMinimizeWindow,
  onCloseWindow,
  onShowDesktop,
  onUpdateSettings,
  onShutdown,
  onSleep,
  onRestart,
  onLock,
  deviceName = 'Lenovo Legion G14',
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [isHoveredBottom, setIsHoveredBottom] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Primary taskbar pinned items
  const pinnedAppIds: AppId[] = [
    'explorer',
    'chrome',
    'store',
    'browser',
    'notepad',
    'paint',
    'terminal',
    'minesweeper',
    'calculator',
    'mediaplayer',
    'nvidia',
    'taskmanager',
    'virtualwindow',
  ];

  // Combined app list to display in taskbar
  const displayedApps = [...pinnedAppIds];
  windows.forEach((win) => {
    if (!displayedApps.includes(win.appId)) {
      displayedApps.push(win.appId);
    }
  });

  const handleTaskbarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playClick();

    const items: ContextMenuItem[] = [
      {
        label: 'Taskbar settings',
        icon: <span>⚙️</span>,
        action: () => {
          onOpenApp('settings', { tab: 'taskbar' });
        },
      },
      {
        label: settings.taskbarAlignment === 'center' ? 'Align taskbar to Left' : 'Align taskbar to Center',
        icon: <span>↔️</span>,
        action: () => {
          if (onUpdateSettings) {
            onUpdateSettings({
              taskbarAlignment: settings.taskbarAlignment === 'center' ? 'left' : 'center',
            });
          }
        },
      },
      {
        label: settings.taskbarAutoHide ? 'Lock taskbar (Turn off auto-hide)' : 'Automatically hide the taskbar',
        icon: <span>👁️</span>,
        action: () => {
          if (onUpdateSettings) {
            onUpdateSettings({
              taskbarAutoHide: !settings.taskbarAutoHide,
            });
          }
        },
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Task Manager',
        icon: <span>📊</span>,
        action: () => {
          onOpenApp('taskmanager');
        },
      },
      {
        label: 'Show desktop',
        icon: <span>🪟</span>,
        action: () => {
          onShowDesktop();
        },
      },
    ];

    setContextMenu({
      x: Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 250, e.clientX),
      y: e.clientY - 180,
      items,
    });
  };

  const handleStartContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playClick();

    const items: ContextMenuItem[] = [
      {
        label: 'Taskbar settings',
        icon: <span>⚙️</span>,
        action: () => onOpenApp('settings', { tab: 'taskbar' }),
      },
      {
        label: 'Task Manager',
        icon: <span>📊</span>,
        action: () => onOpenApp('taskmanager'),
      },
      {
        label: 'Windows Terminal',
        icon: <span>💻</span>,
        action: () => onOpenApp('terminal'),
      },
      {
        label: 'File Explorer (1TB SSD)',
        icon: <span>📁</span>,
        action: () => onOpenApp('explorer'),
      },
      {
        label: 'Settings',
        icon: <span>⚙️</span>,
        action: () => onOpenApp('settings'),
      },
      {
        label: 'Search',
        icon: <span>🔍</span>,
        action: () => onToggleSearch && onToggleSearch(),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Desktop',
        icon: <span>🪟</span>,
        action: () => onShowDesktop(),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Lock (Windows Hello)',
        icon: <span>🔒</span>,
        action: () => onLock && onLock(),
      },
      {
        label: `Sleep (${deviceName})`,
        icon: <span>🌙</span>,
        action: () => onSleep && onSleep(),
      },
      {
        label: `Shut down (${deviceName})`,
        icon: <span>⏻</span>,
        action: () => onShutdown && onShutdown(),
      },
      {
        label: `Restart (${deviceName})`,
        icon: <span>🔄</span>,
        action: () => onRestart && onRestart(),
      },
    ];

    setContextMenu({
      x: Math.max(10, Math.min(e.clientX, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 250)),
      y: Math.max(10, (typeof window !== 'undefined' ? window.innerHeight : 800) - 380),
      items,
    });
  };

  const handleAppClick = (appId: AppId) => {
    soundManager.playClick();
    const matchingWindows = windows.filter((w) => w.appId === appId);
    if (matchingWindows.length === 0) {
      onOpenApp(appId);
    } else {
      const activeMatch = matchingWindows.find((w) => w.id === activeWindowId);
      if (activeMatch && !activeMatch.isMinimized) {
        onMinimizeWindow(activeMatch.id);
      } else {
        onFocusWindow(matchingWindows[0].id);
      }
    }
  };

  const renderTaskbarBattery = () => {
    if (settings.taskbarShowBattery === false) return null;

    const level = settings.batteryLevel ?? 85;
    const isCharging = settings.isCharging ?? true;

    if (isCharging) {
      return (
        <span className="flex items-center text-emerald-400" title={`Battery: ${level}% (Plugged in, charging)`}>
          <BatteryCharging size={16} className="animate-pulse" />
        </span>
      );
    }

    if (level >= 80) {
      return (
        <span className="flex items-center text-emerald-400" title={`Battery: ${level}% (Remaining)`}>
          <BatteryFull size={15} />
        </span>
      );
    }

    if (level >= 40) {
      return (
        <span className="flex items-center text-white" title={`Battery: ${level}% (Remaining)`}>
          <BatteryMedium size={15} />
        </span>
      );
    }

    if (level >= 20) {
      return (
        <span className="flex items-center text-amber-400" title={`Battery: ${level}% (Low battery)`}>
          <BatteryLow size={15} />
        </span>
      );
    }

    return (
      <span className="flex items-center text-red-500 animate-bounce" title={`Battery: ${level}% (Critical)`}>
        <BatteryWarning size={15} />
      </span>
    );
  };

  // Determine Taskbar Height based on taskbarSize
  const heightClass =
    settings.taskbarSize === 'compact'
      ? 'h-10'
      : settings.taskbarSize === 'large'
      ? 'h-14'
      : 'h-12';

  // Determine theme styling
  const themeClass =
    settings.taskbarTheme === 'opaque'
      ? 'bg-[#181818] border-t border-white/10'
      : settings.taskbarTheme === 'blur'
      ? 'bg-[#1f1f1fe6] backdrop-blur-3xl border-t border-white/15'
      : 'bg-[#202020cc] backdrop-blur-2xl border-t border-white/10';

  const shouldHide = settings.taskbarAutoHide && !isHoveredBottom && !isStartOpen && !isSearchOpen && !isWidgetsOpen && !isQuickSettingsOpen && !isCalendarOpen;

  return (
    <>
      {/* Invisible auto-hide hover trigger at bottom of screen */}
      {settings.taskbarAutoHide && (
        <div
          onMouseEnter={() => setIsHoveredBottom(true)}
          className="fixed bottom-0 left-0 right-0 h-2 z-40 bg-transparent"
        />
      )}

      <div
        onContextMenu={handleTaskbarContextMenu}
        onMouseEnter={() => setIsHoveredBottom(true)}
        onMouseLeave={() => setIsHoveredBottom(false)}
        className={`fixed bottom-0 left-0 right-0 ${heightClass} ${themeClass} z-40 flex items-center justify-between px-3 select-none transition-transform duration-300 ${
          shouldHide ? 'translate-y-full' : 'translate-y-0'
        }`}
      >
        {/* Left Side: Widgets / Weather */}
        <div className="flex items-center space-x-2">
          {settings.taskbarShowWidgets !== false && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleWidgets();
              }}
              className={`flex items-center space-x-2 px-2.5 py-1 rounded-md transition ${
                isWidgetsOpen
                  ? 'bg-white/20 text-white'
                  : 'hover:bg-white/10 text-white/80 hover:text-white'
              }`}
              title="Widgets & Weather"
            >
              <CloudSun size={18} className="text-amber-400" />
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[11px] font-medium text-white">68°F</span>
                <span className="text-[9px] text-white/50">Lenovo G14 Radar</span>
              </div>
            </button>
          )}
        </div>

        {/* Center/Left Apps Container */}
        <div
          className={`flex items-center space-x-1 ${
            settings.taskbarAlignment === 'center'
              ? 'absolute left-1/2 transform -translate-x-1/2'
              : 'ml-2'
          }`}
        >
          {/* Windows 11 Start Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              onToggleStart();
            }}
            onContextMenu={handleStartContextMenu}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition transform active:scale-95 ${
              isStartOpen ? 'bg-white/20 ring-1 ring-blue-400 shadow-md' : 'hover:bg-white/10'
            }`}
            title="Start (Windows Key) - Right-click for Quick Links & Power"
          >
            {/* Windows 4-Square SVG Logo */}
            <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
              <rect x="0" y="0" width="7.2" height="7.2" fill="#0078d4" rx="0.5" />
              <rect x="8.8" y="0" width="7.2" height="7.2" fill="#0078d4" rx="0.5" />
              <rect x="0" y="8.8" width="7.2" height="7.2" fill="#0078d4" rx="0.5" />
              <rect x="8.8" y="8.8" width="7.2" height="7.2" fill="#0078d4" rx="0.5" />
            </svg>
          </button>

          {/* Windows 11 Search Button / Search Pill */}
          {settings.taskbarShowSearch !== false && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                if (onToggleSearch) {
                  onToggleSearch();
                } else {
                  onToggleStart();
                }
              }}
              className={`h-9 px-3 rounded-full flex items-center space-x-2 transition transform active:scale-95 ${
                isSearchOpen
                  ? 'bg-blue-600/30 border border-blue-400 text-blue-300 shadow-md'
                  : 'hover:bg-white/10 text-white/80 hover:text-white border border-transparent'
              }`}
              title="Search Lenovo apps, 1TB SSD files, and web (Win + S)"
            >
              <Search size={16} className={isSearchOpen ? 'text-blue-400' : 'text-blue-400/90'} />
              <span className="hidden sm:inline text-xs font-medium pr-0.5 text-white/80">
                Search
              </span>
            </button>
          )}

          {/* Taskbar Apps List */}
          {displayedApps.map((appId) => {
            const appMeta = APPS_CATALOG.find((a) => a.id === appId) || {
              name: appId,
              icon: '📦',
            };
            const openWindows = windows.filter((w) => w.appId === appId);
            const isOpen = openWindows.length > 0;
            const isActive = openWindows.some((w) => w.id === activeWindowId && !w.isMinimized);

            return (
              <div
                key={appId}
                className="relative"
                onMouseEnter={() => setHoveredAppId(appId)}
                onMouseLeave={() => setHoveredAppId(null)}
              >
                <button
                  onClick={() => handleAppClick(appId)}
                  className={`w-10 h-10 flex flex-col items-center justify-center rounded-md transition transform active:scale-95 relative ${
                    isActive
                      ? 'bg-white/15'
                      : isOpen
                      ? 'bg-white/8 hover:bg-white/12'
                      : 'hover:bg-white/10'
                  }`}
                  title={appMeta.name}
                >
                  {appId === 'chrome' ? (
                    <ChromeLogo size={22} />
                  ) : (
                    <span className="text-xl leading-none">{appMeta.icon}</span>
                  )}

                  {/* Running indicator bar/dot */}
                  {isOpen && (
                    <div
                      className={`absolute bottom-0.5 h-1 rounded-full transition-all duration-200 ${
                        isActive ? 'w-4 bg-blue-400' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  )}
                </button>

                {/* Taskbar Hover Thumbnail Preview */}
                {hoveredAppId === appId && isOpen && (
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-48 bg-[#282828ee] backdrop-blur-xl border border-white/20 rounded-xl p-2.5 shadow-2xl z-50 pointer-events-auto animate-in fade-in duration-100">
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10">
                      <span className="text-xs font-semibold text-white/90 truncate flex items-center space-x-1.5">
                        <span>{appMeta.icon}</span>
                        <span className="truncate">{appMeta.name}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openWindows.forEach((w) => onCloseWindow(w.id));
                        }}
                        className="p-0.5 hover:bg-red-600 rounded text-white/70 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div
                      onClick={() => handleAppClick(appId)}
                      className="h-20 bg-black/40 rounded-lg flex items-center justify-center cursor-pointer border border-white/5 hover:border-blue-400 text-xs text-white/60"
                    >
                      Click to switch
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: System Tray */}
        <div className="flex items-center space-x-1">
          {/* Quick Settings pill: Wi-Fi, Volume, Battery */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleQuickSettings();
            }}
            className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md transition ${
              isQuickSettingsOpen
                ? 'bg-white/15'
                : 'hover:bg-white/10 text-white/80 hover:text-white'
            }`}
            title={`Network, Volume, Battery: ${settings.batteryLevel}% ${settings.isCharging ? '(Plugged in, charging)' : '(On battery)'}`}
          >
            {settings.taskbarShowWifi !== false && (
              <Wifi size={14} className={settings.wifiEnabled ? 'text-white' : 'text-white/40'} />
            )}
            {settings.taskbarShowVolume !== false && (
              settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-red-400" />
            )}
            {renderTaskbarBattery()}
          </button>

          {/* Date & Time pill (opens calendar) */}
          {settings.taskbarShowClock !== false && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleCalendar();
              }}
              className={`flex flex-col items-end px-2.5 py-1 rounded-md transition text-right leading-tight ${
                isCalendarOpen
                  ? 'bg-white/15'
                  : 'hover:bg-white/10 text-white/90 hover:text-white'
              }`}
              title="Date & Time"
            >
              <span className="text-[11px] font-medium">{timeStr}</span>
              <span className="text-[10px] text-white/60">{dateStr}</span>
            </button>
          )}

          {/* Notification Bell Badge */}
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleCalendar();
            }}
            className="relative p-2 hover:bg-white/10 rounded-md text-white/80 hover:text-white transition"
            title="Notification Center"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-neutral-900" />
            )}
          </button>

          {/* Show Desktop Line on the far right */}
          <div
            onClick={onShowDesktop}
            className="w-1.5 h-7 hover:bg-white/30 cursor-pointer rounded-sm ml-1 transition"
            title="Show Desktop"
          />
        </div>

        {/* Taskbar Right-Click Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </>
  );
};
