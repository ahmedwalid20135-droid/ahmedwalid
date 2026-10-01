import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Search,
  Lock,
  Star,
  Plus,
  X,
  Download,
  Check,
  MoreVertical,
  ExternalLink,
  Mic,
  Camera,
  Folder,
  FileDown,
  Globe,
  Sparkles,
  Wifi,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  Image as ImageIcon,
  FileText,
  Code,
  HardDrive,
  Copy,
  SlidersHorizontal,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { AppId, FSItem } from '../types/os';
import {
  webSearchService,
  SearchResponse,
  SearchResultItem,
  DownloadHistoryItem,
} from '../services/webSearchService';
import { WindowsStartPage } from '../components/WindowsStartPage';
import { GoogleChromeHome } from '../components/GoogleChromeHome';
import { ChromeLogo } from '../components/ChromeLogo';
import { BrowserDownloadShelf, ActiveDownloadItem } from '../components/BrowserDownloadShelf';
import { BrowserAppDownloadHub } from '../components/BrowserAppDownloadHub';
import { LAPTOP_DOWNLOADABLE_APPS, DownloadableLaptopApp } from '../services/downloadCenter';

interface ChromeTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  viewMode: 'home' | 'search' | 'reader' | 'iframe' | 'downloads';
  searchQuery?: string;
  articleData?: {
    title: string;
    content: string;
    url: string;
    imageUrl?: string;
  };
}

interface GoogleChromeProps {
  onOpenApp?: (appId: AppId, data?: any) => void;
  onSetWallpaper?: (url: string) => void;
  initialUrl?: string;
  initialQuery?: string;
}

const FEATURED_WEB_SITES = [
  {
    name: 'DuckDuckGo Live Search',
    url: 'https://duckduckgo.com',
    icon: '🦆',
    desc: 'Live privacy search engine. Enter any query or visit live web pages.',
    category: 'Search',
  },
  {
    name: 'Wikipedia Encyclopedia',
    url: 'https://en.wikipedia.org',
    icon: '📖',
    desc: 'Browse millions of live articles with complete Reader Mode.',
    category: 'Reference',
  },
  {
    name: 'OpenStreetMap World',
    url: 'https://www.openstreetmap.org/export/embed.html?bbox=-0.15%2C51.50%2C-0.10%2C51.52&layer=mapnik',
    icon: '🗺️',
    desc: 'Live interactive world map and street explorer.',
    category: 'Maps',
  },
  {
    name: 'Hacker News Live',
    url: 'https://news.ycombinator.com',
    icon: '📰',
    desc: 'Real-time technology news, programming discussions, and startups.',
    category: 'News',
  },
  {
    name: 'Internet Archive',
    url: 'https://archive.org',
    icon: '📜',
    desc: 'Explore millions of free books, movies, software, and web history.',
    category: 'History',
  },
  {
    name: 'W3Schools Code Labs',
    url: 'https://www.w3schools.com',
    icon: '💻',
    desc: 'HTML, CSS, JavaScript, and web development documentation.',
    category: 'Education',
  },
];

