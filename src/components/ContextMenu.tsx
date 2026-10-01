import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('contextmenu', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [onClose]);

  // Adjust coordinates if menu overflows window edges
  const adjX = Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 220);
  const adjY = Math.min(y, (typeof window !== 'undefined' ? window.innerHeight : 800) - (items.length * 36 + 20));

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjX}px`, top: `${adjY}px` }}
      className="fixed z-[9990] w-56 bg-[#252525f2] backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 text-xs text-white/90 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {items.map((item, idx) => {
        if (item.divider) {
          return <div key={idx} className="h-px bg-white/10 my-1" />;
        }
        return (
          <button
            key={idx}
            disabled={item.disabled}
            onClick={() => {
              item.action();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
              item.disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-white/10 hover:text-white cursor-pointer'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {item.icon && <span className="text-white/70">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
