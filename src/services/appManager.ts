import { AppId } from '../types/os';
import { fs } from './filesystem';
import { soundManager } from './sound';

const INSTALLED_APPS_KEY = 'win11_installed_apps';

export interface StoreAppInfo {
  id: AppId;
  name: string;
  icon: string;
  category: 'Games' | 'Productivity' | 'Utilities' | 'Development' | 'Media' | 'Creative';
  description: string;
  developer: string;
  rating: number;
  reviewsCount: number;
  sizeMB: number;
  downloadUrl?: string;
  screenshots: string[];
  isCore?: boolean;
}

export const STORE_CATALOG: StoreAppInfo[] = [
  // Downloadable New Store Apps
  {
    id: 'chrome',
    name: 'Google Chrome',
    icon: '🌐',
    category: 'Productivity',
    description: 'Fast, secure web browser with Google Search, YouTube, bookmarks, tab manager, and Chrome downloads.',
    developer: 'Google LLC',
    rating: 4.9,
    reviewsCount: 15420,
    sizeMB: 18.5,
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'game2048',
    name: '2048 Puzzle',
    icon: '🔢',
    category: 'Games',
    description: 'Join the numbers and get to the 2048 tile! Smooth animations, swipe controls, score tracking.',
    developer: 'Gabriele Cirulli / Web OS',
    rating: 4.8,
    reviewsCount: 1420,
    sizeMB: 3.2,
    screenshots: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'clock',
    name: 'Alarms & Clock',
    icon: '⏰',
    category: 'Utilities',
    description: 'Digital world clock, precision stopwatch with lap history, and customizable countdown timer with chimes.',
    developer: 'Microsoft Corporation',
    rating: 4.7,
    reviewsCount: 890,
    sizeMB: 2.4,
    screenshots: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'camera',
    name: 'Camera & Photo Booth',
    icon: '📷',
    category: 'Media',
    description: 'Live webcam & scenic photo booth with filters (Cyberpunk, Vintage, Neon). Snaps save to Win11 storage!',
    developer: 'Microsoft Corporation',
    rating: 4.6,
    reviewsCount: 1105,
    sizeMB: 5.8,
    screenshots: [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'vscode',
    name: 'VS Code Lite',
    icon: '💻',
    category: 'Development',
    description: 'Lightweight HTML, CSS, & JavaScript code editor with real-time live preview sandbox and save to OS storage.',
    developer: 'Microsoft Dev Labs',
    rating: 4.9,
    reviewsCount: 3200,
    sizeMB: 8.4,
    screenshots: [
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'weatherpro',
    name: 'Weather Pro Radar',
    icon: '⛅',
    category: 'Utilities',
    description: 'Interactive live weather satellite radar, 7-day extended forecasts, humidity, wind, and air quality.',
    developer: 'Meteorology Network',
    rating: 4.5,
    reviewsCount: 760,
    sizeMB: 4.1,
    screenshots: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    ],
  },

  // Pre-installed Core Apps (also shown in Store as Installed)
  {
    id: 'virtualwindow',
    name: 'Aura Window Simulator',
    icon: '🪟',
    category: 'Media',
    description: 'Scenic window simulator with wipeable condensation fog, realistic rain physics, ambient audio soundscapes.',
    developer: 'Aura Studio',
    rating: 5.0,
    reviewsCount: 4210,
    sizeMB: 12.0,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'paint',
    name: 'Paint',
    icon: '🎨',
    category: 'Creative',
    description: 'Drawing canvas with brushes, geometric shapes, color palettes, undo/redo, and PNG image export.',
    developer: 'Microsoft Corporation',
    rating: 4.7,
    reviewsCount: 2300,
    sizeMB: 4.5,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper Classic',
    icon: '💣',
    category: 'Games',
    description: 'The legendary retro puzzle game with Beginner, Intermediate, Expert modes, timers, and confetti fanfare.',
    developer: 'Microsoft Casual Games',
    rating: 4.9,
    reviewsCount: 6540,
    sizeMB: 2.1,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'mediaplayer',
    name: 'Windows Media Player',
    icon: '🎵',
    category: 'Media',
    description: 'Synthesizer Lo-Fi and ambient music player with real-time dynamic frequency spectrum visualizer.',
    developer: 'Microsoft Corporation',
    rating: 4.6,
    reviewsCount: 1540,
    sizeMB: 6.2,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: '🧮',
    category: 'Utilities',
    description: 'Standard and scientific math calculator with calculation history tape.',
    developer: 'Microsoft Corporation',
    rating: 4.8,
    reviewsCount: 1980,
    sizeMB: 1.8,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'notepad',
    name: 'Notepad',
    icon: '📝',
    category: 'Productivity',
    description: 'Fast text editor with word wrapping, font scaling, line counters, and virtual file system persistence.',
    developer: 'Microsoft Corporation',
    rating: 4.7,
    reviewsCount: 3100,
    sizeMB: 1.2,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'terminal',
    name: 'Windows Terminal',
    icon: '💻',
    category: 'Development',
    description: 'Powerful PowerShell terminal with neofetch specs, matrix rain, filesystem operations, and tools.',
    developer: 'Microsoft Corporation',
    rating: 4.9,
    reviewsCount: 2890,
    sizeMB: 3.5,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'taskmanager',
    name: 'Task Manager',
    icon: '📊',
    category: 'Utilities',
    description: 'Monitor running processes, CPU & Memory usage, startup applications, and terminate tasks.',
    developer: 'Microsoft Corporation',
    rating: 4.9,
    reviewsCount: 5120,
    sizeMB: 3.5,
    isCore: true,
    screenshots: [],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA GeForce NOW RTX',
    icon: '🟢',
    category: 'Games',
    description: 'NVIDIA GeForce RTX 4090 Cloud Gaming & GPU Hardware Control Panel. Ray Tracing, DLSS 3.5, and 4K 144FPS streaming.',
    developer: 'NVIDIA Corporation',
    rating: 5.0,
    reviewsCount: 28400,
    sizeMB: 35.0,
    isCore: true,
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    ],
  },
  {
    id: 'browser',
    name: 'Microsoft Edge',
    icon: '🌐',
    category: 'Productivity',
    description: 'Modern web browser with tabs, bookmarks, search, and integrated OS storage download center.',
    developer: 'Microsoft Corporation',
    rating: 4.6,
    reviewsCount: 4200,
    sizeMB: 15.0,
    isCore: true,
    screenshots: [],
  },
];

