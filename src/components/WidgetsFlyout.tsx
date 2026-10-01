import React from 'react';
import {
  CloudSun,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Compass,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { soundManager } from '../services/sound';

interface WidgetsFlyoutProps {
  onOpenApp: (appId: any) => void;
  onClose: () => void;
}

export const WidgetsFlyout: React.FC<WidgetsFlyoutProps> = ({ onOpenApp, onClose }) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 left-3 w-96 max-h-[85vh] bg-[#222222f2] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 text-white z-[9000] select-none animate-in fade-in slide-in-from-bottom-3 duration-150 overflow-y-auto space-y-3"
    >
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white/90">
          <Compass size={15} className="text-blue-400" />
          <span>Widgets Board</span>
        </div>
        <span className="text-[10px] text-white/40">Windows Feed</span>
      </div>

      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-blue-200">San Francisco, CA</div>
          <div className="text-3xl font-light text-white my-0.5">68°F</div>
          <div className="text-[11px] text-blue-300">Partly Sunny • H: 72° L: 55°</div>
        </div>
        <CloudSun size={48} className="text-amber-400" strokeWidth={1.5} />
      </div>

      {/* Virtual Scenic Window Card */}
      <div
        onClick={() => {
          soundManager.playClick();
          onOpenApp('virtualwindow');
          onClose();
        }}
        className="group bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition shadow-md"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
            <Sparkles size={13} className="text-sky-400" />
            <span>Aura Virtual Window</span>
          </span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-medium">
            Interactive
          </span>
        </div>
        <p className="text-[11px] text-white/60 mb-2">
          Experience scenic views with realistic rain streaks, day/night cycles &amp; wipeable condensation fog.
        </p>
        <div className="text-[11px] text-sky-400 font-medium flex items-center space-x-1 group-hover:underline">
          <span>Open Window Simulator</span>
          <Maximize2 size={11} />
        </div>
      </div>

      {/* Market Watch */}
      <div className="bg-[#2a2a2a] border border-white/10 rounded-xl p-3 space-y-2">
        <div className="text-xs font-semibold text-white/80">Market Watch</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { sym: 'MSFT', price: '448.20', chg: '+1.85%', up: true },
            { sym: 'AAPL', price: '232.15', chg: '+0.92%', up: true },
            { sym: 'NVDA', price: '124.60', chg: '+3.40%', up: true },
            { sym: 'GOOGL', price: '181.45', chg: '-0.30%', up: false },
          ].map((stock) => (
            <div key={stock.sym} className="p-2 bg-black/20 rounded-lg flex justify-between items-center">
              <div>
                <div className="font-bold text-white text-xs">{stock.sym}</div>
                <div className="text-[10px] text-white/50">${stock.price}</div>
              </div>
              <div className={`text-[11px] font-semibold flex items-center space-x-0.5 ${stock.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stock.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>{stock.chg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top News Headlines */}
      <div className="bg-[#2a2a2a] border border-white/10 rounded-xl p-3 space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-white/80">
          <Newspaper size={13} className="text-white/60" />
          <span>Top Stories</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="hover:text-blue-400 cursor-pointer transition">
            <p className="font-medium text-white/90">Web OS simulations reach native desktop performance</p>
            <span className="text-[10px] text-white/40">Tech Insider • 1h ago</span>
          </div>
          <div className="border-t border-white/5 pt-1.5 hover:text-blue-400 cursor-pointer transition">
            <p className="font-medium text-white/90">Breakthroughs in synthesized Web Audio for browser environments</p>
            <span className="text-[10px] text-white/40">Audio Dev • 3h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
