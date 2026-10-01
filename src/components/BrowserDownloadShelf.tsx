import React from 'react';
import {
  Download,
  Check,
  Play,
  Folder,
  HardDrive,
  X,
  FileCode,
  FileText,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react';
import { AppId } from '../types/os';
import { soundManager } from '../services/sound';
import { webSearchService } from '../services/webSearchService';

export interface ActiveDownloadItem {
  id: string;
  filename: string;
  appId?: AppId;
  progress: number; // 0 to 100
  speed: string;
  totalSize: string;
  completed: boolean;
  timestamp: number;
}

interface BrowserDownloadShelfProps {
  downloads: ActiveDownloadItem[];
  onOpenApp?: (appId: AppId, data?: any) => void;
  onCloseDownload: (id: string) => void;
  onClearAll: () => void;
}

export const BrowserDownloadShelf: React.FC<BrowserDownloadShelfProps> = ({
  downloads,
  onOpenApp,
  onCloseDownload,
  onClearAll,
}) => {
  if (downloads.length === 0) return null;

  return (
    <div className="absolute bottom-9 left-4 right-4 z-40 bg-[#1e1e1ed9] dark:bg-[#1a1a1cf0] backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2.5 flex items-center space-x-3 overflow-x-auto text-xs animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center space-x-2 pl-1 pr-3 border-r border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
          <Download size={16} />
        </div>
        <div>
          <div className="font-bold text-white text-[11px] leading-tight">Downloads Shelf</div>
          <div className="text-[10px] text-white/50">{downloads.length} active / recent</div>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 flex-1 overflow-x-auto no-scrollbar py-0.5">
        {downloads.map((dl) => {
          const isExe = dl.filename.endsWith('.exe') || dl.filename.endsWith('.app') || !!dl.appId;

          return (
            <div
              key={dl.id}
              className="bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 rounded-xl p-2 flex items-center space-x-3 shrink-0 min-w-[280px] max-w-[340px] shadow transition"
            >
              {/* Icon / Progress spinner */}
              <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center relative shrink-0">
                {dl.completed ? (
                  <span className="text-emerald-400 text-base">✓</span>
                ) : (
                  <RotateCw size={16} className="text-blue-400 animate-spin" />
                )}
                {isExe && (
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-bold text-white px-1 rounded shadow">
                    EXE
                  </span>
                )}
              </div>

              {/* Info & Progress Bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white truncate text-[11px]" title={dl.filename}>
                    {dl.filename}
                  </span>
                  <button
                    onClick={() => onCloseDownload(dl.id)}
                    className="p-0.5 text-white/40 hover:text-white rounded"
                  >
                    <X size={12} />
                  </button>
                </div>

                {dl.completed ? (
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[10px] text-emerald-400 font-medium">Download complete</span>
                    <span className="text-[10px] text-white/40">• {dl.totalSize}</span>
                  </div>
                ) : (
                  <div className="space-y-1 mt-1">
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${dl.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>{dl.speed}</span>
                      <span>{dl.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Actions when done */}
                {dl.completed && (
                  <div className="flex items-center space-x-2 mt-1.5 pt-1 border-t border-white/5">
                    {isExe && dl.appId && onOpenApp && (
                      <button
                        onClick={() => {
                          soundManager.playDing();
                          onOpenApp(dl.appId!);
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold flex items-center space-x-1 shadow"
                      >
                        <Play size={10} fill="currentColor" />
                        <span>Open / Run</span>
                      </button>
                    )}
                    {onOpenApp && (
                      <button
                        onClick={() => onOpenApp('explorer', { folderId: 'downloads' })}
                        className="text-[10px] text-blue-300 hover:underline flex items-center space-x-0.5"
                      >
                        <Folder size={11} className="text-amber-400" />
                        <span>Show in folder</span>
                      </button>
                    )}
                    <button
                      onClick={() => webSearchService.downloadToPhysicalComputer(dl.filename, `Lenovo WinWeb 11 Pro File: ${dl.filename}`)}
                      className="text-[10px] text-white/50 hover:text-white"
                      title="Save to your physical computer disk"
                    >
                      Save to PC
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClearAll}
        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[10px] transition shrink-0"
      >
        Clear Shelf
      </button>
    </div>
  );
};
