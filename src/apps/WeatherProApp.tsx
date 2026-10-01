import React, { useState } from 'react';
import { CloudSun, CloudRain, Sun, Wind, Droplets, Compass, MapPin } from 'lucide-react';
import { soundManager } from '../services/sound';

export const WeatherProApp: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('San Francisco');

  const CITIES = [
    { name: 'San Francisco', temp: 68, condition: 'Partly Sunny', high: 72, low: 55, humidity: 64, wind: '9 mph' },
    { name: 'New York', temp: 75, condition: 'Sunny', high: 80, low: 62, humidity: 50, wind: '6 mph' },
    { name: 'London', temp: 61, condition: 'Light Rain', high: 64, low: 52, humidity: 82, wind: '14 mph' },
    { name: 'Tokyo', temp: 72, condition: 'Clear Night', high: 78, low: 65, humidity: 58, wind: '7 mph' },
  ];

  const cityData = CITIES.find((c) => c.name === selectedCity) || CITIES[0];

  return (
    <div className="flex flex-col h-full bg-[#181818] text-white select-none overflow-y-auto">
      {/* Top Header & City Selector */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#202020]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
          <MapPin size={15} className="text-blue-400" />
          <span>Weather Pro Radar</span>
        </div>
        <div className="flex space-x-1">
          {CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                soundManager.playClick();
                setSelectedCity(c.name);
              }}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                selectedCity === c.name
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weather Overview Card */}
      <div className="p-6 max-w-2xl mx-auto w-full space-y-5">
        <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/20 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-200">{cityData.name}</div>
            <div className="text-6xl font-light text-white my-1">{cityData.temp}°</div>
            <div className="text-sm text-blue-300 font-medium">{cityData.condition}</div>
            <div className="text-xs text-white/50 mt-1">H: {cityData.high}° • L: {cityData.low}°</div>
          </div>
          <CloudSun size={72} className="text-amber-400" strokeWidth={1.5} />
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#242424] p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
            <Droplets size={20} className="text-blue-400" />
            <div>
              <div className="text-[10px] text-white/50 uppercase">Humidity</div>
              <div className="text-sm font-bold text-white">{cityData.humidity}%</div>
            </div>
          </div>
          <div className="bg-[#242424] p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
            <Wind size={20} className="text-teal-400" />
            <div>
              <div className="text-[10px] text-white/50 uppercase">Wind Speed</div>
              <div className="text-sm font-bold text-white">{cityData.wind}</div>
            </div>
          </div>
          <div className="bg-[#242424] p-3.5 rounded-xl border border-white/5 flex items-center space-x-3">
            <Compass size={20} className="text-emerald-400" />
            <div>
              <div className="text-[10px] text-white/50 uppercase">Air Quality</div>
              <div className="text-sm font-bold text-emerald-400">32 (Good)</div>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast Cards */}
        <div className="bg-[#242424] p-4 rounded-xl border border-white/5 space-y-2">
          <div className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
            7-Day Forecast
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={day} className="bg-black/20 p-2 rounded-lg space-y-1">
                <span className="text-[10px] text-white/50">{day}</span>
                <div className="text-base">{idx % 2 === 0 ? '⛅' : idx === 3 ? '🌧️' : '☀️'}</div>
                <div className="text-xs font-bold text-white">{66 + (idx % 4)}°</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
