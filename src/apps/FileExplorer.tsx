import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Trash2,
  HardDrive,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Plus,
  LayoutGrid,
  List,
  Search,
  Check,
  Download,
  ShoppingBag,
  Play,
  Shield,
  FileCode,
  ExternalLink,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { fs } from '../services/filesystem';
import { FSItem, AppId } from '../types/os';
import { soundManager } from '../services/sound';
import { STORE_CATALOG } from '../services/appManager';
import { webSearchService } from '../services/webSearchService';

interface FileExplorerProps {
  initialFolderId?: string;
  onOpenFile?: (file: FSItem) => void;
  onOpenApp?: (appId: AppId, data?: any) => void;
  onSetWallpaper?: (url: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  initialFolderId = 'desktop',
  onOpenFile,
  onOpenApp,
  onSetWallpaper,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>(initialFolderId);
  const [items, setItems] = useState<FSItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([initialFolderId]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // App Installer Dialog state
  const [installingApp, setInstallingApp] = useState<{ name: string; progress: number; done: boolean } | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // File Context Menu
  const [fileContextMenu, setFileContextMenu] = useState<{ x: number; y: number; item: FSItem } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshItems = () => {
    const list = fs.getItems(currentFolderId);
    setItems(list);
  };

  const handleFileUpload = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    soundManager.playDing();

    Array.from(files).forEach((file) => {
      const fileName = file.name;
      const isImg = file.type.startsWith('image/') || fileName.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
      const isDocx = fileName.match(/\.(docx|doc)$/i);
      const isXlsx = fileName.match(/\.(xlsx|xls|csv)$/i);
      const isPptx = fileName.match(/\.(pptx|ppt)$/i);
      const isApp = fileName.match(/\.(exe|app|bat|cmd|apk|msi)$/i);

      if (isImg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          fs.createFile(fileName, currentFolderId, dataUrl, 'png');
          refreshItems();
          showNotification(`Picture "${fileName}" loaded into ${getFolderName(currentFolderId)}!`);
        };
        reader.readAsDataURL(file);
      } else if (isDocx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          fs.createFile(fileName, currentFolderId, text, 'docx');
          refreshItems();
          showNotification(`Word Document "${fileName}" loaded!`);
        };
        reader.readAsText(file);
      } else if (isXlsx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          fs.createFile(fileName, currentFolderId, text, 'xlsx');
          refreshItems();
          showNotification(`Excel Spreadsheet "${fileName}" loaded!`);
        };
        reader.readAsText(file);
      } else if (isPptx) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          fs.createFile(fileName, currentFolderId, text, 'pptx');
          refreshItems();
          showNotification(`PowerPoint Presentation "${fileName}" loaded!`);
        };
        reader.readAsText(file);
      } else if (isApp) {
        fs.createFile(fileName, currentFolderId, `app:installer`, 'sys');
        refreshItems();
        showNotification(`Application "${fileName}" loaded into ${getFolderName(currentFolderId)}!`);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          fs.createFile(fileName, currentFolderId, text, 'txt');
          refreshItems();
          showNotification(`File "${fileName}" loaded successfully!`);
        };
        reader.readAsText(file);
      }
    });
  };

  useEffect(() => {
    refreshItems();
    setSelectedId(null);
  }, [currentFolderId]);

  const navigateTo = (folderId: string) => {
    soundManager.playClick();
    setCurrentFolderId(folderId);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), folderId]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      soundManager.playClick();
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setCurrentFolderId(history[prev]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      soundManager.playClick();
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setCurrentFolderId(history[next]);
    }
  };

  const handleUp = () => {
    const current = fs.getItem(currentFolderId);
    if (current && current.parentId) {
      navigateTo(current.parentId);
    } else if (currentFolderId !== 'desktop') {
      navigateTo('desktop');
    }
  };

  // Helper to map file to an installed app
  const detectAppForFile = (item: FSItem): AppId | null => {
    if (item.content?.startsWith('app:')) {
      const id = item.content.replace('app:', '').trim() as AppId;
      return id;
    }
    const lowerName = item.name.toLowerCase();
    if (lowerName.includes('word') || lowerName.includes('doc')) return 'word';
    if (lowerName.includes('excel') || lowerName.includes('sheet')) return 'excel';
    if (lowerName.includes('powerpoint') || lowerName.includes('ppt') || lowerName.includes('slide')) return 'powerpoint';
    if (lowerName.includes('vscode') || lowerName.includes('code') || lowerName.includes('editor')) return 'vscode';
    if (lowerName.includes('nvidia') || lowerName.includes('geforce')) return 'nvidia';
    if (lowerName.includes('chrome') || lowerName.includes('google')) return 'chrome';
    if (lowerName.includes('edge') || lowerName.includes('browser')) return 'browser';
    if (lowerName.includes('2048') || lowerName.includes('minecraft') || lowerName.includes('game')) return 'game2048';
    if (lowerName.includes('terminal') || lowerName.includes('powershell') || lowerName.includes('cmd')) return 'terminal';
    if (lowerName.includes('paint') || lowerName.includes('draw')) return 'paint';
    if (lowerName.includes('minesweeper')) return 'minesweeper';
    if (lowerName.includes('calc')) return 'calculator';
    if (lowerName.includes('player') || lowerName.includes('vlc') || lowerName.includes('music')) return 'mediaplayer';
    if (lowerName.includes('camera') || lowerName.includes('photo')) return 'camera';
    if (lowerName.includes('clock') || lowerName.includes('alarm')) return 'clock';
    if (lowerName.includes('weather')) return 'weatherpro';
    if (lowerName.includes('task') || lowerName.includes('vantage')) return 'taskmanager';
    if (lowerName.includes('settings')) return 'settings';
    if (lowerName.includes('store')) return 'store';
    if (lowerName.includes('window') || lowerName.includes('aura')) return 'virtualwindow';

    const storeMatch = STORE_CATALOG.find((a) => lowerName.includes(a.name.toLowerCase()));
    if (storeMatch) return storeMatch.id;

    return null;
  };

  const handleLaunchExecutable = (item: FSItem) => {
    soundManager.playClick();
    const targetApp = detectAppForFile(item);
    if (targetApp && onOpenApp) {
      soundManager.playDing();
      onOpenApp(targetApp);
      showNotification(`Launched ${item.name} on Lenovo WinWeb 11 Pro`);
    } else {
      // Simulate real installer
      soundManager.playDing();
      setInstallingApp({ name: item.name, progress: 10, done: false });
      const timer1 = setTimeout(() => {
        setInstallingApp((prev) => (prev ? { ...prev, progress: 65 } : null));
      }, 600);
      const timer2 = setTimeout(() => {
        setInstallingApp((prev) => (prev ? { ...prev, progress: 100, done: true } : null));
        soundManager.playDing();
      }, 1400);
    }
  };

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  const handleItemDoubleClick = (item: FSItem) => {
    if (item.type === 'folder') {
      navigateTo(item.id);
      return;
    }

    soundManager.playClick();

    // Check if executable or application shortcut
    const isExe = item.name.endsWith('.exe') || item.name.endsWith('.app') || item.name.endsWith('.lnk') || item.fileType === 'sys' || item.content?.startsWith('app:');
    if (isExe) {
      handleLaunchExecutable(item);
      return;
    }

    // Image preview
    if (item.fileType === 'png' || item.name.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
      if (item.content) {
        setPreviewImage(item.content);
      }
      return;
    }

    // Word Document (.docx / .doc)
    if (item.name.match(/\.(docx|doc)$/i) || item.fileType === 'docx') {
      if (onOpenApp) {
        onOpenApp('word', { fileId: item.id, fileName: item.name, content: item.content });
        return;
      }
    }

    // Excel Spreadsheet (.xlsx / .xls / .csv)
    if (item.name.match(/\.(xlsx|xls|csv)$/i) || item.fileType === 'xlsx') {
      if (onOpenApp) {
        onOpenApp('excel', { fileId: item.id, fileName: item.name, content: item.content });
        return;
      }
    }

    // PowerPoint Presentation (.pptx / .ppt)
    if (item.name.match(/\.(pptx|ppt)$/i) || item.fileType === 'pptx') {
      if (onOpenApp) {
        onOpenApp('powerpoint', { fileId: item.id, fileName: item.name, content: item.content });
        return;
      }
    }

    // Code / web file
    if (item.name.match(/\.(html|css|js|jsx|ts|tsx|json|py|ps1)$/i)) {
      if (onOpenApp) {
        onOpenApp('vscode', { fileName: item.name, content: item.content });
      } else if (onOpenFile) {
        onOpenFile(item);
      }
      return;
    }

    // Media / audio file
    if (item.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      if (onOpenApp) {
        onOpenApp('mediaplayer');
      }
      return;
    }

    // Default: Open in Notepad
    if (onOpenFile) {
      onOpenFile(item);
    } else if (onOpenApp) {
      onOpenApp('notepad', { fileId: item.id, content: item.content, fileName: item.name });
    }
  };

  const handleCreateFolder = () => {
    soundManager.playClick();
    const name = `New Folder ${Math.floor(Math.random() * 100)}`;
    fs.createFolder(name, currentFolderId);
    refreshItems();
  };

  const handleCreateTextFile = () => {
    soundManager.playClick();
    const name = `New Document ${Math.floor(Math.random() * 100)}.txt`;
    fs.createFile(name, currentFolderId, 'Hello from Lenovo Legion G14 WinWeb 11 Pro!', 'txt');
    refreshItems();
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    soundManager.playTrashEmpty();
    fs.deleteItem(selectedId);
    setSelectedId(null);
    refreshItems();
  };

  const handleEmptyTrash = () => {
    soundManager.playTrashEmpty();
    fs.emptyTrash();
    refreshItems();
  };

  const getFolderName = (id: string) => {
    if (id === 'desktop') return 'Desktop';
    if (id === 'documents') return 'Documents';
    if (id === 'pictures') return 'Pictures';
    if (id === 'downloads') return 'Downloads';
    if (id === 'trash') return 'Recycle Bin';
    return fs.getItem(id)?.name || id;
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="flex flex-col h-full bg-[#1e1e1e] text-white select-none relative"
      onClick={() => setFileContextMenu(null)}
    >
      {/* Status Toast */}
      {statusNotification && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold text-white shadow-2xl flex items-center space-x-2 border border-blue-400/40">
          <Check size={14} className="text-emerald-300" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-white/10 text-xs">
        <div className="flex items-center space-x-1">
          {/* Upload / Load File from physical PC */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                handleFileUpload(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold transition shadow-xs"
            title="Load / Upload files, pictures, or applications from your physical PC"
          >
            <Upload size={13} />
            <span>Upload to PC</span>
          </button>

          <button
            onClick={handleCreateFolder}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded transition text-white/90"
          >
            <Plus size={13} />
            <span>New Folder</span>
          </button>
          <button
            onClick={handleCreateTextFile}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded transition text-white/90"
          >
            <FileText size={13} />
            <span>New Document</span>
          </button>
          {onOpenApp && (
            <button
              onClick={() => onOpenApp('store')}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-blue-600/30 text-blue-300 hover:bg-blue-600/40 rounded transition border border-blue-500/30"
              title="Download more apps from Microsoft Store"
            >
              <ShoppingBag size={13} />
              <span>Get Apps</span>
            </button>
          )}
          {selectedId && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center space-x-1 px-2 py-1 text-red-400 hover:bg-red-500/20 rounded transition"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}
          {currentFolderId === 'trash' && (
            <button
              onClick={handleEmptyTrash}
              className="flex items-center space-x-1 px-2.5 py-1 bg-red-600/30 text-red-300 hover:bg-red-600/40 rounded transition"
            >
              <Trash2 size={13} />
              <span>Empty Bin</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1 text-white/60">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/20 text-white' : 'hover:bg-white/10'}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Address & Search Bar */}
      <div className="flex items-center px-3 py-1.5 bg-[#202020] border-b border-white/10 space-x-2 text-xs">
        <div className="flex items-center space-x-1 text-white/70">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
          >
            <ArrowRight size={14} />
          </button>
          <button onClick={handleUp} className="p-1 hover:bg-white/10 rounded">
            <ArrowUp size={14} />
          </button>
          <button onClick={refreshItems} className="p-1 hover:bg-white/10 rounded">
            <RotateCw size={13} />
          </button>
        </div>

        {/* Breadcrumb Path */}
        <div className="flex-1 flex items-center bg-[#181818] border border-white/10 rounded px-2.5 py-1 text-white/80">
          <HardDrive size={13} className="text-blue-400 mr-1.5 shrink-0" />
          <span className="text-white/40 mr-1">This PC &gt; Local Disk (C:) &gt;</span>
          <span className="font-medium text-white">{getFolderName(currentFolderId)}</span>
        </div>

        {/* Search */}
        <div className="w-48 flex items-center bg-[#181818] border border-white/10 rounded px-2.5 py-1">
          <Search size={13} className="text-white/40 mr-1.5 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${getFolderName(currentFolderId)}...`}
            className="w-full bg-transparent outline-none text-white text-xs"
          />
        </div>
      </div>

      {/* Main Body: Sidebar + File Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-52 bg-[#1a1a1a] border-r border-white/10 p-2 flex flex-col justify-between text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-2 py-1">
              Quick Access
            </div>
            {[
              { id: 'desktop', label: 'Desktop', icon: '🖥️' },
              { id: 'documents', label: 'Documents', icon: '📁' },
              { id: 'pictures', label: 'Pictures', icon: '🖼️' },
              { id: 'downloads', label: 'Downloads', icon: '📥' },
              { id: 'trash', label: 'Recycle Bin', icon: '🗑️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center space-x-2 w-full px-2.5 py-1.5 rounded-md text-left transition ${
                  currentFolderId === item.id
                    ? 'bg-blue-600/30 text-blue-300 font-medium'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 1.0 TB NVMe PCIe Gen4 SSD Storage Widget */}
          <div className="pt-3 border-t border-white/10 mt-2 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>STORAGE (C:)</span>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">1.0 TB NVMe</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-white/90">
                <HardDrive size={15} className="text-blue-400 shrink-0" />
                <div className="truncate font-medium text-[11px] leading-tight">
                  Lenovo High-Speed SSD
                </div>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[13%]" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>892.4 GB free</span>
                <span>1,024 GB (1 TB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Container */}
        <div
          onClick={() => setSelectedId(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            // Deselect file context menu on empty space
            setFileContextMenu(null);
          }}
          className="flex-1 p-4 overflow-y-auto bg-[#181818]"
        >
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs">
              <Folder size={40} strokeWidth={1} className="mb-2 opacity-50" />
              <span>This folder is empty.</span>
              <span className="text-[10px] mt-1 text-white/20">Download apps or files from Google Chrome & Edge to view them here.</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                const isExe = item.name.endsWith('.exe') || item.name.endsWith('.app') || item.fileType === 'sys' || item.content?.startsWith('app:');

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedId(item.id);
                      setFileContextMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition text-center group relative ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-500/50 shadow-md'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center text-3xl mb-1.5 group-hover:scale-105 transition-transform relative">
                      {item.type === 'folder' ? (
                        '📁'
                      ) : isExe ? (
                        <div className="relative">
                          <span className="text-3xl">🚀</span>
                          <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-bold text-white px-1 rounded-sm shadow">
                            EXE
                          </span>
                        </div>
                      ) : item.fileType === 'png' || item.name.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                        item.content?.startsWith('http') || item.content?.startsWith('data:image') || item.content?.startsWith('/wallpapers') ? (
                          <img
                            src={item.content}
                            alt={item.name}
                            className="w-11 h-11 object-cover rounded shadow"
                          />
                        ) : (
                          '🖼️'
                        )
                      ) : item.name.match(/\.(html|css|js|json|py)$/i) ? (
                        '💻'
                      ) : item.name.match(/\.(mp3|wav)$/i) ? (
                        '🎵'
                      ) : (
                        '📄'
                      )}
                    </div>
                    <span className="text-xs text-white/90 truncate max-w-full font-medium" title={item.name}>
                      {item.name}
                    </span>
                    {isExe && (
                      <span className="text-[9px] text-blue-400 font-mono mt-0.5">Application</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="w-full text-xs">
              <div className="grid grid-cols-12 py-1 px-2 text-white/40 border-b border-white/10 font-medium">
                <span className="col-span-6">Name</span>
                <span className="col-span-3">Date modified</span>
                <span className="col-span-3">Type</span>
              </div>
              {filteredItems.map((item) => {
                const isSelected = selectedId === item.id;
                const isExe = item.name.endsWith('.exe') || item.name.endsWith('.app') || item.fileType === 'sys' || item.content?.startsWith('app:');

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(item.id);
                    }}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedId(item.id);
                      setFileContextMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                    className={`grid grid-cols-12 py-1.5 px-2 rounded cursor-pointer items-center transition ${
                      isSelected ? 'bg-blue-600/30' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="col-span-6 flex items-center space-x-2 truncate">
                      <span>{item.type === 'folder' ? '📁' : isExe ? '🚀' : item.fileType === 'png' ? '🖼️' : '📄'}</span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="col-span-3 text-white/50 text-[11px]">
                      {new Date(item.modifiedAt).toLocaleDateString()}
                    </span>
                    <span className="col-span-3 text-white/50 text-[11px] capitalize">
                      {item.type === 'folder'
                        ? 'File folder'
                        : isExe
                        ? 'Lenovo WinWeb Executable (.exe)'
                        : `${item.fileType?.toUpperCase() || 'Text'} Document`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* File Context Menu */}
      {fileContextMenu && (
        <div
          style={{ top: fileContextMenu.y - 40, left: fileContextMenu.x - 20 }}
          className="fixed z-50 w-52 bg-[#252525]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleItemDoubleClick(fileContextMenu.item);
              setFileContextMenu(null);
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition font-semibold"
          >
            <Play size={13} />
            <span>Open / Run</span>
          </button>

          {(fileContextMenu.item.name.endsWith('.exe') || fileContextMenu.item.name.endsWith('.app')) && (
            <button
              onClick={() => {
                handleLaunchExecutable(fileContextMenu.item);
                setFileContextMenu(null);
              }}
              className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition"
            >
              <Shield size={13} className="text-amber-400" />
              <span>Run as administrator</span>
            </button>
          )}

          {(fileContextMenu.item.fileType === 'png' || fileContextMenu.item.name.match(/\.(png|jpg|jpeg|webp)$/i)) && (
            <>
              <button
                onClick={() => {
                  if (fileContextMenu.item.content) {
                    setPreviewImage(fileContextMenu.item.content);
                  }
                  setFileContextMenu(null);
                }}
                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition"
              >
                <ImageIcon size={13} />
                <span>Preview Image</span>
              </button>
              {onSetWallpaper && fileContextMenu.item.content && (
                <button
                  onClick={() => {
                    onSetWallpaper(fileContextMenu.item.content!);
                    showNotification('Set as Desktop Wallpaper!');
                    setFileContextMenu(null);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition text-blue-300"
                >
                  <Sparkles size={13} />
                  <span>Set as Desktop Background</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => {
              if (onOpenApp) {
                onOpenApp('notepad', { fileId: fileContextMenu.item.id, content: fileContextMenu.item.content, fileName: fileContextMenu.item.name });
              }
              setFileContextMenu(null);
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition"
          >
            <FileText size={13} />
            <span>Open with Notepad</span>
          </button>

          <button
            onClick={() => {
              if (onOpenApp) {
                onOpenApp('vscode', { fileName: fileContextMenu.item.name, content: fileContextMenu.item.content });
              }
              setFileContextMenu(null);
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition"
          >
            <FileCode size={13} />
            <span>Edit with VS Code</span>
          </button>

          <div className="border-t border-white/10 my-1" />

          <button
            onClick={() => {
              webSearchService.downloadToPhysicalComputer(
                fileContextMenu.item.name,
                fileContextMenu.item.content || 'Lenovo WinWeb 11 Pro File'
              );
              showNotification(`Saved ${fileContextMenu.item.name} to your PC!`);
              setFileContextMenu(null);
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-blue-600 rounded-lg text-left transition"
          >
            <Download size={13} />
            <span>Download to Physical PC</span>
          </button>

          <button
            onClick={() => {
              fs.deleteItem(fileContextMenu.item.id);
              refreshItems();
              setFileContextMenu(null);
              soundManager.playTrashEmpty();
            }}
            className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-red-600 rounded-lg text-left text-red-300 transition"
          >
            <Trash2 size={13} />
            <span>Delete File</span>
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 cursor-pointer"
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[75%] rounded-xl shadow-2xl object-contain border border-white/20"
          />
          <div className="mt-4 flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
            {onSetWallpaper && (
              <button
                onClick={() => {
                  onSetWallpaper(previewImage);
                  showNotification('Desktop Wallpaper updated!');
                  setPreviewImage(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg transition flex items-center space-x-1.5"
              >
                <Sparkles size={14} />
                <span>Set as Wallpaper</span>
              </button>
            )}
            <button
              onClick={() => setPreviewImage(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Simulated Application Installer Dialog */}
      {installingApp && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-[#222222] border border-blue-500/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{installingApp.name}</h4>
                <p className="text-xs text-white/60">Lenovo WinWeb 11 Pro Installer</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/70">
                <span>{installingApp.done ? 'Ready to run' : 'Installing application binaries...'}</span>
                <span className="font-mono text-blue-400">{installingApp.progress}%</span>
              </div>
              <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${installingApp.progress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setInstallingApp(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                disabled={!installingApp.done}
                onClick={() => {
                  soundManager.playDing();
                  showNotification(`${installingApp.name} executed successfully!`);
                  setInstallingApp(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
              >
                {installingApp.done ? 'Launch Program' : 'Installing...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-t border-white/10 text-[11px] text-white/50">
        <span>{filteredItems.length} items</span>
        <div className="flex items-center space-x-4">
          <span>NTFS (1.0 TB NVMe PCIe Gen4)</span>
          {selectedId && <span className="text-blue-400 font-medium">1 item selected</span>}
        </div>
      </div>
    </div>
  );
};
