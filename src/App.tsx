/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppId, WindowInstance, SystemSettings, NotificationItem, FSItem } from './types/os';
import { Desktop } from './components/Desktop';
import { Taskbar } from './components/Taskbar';
import { StartMenu, APPS_CATALOG } from './components/StartMenu';
import { SearchFlyout } from './components/SearchFlyout';
import { QuickSettings } from './components/QuickSettings';
import { CalendarFlyout } from './components/CalendarFlyout';
import { WidgetsFlyout } from './components/WidgetsFlyout';
import { WindowFrame } from './components/WindowFrame';
import { PowerManagerScreen, PowerState } from './components/PowerManagerScreen';
import { LockScreen } from './components/LockScreen';
import { soundManager } from './services/sound';
import { fs } from './services/filesystem';

// Apps
import { FileExplorer } from './apps/FileExplorer';
import { Notepad } from './apps/Notepad';
import { Paint } from './apps/Paint';
import { Terminal } from './apps/Terminal';
import { Minesweeper } from './apps/Minesweeper';
import { Calculator } from './apps/Calculator';
import { MediaPlayer } from './apps/MediaPlayer';
import { Browser } from './apps/Browser';
import { VirtualWindow } from './apps/VirtualWindow';
import { SettingsApp, WALLPAPERS } from './apps/SettingsApp';
import { BSOD } from './apps/BSOD';
import { MicrosoftStore } from './apps/MicrosoftStore';
import { GoogleChrome } from './apps/GoogleChrome';
import { Game2048 } from './apps/Game2048';
import { ClockApp } from './apps/ClockApp';
import { CameraApp } from './apps/CameraApp';
import { VSCodeApp } from './apps/VSCodeApp';
import { WeatherProApp } from './apps/WeatherProApp';
import { TaskManager } from './apps/TaskManager';
import { NvidiaGeForceApp } from './apps/NvidiaGeForceApp';

const SETTINGS_KEY = 'win11_system_settings';

const DEFAULT_SETTINGS: SystemSettings = {
  wallpaper: WALLPAPERS[0].url,
  wallpaperType: 'solar-glow-orb',
  theme: 'dark',
  taskbarAlignment: 'center',
  taskbarAutoHide: false,
  taskbarShowSearch: true,
  taskbarShowWidgets: true,
  taskbarShowTaskManager: true,
  taskbarShowWifi: true,
  taskbarShowVolume: true,
  taskbarShowBattery: true,
  taskbarShowClock: true,
  taskbarSize: 'default',
  taskbarTheme: 'acrylic',
  soundEnabled: true,
  volume: 0.8,
  brightness: 1,
  nightLight: false,
  wifiEnabled: true,
  bluetoothEnabled: true,
  airplaneMode: false,
  batteryLevel: 92,
  isCharging: true,
  deviceName: 'Lenovo Legion G14',
  deviceModel: 'Lenovo Legion Slim G14 AMD Ryzen 9 / RTX 4070 / 1TB NVMe Gen4 SSD',
  pin: '1234',
  password: 'lenovo',
  requireLogin: true,
  remapWinToCtrl: true,
};

