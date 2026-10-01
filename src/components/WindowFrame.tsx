import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { WindowInstance } from '../types/os';
import { soundManager } from '../services/sound';

interface WindowFrameProps {
  window: WindowInstance;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximizeToggle: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number, x?: number, y?: number) => void;
  onSnap: (zone: 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'full') => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onMaximizeToggle,
  onMove,
  onResize,
  onSnap,
  children,
}) => {
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const snapMenuTimeout = useRef<any>(null);
  const rafId = useRef<number | null>(null);

  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });

  // Resizing state
  const isResizing = useRef(false);
  const resizeDir = useRef<string>('');
  const resizeStart = useRef({
    mouseX: 0,
    mouseY: 0,
    winX: 0,
    winY: 0,
    winW: 0,
    winH: 0,
  });

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    if (win.isMaximized) return; // don't drag if maximized
    onFocus();
    isDragging.current = true;
    setIsInteracting(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.x,
      winY: win.y,
    };
    e.preventDefault();
  };

  const handleResizeMouseDown = (dir: string, e: React.MouseEvent) => {
    if (e.button !== 0 || win.isMaximized) return;
    e.stopPropagation();
    onFocus();
    isResizing.current = true;
    setIsInteracting(true);
    resizeDir.current = dir;
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.x,
      winY: win.y,
      winW: win.width,
      winH: win.height,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current && !isResizing.current) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        if (isDragging.current) {
          const dx = e.clientX - dragStart.current.mouseX;
          const dy = e.clientY - dragStart.current.mouseY;
          let newX = dragStart.current.winX + dx;
          let newY = Math.max(0, dragStart.current.winY + dy); // can't drag above screen
          // Keep at least 100px on screen
          const maxW = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const maxH = typeof window !== 'undefined' ? window.innerHeight : 800;
          newX = Math.min(maxW - 100, Math.max(-win.width + 100, newX));
          newY = Math.min(maxH - 80, newY);
          onMove(newX, newY);
        } else if (isResizing.current) {
          const dx = e.clientX - resizeStart.current.mouseX;
          const dy = e.clientY - resizeStart.current.mouseY;
          const dir = resizeDir.current;
          const minW = win.minWidth || 340;
          const minH = win.minHeight || 240;

          let newW = resizeStart.current.winW;
          let newH = resizeStart.current.winH;
          let newX = resizeStart.current.winX;
          let newY = resizeStart.current.winY;

          if (dir.includes('e')) {
            newW = Math.max(minW, resizeStart.current.winW + dx);
          }
          if (dir.includes('s')) {
            newH = Math.max(minH, resizeStart.current.winH + dy);
          }
          if (dir.includes('w')) {
            const potW = resizeStart.current.winW - dx;
            if (potW >= minW) {
              newW = potW;
              newX = resizeStart.current.winX + dx;
            }
          }
          if (dir.includes('n')) {
            const potH = resizeStart.current.winH - dy;
            if (potH >= minH) {
              newH = potH;
              newY = resizeStart.current.winY + dy;
            }
          }

          onResize(newW, newH, newX, newY);
        }
      });
    },
    [win.width, win.minWidth, win.minHeight, onMove, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    isDragging.current = false;
    isResizing.current = false;
    setIsInteracting(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (win.isMinimized) {
    return null;
  }

  const snapStyle: React.CSSProperties = win.isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 48px)', // above taskbar
        borderRadius: 0,
      }
    : {
        top: win.y,
        left: win.x,
        width: win.width,
        height: win.height,
        borderRadius: '8px',
      };

  return (
    <>
      {/* Global pointer capture during drag/resize to guarantee 60/120fps smoothness over iframes */}
      {isInteracting && (
        <div className="fixed inset-0 z-[999999] cursor-move select-none pointer-events-auto" />
      )}

      <div
        onMouseDown={onFocus}
        style={{
          ...snapStyle,
          zIndex: win.zIndex,
        }}
        className={`absolute flex flex-col overflow-hidden select-none ${
          isActive
            ? 'shadow-2xl shadow-black/45 ring-1 ring-white/20'
            : 'shadow-lg shadow-black/25 ring-1 ring-white/10 opacity-95'
        } ${
          isInteracting
            ? 'will-change-[top,left,width,height]'
            : 'transition-[top,left,width,height,border-radius,box-shadow] duration-200 fluent-motion'
        } bg-[#1e1e1ed9] backdrop-blur-2xl border border-white/10 text-white`}
      >
      {/* Titlebar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={onMaximizeToggle}
        className={`h-9 min-h-9 flex items-center justify-between px-3 cursor-default select-none border-b border-white/5 ${
          isActive ? 'bg-white/[0.06]' : 'bg-transparent text-white/70'
        }`}
      >
        <div className="flex items-center space-x-2.5 overflow-hidden pr-2">
          <span className="text-base select-none leading-none">{win.icon}</span>
          <span className="text-xs font-medium tracking-wide truncate select-none text-white/90">
            {win.title}
          </span>
        </div>

        {/* Window controls */}
        <div className="flex items-center h-full relative" onMouseDown={(e) => e.stopPropagation()}>
          {/* Minimize */}
          <button
            onClick={() => {
              soundManager.playClick();
              onMinimize();
            }}
            title="Minimize"
            className="w-11 h-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <Minus size={13} strokeWidth={2} />
          </button>

          {/* Maximize / Restore & Snap flyout trigger */}
          <div
            className="relative h-full"
            onMouseEnter={() => {
              snapMenuTimeout.current = setTimeout(() => setShowSnapMenu(true), 300);
            }}
            onMouseLeave={() => {
              clearTimeout(snapMenuTimeout.current);
              setShowSnapMenu(false);
            }}
          >
            <button
              onClick={() => {
                soundManager.playClick();
                onMaximizeToggle();
              }}
              title={win.isMaximized ? 'Restore' : 'Maximize'}
              className="w-11 h-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              {win.isMaximized ? (
                <Copy size={12} strokeWidth={1.8} className="transform rotate-180" />
              ) : (
                <Square size={12} strokeWidth={1.8} />
              )}
            </button>

            {/* Win11 Snap Layouts Flyout Menu */}
            {showSnapMenu && (
              <div
                className="absolute right-0 top-9 w-60 bg-[#2b2b2bee] backdrop-blur-xl border border-white/20 rounded-lg p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseEnter={() => clearTimeout(snapMenuTimeout.current)}
              >
                <div className="text-[10px] uppercase font-semibold text-white/50 tracking-wider mb-2">
                  Snap Window Layout
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Left / Right 50% */}
                  <div className="flex space-x-1 p-1 bg-white/5 rounded border border-white/10 hover:border-blue-400 cursor-pointer">
                    <button
                      onClick={() => {
                        onSnap('left');
                        setShowSnapMenu(false);
                      }}
                      className="w-1/2 h-9 bg-white/10 hover:bg-blue-500/60 rounded flex items-center justify-center text-[10px] text-white/80"
                    >
                      50% Left
                    </button>
                    <button
                      onClick={() => {
                        onSnap('right');
                        setShowSnapMenu(false);
                      }}
                      className="w-1/2 h-9 bg-white/10 hover:bg-blue-500/60 rounded flex items-center justify-center text-[10px] text-white/80"
                    >
                      50% Right
                    </button>
                  </div>

                  {/* 4 Quadrants */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded border border-white/10 hover:border-blue-400 cursor-pointer">
                    <button
                      onClick={() => {
                        onSnap('top-left');
                        setShowSnapMenu(false);
                      }}
                      className="h-4 bg-white/10 hover:bg-blue-500/60 rounded"
                      title="Top Left"
                    />
                    <button
                      onClick={() => {
                        onSnap('top-right');
                        setShowSnapMenu(false);
                      }}
                      className="h-4 bg-white/10 hover:bg-blue-500/60 rounded"
                      title="Top Right"
                    />
                    <button
                      onClick={() => {
                        onSnap('bottom-left');
                        setShowSnapMenu(false);
                      }}
                      className="h-4 bg-white/10 hover:bg-blue-500/60 rounded"
                      title="Bottom Left"
                    />
                    <button
                      onClick={() => {
                        onSnap('bottom-right');
                        setShowSnapMenu(false);
                      }}
                      className="h-4 bg-white/10 hover:bg-blue-500/60 rounded"
                      title="Bottom Right"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            title="Close"
            className="w-11 h-full flex items-center justify-center hover:bg-red-600 text-white/80 hover:text-white transition-colors"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className={`flex-1 overflow-hidden relative flex flex-col bg-[#181818]/90 text-white select-auto ${
        isInteracting ? 'pointer-events-none select-none' : ''
      }`}>
        {children}
      </div>

      {/* Resize Handles (Only if not maximized) */}
      {!win.isMaximized && (
        <>
          <div
            onMouseDown={(e) => handleResizeMouseDown('n', e)}
            className="absolute top-0 left-2 right-2 h-1.5 cursor-ns-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('s', e)}
            className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('w', e)}
            className="absolute top-2 bottom-2 left-0 w-1.5 cursor-ew-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('e', e)}
            className="absolute top-2 bottom-2 right-0 w-1.5 cursor-ew-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('nw', e)}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('ne', e)}
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('sw', e)}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown('se', e)}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
          />
        </>
      )}
    </div>
    </>
  );
};
