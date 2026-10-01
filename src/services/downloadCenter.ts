import { AppId, FSItem } from '../types/os';
import { fs } from './filesystem';
import { soundManager } from './sound';
import { webSearchService } from './webSearchService';

export interface DownloadableLaptopApp {
  id: string;
  name: string;
  filename: string;
  category: string;
  size: string;
  icon: string;
  description: string;
  appId: AppId;
}

export const LAPTOP_DOWNLOADABLE_APPS: DownloadableLaptopApp[] = [
  {
    id: 'vscode',
    name: 'Visual Studio Code Lite',
    filename: 'VSCode_Setup_x64.exe',
    category: 'Development',
    size: '88.4 MB',
    icon: '💻',
    description: 'HTML5, CSS3 & JavaScript code editor with real-time browser preview sandbox.',
    appId: 'vscode',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA GeForce Experience',
    filename: 'GeForce_Experience_RTX4070.exe',
    category: 'Graphics & Gaming',
    size: '124.6 MB',
    icon: '⚡',
    description: 'Lenovo Legion RTX 4070 tuning, DLSS 3.5 frame gen demo & real-time path tracing.',
    appId: 'nvidia',
  },
  {
    id: 'chrome',
    name: 'Google Chrome Web Browser',
    filename: 'ChromeStandaloneSetup64.exe',
    category: 'Internet',
    size: '95.2 MB',
    icon: '🌐',
    description: 'Fast, secure Google Chrome browser with tabs, search, and universal downloads.',
    appId: 'chrome',
  },
  {
    id: 'game2048',
    name: 'Minecraft 2048 Edition',
    filename: 'Minecraft_2048_Game.exe',
    category: 'Games',
    size: '34.8 MB',
    icon: '🎮',
    description: 'Addictive number puzzle game with smooth sliding animations and high scores.',
    appId: 'game2048',
  },
  {
    id: 'terminal',
    name: 'Windows Terminal & PowerShell',
    filename: 'WindowsTerminal_Lenovo.exe',
    category: 'System Tools',
    size: '22.0 MB',
    icon: '💻',
    description: 'Command prompt and PowerShell with neofetch, system specs, matrix effect, and disk commands.',
    appId: 'terminal',
  },
  {
    id: 'paint',
    name: 'Paint Studio Pro',
    filename: 'PaintStudioPro.exe',
    category: 'Creative',
    size: '18.5 MB',
    icon: '🎨',
    description: 'Multi-tool digital art studio with brush sizes, shapes, colors, and canvas export.',
    appId: 'paint',
  },
  {
    id: 'mediaplayer',
    name: 'VLC Media Player Classic',
    filename: 'VLC_MediaPlayer_Setup.exe',
    category: 'Media',
    size: '42.0 MB',
    icon: '🎵',
    description: 'Audio & video player with synth tracks, audio visualizer, and custom playback.',
    appId: 'mediaplayer',
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper Deluxe',
    filename: 'Minesweeper_Classic.exe',
    category: 'Games',
    size: '12.4 MB',
    icon: '💣',
    description: 'Classic Windows Minesweeper with Beginner, Intermediate & Expert board modes.',
    appId: 'minesweeper',
  },
  {
    id: 'calculator',
    name: 'Lenovo Precision Calculator',
    filename: 'Calculator_Pro.exe',
    category: 'Utilities',
    size: '8.2 MB',
    icon: '🔢',
    description: 'Standard and scientific mathematical calculator with memory functions.',
    appId: 'calculator',
  },
  {
    id: 'weatherpro',
    name: 'Weather Pro Satellite Radar',
    filename: 'WeatherProRadar.exe',
    category: 'News & Weather',
    size: '16.0 MB',
    icon: '⛅',
    description: 'Global weather radar, 7-day live forecasts, wind speed, humidity, and air quality.',
    appId: 'weatherpro',
  },
  {
    id: 'clock',
    name: 'World Clock & Stopwatch',
    filename: 'ClockApp_Suite.exe',
    category: 'Utilities',
    size: '7.5 MB',
    icon: '⏰',
    description: 'World time zones, precision stopwatch with lap times, and countdown timers.',
    appId: 'clock',
  },
  {
    id: 'camera',
    name: 'Lenovo HD Camera & Photo Booth',
    filename: 'LenovoCameraStudio.exe',
    category: 'Media',
    size: '28.0 MB',
    icon: '📷',
    description: 'Camera viewport with Cyberpunk, Neon, and Vintage filters; saves snaps to Pictures storage.',
    appId: 'camera',
  },
];

export interface ActiveDownloadProgress {
  id: string;
  filename: string;
  appId?: AppId;
  progress: number;
  speed: string;
  totalSize: string;
  completed: boolean;
  timestamp: number;
}
