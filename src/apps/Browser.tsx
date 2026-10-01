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
  Globe,
  ExternalLink,
  Download,
  Check,
  FileDown,
  Layers,
  Sparkles,
  BookOpen,
  Folder,
  HardDrive,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { AppId } from '../types/os';
import {
  webSearchService,
  SearchResponse,
  SearchResultItem,
  DownloadHistoryItem,
} from '../services/webSearchService';
import { WindowsStartPage } from '../components/WindowsStartPage';
import { BrowserDownloadShelf, ActiveDownloadItem } from '../components/BrowserDownloadShelf';
import { BrowserAppDownloadHub } from '../components/BrowserAppDownloadHub';
import { LAPTOP_DOWNLOADABLE_APPS, DownloadableLaptopApp } from '../services/downloadCenter';

interface EdgeTab {
  id: string;
  title: string;
  url: string;
  viewMode: 'start' | 'search' | 'reader' | 'iframe' | 'downloads';
  searchQuery?: string;
  articleData?: {
    title: string;
    content: string;
    url: string;
    imageUrl?: string;
  };
}

interface BrowserProps {
  onOpenApp?: (appId: AppId, data?: any) => void;
  initialUrl?: string;
  initialQuery?: string;
}

export const Browser: React.FC<BrowserProps> = ({
  onOpenApp,
  initialUrl,
  initialQuery,
}) => {
  const [tabs, setTabs] = useState<EdgeTab[]>([
    {
      id: '1',
      title: initialQuery ? `${initialQuery} - Bing Search` : 'Edge Start',
      url: initialUrl || (initialQuery ? `https://bing.com/search?q=${encodeURIComponent(initialQuery)}` : 'edge://start'),
      viewMode: initialQuery ? 'search' : 'start',
      searchQuery: initialQuery || '',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [addressBar, setAddressBar] = useState(
    initialQuery ? `https://bing.com/search?q=${encodeURIComponent(initialQuery)}` : 'https://downloads.win11.os'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'articles' | 'images' | 'downloads'>('all');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Custom download tool inputs
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
      speed: '22.0 MB/s',
      totalSize: app.size,
      completed: false,
      timestamp: Date.now(),
    };

    setActiveDownloads((prev) => [newDownload, ...prev]);

    setTimeout(() => {
      setActiveDownloads((prev) =>
        prev.map((d) => (d.id === downloadId ? { ...d, progress: 65, speed: '26.8 MB/s' } : d))
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

  useEffect(() => {
    if (activeTab.viewMode === 'search' && activeTab.searchQuery) {
      executeSearch(activeTab.searchQuery);
    }
  }, [activeTab.id, activeTab.searchQuery]);

  const executeSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    try {
      const resp = await webSearchService.search(q);
      setSearchResponse(resp);
    } catch (_) {
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOpenReader = async (title: string, url: string) => {
    soundManager.playClick();
    setReaderLoading(true);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: `${title} - Reader View`,
              url,
              viewMode: 'reader',
              articleData: {
                title,
                content: 'Loading clean reader view...',
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
    let viewMode: EdgeTab['viewMode'] = 'start';
    let displayTitle = title;
    let query = '';

    if (url === 'edge://start' || url === 'https://start.web') {
      finalUrl = 'edge://start';
      displayTitle = 'Edge Start';
      viewMode = 'start';
    } else if (url === 'edge://downloads' || url.includes('downloads.win11.os')) {
      finalUrl = 'edge://downloads';
      displayTitle = 'Downloads Center';
      viewMode = 'downloads';
      setDownloadHistory(webSearchService.getDownloadHistory());
    } else if (url.includes('bing.com/search') || url.includes('search?q=')) {
      const params = new URLSearchParams(url.split('?')[1] || '');
      query = params.get('q') || 'Windows 11';
      finalUrl = url;
      displayTitle = `${query} - Bing Search`;
      viewMode = 'search';
      executeSearch(query);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`;
        displayTitle = url;
        if (url.includes('wikipedia.org')) {
          const articleTitle = url.split('/wiki/')[1] ? decodeURIComponent(url.split('/wiki/')[1].replace(/_/g, ' ')) : 'Wikipedia';
          handleOpenReader(articleTitle, finalUrl);
          return;
        } else {
          viewMode = 'iframe';
        }
      } else {
        query = url;
        finalUrl = `https://bing.com/search?q=${encodeURIComponent(query)}`;
        displayTitle = `${query} - Bing`;
        viewMode = 'search';
        executeSearch(query);
      }
    } else {
      finalUrl = url;
      if (url.includes('wikipedia.org/wiki/')) {
        const articleTitle = decodeURIComponent(url.split('/wiki/')[1].replace(/_/g, ' '));
        handleOpenReader(articleTitle, finalUrl);
        return;
      }
      viewMode = 'iframe';
      displayTitle = title || finalUrl.replace(/^https?:\/\//, '').split('/')[0];
    }

    setAddressBar(finalUrl);
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
    const newTab: EdgeTab = {
      id: newId,
      title: 'New Tab',
      url: 'edge://start',
      viewMode: 'start',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setAddressBar('edge://start');
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundManager.playClick();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      const next = remaining[remaining.length - 1];
      setActiveTabId(next.id);
      setAddressBar(next.url);
    }
  };

  const handleDownloadFile = (fileName: string, content: string, type: 'txt' | 'png' | 'sys' = 'txt') => {
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
    webSearchService.downloadToWin11Storage(fileName, content, type, 'downloads');
    setDownloadToast(`Saved '${fileName}' to Win11 Downloads folder!`);
    setDownloadHistory(webSearchService.getDownloadHistory());
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const handleDownloadToPC = (fileName: string, content: string) => {
    webSearchService.downloadToPhysicalComputer(fileName, content);
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
    setDownloadToast(`Downloaded '${fileName}' to Win11 OS & Local PC!`);
    setDownloadHistory(webSearchService.getDownloadHistory());
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const handleOpenExternalTab = (url?: string) => {
    soundManager.playClick();
    const target = url || (activeTab.url.startsWith('http') ? activeTab.url : 'https://www.bing.com');
    try {
      window.open(target, '_blank', 'noopener,noreferrer');
    } catch (_) {}
  };

  return (
    <div className="flex flex-col h-full bg-[#1f1f1f] text-white select-none">
      {/* Edge Tab Bar */}
      <div className="flex items-center px-2 pt-1 bg-[#181818] border-b border-white/5 space-x-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setAddressBar(tab.url);
                soundManager.playClick();
              }}
              className={`group max-w-[210px] min-w-[130px] flex items-center justify-between px-3 py-1.5 rounded-t-lg text-xs cursor-pointer transition ${
                isActive
                  ? 'bg-[#292929] text-white shadow-sm font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 truncate pr-1">
                <Globe size={13} className="text-blue-400 shrink-0" />
                <span className="truncate">{tab.title}</span>
              </div>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-white/20 p-0.5 rounded text-white/70 transition"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={handleAddTab}
          className="p-1.5 hover:bg-white/10 rounded-md text-white/70 hover:text-white transition"
          title="New Tab"
        >
          <Plus size={14} />
        </button>

        <div className="ml-auto flex items-center space-x-2 pr-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
            MICROSOFT EDGE
          </span>
        </div>
      </div>

      {/* Navigation & Address Bar */}
      <div className="flex items-center px-3 py-2 bg-[#292929] border-b border-white/10 space-x-2">
        <div className="flex items-center space-x-1 text-white/70">
          <button
            onClick={() => handleNavigate('edge://start')}
            className="p-1.5 hover:bg-white/10 rounded hover:text-white"
            title="Back to Start"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            onClick={() => {
              if (activeTab.viewMode === 'search' && activeTab.searchQuery) {
                executeSearch(activeTab.searchQuery);
              } else {
                setIframeKey((k) => k + 1);
              }
            }}
            className="p-1.5 hover:bg-white/10 rounded hover:text-white"
            title="Refresh"
          >
            <RotateCw size={14} className={searchLoading ? 'animate-spin text-blue-400' : ''} />
          </button>
          <button
            onClick={() => handleNavigate('edge://start', 'Edge Start')}
            className="p-1.5 hover:bg-white/10 rounded hover:text-white"
            title="Home"
          >
            <Home size={15} />
          </button>
        </div>

        {/* URL Input */}
        <div className="flex-1 flex items-center bg-[#1e1e1e] border border-white/10 focus-within:border-blue-500 rounded-full px-3 py-1 space-x-2 shadow-inner">
          <Lock size={12} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNavigate(addressBar);
            }}
            className="w-full bg-transparent text-xs text-white/90 outline-none font-sans"
            placeholder="Search the web for anything, enter URL, or download files..."
          />
          <button
            onClick={() => handleNavigate(addressBar)}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-semibold"
          >
            Go
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-1 rounded transition ${isBookmarked ? 'text-yellow-400' : 'text-white/40 hover:text-white'}`}
          >
            <Star size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Downloads Center Button */}
        <button
          onClick={() => handleNavigate('edge://downloads', 'Downloads Center')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            activeTab.viewMode === 'downloads'
              ? 'bg-blue-600 text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
          title="Edge Universal Downloads Center"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Downloads</span>
          {downloadHistory.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
              {downloadHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center space-x-2 px-3 py-1 bg-[#232323] border-b border-white/10 text-xs text-white/70 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleNavigate('edge://downloads', 'Downloads & Software Center')}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-white/10 rounded text-blue-400 font-medium shrink-0"
        >
          <FileDown size={13} />
          <span>Win11 Download Center</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Microsoft_Windows', 'Windows - Wikipedia')}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-white/10 rounded shrink-0"
        >
          <span>🌐 Wikipedia</span>
        </button>
        <button
          onClick={() => handleNavigate('https://news.ycombinator.com', 'Hacker News')}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-white/10 rounded shrink-0"
        >
          <span>📰 Tech News</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/Artificial_intelligence', 'AI Research')}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-white/10 rounded text-indigo-400 shrink-0"
        >
          <span>🤖 AI Hub</span>
        </button>
        <button
          onClick={() => handleNavigate('https://en.wikipedia.org/wiki/WebAssembly', 'WebAssembly')}
          className="flex items-center space-x-1.5 px-2 py-0.5 hover:bg-white/10 rounded text-emerald-400 shrink-0"
        >
          <span>⚡ WebAssembly</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-white text-gray-900 select-text p-6 relative">
        {/* Download Success Notification Toast */}
        {downloadToast && (
          <div className="sticky top-0 mb-4 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs font-medium z-30 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check size={16} />
              <span>{downloadToast}</span>
            </div>
            {onOpenApp && (
              <button
                onClick={() => onOpenApp('explorer', { folderId: 'downloads' })}
                className="text-white underline font-semibold text-xs ml-3"
              >
                Open in Explorer
              </button>
            )}
          </div>
        )}

        {/* View 1: Search Results */}
        {activeTab.viewMode === 'search' ? (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-blue-600">Bing Search</span>
                <span className="text-xs text-gray-500">Live Web Results for &ldquo;{activeTab.searchQuery}&rdquo;</span>
              </div>
              <button
                onClick={() => {
                  const q = activeTab.searchQuery || 'Search_Results';
                  const sum = searchResponse?.knowledge?.description || `Summary for ${q}`;
                  handleDownloadBoth(`${q.replace(/ /g, '_')}_Summary.txt`, sum, 'txt');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow"
              >
                <Download size={13} />
                <span>Download Search Summary</span>
              </button>
            </div>

            {searchLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-2">
                <RotateCw size={32} className="text-blue-600 animate-spin" />
                <span className="text-xs text-gray-600">Searching web across live sources...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Results list */}
                <div className="md:col-span-2 space-y-4">
                  {searchResponse?.results.map((res) => (
                    <div key={res.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 shadow-sm">
                      <div className="text-[11px] text-gray-500">{res.displayUrl}</div>
                      <h3
                        onClick={() => handleOpenReader(res.title, res.url)}
                        className="text-base font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        {res.title}
                      </h3>
                      <p className="text-xs text-gray-700 leading-relaxed">{res.snippet}</p>
                      <div className="flex space-x-2 pt-2 border-t mt-2">
                        <button
                          onClick={() => handleOpenReader(res.title, res.url)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center space-x-1"
                        >
                          <BookOpen size={12} />
                          <span>Reader Mode</span>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(`${res.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`, res.snippet, 'txt')}
                          className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center space-x-1"
                        >
                          <Download size={12} />
                          <span>Save to Win11</span>
                        </button>
                        <button
                          onClick={() => handleDownloadToPC(`${res.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`, res.snippet)}
                          className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center space-x-1"
                        >
                          <HardDrive size={12} />
                          <span>Save to PC</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Generated Download Packs */}
                  <div className="pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-gray-700 uppercase">Generated Research Downloads</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {searchResponse?.downloadablePacks.map((pack) => (
                        <div key={pack.filename} className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                          <div className="text-xs font-bold text-blue-900">{pack.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{pack.filename} • {pack.size}</div>
                          <button
                            onClick={() => handleDownloadBoth(pack.filename, pack.content, pack.type as any)}
                            className="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1"
                          >
                            <Download size={12} />
                            <span>Download Package</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Knowledge Card */}
                <div>
                  {searchResponse?.knowledge && (
                    <div className="p-4 bg-gray-50 border rounded-2xl space-y-3 sticky top-6">
                      {searchResponse.knowledge.imageUrl && (
                        <img
                          src={searchResponse.knowledge.imageUrl}
                          alt="Thumbnail"
                          className="w-full h-36 object-cover rounded-xl"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{searchResponse.knowledge.title}</h3>
                        <p className="text-xs text-gray-500">{searchResponse.knowledge.subtitle}</p>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{searchResponse.knowledge.description}</p>
                      <button
                        onClick={() => handleOpenReader(searchResponse.knowledge!.title, searchResponse.knowledge!.wikiUrl || '')}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Read Full Article
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab.viewMode === 'reader' ? (
          /* View 2: Reader Mode */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase">Reader Mode</span>
                <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{activeTab.articleData?.title}</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const t = activeTab.articleData?.title || 'Doc';
                    const c = activeTab.articleData?.content || '';
                    handleDownloadBoth(`${t.replace(/ /g, '_')}.txt`, c, 'txt');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow"
                >
                  <Download size={13} />
                  <span>Download Document</span>
                </button>
                <button
                  onClick={() => handleOpenExternalTab(activeTab.url)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium flex items-center space-x-1"
                >
                  <span>Native Tab</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {activeTab.articleData?.imageUrl && (
              <img src={activeTab.articleData.imageUrl} alt="Hero" className="w-full h-64 object-cover rounded-2xl shadow" />
            )}

            <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {activeTab.articleData?.content}
            </div>
          </div>
        ) : activeTab.viewMode === 'iframe' ? (
          /* View 3: Embedded Web Frame */
          <div className="w-full h-full flex flex-col">
            <div className="p-2 bg-gray-100 border-b flex justify-between items-center text-xs">
              <span className="text-gray-600 truncate">Browsing: {activeTab.url}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenReader(activeTab.title, activeTab.url)}
                  className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs"
                >
                  Reader Mode
                </button>
                <button
                  onClick={() => handleOpenExternalTab(activeTab.url)}
                  className="px-2 py-0.5 bg-gray-300 rounded text-xs flex items-center space-x-1"
                >
                  <span>Native Tab</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
            <iframe key={iframeKey} src={activeTab.url} className="w-full flex-1 border-none" />
          </div>
        ) : activeTab.viewMode === 'downloads' ? (
          /* View 4: Downloads Center */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Laptop Apps Download Repository */}
            <BrowserAppDownloadHub
              onStartDownload={triggerDownloadApp}
              onOpenApp={onOpenApp}
            />

            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
              <div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Win11 Universal Downloader
                </span>
                <h1 className="text-2xl font-bold mt-1">Software &amp; Downloads Hub</h1>
                <p className="text-xs text-blue-100 max-w-lg mt-1">
                  Download any web files, code packages, or research summaries directly to Win11 storage and your local computer!
                </p>
              </div>
              <FileDown size={48} className="text-white/80 shrink-0" />
            </div>

            {/* Direct URL Downloader */}
            <div className="p-4 bg-gray-50 border rounded-2xl space-y-2">
              <div className="text-xs font-bold text-gray-800">Download from Any Web URL:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDownloadUrl}
                  onChange={(e) => setCustomDownloadUrl(e.target.value)}
                  placeholder="https://example.com/file.txt..."
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs outline-none"
                />
                <button
                  onClick={() => {
                    if (!customDownloadUrl.trim()) return;
                    const fname = customDownloadUrl.split('/').pop()?.split('?')[0] || 'Downloaded_Web_File.txt';
                    handleDownloadBoth(fname, customDownloadUrl.trim(), 'txt');
                    setCustomDownloadUrl('');
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Download
                </button>
              </div>
            </div>

            {/* Featured Downloads */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">Featured Packages &amp; Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Developer_Cheatsheet.txt',
                    desc: 'Essential shortcut keys, PowerShell terminal commands, and system tips.',
                    size: '4.2 KB',
                    type: 'txt' as const,
                    content: '=== WIN11 WEB OS CHEATSHEET ===\n\n- Open Start: Windows key or Start button\n- Terminal commands: neofetch, matrix, dir, calc, ping\n- Storage folder: /downloads, /documents, /pictures\n- Games: Minesweeper, 2048\n- Universal Downloader: Search anything and download to PC or Win11 OS!',
                  },
                  {
                    name: 'Project_Architecture.md',
                    desc: 'Virtual operating system architecture details, Web Audio specs, and filesystem drivers.',
                    size: '2.8 KB',
                    type: 'txt' as const,
                    content: '# Win11 Web OS Architecture\n\n- Kernel: React 19 + TypeScript\n- Storage: Virtual LocalStorage filesystem\n- Downloader: Universal Web Search & Downloader\n- Audio: Web Audio API synthesized harmonics',
                  },
                  {
                    name: 'Retro_Game_Pack.app',
                    desc: 'Executable package for classic games suite.',
                    size: '1.4 MB',
                    type: 'sys' as const,
                    content: '[WIN11_APP_PACKAGE]\nID=game2048\nName=2048 Puzzle',
                  },
                  {
                    name: '4K_Scenic_Wallpaper.png',
                    desc: 'High-definition 4K scenic wallpaper bundle.',
                    size: '2.1 MB',
                    type: 'png' as const,
                    content: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
                  },
                ].map((item) => (
                  <div key={item.name} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex items-start justify-between space-x-3 shadow-sm">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-900">{item.name}</div>
                      <p className="text-xs text-gray-600 mt-1">{item.desc}</p>
                      <div className="text-[11px] text-gray-400 mt-1 font-mono">{item.size}</div>
                    </div>
                    <div className="flex flex-col space-y-1.5 shrink-0">
                      <button
                        onClick={() => handleDownloadFile(item.name, item.content, item.type)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-1"
                      >
                        <Download size={12} />
                        <span>Win11</span>
                      </button>
                      <button
                        onClick={() => handleDownloadToPC(item.name, item.content)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-medium flex items-center space-x-1"
                      >
                        <HardDrive size={12} />
                        <span>PC</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* View 5: Windows Start Page Dashboard & Tiles */
          <WindowsStartPage
            onNavigate={handleNavigate}
            brandName="Microsoft Edge"
            searchPlaceholder="Type to search or download Chrome..."
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
      </div>
    </div>
  );
};