export default function App() {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isOldLenovo = !parsed.deviceName || parsed.deviceName === 'Lenovo' || parsed.deviceName.includes('ThinkPad');
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          wallpaper: parsed.wallpaper || WALLPAPERS[0].url,
          wallpaperType: parsed.wallpaperType || 'solar-glow-orb',
          deviceName: isOldLenovo ? 'Lenovo Legion G14' : parsed.deviceName,
          deviceModel: isOldLenovo ? 'Lenovo Legion Slim G14 AMD Ryzen 9 / RTX 4070 / 1TB NVMe Gen4 SSD' : (parsed.deviceModel || DEFAULT_SETTINGS.deviceModel),
          pin: parsed.pin || '1234',
          password: parsed.password || 'lenovo',
          requireLogin: parsed.requireLogin !== undefined ? parsed.requireLogin : true,
          remapWinToCtrl: parsed.remapWinToCtrl !== undefined ? parsed.remapWinToCtrl : true,
          taskbarAlignment: parsed.taskbarAlignment || 'center',
          taskbarAutoHide: parsed.taskbarAutoHide ?? false,
          taskbarShowSearch: parsed.taskbarShowSearch ?? true,
          taskbarShowWidgets: parsed.taskbarShowWidgets ?? true,
          taskbarShowTaskManager: parsed.taskbarShowTaskManager ?? true,
          taskbarShowWifi: parsed.taskbarShowWifi ?? true,
          taskbarShowVolume: parsed.taskbarShowVolume ?? true,
          taskbarShowBattery: parsed.taskbarShowBattery ?? true,
          taskbarShowClock: parsed.taskbarShowClock ?? true,
          taskbarSize: parsed.taskbarSize || 'default',
          taskbarTheme: parsed.taskbarTheme || 'acrylic',
        };
      }
      return DEFAULT_SETTINGS;
    } catch (_) {
      return DEFAULT_SETTINGS;
    }
  });

  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(100);

  // Power Manager State (Sleep, Shut Down, Restart, Boot)
  const [powerState, setPowerState] = useState<PowerState>('normal');

  // Lock Screen State (Windows Hello PIN & Password)
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // System Flyouts
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWidgetsOpen, setIsWidgetsOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // BSOD State
  const [isBSOD, setIsBSOD] = useState(false);
  const [winKeyToast, setWinKeyToast] = useState<string | null>(null);

  // Notification items
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Lenovo Legion Vantage',
      message: 'Lenovo Legion G14 AMD Ryzen 9 & RTX 4070 hardware is healthy, active, and fully optimized.',
      time: 'Just now',
      app: 'Lenovo Vantage',
      read: false,
    },
    {
      id: 'n-2',
      title: 'Windows Security',
      message: 'Lenovo Legion hardware root-of-trust & 1.0 TB NVMe Gen4 protection active.',
      time: '2m ago',
      app: 'Defender',
      read: false,
    },
    {
      id: 'n-3',
      title: 'Virtual Scenic Window',
      message: 'New scenic atmosphere presets available in Aura Window.',
      time: '10m ago',
      app: 'Aura Window',
      read: false,
    },
  ]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {}
  }, [settings]);

  // Handle Page Unload / Refresh Protection & State Persistence (Modern & Reliable)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 1. Perform cleanup and persist latest system state to localStorage
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        if (windows.length > 0) {
          const serializedWindows = windows.map((w) => ({
            id: w.id,
            appId: w.appId,
            title: w.title,
            icon: w.icon,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
            isMinimized: w.isMinimized,
            isMaximized: w.isMaximized,
            initialData: w.initialData,
          }));
          localStorage.setItem('win11_saved_windows_session', JSON.stringify(serializedWindows));
        }
      } catch (_) {}

      // 2. Standard custom warning message to prevent accidental closing or refresh
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [settings, windows]);

  // Initial Welcome notification & open Aura Window / Explorer on first boot
  useEffect(() => {
    const hasBooted = sessionStorage.getItem('win11_has_booted');
    if (!hasBooted) {
      sessionStorage.setItem('win11_has_booted', 'true');
      // Open Aura Virtual Window to greet the user
      setTimeout(() => {
        openApp('virtualwindow');
      }, 500);
    }
  }, []);

  // Close flyouts when clicking anywhere outside
  const closeAllFlyouts = useCallback(() => {
    setIsStartOpen(false);
    setIsSearchOpen(false);
    setIsWidgetsOpen(false);
    setIsQuickSettingsOpen(false);
    setIsCalendarOpen(false);
  }, []);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const bringToFront = (id: string) => {
    setMaxZIndex((z) => {
      const nextZ = z + 1;
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w))
      );
      setActiveWindowId(id);
      return nextZ;
    });
  };

  const openApp = (appId: AppId, initialData?: any) => {
    closeAllFlyouts();
    soundManager.playClick();

    // Check if single-instance app already exists
    const existing = windows.find((w) => w.appId === appId);
    if (existing && appId !== 'notepad') {
      bringToFront(existing.id);
      return;
    }

    const appMeta = APPS_CATALOG.find((a) => a.id === appId) || {
      name: appId,
      icon: '📦',
    };

    // Calculate smart window size & placement
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

    let width = 740;
    let height = 520;

    if (appId === 'calculator') {
      width = 340;
      height = 490;
    } else if (appId === 'minesweeper') {
      width = 460;
      height = 510;
    } else if (appId === 'game2048') {
      width = 420;
      height = 530;
    } else if (appId === 'clock') {
      width = 540;
      height = 480;
    } else if (appId === 'camera') {
      width = 720;
      height = 560;
    } else if (appId === 'vscode') {
      width = 860;
      height = 560;
    } else if (appId === 'weatherpro') {
      width = 680;
      height = 500;
    } else if (appId === 'chrome') {
      width = 860;
      height = 580;
    } else if (appId === 'store') {
      width = 880;
      height = 580;
    } else if (appId === 'mediaplayer') {
      width = 460;
      height = 540;
    } else if (appId === 'paint') {
      width = 820;
      height = 580;
    } else if (appId === 'terminal') {
      width = 680;
      height = 460;
    } else if (appId === 'virtualwindow') {
      width = 780;
      height = 540;
    } else if (appId === 'taskmanager') {
      width = 760;
      height = 540;
    } else if (appId === 'nvidia') {
      width = 920;
      height = 620;
    }

    const offset = (windows.length % 6) * 26;
    const x = Math.max(20, Math.min(screenW - width - 40, 80 + offset));
    const y = Math.max(20, Math.min(screenH - height - 80, 40 + offset));

    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);

    const newWindow: WindowInstance = {
      id: `${appId}_${Date.now()}`,
      appId,
      title: appMeta.name,
      icon: appMeta.icon,
      x,
      y,
      width,
      height,
      minWidth: appId === 'calculator' ? 320 : 380,
      minHeight: appId === 'calculator' ? 440 : 280,
      isMinimized: false,
      isMaximized: false,
      zIndex: newZ,
      initialData,
    };

    setWindows((prev) => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const toggleMaximize = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (!w.isMaximized) {
          return {
            ...w,
            isMaximized: true,
            preMaximizeState: { x: w.x, y: w.y, width: w.width, height: w.height },
          };
        } else {
          return {
            ...w,
            isMaximized: false,
            x: w.preMaximizeState?.x ?? 80,
            y: w.preMaximizeState?.y ?? 50,
            width: w.preMaximizeState?.width ?? 700,
            height: w.preMaximizeState?.height ?? 500,
          };
        }
      })
    );
  };

  const snapWindow = (
    id: string,
    zone: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'full'
  ) => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const taskbarH = 48;
    const screenH = (typeof window !== 'undefined' ? window.innerHeight : 800) - taskbarH;

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;

        let newX = 0;
        let newY = 0;
        let newW = screenW;
        let newH = screenH;

        if (zone === 'left') {
          newX = 0;
          newW = screenW / 2;
        } else if (zone === 'right') {
          newX = screenW / 2;
          newW = screenW / 2;
        } else if (zone === 'top-left') {
          newX = 0;
          newY = 0;
          newW = screenW / 2;
          newH = screenH / 2;
        } else if (zone === 'top-right') {
          newX = screenW / 2;
          newY = 0;
          newW = screenW / 2;
          newH = screenH / 2;
        } else if (zone === 'bottom-left') {
          newX = 0;
          newY = screenH / 2;
          newW = screenW / 2;
          newH = screenH / 2;
        } else if (zone === 'bottom-right') {
          newX = screenW / 2;
          newY = screenH / 2;
          newW = screenW / 2;
          newH = screenH / 2;
        }

        return {
          ...w,
          isMaximized: false,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        };
      })
    );
  };

  const showDesktop = () => {
    soundManager.playClick();
    const hasUnminimized = windows.some((w) => !w.isMinimized);
    setWindows((prev) =>
      prev.map((w) => ({
        ...w,
        isMinimized: hasUnminimized,
      }))
    );
  };

  // Lock & Unlock Handlers (Windows Hello)
  const handleLock = useCallback(() => {
    closeAllFlyouts();
    soundManager.playClick();
    setIsLocked(true);
  }, [closeAllFlyouts]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
    soundManager.playDing();
  }, []);

  // Power Controls (Shutdown, Sleep, Restart, Wake, Boot)
  const handleShutdown = () => {
    closeAllFlyouts();
    soundManager.playClick();
    setPowerState('shutting-down');
  };

  const handleSleep = () => {
    closeAllFlyouts();
    soundManager.playClick();
    setPowerState('sleep');
    if (settings.requireLogin !== false) {
      setIsLocked(true);
    }
  };

  const handleRestart = () => {
    closeAllFlyouts();
    soundManager.playClick();
    setPowerState('restarting');
  };

  const handlePowerOn = () => {
    setPowerState('booting');
    if (settings.requireLogin !== false) {
      setIsLocked(true);
    }
  };

  const handleWake = () => {
    setPowerState('normal');
    if (settings.requireLogin !== false) {
      setIsLocked(true);
    }
  };

  const handleRestartComplete = () => {
    setWindows([]);
    setActiveWindowId(null);
    setPowerState('normal');
    if (settings.requireLogin !== false) {
      setIsLocked(true);
    }
  };

  // Tracking Control Key presses alone vs in combination
  const ctrlAloneRef = useRef(false);
  const ctrlComboUsedRef = useRef(false);

  // Global Keyboard Shortcuts (Control Key acts as Windows Key & Combinations)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (powerState !== 'normal') return;
      if (isLocked) return;

      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      const isCtrlKey =
        e.key === 'Control' ||
        e.code === 'ControlLeft' ||
        e.code === 'ControlRight';

      // Check for Windows Key (Meta / OS key)
      const isWinKey =
        e.key === 'Meta' ||
        e.key === 'OS' ||
        e.code === 'MetaLeft' ||
        e.code === 'MetaRight';

      // 1. Control Key alone down: track for Start Menu toggle
      if (isCtrlKey) {
        ctrlAloneRef.current = true;
        ctrlComboUsedRef.current = false;
        return;
      }

      // If another key is pressed while Control is active, mark combo used
      if (e.ctrlKey) {
        ctrlComboUsedRef.current = true;
      }

      // 2. Ctrl + Shift + Esc or Win + Shift + Esc -> Task Manager
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Escape' || e.code === 'Escape')) {
        e.preventDefault();
        openApp('taskmanager');
        setWinKeyToast('Task Manager opened (Ctrl+Shift+Esc)');
        setTimeout(() => setWinKeyToast(null), 2500);
        return;
      }

      // 3. Lock screen shortcut: Ctrl + L or Win + L (when not in text input)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l' && !isInputFocused) {
        e.preventDefault();
        handleLock();
        setWinKeyToast('PC Locked (Windows Hello)');
        setTimeout(() => setWinKeyToast(null), 2500);
        return;
      }

      // 4. Ctrl + Esc or Win + Esc: Toggle Windows Start Menu
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Escape' || e.code === 'Escape')) {
        e.preventDefault();
        soundManager.playClick();
        setIsStartOpen((prev) => !prev);
        setIsSearchOpen(false);
        setIsWidgetsOpen(false);
        setIsQuickSettingsOpen(false);
        setIsCalendarOpen(false);
        setWinKeyToast('Windows Start Menu (Ctrl+Esc)');
        setTimeout(() => setWinKeyToast(null), 2500);
        return;
      }

      // 5. Control Key / Windows Key Combinations (Ctrl + E, Ctrl + S, Ctrl + I, Ctrl + D, Ctrl + R)
      if ((e.ctrlKey || e.metaKey) && !isInputFocused) {
        const k = e.key.toLowerCase();
        if (k === 'e') {
          e.preventDefault();
          openApp('explorer');
          setWinKeyToast('Ctrl / Win + E: File Explorer opened');
          setTimeout(() => setWinKeyToast(null), 2500);
          return;
        } else if (k === 'd') {
          e.preventDefault();
          showDesktop();
          setWinKeyToast('Ctrl / Win + D: Desktop toggled');
          setTimeout(() => setWinKeyToast(null), 2500);
          return;
        } else if (k === 'i') {
          e.preventDefault();
          openApp('settings');
          setWinKeyToast('Ctrl / Win + I: Settings opened');
          setTimeout(() => setWinKeyToast(null), 2500);
          return;
        } else if (k === 'r') {
          e.preventDefault();
          openApp('terminal');
          setWinKeyToast('Ctrl / Win + R: Terminal / Run opened');
          setTimeout(() => setWinKeyToast(null), 2500);
          return;
        } else if (k === 's') {
          e.preventDefault();
          setIsSearchOpen((prev) => !prev);
          setIsStartOpen(false);
          setIsWidgetsOpen(false);
          setIsQuickSettingsOpen(false);
          setIsCalendarOpen(false);
          setWinKeyToast('Ctrl / Win + S: Windows Search');
          setTimeout(() => setWinKeyToast(null), 2500);
          return;
        }
      }

      // 6. Physical Windows Key (Meta) alone pressed
      if (isWinKey) {
        soundManager.playClick();
        setIsStartOpen((prev) => {
          const next = !prev;
          if (next) {
            setWinKeyToast('Windows Key pressed: Start Menu opened');
            setTimeout(() => setWinKeyToast(null), 2200);
          }
          return next;
        });
        setIsSearchOpen(false);
        setIsWidgetsOpen(false);
        setIsQuickSettingsOpen(false);
        setIsCalendarOpen(false);
        return;
      }

      // 7. Escape key closes Start Menu and flyouts
      if (e.key === 'Escape') {
        closeAllFlyouts();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isCtrlKey =
        e.key === 'Control' ||
        e.code === 'ControlLeft' ||
        e.code === 'ControlRight';

      if (isCtrlKey) {
        // User tapped Control key alone -> Works as Windows Key to toggle Start Menu!
        if (ctrlAloneRef.current && !ctrlComboUsedRef.current) {
          soundManager.playClick();
          setIsStartOpen((prev) => {
            const next = !prev;
            if (next) {
              setWinKeyToast('Control Key ➔ Windows Start Menu opened');
              setTimeout(() => setWinKeyToast(null), 2200);
            }
            return next;
          });
          setIsSearchOpen(false);
          setIsWidgetsOpen(false);
          setIsQuickSettingsOpen(false);
          setIsCalendarOpen(false);
        }
        ctrlAloneRef.current = false;
        ctrlComboUsedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [closeAllFlyouts, windows, powerState, isLocked, handleLock, showDesktop]);

  // Render contents for each app inside the window frame
  const renderAppContent = (win: WindowInstance) => {
    switch (win.appId) {
      case 'explorer':
        return (
          <FileExplorer
            initialFolderId={win.initialData?.folderId || 'desktop'}
            onOpenFile={(file: FSItem) => {
              if (
                file.name.endsWith('.exe') ||
                file.name.endsWith('.app') ||
                file.name.endsWith('.lnk') ||
                file.content?.startsWith('app:')
              ) {
                const rawApp = file.content?.startsWith('app:')
                  ? file.content.replace('app:', '').trim()
                  : '';
                const nameLower = file.name.toLowerCase();
                if (rawApp && APPS_CATALOG.some((a) => a.id === rawApp)) {
                  openApp(rawApp as AppId);
                  return;
                }
                if (nameLower.includes('chrome') || nameLower.includes('google')) openApp('chrome');
                else if (nameLower.includes('edge') || nameLower.includes('browser')) openApp('browser');
                else if (nameLower.includes('store')) openApp('store');
                else if (nameLower.includes('geforce') || nameLower.includes('nvidia')) openApp('nvidia');
                else if (nameLower.includes('code') || nameLower.includes('vscode')) openApp('vscode');
                else if (nameLower.includes('paint')) openApp('paint');
                else if (nameLower.includes('calc')) openApp('calculator');
                else if (nameLower.includes('terminal') || nameLower.includes('cmd')) openApp('terminal');
                else if (nameLower.includes('media') || nameLower.includes('player') || nameLower.includes('music')) openApp('mediaplayer');
                else if (nameLower.includes('clock') || nameLower.includes('alarm')) openApp('clock');
                else if (nameLower.includes('camera')) openApp('camera');
                else if (nameLower.includes('weather')) openApp('weatherpro');
                else if (nameLower.includes('task') || nameLower.includes('manager')) openApp('taskmanager');
                else if (nameLower.includes('game') || nameLower.includes('2048')) openApp('game2048');
                else if (nameLower.includes('mine')) openApp('minesweeper');
                else if (nameLower.includes('window') || nameLower.includes('scenic')) openApp('virtualwindow');
                else openApp('terminal', { command: `run "${file.name}"` });
                return;
              }
              if (
                file.fileType === 'txt' ||
                file.name.endsWith('.txt') ||
                file.name.endsWith('.md') ||
                file.name.endsWith('.log') ||
                file.name.endsWith('.json') ||
                file.name.endsWith('.js') ||
                file.name.endsWith('.ts')
              ) {
                openApp('notepad', { fileId: file.id, fileName: file.name, content: file.content });
                return;
              }
              if (file.fileType === 'url' || file.name.endsWith('.url') || file.name.endsWith('.html')) {
                openApp('chrome', { url: file.content || 'https://google.com' });
                return;
              }
              if (
                file.fileType === 'png' ||
                file.name.endsWith('.png') ||
                file.name.endsWith('.jpg') ||
                file.name.endsWith('.jpeg')
              ) {
                openApp('paint');
                return;
              }
              openApp('notepad', { fileId: file.id, fileName: file.name, content: file.content });
            }}
            onOpenApp={openApp}
          />
        );
      case 'trash':
        return <FileExplorer initialFolderId="trash" onOpenApp={openApp} />;
      case 'store':
        return <MicrosoftStore onOpenApp={openApp} />;
      case 'chrome':
        return (
          <GoogleChrome
            onOpenApp={openApp}
            onSetWallpaper={(url) => updateSettings({ wallpaper: url, wallpaperType: 'custom' })}
            initialUrl={win.initialData?.url}
            initialQuery={win.initialData?.query}
          />
        );
      case 'game2048':
        return <Game2048 />;
      case 'clock':
        return <ClockApp />;
      case 'camera':
        return <CameraApp />;
      case 'vscode':
        return <VSCodeApp />;
      case 'weatherpro':
        return <WeatherProApp />;
      case 'notepad':
        return (
          <Notepad
            initialFileId={win.initialData?.fileId}
            initialContent={win.initialData?.content}
            initialFileName={win.initialData?.fileName}
          />
        );
      case 'paint':
        return <Paint />;
      case 'terminal':
        return (
          <Terminal
            onTriggerBSOD={() => setIsBSOD(true)}
            onClose={() => closeWindow(win.id)}
            onOpenApp={openApp}
            onShutdown={handleShutdown}
            onRestart={handleRestart}
            onSleep={handleSleep}
            deviceName={settings.deviceName || 'Lenovo'}
          />
        );
      case 'minesweeper':
        return <Minesweeper />;
      case 'calculator':
        return <Calculator />;
      case 'mediaplayer':
        return <MediaPlayer />;
      case 'browser':
        return (
          <Browser
            onOpenApp={openApp}
            initialUrl={win.initialData?.url}
            initialQuery={win.initialData?.query}
          />
        );
      case 'virtualwindow':
        return <VirtualWindow />;
      case 'settings':
        return (
          <SettingsApp
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenApp={openApp}
            onShutdown={handleShutdown}
            onRestart={handleRestart}
            onSleep={handleSleep}
            onLock={handleLock}
            initialTab={win.initialData?.tab}
          />
        );
      case 'taskmanager':
        return (
          <TaskManager
            windows={windows}
            onCloseWindow={closeWindow}
            onFocusWindow={bringToFront}
            onOpenApp={openApp}
          />
        );
      case 'nvidia':
        return <NvidiaGeForceApp initialTab={win.initialData?.tab} />;
      default:
        return <div className="p-4">App not found</div>;
    }
  };

  return (
    <div
      onClick={closeAllFlyouts}
      className="relative w-screen h-screen overflow-hidden font-sans select-none bg-black"
    >
      {/* BSOD Crash Screen Easter Egg */}
      {isBSOD ? (
        <BSOD onRestart={() => setIsBSOD(false)} />
      ) : (
        <>
          {/* Power Manager Screen (Sleep, Shut Down, Restart, Boot) */}
          <PowerManagerScreen
            powerState={powerState}
            deviceName={settings.deviceName || 'Lenovo'}
            onWake={handleWake}
            onPowerOn={handlePowerOn}
            onRestartComplete={handleRestartComplete}
          />

          {/* Windows Hello Lock Screen (PIN & Password) */}
          <LockScreen
            isLocked={isLocked}
            settings={settings}
            onUnlock={handleUnlock}
            onShutdown={handleShutdown}
            onSleep={handleSleep}
            onRestart={handleRestart}
          />

          {/* Desktop & Wallpapers */}
          <Desktop
            settings={settings}
            onOpenApp={openApp}
            onOpenSettings={() => openApp('settings')}
          >
            {/* Render all open windows */}
            {windows.map((win) => (
              <WindowFrame
                key={win.id}
                window={win}
                isActive={win.id === activeWindowId}
                onFocus={() => bringToFront(win.id)}
                onClose={() => closeWindow(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onMaximizeToggle={() => toggleMaximize(win.id)}
                onMove={(x, y) => {
                  setWindows((prev) =>
                    prev.map((w) => (w.id === win.id ? { ...w, x, y } : w))
                  );
                }}
                onResize={(width, height, x, y) => {
                  setWindows((prev) =>
                    prev.map((w) =>
                      w.id === win.id
                        ? {
                            ...w,
                            width,
                            height,
                            x: x !== undefined ? x : w.x,
                            y: y !== undefined ? y : w.y,
                          }
                        : w
                    )
                  );
                }}
                onSnap={(zone) => snapWindow(win.id, zone)}
              >
                {renderAppContent(win)}
              </WindowFrame>
            ))}
          </Desktop>

          {/* Start Menu Flyout */}
          {isStartOpen && (
            <StartMenu
              onOpenApp={openApp}
              onTriggerBSOD={() => setIsBSOD(true)}
              onRestart={handleRestart}
              onShutdown={handleShutdown}
              onSleep={handleSleep}
              onLock={handleLock}
              onClose={() => setIsStartOpen(false)}
              taskbarAlignment={settings.taskbarAlignment}
              deviceName={settings.deviceName || 'Lenovo'}
            />
          )}

          {/* Windows 11 Search Flyout */}
          {isSearchOpen && (
            <SearchFlyout
              onOpenApp={openApp}
              onClose={() => setIsSearchOpen(false)}
              taskbarAlignment={settings.taskbarAlignment}
              settings={settings}
            />
          )}

          {/* Widgets Flyout */}
          {isWidgetsOpen && (
            <WidgetsFlyout
              onOpenApp={openApp}
              onClose={() => setIsWidgetsOpen(false)}
            />
          )}

          {/* Quick Settings Action Center */}
          {isQuickSettingsOpen && (
            <QuickSettings
              settings={settings}
              onUpdateSettings={updateSettings}
              onOpenSettings={() => openApp('settings')}
              onClose={() => setIsQuickSettingsOpen(false)}
              onShutdown={handleShutdown}
              onSleep={handleSleep}
              onRestart={handleRestart}
              onLock={handleLock}
              deviceName={settings.deviceName || 'Lenovo'}
            />
          )}

          {/* Calendar & Notifications Flyout */}
          {isCalendarOpen && (
            <CalendarFlyout
              notifications={notifications}
              onClearNotifications={() => setNotifications([])}
              onClose={() => setIsCalendarOpen(false)}
            />
          )}

          {/* Taskbar */}
          <Taskbar
            windows={windows}
            activeWindowId={activeWindowId}
            settings={settings}
            onUpdateSettings={updateSettings}
            isStartOpen={isStartOpen}
            isSearchOpen={isSearchOpen}
            isWidgetsOpen={isWidgetsOpen}
            isQuickSettingsOpen={isQuickSettingsOpen}
            isCalendarOpen={isCalendarOpen}
            unreadCount={notifications.length}
            onShutdown={handleShutdown}
            onSleep={handleSleep}
            onRestart={handleRestart}
            onLock={handleLock}
            deviceName={settings.deviceName || 'Lenovo Legion G14'}
            onToggleStart={() => {
              setIsStartOpen(!isStartOpen);
              setIsSearchOpen(false);
              setIsWidgetsOpen(false);
              setIsQuickSettingsOpen(false);
              setIsCalendarOpen(false);
            }}
            onToggleSearch={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsStartOpen(false);
              setIsWidgetsOpen(false);
              setIsQuickSettingsOpen(false);
              setIsCalendarOpen(false);
            }}
            onToggleWidgets={() => {
              setIsWidgetsOpen(!isWidgetsOpen);
              setIsStartOpen(false);
              setIsSearchOpen(false);
              setIsQuickSettingsOpen(false);
              setIsCalendarOpen(false);
            }}
            onToggleQuickSettings={() => {
              setIsQuickSettingsOpen(!isQuickSettingsOpen);
              setIsStartOpen(false);
              setIsSearchOpen(false);
              setIsWidgetsOpen(false);
              setIsCalendarOpen(false);
            }}
            onToggleCalendar={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsStartOpen(false);
              setIsSearchOpen(false);
              setIsWidgetsOpen(false);
              setIsQuickSettingsOpen(false);
            }}
            onOpenApp={openApp}
            onFocusWindow={bringToFront}
            onMinimizeWindow={minimizeWindow}
            onCloseWindow={closeWindow}
            onShowDesktop={showDesktop}
          />

          {/* Windows Key HUD Feedback Notification */}
          {winKeyToast && (
            <div className="fixed bottom-14 left-1/2 transform -translate-x-1/2 z-[99999] bg-neutral-900/90 backdrop-blur-md text-white border border-white/20 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
              <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                🪟
              </span>
              <span>{winKeyToast}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
