import React, { useState } from 'react';
import {
  Search,
  Mic,
  Camera,
  Plus,
  MoreVertical,
  ExternalLink,
  Edit2,
  Grid,
  Sparkles,
  Download,
} from 'lucide-react';
import { ChromeLogo } from './ChromeLogo';

interface GoogleChromeHomeProps {
  onNavigate: (url: string, title?: string) => void;
  onOpenDownloads?: () => void;
  onOpenApp?: (appId: any) => void;
}

interface ChromeShortcut {
  id: string;
  name: string;
  url: string;
  iconBg: string;
  iconText: string;
  isCustom?: boolean;
}

export const GoogleChromeHome: React.FC<GoogleChromeHomeProps> = ({
  onNavigate,
  onOpenDownloads,
  onOpenApp,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [showWaffleMenu, setShowWaffleMenu] = useState(false);
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newShortcutName, setNewShortcutName] = useState('');
  const [newShortcutUrl, setNewShortcutUrl] = useState('');

  const [shortcuts, setShortcuts] = useState<ChromeShortcut[]>([
    {
      id: 'google-search',
      name: 'Google Search',
      url: 'https://www.google.com',
      iconBg: 'bg-blue-600',
      iconText: 'G',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com',
      iconBg: 'bg-red-600',
      iconText: '▶',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      url: 'https://mail.google.com',
      iconBg: 'bg-red-500',
      iconText: '✉',
    },
    {
      id: 'maps',
      name: 'Google Maps',
      url: 'https://maps.google.com',
      iconBg: 'bg-emerald-600',
      iconText: '🗺',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      url: 'https://drive.google.com',
      iconBg: 'bg-amber-500',
      iconText: '▲',
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      url: 'https://gemini.google.com',
      iconBg: 'bg-purple-600',
      iconText: '✦',
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com',
      iconBg: 'bg-neutral-800',
      iconText: '🐙',
    },
    {
      id: 'wikipedia',
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org',
      iconBg: 'bg-neutral-700',
      iconText: 'W',
    },
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    onNavigate(searchInput.trim());
  };

  const handleAddCustomShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcutName.trim() || !newShortcutUrl.trim()) return;

    let targetUrl = newShortcutUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const newSc: ChromeShortcut = {
      id: `sc_${Date.now()}`,
      name: newShortcutName.trim(),
      url: targetUrl,
      iconBg: 'bg-blue-600',
      iconText: newShortcutName.trim().slice(0, 1).toUpperCase(),
      isCustom: true,
    };

    setShortcuts((prev) => [...prev, newSc]);
    setNewShortcutName('');
    setNewShortcutUrl('');
    setShowAddShortcut(false);
  };

  const googleApps = [
    { name: 'Search', url: 'https://google.com', icon: '🔍' },
    { name: 'Maps', url: 'https://maps.google.com', icon: '🗺️' },
    { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
    { name: 'Play', url: 'https://play.google.com', icon: '🎮' },
    { name: 'News', url: 'https://news.google.com', icon: '📰' },
    { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
    { name: 'Meet', url: 'https://meet.google.com', icon: '📹' },
    { name: 'Chat', url: 'https://chat.google.com', icon: '💬' },
    { name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
    { name: 'Calendar', url: 'https://calendar.google.com', icon: '📅' },
    { name: 'Translate', url: 'https://translate.google.com', icon: '🌐' },
    { name: 'Photos', url: 'https://photos.google.com', icon: '🖼️' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#202124] text-neutral-800 dark:text-neutral-100 select-none overflow-y-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between p-4 px-6 relative">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          <ChromeLogo size={20} />
          <span>Google Chrome (Official Build 64-bit)</span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-neutral-700 dark:text-neutral-300">
          <button
            onClick={() => onNavigate('https://mail.google.com', 'Gmail')}
            className="hover:underline cursor-pointer"
          >
            Gmail
          </button>
          <button
            onClick={() => onNavigate('https://images.google.com', 'Google Images')}
            className="hover:underline cursor-pointer"
          >
            Images
          </button>

          {/* 9-Dots Google Apps Launcher */}
          <div className="relative">
            <button
              onClick={() => setShowWaffleMenu(!showWaffleMenu)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition cursor-pointer"
              title="Google apps"
            >
              <Grid size={18} className="text-neutral-600 dark:text-neutral-300" />
            </button>

            {/* Waffle Google Apps Menu */}
            {showWaffleMenu && (
              <div className="absolute right-0 top-10 w-72 bg-white dark:bg-[#28292c] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 grid grid-cols-3 gap-2">
                {googleApps.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => {
                      setShowWaffleMenu(false);
                      onNavigate(app.url, app.name);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition cursor-pointer group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                      {app.icon}
                    </span>
                    <span className="text-[11px] text-neutral-700 dark:text-neutral-200">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow cursor-pointer ring-2 ring-white/20"
            title="Google Chrome Account"
          >
            G
          </div>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full py-8 space-y-7">
        {/* Authentic Multi-Color Google Wordmark Logo */}
        <div className="flex items-center select-none tracking-tight font-medium text-6xl sm:text-7xl font-sans drop-shadow-sm">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
        </div>

        {/* Chrome Omnibox / Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full relative flex items-center bg-white dark:bg-[#303134] border border-neutral-200 dark:border-neutral-700/80 hover:border-transparent hover:shadow-lg focus-within:shadow-xl focus-within:border-transparent rounded-full px-4 py-3 space-x-3 transition-all duration-200"
        >
          <Search size={18} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Google or type a URL"
            className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
            autoFocus
          />

          <div className="flex items-center space-x-2 shrink-0 text-neutral-500 dark:text-neutral-400">
            <button
              type="button"
              className="p-1 hover:text-blue-500 transition"
              title="Search by voice"
            >
              <Mic size={17} />
            </button>
            <button
              type="button"
              className="p-1 hover:text-blue-500 transition"
              title="Search by image (Google Lens)"
            >
              <Camera size={17} />
            </button>
          </div>
        </form>

        {/* Google Quick Shortcut Tiles */}
        <div className="w-full">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
            {shortcuts.map((sc) => (
              <button
                key={sc.id}
                onClick={() => onNavigate(sc.url, sc.name)}
                className="flex flex-col items-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer group"
              >
                <div
                  className={`w-12 h-12 rounded-full ${sc.iconBg} text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform mb-1.5`}
                >
                  {sc.iconText}
                </div>
                <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate w-full text-center">
                  {sc.name}
                </span>
              </button>
            ))}

            {/* Add Shortcut Tile */}
            <button
              onClick={() => setShowAddShortcut(true)}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-lg shadow-inner group-hover:scale-105 transition-transform mb-1.5 border border-dashed border-neutral-300 dark:border-neutral-700">
                <Plus size={20} />
              </div>
              <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Add shortcut
              </span>
            </button>
          </div>
        </div>

        {/* Quick Popular Laptop Software Downloads Bar */}
        {onOpenDownloads && (
          <div className="w-full p-4 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
                <Download size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">
                  Chrome Download Hub &amp; Laptop Software
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Download Discord, VS Code, GeForce, Spotify, Steam, and offline tools
                </div>
              </div>
            </div>
            <button
              onClick={onOpenDownloads}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
            >
              Open Downloads
            </button>
          </div>
        )}
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomShortcut}
            className="w-full max-w-sm bg-white dark:bg-[#28292c] border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Add shortcut</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newShortcutName}
                  onChange={(e) => setNewShortcutName(e.target.value)}
                  placeholder="e.g. Reddit"
                  required
                  className="w-full bg-neutral-100 dark:bg-[#1a1a1c] border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={newShortcutUrl}
                  onChange={(e) => setNewShortcutUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full bg-neutral-100 dark:bg-[#1a1a1c] border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setShowAddShortcut(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow"
              >
                Done
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chrome Footer */}
      <div className="p-4 px-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center space-x-4">
          <span>About</span>
          <span>Advertising</span>
          <span>Business</span>
          <span>How Search works</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
};
