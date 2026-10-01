import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Check, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types/os';
import { soundManager } from '../services/sound';

interface CalendarFlyoutProps {
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onClose: () => void;
}

export const CalendarFlyout: React.FC<CalendarFlyoutProps> = ({
  notifications,
  onClearNotifications,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    soundManager.playClick();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    soundManager.playClick();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 right-3 w-84 bg-[#232323f0] backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 text-white z-[9000] select-none animate-in fade-in slide-in-from-bottom-3 duration-150 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto"
    >
      {/* Notifications Header */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-white/90">
            <Bell size={14} className="text-blue-400" />
            <span>Notifications ({notifications.length})</span>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => {
                soundManager.playTrashEmpty();
                onClearNotifications();
              }}
              className="text-[11px] text-white/50 hover:text-white transition flex items-center space-x-1"
            >
              <Trash2 size={11} />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-3 text-white/40 text-xs italic">
            No new notifications
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs border border-white/5 transition"
              >
                <div className="flex justify-between font-medium text-white/90">
                  <span>{n.title}</span>
                  <span className="text-[10px] text-white/40">{n.time}</span>
                </div>
                <div className="text-white/60 text-[11px] mt-0.5">{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Area */}
      <div>
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-semibold text-white">
            {monthNames[month]} {year}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-white/40 font-medium mb-1">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isToday = isCurrentMonth && dayNum === now.getDate();
            return (
              <button
                key={dayNum}
                className={`h-8 flex items-center justify-center rounded-full transition text-xs ${
                  isToday
                    ? 'bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/50'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
