import React, { useState, useEffect } from 'react';
import { Power, Moon, RotateCcw, Monitor, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

export type PowerState = 'normal' | 'sleep' | 'shutting-down' | 'off' | 'restarting' | 'booting';

interface PowerManagerScreenProps {
  powerState: PowerState;
  deviceName?: string;
  onWake: () => void;
  onPowerOn: () => void;
  onRestartComplete: () => void;
}

export const PowerManagerScreen: React.FC<PowerManagerScreenProps> = ({
  powerState,
  deviceName = 'Lenovo',
  onWake,
  onPowerOn,
  onRestartComplete,
}) => {
  const [internalState, setInternalState] = useState<PowerState>(powerState);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Keep internal state in sync with prop
  useEffect(() => {
    setInternalState(powerState);
  }, [powerState]);

  // Update clock for sleep screen
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle auto transitions for shutting-down and restarting/booting
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (internalState === 'shutting-down') {
      timer = setTimeout(() => {
        setInternalState('off');
      }, 1900);
    } else if (internalState === 'restarting') {
      timer = setTimeout(() => {
        setInternalState('booting');
      }, 1800);
    } else if (internalState === 'booting') {
      timer = setTimeout(() => {
        soundManager.playStartupSound();
        onRestartComplete();
      }, 2400);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [internalState, onRestartComplete]);

  // Handle keyboard events for wake & power on
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (internalState === 'sleep') {
        soundManager.playDing();
        onWake();
      } else if (internalState === 'off') {
        if (e.key === ' ' || e.key === 'Enter') {
          soundManager.playClick();
          setInternalState('booting');
          onPowerOn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalState, onWake, onPowerOn]);

  if (internalState === 'normal') {
    return null;
  }

  // 1. SLEEP SCREEN
  if (internalState === 'sleep') {
    return (
      <div
        onClick={() => {
          soundManager.playDing();
          onWake();
        }}
        className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-between p-12 select-none cursor-pointer transition-opacity duration-700 animate-in fade-in"
      >
        <div className="w-full flex justify-between items-center text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#e11424] animate-ping" />
            <span className="font-semibold tracking-wider uppercase text-neutral-400">
              {deviceName} Standby
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Moon size={14} className="text-blue-400" />
            <span>Power saving active</span>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="text-7xl font-extralight tracking-tight text-neutral-200">
            {timeStr}
          </div>
          <div className="text-sm font-light text-neutral-400">{dateStr}</div>

          <div className="pt-8">
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 shadow-lg backdrop-blur-md hover:bg-white/10 transition">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11424] animate-pulse" />
              <span>{deviceName} is asleep. Click anywhere or press any key to wake.</span>
            </div>
          </div>
        </div>

        {/* Footer brand */}
        <div className="text-[11px] text-neutral-600 tracking-widest uppercase font-mono">
          {deviceName} · Innovation Never Stands Still
        </div>
      </div>
    );
  }

  // 2. SHUTTING DOWN SCREEN
  if (internalState === 'shutting-down') {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000e8] backdrop-blur-3xl text-white flex flex-col items-center justify-center select-none font-sans animate-in fade-in duration-300">
        <div className="flex flex-col items-center space-y-6">
          {/* Windows 11 spinning dots circle */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            <div className="absolute w-6 h-6 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-light tracking-wide text-white">Shutting down</h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-[#e11424] text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                {deviceName}
              </span>
              <span className="text-xs text-neutral-400">Saving session &amp; virtual storage</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. RESTARTING SCREEN
  if (internalState === 'restarting') {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#000000eb] backdrop-blur-3xl text-white flex flex-col items-center justify-center select-none font-sans animate-in fade-in duration-300">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinning ring */}
          <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />

          <div className="text-center space-y-2">
            <h2 className="text-xl font-light tracking-wide text-white">Restarting</h2>
            <div className="flex items-center justify-center space-x-2">
              <span className="bg-[#e11424] text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                {deviceName}
              </span>
              <span className="text-xs text-neutral-400">Rebooting subsystem</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. POWERED OFF SCREEN (PC is turned off)
  if (internalState === 'off') {
    return (
      <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-between p-8 select-none">
        {/* Top Header */}
        <div className="w-full flex justify-between items-center text-xs text-neutral-600">
          <span>{deviceName} Hardware System</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
            <span>Power: Off</span>
          </span>
        </div>

        {/* Center Hardware Power Console */}
        <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
          {/* Iconic Lenovo Red Badge */}
          <div className="bg-[#e11424] text-white font-extrabold text-2xl tracking-[0.25em] px-6 py-2 rounded shadow-2xl uppercase">
            {deviceName}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-200">Device is turned off</h3>
            <p className="text-xs text-neutral-400">
              Your {deviceName} computer is currently powered down. Press the power button or press Space / Enter on your keyboard to start up.
            </p>
          </div>

          {/* Interactive Power Button with Glowing Ring */}
          <button
            onClick={() => {
              soundManager.playClick();
              setInternalState('booting');
              onPowerOn();
            }}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-neutral-900 border-2 border-neutral-700 hover:border-[#e11424] text-neutral-300 hover:text-white shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_30px_rgba(225,20,36,0.4)] transition-all duration-300 transform active:scale-95 cursor-pointer mt-2"
            title="Press Power Button to turn on Lenovo PC"
          >
            <div className="absolute inset-0 rounded-full border border-neutral-600 group-hover:border-[#e11424] group-hover:animate-ping opacity-25" />
            <Power size={32} className="group-hover:scale-110 transition-transform text-[#e11424]" />
          </button>

          <div className="text-xs text-neutral-500 font-mono">
            Press <kbd className="px-2 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-neutral-300">Power</kbd> or <kbd className="px-2 py-0.5 bg-neutral-800 rounded border border-neutral-700 text-neutral-300">Space</kbd> to boot
          </div>
        </div>

        {/* Bottom subtle copyright */}
        <div className="text-[11px] text-neutral-700">
          {deviceName} Corporation · All rights reserved
        </div>
      </div>
    );
  }

  // 5. AUTHENTIC LENOVO BOOT SCREEN
  if (internalState === 'booting') {
    return (
      <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-between p-12 select-none">
        <div className="w-full text-left text-xs text-neutral-600 font-mono">
          {deviceName} UEFI BIOS Revision 1.34
        </div>

        {/* Center Lenovo Emblem and Windows 11 Spinner */}
        <div className="flex flex-col items-center space-y-12">
          {/* Lenovo Emblem */}
          <div className="flex flex-col items-center">
            <div className="bg-[#e11424] text-white font-extrabold text-3xl sm:text-4xl tracking-[0.3em] px-8 py-3 rounded shadow-2xl uppercase">
              {deviceName}
            </div>
            <span className="text-[11px] text-neutral-400 font-sans tracking-widest mt-2 uppercase">
              Legion · ThinkPad Performance
            </span>
          </div>

          {/* Windows 11 Dotted Spinning Circle */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '0.9s' }} />
          </div>
        </div>

        {/* Bottom BIOS Hint */}
        <div className="text-center space-y-1">
          <div className="text-xs text-neutral-400 font-sans">
            Starting Windows 11 Pro on {deviceName}...
          </div>
          <div className="text-[11px] text-neutral-600 font-mono">
            To interrupt normal startup, press Enter
          </div>
        </div>
      </div>
    );
  }

  return null;
};