export const GoogleChrome: React.FC<GoogleChromeProps> = ({
  onOpenApp,
  onSetWallpaper,
  initialUrl,
  initialQuery,
}) => {
  const [tabs, setTabs] = useState<ChromeTab[]>([
    {
      id: '1',
      title: initialQuery ? `${initialQuery} - Google Search` : 'New Tab',
      url: initialUrl || (initialQuery ? `https://www.google.com/search?q=${encodeURIComponent(initialQuery)}` : 'chrome://newtab'),
      favicon: '🌐',
      viewMode: initialQuery ? 'search' : 'home',
      searchQuery: initialQuery || '',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [addressBar, setAddressBar] = useState(initialQuery ? `https://www.google.com/search?q=${encodeURIComponent(initialQuery)}` : '');
  const [searchEngine, setSearchEngine] = useState<'google' | 'bing' | 'duckduckgo'>('google');
  const [searchFilter, setSearchFilter] = useState<'all' | 'articles' | 'images' | 'downloads' | 'json'>('all');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Search Results Cache / State
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);

  // Reader Mode Article State
  const [readerLoading, setReaderLoading] = useState(false);

  // Direct Downloader inputs (on downloads page)
  const [customDownloadUrl, setCustomDownloadUrl] = useState('');
  const [customFileName, setCustomFileName] = useState('');
  const [customFileContent, setCustomFileContent] = useState('');
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>(webSearchService.getDownloadHistory());

  // Active Downloads Shelf State
  const [activeDownloads, setActiveDownloads] = useState<ActiveDownloadItem[]>([]);

  const triggerDownloadApp = (app: DownloadableLaptopApp) => {
    soundManager.playClick();
    const downloadId = `dl_${Date.now()}`;
    const newDownload: ActiveDownloadItem = {
      id: downloadId,
      filename: app.filename,
      appId: app.appId,
      progress: 15,
      speed: '21.4 MB/s',
      totalSize: app.size,
      completed: false,
      timestamp: Date.now(),
    };

    setActiveDownloads((prev) => [newDownload, ...prev]);

    setTimeout(() => {
      setActiveDownloads((prev) =>
        prev.map((d) => (d.id === downloadId ? { ...d, progress: 65, speed: '28.2 MB/s' } : d))
      );
    }, 350);

    setTimeout(() => {
      setActiveDownloads((prev) =>
        prev.map((d) => (d.id === downloadId ? { ...d, progress: 100, completed: true } : d))
      );
      soundManager.playDing();
      webSearchService.downloadToWin11Storage(app.filename, `app:${app.appId}\nName=${app.name}\nSize=${app.size}`, 'sys', 'downloads');
      setDownloadToast(`Downloaded '${app.filename}' to Lenovo WinWeb 11 Pro Downloads!`);
      setDownloadHistory(webSearchService.getDownloadHistory());
      setTimeout(() => setDownloadToast(null), 3500);
    }, 800);
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // If initialQuery or search triggered
  useEffect(() => {
    if (activeTab.viewMode === 'search' && activeTab.searchQuery) {
      executeSearch(activeTab.searchQuery);
    }
  }, [activeTab.id, activeTab.searchQuery]);

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const resp = await webSearchService.search(query);
      setSearchResponse(resp);
    } catch (_) {
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenReader = async (title: string, url: string) => {
    soundManager.playClick();
    setReaderLoading(true);

    // Update active tab to reader mode
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: `${title} - Web Reader`,
              url,
              viewMode: 'reader',
              articleData: {
                title,
                content: 'Loading full article content from web source...',
                url,
              },
            }
          : t
      )
    );
    setAddressBar(url);

    try {
      const article = await webSearchService.fetchArticleDetails(title, url);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                articleData: article,
              }
            : t
        )
      );
    } catch (_) {
    } finally {
      setReaderLoading(false);
    }
  };

  const handleNavigate = (inputUrl: string, title?: string) => {
    soundManager.playClick();
    let url = inputUrl.trim();
    if (!url) return;

    let finalUrl = url;
    let viewMode: ChromeTab['viewMode'] = 'home';
    let displayTitle = title;
    let query = '';

    if (url === 'chrome://newtab' || url === 'https://www.google.com') {
      finalUrl = 'chrome://newtab';
      displayTitle = 'New Tab';
      viewMode = 'home';
    } else if (url === 'chrome://downloads') {
      finalUrl = 'chrome://downloads';
      displayTitle = 'Downloads';
      viewMode = 'downloads';
      setDownloadHistory(webSearchService.getDownloadHistory());
    } else if (url.startsWith('chrome://')) {
      finalUrl = url;
      viewMode = 'downloads';
    } else if (url.includes('google.com/search') || url.includes('duckduckgo.com/?q=') || url.includes('bing.com/search')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      query = params.get('q') || 'Windows 11';
      finalUrl = url;
      displayTitle = `${query} - Search`;
      viewMode = 'search';
      executeSearch(query);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it's a domain name or a search query
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`;
        displayTitle = url;
        // Check if Wikipedia or specific sites -> provide reader mode directly for great UX
        if (url.includes('wikipedia.org')) {
          const articleTitle = url.split('/wiki/')[1] ? decodeURIComponent(url.split('/wiki/')[1].replace(/_/g, ' ')) : 'Wikipedia';
          handleOpenReader(articleTitle, finalUrl);
          return;
        } else {
          viewMode = 'iframe';
        }
      } else {
        // It's a search query!
        query = url;
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        displayTitle = `${query} - Google Search`;
        viewMode = 'search';
        executeSearch(query);
      }
    } else {
      // Real HTTP/HTTPS URL
      finalUrl = url;
      if (url.includes('wikipedia.org/wiki/')) {
        const articleTitle = decodeURIComponent(url.split('/wiki/')[1].replace(/_/g, ' '));
        handleOpenReader(articleTitle, finalUrl);
        return;
      }
      viewMode = 'iframe';
      if (!displayTitle) {
        try {
          displayTitle = new URL(finalUrl).hostname;
        } catch (_) {
          displayTitle = finalUrl;
        }
      }
    }

    setAddressBar(finalUrl === 'chrome://newtab' ? '' : finalUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: finalUrl,
              title: displayTitle || 'Web Page',
              viewMode,
              searchQuery: query,
            }
          : t
      )
    );
  };

  const handleAddTab = () => {
    soundManager.playClick();
    const newId = String(Date.now());
    const newTab: ChromeTab = {
      id: newId,
      title: 'New Tab',
      url: 'chrome://newtab',
      favicon: '🌐',
      viewMode: 'home',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setAddressBar('');
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundManager.playClick();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      const nextActive = remaining[remaining.length - 1];
      setActiveTabId(nextActive.id);
      setAddressBar(nextActive.url === 'chrome://newtab' ? '' : nextActive.url);
    }
  };

  // Download Handlers
  const handleDownloadToWin11 = (
    fileName: string,
    content: string,
    type: 'txt' | 'png' | 'sys' = 'txt',
    targetFolder: string = 'downloads'
  ) => {
    const downloadId = `dl_${Date.now()}`;
    setActiveDownloads((prev) => [
      {
        id: downloadId,
        filename: fileName,
        progress: 100,
        speed: 'Completed',
        totalSize: `${Math.round(content.length / 1024) || 1} KB`,
        completed: true,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
    webSearchService.downloadToWin11Storage(fileName, content, type, targetFolder);
    setDownloadToast(`Saved '${fileName}' to Win11 ${targetFolder.toUpperCase()} folder!`);
    setDownloadHistory(webSearchService.getDownloadHistory());
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleDownloadToPC = (fileName: string, content: string, mimeType: string = 'text/plain') => {
    webSearchService.downloadToPhysicalComputer(fileName, content, mimeType);
    setDownloadToast(`Downloaded '${fileName}' to your computer's local disk!`);
    setDownloadHistory(webSearchService.getDownloadHistory());
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleDownloadBoth = (fileName: string, content: string, type: 'txt' | 'png' | 'sys' = 'txt') => {
    const downloadId = `dl_${Date.now()}`;
    setActiveDownloads((prev) => [
      {
        id: downloadId,
        filename: fileName,
        progress: 100,
        speed: 'Completed',
        totalSize: `${Math.round(content.length / 1024) || 1} KB`,
        completed: true,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
    webSearchService.downloadBoth(fileName, content, type);
    setDownloadToast(`Downloaded '${fileName}' to BOTH Win11 Storage & your PC!`);
    setDownloadHistory(webSearchService.getDownloadHistory());
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const handleOpenExternalTab = (targetUrl?: string) => {
    soundManager.playClick();
    const target = targetUrl || (activeTab.url.startsWith('http') ? activeTab.url : 'https://www.google.com');
    try {
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  return (
    <div className="flex flex-col h-full bg-[#dee1e6] dark:bg-[#202124] text-neutral-800 dark:text-neutral-100 select-none font-sans overflow-hidden">
      {/* Chrome Tab Strip */}
      <div className="flex items-center px-2 pt-2 bg-[#dfe1e5] dark:bg-[#1f1f1f] border-b border-neutral-300 dark:border-neutral-800 space-x-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTabId(tab.id);
                setAddressBar(tab.url === 'chrome://newtab' ? '' : tab.url);
              }}
              className={`group relative flex items-center max-w-[210px] min-w-[130px] h-8 px-3 rounded-t-lg text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#292a2d] text-neutral-900 dark:text-white shadow-sm font-medium'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
              }`}
            >
              <span className="mr-2 text-sm">{tab.favicon || '🌐'}</span>
              <span className="truncate flex-1 text-[11px]">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-700 ml-1 transition"
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={handleAddTab}
          className="p-1 rounded-full text-neutral-600 dark:text-neutral-400 hover:bg-neutral-300/60 dark:hover:bg-neutral-800 transition"
          title="New Tab (Ctrl+T)"
        >
          <Plus size={16} />
        </button>

        {/* Status Indicators */}
        <div className="ml-auto flex items-center space-x-2 pr-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30 flex items-center space-x-1">
            <Download size={11} />
            <span>UNIVERSAL DOWNLOADER</span>
          </span>
          <span className="flex items-center text-emerald-500 space-x-1 font-medium hidden sm:flex">
            <Wifi size={12} />
            <span>Online</span>
          </span>
        </div>
      </div>

      {/* Chrome Navigation & Omnibox */}
      <div className="flex items-center px-3 py-1.5 bg-white dark:bg-[#292a2d] border-b border-neutral-200 dark:border-neutral-800 space-x-2">
        <div className="flex items-center space-x-1 text-neutral-600 dark:text-neutral-300">
          <button
            onClick={() => handleNavigate('chrome://newtab')}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"
            title="Back to Home"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              if (activeTab.viewMode === 'search' && activeTab.searchQuery) {
                executeSearch(activeTab.searchQuery);
              } else {
                setIframeKey((k) => k + 1);
              }
            }}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"
            title="Reload Page"
          >
            <RotateCw size={14} className={searchLoading ? 'animate-spin text-blue-500' : ''} />
          </button>
          <button
            onClick={() => handleNavigate('chrome://newtab', 'New Tab')}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"
            title="Chrome Homepage"
          >
            <Home size={14} />
          </button>
        </div>

        {/* Omnibox / Search & Download URL input */}
        <div className="flex-1 flex items-center bg-[#f1f3f4] dark:bg-[#202124] hover:bg-[#e8eaed] dark:hover:bg-[#1a1a1c] border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-[#202124] rounded-full px-3.5 py-1 space-x-2 transition-all shadow-inner">
          <Search size={14} className="text-blue-500 shrink-0" />
          <input
            type="text"
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNavigate(addressBar);
            }}
            placeholder="Search the web for anything, enter URL, or download files..."
            className="w-full bg-transparent text-xs text-neutral-800 dark:text-neutral-100 outline-none"
          />

          {/* Quick Go / Search button */}
          <button
            onClick={() => handleNavigate(addressBar)}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[11px] font-semibold transition"
          >
            Go
          </button>

          {/* Open in native browser tab */}
          <button
            onClick={() => handleOpenExternalTab()}
            className="p-1 text-neutral-400 hover:text-blue-500 transition"
            title="Open in Native Browser Tab"
          >
            <ExternalLink size={13} />
          </button>

          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-1 rounded transition ${isBookmarked ? 'text-amber-500' : 'text-neutral-400 hover:text-neutral-600'}`}
            title="Bookmark this page"
          >
            <Star size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Downloads & Profile Toolbar */}
        <div className="flex items-center space-x-1.5 relative">
          <button
            onClick={() => handleNavigate('chrome://downloads', 'Downloads Manager')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
              activeTab.viewMode === 'downloads'
                ? 'bg-blue-600 text-white shadow'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
            title="View Downloads Center (Win11 OS & Local Disk)"
          >
            <Download size={14} />
            <span className="hidden md:inline">Downloads</span>
            {downloadHistory.length > 0 && (
              <span className="w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {downloadHistory.length}
              </span>
            )}
          </button>

          <div
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
            title="Win11 Chrome User"
          >
            W
          </div>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"
          >
            <MoreVertical size={15} />
          </button>

          {/* Chrome Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-9 w-60 bg-white dark:bg-[#28292c] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 text-[10px] text-neutral-400 uppercase tracking-wider font-semibold border-b dark:border-neutral-700">
                Google Chrome Web &amp; Downloads
              </div>
              <button
                onClick={() => {
                  handleAddTab();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-between"
              >
                <span>New tab</span>
                <span className="text-neutral-400 font-mono text-[10px]">Ctrl+T</span>
              </button>
              <button
                onClick={() => {
                  handleNavigate('chrome://downloads');
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-between text-blue-500 font-medium"
              >
                <div className="flex items-center space-x-2">
                  <Download size={13} />
                  <span>Downloads Manager</span>
                </div>
                <span className="text-neutral-400 font-mono text-[10px]">Ctrl+J</span>
              </button>
              <button
                onClick={() => {
                  if (onOpenApp) onOpenApp('explorer', { folderId: 'downloads' });
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
              >
                <Folder size={13} className="text-amber-500" />
                <span>Open Win11 Downloads Folder</span>
              </button>
              <button
                onClick={() => {
                  handleOpenExternalTab();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center justify-between"
              >
                <span>Open in native browser</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bookmarks & Quick Navigation Bar */}
      <div className="flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-[#292a2d] border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleNavigate('chrome://newtab', 'Google')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition shrink-0"
        >
          <span>🔍 Web Search</span>
        </button>
        <button
          onClick={() => handleNavigate('chrome://downloads', 'Downloads Manager')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition text-blue-500 font-medium shrink-0"
        >
          <Download size={12} />
          <span>Universal Downloader</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Artificial_intelligence', 'Artificial Intelligence')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition text-indigo-500 shrink-0"
        >
          <span>🤖 AI &amp; Tech</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/React_(software)', 'React.js')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition text-cyan-500 shrink-0"
        >
          <span>⚛️ React.js</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Python_(programming_language)', 'Python')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition text-emerald-500 shrink-0"
        >
          <span>🐍 Python</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Quantum_computing', 'Quantum Computing')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition text-purple-500 shrink-0"
        >
          <span>🔬 Quantum</span>
        </button>
        <button
          onClick={() => handleNavigate('https://news.ycombinator.com', 'Hacker News')}
          className="flex items-center space-x-1 px-2 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition shrink-0"
        >
          <span>📰 Hacker News</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#202124] text-neutral-800 dark:text-neutral-100 relative flex flex-col select-text">
        {/* Download Success Notification Toast */}
        {downloadToast && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/95 text-white border border-white/20 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">{downloadToast}</div>
              <div className="text-[11px] text-neutral-400">Available in Win11 Downloads folder &amp; your PC</div>
            </div>
            {onOpenApp && (
              <button
                onClick={() => onOpenApp('explorer', { folderId: 'downloads' })}
                className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition"
              >
                View in Explorer
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: SEARCH RESULTS PAGE (SEARCH ANYTHING ON THE WEB)  */}
        {/* ========================================================= */}
        {activeTab.viewMode === 'search' ? (
          <div className="flex-1 flex flex-col">
            {/* Top Search Subheader & Filter Tabs */}
            <div className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-[#fafafa] dark:bg-[#252629] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-4">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
                  Google
                </span>

                {/* Filter Tabs */}
                <div className="flex space-x-1 text-xs">
                  {[
                    { id: 'all', label: 'All Results' },
                    { id: 'articles', label: 'Articles & Reader' },
                    { id: 'images', label: 'Images & Wallpapers' },
                    { id: 'downloads', label: 'Downloadable Assets' },
                    { id: 'json', label: 'Raw Data (JSON)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSearchFilter(f.id as any)}
                      className={`px-3 py-1 rounded-full font-medium transition ${
                        searchFilter === f.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick 1-Click Topic Downloader Banner */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const q = activeTab.searchQuery || 'Web_Topic';
                    const summary = searchResponse?.knowledge?.description || `Research notes on ${q}`;
                    handleDownloadBoth(`${q.replace(/ /g, '_')}_Research.txt`, summary, 'txt');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition"
                  title="Download complete research notes to Win11 OS and your PC"
                >
                  <Download size={13} />
                  <span>Download Research Summary</span>
                </button>
              </div>
            </div>

            {/* Results Content Area */}
            <div className="max-w-6xl mx-auto w-full p-6 flex-1">
              {searchLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <RotateCw size={36} className="text-blue-500 animate-spin" />
                  <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Searching the web for "{activeTab.searchQuery}"...
                  </div>
                  <div className="text-xs text-neutral-400">Querying live Wikipedia, Web Index, and Downloads packages</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Search Results */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Query stats */}
                    <div className="text-xs text-neutral-500">
                      Found {(searchResponse?.results.length || 0) * 120} results for &ldquo;{activeTab.searchQuery}&rdquo; • Live Web Search Active
                    </div>

                    {/* Filter: All or Articles */}
                    {(searchFilter === 'all' || searchFilter === 'articles') && (
                      <div className="space-y-6">
                        {searchResponse?.results.map((res) => (
                          <div
                            key={res.id}
                            className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/70 hover:border-blue-400 dark:hover:border-blue-500 transition group shadow-sm"
                          >
                            <div className="flex items-center space-x-2 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold">
                                {res.source === 'wikipedia' ? 'W' : res.source === 'news' ? 'Y' : '🌐'}
                              </span>
                              <span className="truncate">{res.displayUrl}</span>
                              {res.date && <span>• {res.date}</span>}
                            </div>

                            <h3
                              onClick={() => handleOpenReader(res.title, res.url)}
                              className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center justify-between"
                            >
                              <span>{res.title}</span>
                              <span className="text-[11px] text-neutral-400 font-normal group-hover:text-blue-500 flex items-center space-x-1">
                                <BookOpen size={13} />
                                <span>Reader Mode</span>
                              </span>
                            </h3>

                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mt-1.5">
                              {res.snippet}
                            </p>

                            {/* Action Buttons for this result */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 mt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                              <button
                                onClick={() => handleOpenReader(res.title, res.url)}
                                className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                              >
                                <BookOpen size={12} />
                                <span>Read Full Article</span>
                              </button>

                              <button
                                onClick={() => {
                                  const fname = `${res.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
                                  handleDownloadToWin11(fname, `Title: ${res.title}\nURL: ${res.url}\n\nSummary:\n${res.snippet}\n\nFull reference indexed by Win11 Web OS.`, 'txt');
                                }}
                                className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                                title="Save summary to Win11 Downloads"
                              >
                                <Download size={12} />
                                <span>Save to Win11</span>
                              </button>

                              <button
                                onClick={() => {
                                  const fname = `${res.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
                                  handleDownloadToPC(fname, `Title: ${res.title}\nURL: ${res.url}\n\nSummary:\n${res.snippet}`);
                                }}
                                className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                                title="Download to your PC local disk"
                              >
                                <HardDrive size={12} />
                                <span>Save to PC</span>
                              </button>

                              <button
                                onClick={() => handleOpenExternalTab(res.url)}
                                className="px-2.5 py-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-white rounded-lg text-xs flex items-center space-x-1 transition ml-auto"
                                title="Open this original web link in your actual browser tab"
                              >
                                <span>Native Tab</span>
                                <ExternalLink size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Filter: Downloadable Assets */}
                    {(searchFilter === 'all' || searchFilter === 'downloads') && (
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b pb-2 dark:border-neutral-700">
                          <h4 className="text-sm font-bold flex items-center space-x-2 text-neutral-800 dark:text-neutral-200">
                            <Download size={16} className="text-emerald-500" />
                            <span>Download Packages Generated for "{activeTab.searchQuery}"</span>
                          </h4>
                          <span className="text-[11px] text-neutral-400">1-Click Save to Win11 OS or PC</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {searchResponse?.downloadablePacks.map((pack) => (
                            <div
                              key={pack.filename}
                              className="p-3.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl flex flex-col justify-between space-y-2 shadow-sm"
                            >
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate">
                                    {pack.title}
                                  </span>
                                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">
                                    {pack.filename.split('.').pop()}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                                  {pack.filename} • {pack.size}
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                                  {pack.description}
                                </p>
                              </div>

                              <div className="flex items-center space-x-2 pt-2 border-t dark:border-neutral-700/60">
                                <button
                                  onClick={() => handleDownloadToWin11(pack.filename, pack.content, pack.type as any)}
                                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow transition"
                                >
                                  <Download size={12} />
                                  <span>Win11 OS</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadToPC(pack.filename, pack.content)}
                                  className="flex-1 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition"
                                >
                                  <HardDrive size={12} />
                                  <span>Save to PC</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filter: Images & Wallpapers */}
                    {(searchFilter === 'all' || searchFilter === 'images') && (
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between border-b pb-2 dark:border-neutral-700">
                          <h4 className="text-sm font-bold flex items-center space-x-2 text-neutral-800 dark:text-neutral-200">
                            <ImageIcon size={16} className="text-purple-500" />
                            <span>Related Web Images &amp; Wallpapers</span>
                          </h4>
                          <span className="text-[11px] text-neutral-400">Click to Download or Set as Wallpaper</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {searchResponse?.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="group relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-900 shadow-sm"
                            >
                              <img
                                src={img.url}
                                alt={img.title}
                                className="w-full h-32 object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="p-2 bg-neutral-50 dark:bg-neutral-800">
                                <div className="text-[11px] font-semibold truncate text-neutral-800 dark:text-neutral-200">
                                  {img.title}
                                </div>
                                <div className="flex items-center space-x-1 mt-1.5">
                                  <button
                                    onClick={() => handleDownloadToWin11(img.downloadName, img.url, 'png', 'pictures')}
                                    className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-medium transition"
                                    title="Download image to Win11 Pictures folder"
                                  >
                                    Save Image
                                  </button>
                                  {onSetWallpaper && (
                                    <button
                                      onClick={() => {
                                        soundManager.playClick();
                                        onSetWallpaper(img.url);
                                        setDownloadToast('Set image as Windows 11 Desktop Wallpaper!');
                                        setTimeout(() => setDownloadToast(null), 3000);
                                      }}
                                      className="p-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded text-neutral-700 dark:text-neutral-200 transition"
                                      title="Set as Desktop Wallpaper"
                                    >
                                      <Monitor size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filter: JSON Data */}
                    {searchFilter === 'json' && (
                      <div className="bg-[#1e1e1e] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 text-white">
                          <span>Raw Search Payload</span>
                          <button
                            onClick={() => {
                              const jsonStr = JSON.stringify(searchResponse, null, 2);
                              handleDownloadBoth(`${activeTab.searchQuery || 'data'}_data.json`, jsonStr, 'txt');
                            }}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Download JSON
                          </button>
                        </div>
                        <pre>{JSON.stringify(searchResponse, null, 2)}</pre>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Knowledge Graph Card */}
                  <div className="space-y-4">
                    {searchResponse?.knowledge ? (
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
                        {searchResponse.knowledge.imageUrl && (
                          <div className="w-full h-44 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                            <img
                              src={searchResponse.knowledge.imageUrl}
                              alt={searchResponse.knowledge.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div>
                          <div className="text-[11px] text-blue-500 font-semibold uppercase tracking-wider">
                            Knowledge Card
                          </div>
                          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                            {searchResponse.knowledge.title}
                          </h2>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {searchResponse.knowledge.subtitle}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {searchResponse.knowledge.description}
                        </p>

                        {/* Quick Facts */}
                        <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                          {searchResponse.knowledge.facts.map((fact) => (
                            <div key={fact.label} className="flex justify-between text-xs">
                              <span className="text-neutral-500">{fact.label}</span>
                              <span className="font-medium text-neutral-800 dark:text-neutral-200 text-right max-w-[180px] truncate">
                                {fact.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Knowledge Card Download Actions */}
                        <div className="pt-2 flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              const k = searchResponse.knowledge!;
                              const text = `Topic: ${k.title}\nSubtitle: ${k.subtitle}\n\n${k.description}\n\nFacts:\n${k.facts.map((f) => `- ${f.label}: ${f.value}`).join('\n')}\n\nURL: ${k.wikiUrl || ''}`;
                              handleDownloadBoth(`${k.title.replace(/ /g, '_')}_Factsheet.txt`, text, 'txt');
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center space-x-1.5 transition"
                          >
                            <Download size={13} />
                            <span>Download Topic Factsheet</span>
                          </button>

                          {searchResponse.knowledge.wikiUrl && (
                            <button
                              onClick={() => handleOpenReader(searchResponse.knowledge!.title, searchResponse.knowledge!.wikiUrl!)}
                              className="w-full py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-800 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                            >
                              <BookOpen size={13} />
                              <span>Read Full Article in Reader Mode</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs space-y-2">
                        <div className="font-semibold text-neutral-700 dark:text-neutral-200">
                          Search Tips
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                          You can search literally any topic, language, historical event, or question. Every search automatically builds ready-to-download research documents, markdown notes, and offline archives!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab.viewMode === 'reader' ? (
          /* ========================================================= */
          /* VIEW 2: ARTICLE READER MODE (BYPASSES IFRAME BLOCKING!)  */
          /* ========================================================= */
          <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-[#18181b]">
            {/* Top Reader Action Bar */}
            <div className="px-6 py-2.5 bg-white dark:bg-[#202024] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs sticky top-0 z-30 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                  Reader View (No IFrame Restriction)
                </span>
                <span className="text-neutral-400 truncate max-w-sm font-mono text-[11px]">
                  {activeTab.url}
                </span>
              </div>

              {/* Reader Action Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const title = activeTab.articleData?.title || 'Article';
                    const content = activeTab.articleData?.content || '';
                    handleDownloadToWin11(`${title.replace(/ /g, '_')}.txt`, content, 'txt');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow"
                  title="Save article text to Win11 Downloads"
                >
                  <Download size={13} />
                  <span>Save to Win11</span>
                </button>

                <button
                  onClick={() => {
                    const title = activeTab.articleData?.title || 'Article';
                    const content = activeTab.articleData?.content || '';
                    handleDownloadToPC(`${title.replace(/ /g, '_')}.txt`, content);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow"
                  title="Download article directly to your computer disk"
                >
                  <HardDrive size={13} />
                  <span>Download to PC</span>
                </button>

                <button
                  onClick={() => {
                    // Toggle to iframe view
                    setTabs((prev) =>
                      prev.map((t) => (t.id === activeTabId ? { ...t, viewMode: 'iframe' } : t))
                    );
                  }}
                  className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-medium transition"
                  title="Switch to original Iframe view"
                >
                  Switch to IFrame
                </button>

                <button
                  onClick={() => handleOpenExternalTab(activeTab.url)}
                  className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-medium flex items-center space-x-1 transition"
                  title="Open in native browser tab"
                >
                  <span>Native Tab</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Reader Content Area */}
            <div className="max-w-4xl mx-auto w-full p-8 space-y-6">
              {readerLoading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-3">
                  <RotateCw size={36} className="text-blue-500 animate-spin" />
                  <div className="text-sm font-semibold">Formatting page for distraction-free reading...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Hero image if present */}
                  {activeTab.articleData?.imageUrl && (
                    <div className="w-full h-72 rounded-2xl overflow-hidden bg-neutral-900 shadow-md">
                      <img
                        src={activeTab.articleData.imageUrl}
                        alt="Hero"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="border-b pb-4 dark:border-neutral-800">
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                      Web Reader Mode
                    </span>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                      {activeTab.articleData?.title || activeTab.title}
                    </h1>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center space-x-2">
                      <span>Live Extracted Document</span>
                      <span>•</span>
                      <span>Verified Win11 Safe</span>
                    </div>
                  </div>

                  {/* Formatted Article Body */}
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap space-y-4">
                    {activeTab.articleData?.content}
                  </div>

                  {/* Article Footer Download Bar */}
                  <div className="mt-12 p-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">Save this document offline</h4>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Download full text to your Win11 storage or your real device for offline access.
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const t = activeTab.articleData?.title || 'Doc';
                          const c = activeTab.articleData?.content || '';
                          handleDownloadBoth(`${t.replace(/ /g, '_')}.txt`, c, 'txt');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5 transition"
                      >
                        <Download size={14} />
                        <span>Download Everything</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab.viewMode === 'iframe' ? (
          /* ========================================================= */
          /* VIEW 3: LIVE IFRAME EMBED (WITH HELPER TO BYPASS BLOCKS) */
          /* ========================================================= */
          <div className="flex-1 flex flex-col h-full bg-neutral-900">
            {/* Live Web Top Information Bar */}
            <div className="px-4 py-2 bg-neutral-800/95 text-white border-b border-neutral-700 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-neutral-200">Embedded Web View:</span>
                <span className="font-mono text-neutral-400 truncate max-w-md">{activeTab.url}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleOpenReader(activeTab.title, activeTab.url)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold transition"
                  title="If the site refuses to connect inside iframe, click here for clean Reader Mode"
                >
                  <BookOpen size={12} />
                  <span>Reader Mode</span>
                </button>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition"
                  title="Reload IFrame"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => handleOpenExternalTab(activeTab.url)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold transition"
                  title="Open this URL in your native browser tab"
                >
                  <span>Open in Real Tab</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Embedded Live Web Frame */}
            <div className="flex-1 relative">
              <iframe
                key={iframeKey}
                src={activeTab.url}
                title={activeTab.title}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              />
            </div>
          </div>
        ) : activeTab.viewMode === 'downloads' ? (
          /* ========================================================= */
          /* VIEW 4: CHROME DOWNLOADS MANAGER (UNIVERSAL DOWNLOADER)   */
          /* ========================================================= */
          <div className="max-w-5xl mx-auto w-full p-6 space-y-6 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b dark:border-neutral-700 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                  <Download size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Chrome Universal Downloader Center
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Download anything from the web to Win11 Storage or your real computer disk
                  </p>
                </div>
              </div>

              {onOpenApp && (
                <button
                  onClick={() => onOpenApp('explorer', { folderId: 'downloads' })}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold transition"
                >
                  <Folder size={14} className="text-amber-500" />
                  <span>Open Downloads Folder</span>
                </button>
              )}
            </div>

            {/* Laptop Apps Download Repository */}
            <BrowserAppDownloadHub
              onStartDownload={triggerDownloadApp}
              onOpenApp={onOpenApp}
            />

            {/* Direct URL Downloader Tool */}
            <div className="p-5 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FileDown size={16} className="text-blue-400" />
                  <span>Direct URL Web Downloader</span>
                </h3>
                <span className="text-[11px] text-blue-200">Paste any file or image URL to download</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDownloadUrl}
                  onChange={(e) => setCustomDownloadUrl(e.target.value)}
                  placeholder="https://example.com/file.txt or image URL..."
                  className="flex-1 bg-black/40 border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 outline-none"
                />
                <button
                  onClick={() => {
                    if (!customDownloadUrl.trim()) return;
                    const url = customDownloadUrl.trim();
                    const fname = url.split('/').pop()?.split('?')[0] || `Downloaded_${Date.now()}.txt`;
                    handleDownloadBoth(fname, url, 'txt');
                    setCustomDownloadUrl('');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5 transition shrink-0"
                >
                  <Download size={14} />
                  <span>Download Now</span>
                </button>
              </div>
            </div>

            {/* Custom File Generator & Downloader */}
            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center space-x-2">
                <FileText size={16} className="text-emerald-500" />
                <span>Create &amp; Download Custom File</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Filename (e.g. notes.txt, script.py, data.csv)"
                  className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs outline-none"
                />
                <div className="md:col-span-2 flex space-x-2">
                  <input
                    type="text"
                    value={customFileContent}
                    onChange={(e) => setCustomFileContent(e.target.value)}
                    placeholder="Content or text to save..."
                    className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!customFileName.trim()) return;
                      handleDownloadBoth(customFileName.trim(), customFileContent || 'Custom File', 'txt');
                      setCustomFileName('');
                      setCustomFileContent('');
                    }}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow transition shrink-0"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Download History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Download History ({downloadHistory.length})
                </h3>
                {downloadHistory.length > 0 && (
                  <button
                    onClick={() => {
                      webSearchService.clearDownloadHistory();
                      setDownloadHistory([]);
                    }}
                    className="text-xs text-neutral-400 hover:text-red-400 transition"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {downloadHistory.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
                  No recent downloads yet. Search any topic or click download on any webpage to save files!
                </div>
              ) : (
                <div className="space-y-2">
                  {downloadHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                          📄
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                            {item.filename}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {item.size} • {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => {
                            if (onOpenApp) onOpenApp('explorer', { folderId: 'downloads' });
                          }}
                          className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-xs font-medium transition"
                        >
                          Show in Folder
                        </button>
                        <button
                          onClick={() => handleDownloadToPC(item.filename, `Exported from Win11: ${item.filename}`)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                          title="Save to your real PC"
                        >
                          <HardDrive size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 5: REAL GOOGLE CHROME HOMEPAGE & SEARCH             */
          /* ========================================================= */
          <GoogleChromeHome
            onNavigate={handleNavigate}
            onOpenDownloads={() => handleNavigate('chrome://downloads', 'Downloads Manager')}
            onOpenApp={onOpenApp}
          />
        )}

        {/* Active Real-time Downloads Shelf */}
        <BrowserDownloadShelf
          downloads={activeDownloads}
          onOpenApp={onOpenApp}
          onCloseDownload={(id) => setActiveDownloads((prev) => prev.filter((d) => d.id !== id))}
          onClearAll={() => setActiveDownloads([])}
        />

        {/* Bottom Status Bar */}
        <div className="px-4 py-1.5 bg-[#f1f3f4] dark:bg-[#1a1a1c] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0 select-none">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck size={13} />
              <span>Universal Web Search &amp; Downloader</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Win11 Virtual OS Subsystem</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleNavigate('chrome://downloads')}
              className="hover:text-blue-500 transition font-medium flex items-center space-x-1"
            >
              <Download size={11} />
              <span>Downloads Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
