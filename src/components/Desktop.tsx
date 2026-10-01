import React, { useState, useRef, useEffect } from 'react';
import { AppId, FSItem, SystemSettings } from '../types/os';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ChromeLogo } from './ChromeLogo';

import { appManager, STORE_CATALOG } from '../services/appManager';

interface DesktopProps {
  settings: SystemSettings;
  onOpenApp: (appId: AppId, data?: any) => void;
  onOpenSettings: () => void;
  children?: React.ReactNode;
}

interface DesktopItem {
  id: string;
  name: string;
  icon: string;
  appId?: AppId;
  fsItem?: FSItem;
}

export const Desktop: React.FC<DesktopProps> = ({
  settings,
  onOpenApp,
  onOpenSettings,
  children,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [fsDesktopItems, setFsDesktopItems] = useState<FSItem[]>([]);
  const [installedApps, setInstalledApps] = useState<AppId[]>(() => appManager.getInstalledAppIds());

  // Marquee selection box state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectBox, setSelectBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);

  const refreshFs = () => {
    setFsDesktopItems(fs.getItems('desktop'));
  };

  useEffect(() => {
    refreshFs();
    return appManager.subscribe(() => {
      setInstalledApps(appManager.getInstalledAppIds());
      refreshFs();
    });
  }, []);

  // Built-in system desktop shortcuts
  const systemShortcuts: DesktopItem[] = [
    { id: 'sc-explorer', name: 'This PC', icon: '💻', appId: 'explorer' },
    { id: 'sc-chrome', name: 'Google Chrome', icon: '🌐', appId: 'chrome' },
    { id: 'sc-trash', name: 'Recycle Bin', icon: '🗑️', appId: 'trash' },
    { id: 'sc-store', name: 'Microsoft Store', icon: '🛍️', appId: 'store' },
    { id: 'sc-edge', name: 'Microsoft Edge', icon: '🌐', appId: 'browser' },
    { id: 'sc-notepad', name: 'Notepad', icon: '📝', appId: 'notepad' },
    { id: 'sc-paint', name: 'Paint', icon: '🎨', appId: 'paint' },
    { id: 'sc-terminal', name: 'Terminal', icon: '💻', appId: 'terminal' },
    { id: 'sc-minesweeper', name: 'Minesweeper', icon: '💣', appId: 'minesweeper' },
    { id: 'sc-calculator', name: 'Calculator', icon: '🧮', appId: 'calculator' },
    { id: 'sc-mediaplayer', name: 'Media Player', icon: '🎵', appId: 'mediaplayer' },
    { id: 'sc-nvidia', name: 'NVIDIA GeForce NOW', icon: '🟢', appId: 'nvidia' },
    { id: 'sc-taskmgr', name: 'Task Manager', icon: '📊', appId: 'taskmanager' },
    { id: 'sc-window', name: 'Aura Window', icon: '🪟', appId: 'virtualwindow' },
    { id: 'sc-settings', name: 'Settings', icon: '⚙️', appId: 'settings' },
  ];

  // Dynamically downloaded apps that aren't already in system shortcuts
  const downloadedShortcuts: DesktopItem[] = installedApps
    .filter((appId) => !systemShortcuts.some((s) => s.appId === appId))
    .map((appId) => {
      const info = STORE_CATALOG.find((a) => a.id === appId);
      return {
        id: `sc-downloaded-${appId}`,
        name: info?.name || appId,
        icon: info?.icon || '📦',
        appId,
      };
    });

  // Convert filesystem desktop items to desktop cards
  const fileItems: DesktopItem[] = fsDesktopItems.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.type === 'folder' ? '📁' : item.fileType === 'png' ? '🖼️' : '📄',
    fsItem: item,
  }));

  const allDesktopItems = [...systemShortcuts, ...downloadedShortcuts, ...fileItems];

  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
  };

  const handleItemDoubleClick = (item: DesktopItem) => {
    soundManager.playClick();
    if (item.appId) {
      onOpenApp(item.appId);
    } else if (item.fsItem) {
      if (item.fsItem.type === 'folder') {
        onOpenApp('explorer', { folderId: item.fsItem.id });
      } else if (item.fsItem.content?.startsWith('app:')) {
        const rawApp = item.fsItem.content.replace('app:', '').trim();
        onOpenApp(rawApp as AppId);
      } else if (
        item.fsItem.name.endsWith('.exe') ||
        item.fsItem.name.endsWith('.lnk') ||
        item.fsItem.name.endsWith('.app')
      ) {
        const lower = item.fsItem.name.toLowerCase();
        if (lower.includes('chrome') || lower.includes('google')) onOpenApp('chrome');
        else if (lower.includes('edge') || lower.includes('browser')) onOpenApp('browser');
        else if (lower.includes('geforce') || lower.includes('nvidia')) onOpenApp('nvidia');
        else if (lower.includes('code') || lower.includes('vscode')) onOpenApp('vscode');
        else if (lower.includes('paint')) onOpenApp('paint');
        else if (lower.includes('calc')) onOpenApp('calculator');
        else if (lower.includes('task')) onOpenApp('taskmanager');
        else if (lower.includes('store')) onOpenApp('store');
        else if (lower.includes('weather')) onOpenApp('weatherpro');
        else if (lower.includes('camera')) onOpenApp('camera');
        else if (lower.includes('clock') || lower.includes('alarm')) onOpenApp('clock');
        else if (lower.includes('media') || lower.includes('player') || lower.includes('music')) onOpenApp('mediaplayer');
        else if (lower.includes('2048') || lower.includes('game')) onOpenApp('game2048');
        else if (lower.includes('mine')) onOpenApp('minesweeper');
        else if (lower.includes('window') || lower.includes('aura')) onOpenApp('virtualwindow');
        else onOpenApp('terminal', { command: `run "${item.fsItem.name}"` });
      } else if (item.fsItem.fileType === 'url') {
        onOpenApp('chrome', { url: item.fsItem.content });
      } else if (item.fsItem.fileType === 'txt' || item.fsItem.name.endsWith('.txt')) {
        onOpenApp('notepad', { fileId: item.fsItem.id, fileName: item.fsItem.name, content: item.fsItem.content });
      } else if (item.fsItem.fileType === 'png' || item.fsItem.name.endsWith('.png') || item.fsItem.name.endsWith('.jpg')) {
        onOpenApp('paint');
      } else {
        onOpenApp('explorer', { folderId: 'desktop' });
      }
    }
  };

  // Right click on empty desktop
  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playClick();

    const items: ContextMenuItem[] = [
      {
        label: 'View',
        action: () => {},
      },
      {
        label: 'Refresh',
        action: () => {
          refreshFs();
          soundManager.playClick();
        },
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'New Folder',
        action: () => {
          fs.createFolder('New folder', 'desktop');
          refreshFs();
        },
      },
      {
        label: 'New Text Document',
        action: () => {
          fs.createFile('New Text Document.txt', 'desktop', '', 'txt');
          refreshFs();
        },
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Task Manager',
        icon: <span>📊</span>,
        action: () => onOpenApp('taskmanager'),
      },
      {
        label: 'NVIDIA Control Panel',
        icon: <span>🟢</span>,
        action: () => onOpenApp('nvidia'),
      },
      { divider: true, label: '', action: () => {} },
      {
        label: 'Taskbar Settings',
        icon: <span>⚙️</span>,
        action: () => onOpenApp('settings', { tab: 'taskbar' }),
      },
      {
        label: 'Personalize & Wallpapers',
        icon: <span>🎨</span>,
        action: () => onOpenApp('settings', { tab: 'personalize' }),
      },
      {
        label: 'System & Storage (1.0 TB SSD)',
        icon: <span>💾</span>,
        action: () => onOpenApp('settings', { tab: 'storage' }),
      },
    ];

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  // Right click on an icon
  const handleItemContextMenu = (e: React.MouseEvent, item: DesktopItem) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playClick();
    setSelectedId(item.id);

    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        action: () => handleItemDoubleClick(item),
      },
      ...(item.fsItem
        ? [
            { divider: true, label: '', action: () => {} },
            {
              label: 'Delete',
              action: () => {
                if (item.fsItem) {
                  soundManager.playTrashEmpty();
                  fs.deleteItem(item.fsItem.id);
                  refreshFs();
                }
              },
            },
          ]
        : []),
    ];

    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  // Marquee mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setSelectedId(null);
    setContextMenu(null);
    setIsSelecting(true);
    setSelectBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectBox) return;
    setSelectBox((prev) =>
      prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
    );
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectBox(null);
  };

  // Compute selection box dimensions
  const getBoxStyle = () => {
    if (!selectBox) return {};
    const left = Math.min(selectBox.startX, selectBox.currentX);
    const top = Math.min(selectBox.startY, selectBox.currentY);
    const width = Math.abs(selectBox.startX - selectBox.currentX);
    const height = Math.abs(selectBox.startY - selectBox.currentY);
    return { left, top, width, height };
  };

  return (
    <div
      ref={desktopRef}
      onContextMenu={handleDesktopContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        backgroundImage: `url(${settings.wallpaper})`,
        filter: `brightness(${settings.brightness})`,
      }}
      className="fixed inset-0 bg-cover bg-center overflow-hidden select-none"
    >
      {/* Night Light amber overlay filter */}
      {settings.nightLight && (
        <div className="absolute inset-0 bg-amber-500/15 pointer-events-none z-[10]" />
      )}

      {/* Desktop Icons Grid */}
      <div className="absolute top-3 left-3 bottom-14 flex flex-col flex-wrap gap-2 content-start z-[20] pointer-events-auto">
        {allDesktopItems.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => handleItemClick(e, item.id)}
              onDoubleClick={() => handleItemDoubleClick(item)}
              onContextMenu={(e) => handleItemContextMenu(e, item)}
              className={`w-20 h-22 flex flex-col items-center justify-start p-1.5 rounded-lg cursor-pointer transition text-center group border ${
                isSelected
                  ? 'bg-blue-500/30 border-blue-400/60 ring-1 ring-blue-300'
                  : 'hover:bg-white/10 border-transparent'
              }`}
            >
              <div className="w-11 h-11 flex items-center justify-center text-3xl mb-1 filter drop-shadow-md group-hover:scale-105 transition-transform">
                {item.appId === 'chrome' || item.name.toLowerCase().includes('google chrome') ? (
                  <ChromeLogo size={36} />
                ) : (
                  item.icon
                )}
              </div>
              <span className="text-[11px] font-normal text-white text-shadow leading-tight line-clamp-2 px-1 break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Marquee Selection Drag Box */}
      {isSelecting && selectBox && (
        <div
          style={getBoxStyle()}
          className="absolute bg-blue-500/25 border border-blue-400/80 rounded pointer-events-none z-[30]"
        />
      )}

      {/* Render Open Windows */}
      {children}

      {/* Desktop Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