// Pre-installed core app IDs that are always active
export const CORE_APP_IDS: AppId[] = [
  'explorer',
  'chrome',
  'browser',
  'notepad',
  'paint',
  'terminal',
  'minesweeper',
  'calculator',
  'mediaplayer',
  'virtualwindow',
  'settings',
  'trash',
  'store',
  'taskmanager',
  'nvidia',
];

class AppManager {
  private installedIds: Set<AppId> = new Set(CORE_APP_IDS);
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const data = localStorage.getItem(INSTALLED_APPS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as AppId[];
        parsed.forEach((id) => this.installedIds.add(id));
      }
    } catch (_) {}
    // Ensure all core apps are installed
    CORE_APP_IDS.forEach((id) => this.installedIds.add(id));
  }

  private save() {
    try {
      localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(Array.from(this.installedIds)));
    } catch (_) {}
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    queueMicrotask(() => {
      this.listeners.forEach((l) => l());
    });
  }

  public getInstalledAppIds(): AppId[] {
    return Array.from(this.installedIds);
  }

  public isInstalled(appId: AppId): boolean {
    return this.installedIds.has(appId);
  }

  // Install app into Win11 Web OS storage
  public installApp(appId: AppId): boolean {
    if (this.installedIds.has(appId)) return true;

    const info = STORE_CATALOG.find((a) => a.id === appId);
    if (!info) return false;

    this.installedIds.add(appId);
    this.save();

    // Register on Virtual File System: save package to Program Files / Downloads
    const fileName = `${info.name.replace(/\s+/g, '_')}_v1.0.app`;
    fs.createFile(
      fileName,
      'downloads',
      `[WIN11_APP_PACKAGE]\nID=${info.id}\nName=${info.name}\nSize=${info.sizeMB}MB\nInstalledAt=${new Date().toISOString()}`,
      'sys' as any
    );

    // Add Desktop shortcut file
    fs.createFile(
      `${info.name}.lnk`,
      'desktop',
      `[Shortcut]\nTargetApp=${info.id}\nName=${info.name}\nIcon=${info.icon}`,
      'url' as any
    );

    soundManager.playDing();
    this.notify();
    return true;
  }

  // Uninstall app from Win11 Web OS storage
  public uninstallApp(appId: AppId): boolean {
    if (CORE_APP_IDS.includes(appId)) return false; // Core apps cannot be deleted

    const info = STORE_CATALOG.find((a) => a.id === appId);
    this.installedIds.delete(appId);
    this.save();

    // Remove desktop shortcut if exists
    if (info) {
      const desktopFiles = fs.getItems('desktop');
      const shortcut = desktopFiles.find((f) => f.name.includes(info.name));
      if (shortcut) {
        fs.deleteItem(shortcut.id);
      }
    }

    soundManager.playTrashEmpty();
    this.notify();
    return true;
  }

  public getTotalStorageUsedMB(): number {
    let mb = 45; // Base OS storage footprint
    this.installedIds.forEach((id) => {
      const info = STORE_CATALOG.find((a) => a.id === id);
      if (info) mb += info.sizeMB;
    });
    // Add file system item sizes
    const items = fs.getAllItems();
    const bytes = items.reduce((acc, i) => acc + (i.size || 0), 0);
    mb += Math.round((bytes / 1024 / 1024) * 10) / 10;
    return Math.round(mb * 10) / 10;
  }
}

export const appManager = new AppManager();
