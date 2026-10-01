import React, { useState, useEffect, useRef } from 'react';
import { Clock, Timer, Hourglass, Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { soundManager } from '../services/sound';

export const ClockApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'clock' | 'stopwatch' | 'timer'>('clock');

  // Clock state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Stopwatch state
  const [swTime, setSwTime] = useState(0); // in ms
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const swIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (swRunning) {
      const start = Date.now() - swTime;
      swIntervalRef.current = setInterval(() => {
        setSwTime(Date.now() - start);
      }, 30);
    } else {
      clearInterval(swIntervalRef.current);
    }
    return () => clearInterval(swIntervalRef.current);
  }, [swRunning]);

  const handleLap = () => {
    soundManager.playClick();
    setLaps((prev) => [swTime, ...prev]);
  };

  const handleResetStopwatch = () => {
    soundManager.playClick();
    setSwRunning(false);
    setSwTime(0);
    setLaps([]);
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min default
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            soundManager.playDing();
            setTimeout(() => soundManager.playDing(), 600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const handleResetTimer = () => {
    soundManager.playClick();
    setTimerRunning(false);
    setTimerRemaining(timerSeconds);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white select-none">
      {/* Top Navigation */}
      <div className="flex items-center px-4 py-2 border-b border-white/10 bg-[#252525] space-x-2">
        {[
          { id: 'clock', label: 'World Clock', icon: Clock },
          { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
          { id: 'timer', label: 'Timer', icon: Hourglass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                isActive ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center">
        {activeTab === 'clock' && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div>
              <div className="text-6xl font-light tracking-tight font-sans text-white">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-blue-400 font-medium mt-1">
                {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* World Clocks Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-left">
              {[
                { city: 'London, UK', offset: 0 },
                { city: 'Tokyo, Japan', offset: 9 },
                { city: 'New York, US', offset: -5 },
                { city: 'San Francisco, US', offset: -8 },
              ].map((loc) => {
                const utc = now.getTime() + now.getTimezoneOffset() * 60000;
                const cityDate = new Date(utc + 3600000 * loc.offset);
                return (
                  <div key={loc.city} className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-xs text-white/50">{loc.city}</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {cityDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'stopwatch' && (
          <div className="w-full max-w-sm flex flex-col items-center space-y-5">
            <div className="text-6xl font-mono font-bold text-white tracking-wider">
              {formatStopwatch(swTime)}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSwRunning(!swRunning);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition active:scale-95 ${
                  swRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {swRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <button
                onClick={handleLap}
                disabled={!swRunning}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white flex items-center justify-center transition"
                title="Lap"
              >
                <Flag size={16} />
              </button>

              <button
                onClick={handleResetStopwatch}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Lap list */}
            {laps.length > 0 && (
              <div className="w-full max-h-40 overflow-y-auto space-y-1.5 border-t border-white/10 pt-3 text-xs">
                {laps.map((lap, idx) => (
                  <div key={idx} className="flex justify-between px-3 py-1 bg-white/5 rounded-lg font-mono">
                    <span className="text-white/50">Lap {laps.length - idx}</span>
                    <span className="font-semibold text-white">{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="w-full max-w-sm flex flex-col items-center space-y-6">
            <div className="text-6xl font-mono font-bold text-white">
              {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:
              {String(timerRemaining % 60).padStart(2, '0')}
            </div>

            {/* Quick Presets */}
            {!timerRunning && (
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { label: '1 min', sec: 60 },
                  { label: '3 min', sec: 180 },
                  { label: '5 min', sec: 300 },
                  { label: '10 min', sec: 600 },
                  { label: '25 min (Pomodoro)', sec: 1500 },
                ].map((p) => (
                  <button
                    key={p.sec}
                    onClick={() => {
                      soundManager.playClick();
                      setTimerSeconds(p.sec);
                      setTimerRemaining(p.sec);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                      timerSeconds === p.sec
                        ? 'bg-blue-600 border-blue-500 text-white font-medium'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setTimerRunning(!timerRunning);
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition active:scale-95 ${
                  timerRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {timerRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>

              <button
                onClick={handleResetTimer}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition"
                title="Reset Timer"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
