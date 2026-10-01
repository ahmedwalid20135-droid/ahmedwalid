export type AppId =
  | 'explorer'
  | 'notepad'
  | 'paint'
  | 'terminal'
  | 'minesweeper'
  | 'calculator'
  | 'mediaplayer'
  | 'browser'
  | 'chrome'
  | 'virtualwindow'
  | 'settings'
  | 'trash'
  | 'store'
  | 'game2048'
  | 'clock'
  | 'camera'
  | 'vscode'
  | 'weatherpro'
  | 'taskmanager'
  | 'nvidia'
  | 'word'
  | 'excel'
  | 'powerpoint';

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  preMaximizeState?: { x: number; y: number; width: number; height: number };
  initialData?: any;
}

export interface FSItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null; // null for root/desktop
  content?: string; // for text files or image data url
  fileType?: 'txt' | 'png' | 'url' | 'sys' | 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'media';
  icon?: string;
  createdAt: number;
  modifiedAt: number;
  size?: number;
}

export type ThemeMode = 'dark' | 'light' | 'retro-xp';

export interface SystemSettings {
  wallpaper: string;
  wallpaperType: 'solar-glow-orb' | 'bloom-dark' | 'bloom-light' | 'glow-abstract' | 'bliss-xp' | 'cyber-neon' | 'sunset-mountain' | 'custom';
  customWallpaperUrl?: string;
  theme: ThemeMode;
  taskbarAlignment: 'center' | 'left';
  soundEnabled: boolean;
  volume: number;
  audioOutputDevice?: string;
  spatialAudio?: boolean;
  brightness: number;
  nightLight: boolean;
  wifiEnabled: boolean;
  wifiNetwork?: string;
  bluetoothEnabled: boolean;
  airplaneMode: boolean;
  batteryLevel: number;
  isCharging: boolean;
  batterySaver?: boolean;
  powerMode?: 'efficiency' | 'balanced' | 'performance';
  focusAssist?: boolean;
  deviceName?: string;
  deviceModel?: string;
  pin?: string;
  password?: string;
  requireLogin?: boolean;
  isLocked?: boolean;
  remapWinToCtrl?: boolean;
  taskbarAutoHide?: boolean;
  taskbarShowSearch?: boolean;
  taskbarShowWidgets?: boolean;
  taskbarShowTaskManager?: boolean;
  taskbarShowWifi?: boolean;
  taskbarShowVolume?: boolean;
  taskbarShowBattery?: boolean;
  taskbarShowClock?: boolean;
  taskbarSize?: 'default' | 'compact' | 'large';
  taskbarTheme?: 'blur' | 'opaque' | 'acrylic';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  app: string;
  read: boolean;
  actionAppId?: AppId;
  actionData?: any;
}
