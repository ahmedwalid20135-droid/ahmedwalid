import React from 'react';
import {
  Wifi,
  Bluetooth,
  Moon,
  Volume2,
  VolumeX,
  Sun,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Plane,
  Settings as SettingsIcon,
  Shield,
  Power,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { SystemSettings } from '../types/os';
import { soundManager } from '../services/sound';

interface QuickSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onOpenSettings: () => void;
  onClose: () => void;
  onShutdown?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onLock?: () => void;
  deviceName?: string;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  onClose,
  onShutdown,
  onSleep,
  onRestart,
  onLock,
  deviceName = 'Lenovo',
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 right-3 w-84 bg-[#232323f0] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 text-white z-[9000] select-none animate-in fade-in slide-in-from-bottom-3 duration-150"
    >
      {/* Quick Toggles Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {/* Wi-Fi */}
        <button
          onClick={() => {
            soundManager.playClick();
            onUpdateSettings({ wifiEnabled: !settings.wifiEnabled });
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            settings.wifiEnabled
              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <Wifi size={18} className="mb-1.5" />
          <span className="text-[11px] font-medium">Wi-Fi</span>
        </button>

        {/* Bluetooth */}
        <button
          onClick={() => {
            soundManager.playClick();
            onUpdateSettings({ bluetoothEnabled: !settings.bluetoothEnabled });
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            settings.bluetoothEnabled
              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <Bluetooth size={18} className="mb-1.5" />
          <span className="text-[11px] font-medium">Bluetooth</span>
        </button>

        {/* Night Light */}
        <button
          onClick={() => {
            soundManager.playClick();
            onUpdateSettings({ nightLight: !settings.nightLight });
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            settings.nightLight
              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <Moon size={18} className="mb-1.5" />
          <span className="text-[11px] font-medium">Night Light</span>
        </button>

        {/* Airplane Mode */}
        <button
          onClick={() => {
            soundManager.playClick();
            onUpdateSettings({ airplaneMode: !settings.airplaneMode });
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            settings.airplaneMode
              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          <Plane size={18} className="mb-1.5" />
          <span className="text-[11px] font-medium">Airplane</span>
        </button>

        {/* Audio Mute / Sound Toggle */}
        <button
          onClick={() => {
            const next = !settings.soundEnabled;
            soundManager.enabled = next;
            onUpdateSettings({ soundEnabled: next });
            if (next) soundManager.playDing();
          }}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
            settings.soundEnabled
              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
          }`}
        >
          {settings.soundEnabled ? <Volume2 size={18} className="mb-1.5" /> : <VolumeX size={18} className="mb-1.5" />}
          <span className="text-[11px] font-medium">Sound FX</span>
        </button>

        {/* Virtual Shield / Defender */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl border bg-emerald-600/20 border-emerald-500/40 text-emerald-400">
          <Shield size={18} className="mb-1.5" />
          <span className="text-[11px] font-medium">Secured</span>
        </div>
      </div>

      {/* Sliders Area */}
      <div className="space-y-3.5 bg-black/20 p-3 rounded-xl border border-white/5 mb-3">
        {/* Brightness */}
        <div className="flex items-center space-x-3">
          <Sun size={17} className="text-white/60 shrink-0" />
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={settings.brightness}
            onChange={(e) => onUpdateSettings({ brightness: Number(e.target.value) })}
            className="w-full accent-blue-500 cursor-pointer h-1.5"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center space-x-3">
          <Volume2 size={17} className="text-white/60 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              soundManager.volume = v;
              onUpdateSettings({ volume: v });
            }}
            className="w-full accent-blue-500 cursor-pointer h-1.5"
          />
        </div>
      </div>

      {/* Footer Info & Settings Link */}
      <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
        <div className="flex items-center justify-between text-white/60">
          <div
            onClick={() => {
              soundManager.playClick();
              onUpdateSettings({ isCharging: !settings.isCharging });
            }}
            className="flex items-center space-x-2 cursor-pointer hover:text-white transition"
            title="Click to toggle charger plugged in"
          >
            {settings.isCharging ? (
              <BatteryCharging size={16} className="text-emerald-400 animate-pulse" />
            ) : settings.batteryLevel >= 80 ? (
              <BatteryFull size={15} className="text-emerald-400" />
            ) : settings.batteryLevel >= 40 ? (
              <BatteryMedium size={15} className="text-blue-400" />
            ) : settings.batteryLevel >= 15 ? (
              <BatteryLow size={15} className="text-amber-400" />
            ) : (
              <BatteryWarning size={15} className="text-red-400 animate-pulse" />
            )}
            <span className="text-[11px] font-medium text-white/90">
              {settings.batteryLevel}% {settings.isCharging ? '(Charging)' : '(On battery)'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="bg-[#e11424] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
              {deviceName || 'LENOVO'}
            </span>
          </div>
        </div>

        {/* Device Power Quick Bar */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-white/70">
          <span className="text-[11px] text-white/50">Device: {deviceName || 'Lenovo'}</span>

          <div className="flex items-center space-x-1">
            {onLock && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onLock();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer"
                title="Lock PC (Windows Hello)"
              >
                <Lock size={14} className="text-blue-400" />
              </button>
            )}
            {onSleep && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onSleep();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer"
                title="Sleep"
              >
                <Moon size={14} className="text-blue-400" />
              </button>
            )}
            {onRestart && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onRestart();
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer"
                title="Restart"
              >
                <RotateCcw size={14} className="text-blue-400" />
              </button>
            )}
            {onShutdown && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                  onShutdown();
                }}
                className="p-1.5 hover:bg-[#e11424]/20 rounded-lg text-[#e11424] transition cursor-pointer"
                title="Shut down"
              >
                <Power size={14} />
              </button>
            )}
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenSettings();
                onClose();
              }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition cursor-pointer ml-1"
              title="All Settings"
            >
              <SettingsIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
