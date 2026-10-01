import React from 'react';
import {
  Download,
  Play,
  Check,
  Folder,
  Shield,
  Sparkles,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { AppId } from '../types/os';
import { LAPTOP_DOWNLOADABLE_APPS, DownloadableLaptopApp } from '../services/downloadCenter';
import { soundManager } from '../services/sound';

interface BrowserAppDownloadHubProps {
  onStartDownload: (app: DownloadableLaptopApp) => void;
  onOpenApp?: (appId: AppId) => void;
}

export const BrowserAppDownloadHub: React.FC<BrowserAppDownloadHubProps> = ({
  onStartDownload,
  onOpenApp,
}) => {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Lenovo Legion G14 Software Repository
            </span>
            <span className="bg-emerald-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              WinWeb 11 Pro Verified
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1.5">Laptop Applications &amp; Executables</h2>
          <p className="text-xs text-blue-100 max-w-xl mt-1">
            Download real applications directly to your Lenovo G14 Downloads folder (1.0 TB NVMe SSD). Once downloaded, run them from your browser download tray or double-click any .exe in File Explorer!
          </p>
        </div>
        <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md items-center justify-center text-4xl shadow-inner border border-white/20">
          💻
        </div>
      </div>

      {/* Grid of Downloadable Laptop Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {LAPTOP_DOWNLOADABLE_APPS.map((app) => (
          <div
            key={app.id}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition shadow-sm flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {app.icon}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                      {app.name}
                    </h3>
                    <span className="text-[10px] text-blue-500 font-mono font-medium">
                      {app.filename}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-mono">
                  {app.size}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
                {app.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
              <button
                onClick={() => onStartDownload(app)}
                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer"
              >
                <Download size={13} />
                <span>Download .exe</span>
              </button>

              {onOpenApp && (
                <button
                  onClick={() => {
                    soundManager.playDing();
                    onOpenApp(app.appId);
                  }}
                  className="py-1.5 px-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Direct Run"
                >
                  <Play size={13} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
