import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../services/sound';

type Difficulty = 'beginner' | 'intermediate' | 'expert';

interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const CONFIGS = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export const Minesweeper: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [timer, setTimer] = useState(0);
  const [flagsRemaining, setFlagsRemaining] = useState(10);
  const [isFaceGasp, setIsFaceGasp] = useState(false);
  const timerRef = useRef<any>(null);

  const initGame = useCallback((diff: Difficulty = difficulty) => {
    clearInterval(timerRef.current);
    const { rows, cols, mines } = CONFIGS[diff];
    const newGrid: Cell[][] = [];

    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          x: c,
          y: r,
          isMine: false,
          isOpen: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    setGameState('idle');
    setTimer(0);
    setFlagsRemaining(mines);
  }, [difficulty]);

  useEffect(() => {
    initGame(difficulty);
    return () => clearInterval(timerRef.current);
  }, [difficulty, initGame]);

  const placeMines = (startRow: number, startCol: number, currentGrid: Cell[][]) => {
    const { rows, cols, mines } = CONFIGS[difficulty];
    let placed = 0;

    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Safe zone 3x3 around first click
      if (Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1) {
        continue;
      }

      if (!currentGrid[r][c].isMine) {
        currentGrid[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!currentGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (currentGrid[nr][nc].isMine) count++;
              }
            }
          }
          currentGrid[r][c].neighborMines = count;
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState === 'won' || gameState === 'lost') return;
    const cell = grid[r][c];
    if (cell.isOpen || cell.isFlagged) return;

    soundManager.playClick();

    let newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

    if (gameState === 'idle') {
      placeMines(r, c, newGrid);
      setGameState('playing');
      timerRef.current = setInterval(() => {
        setTimer((t) => Math.min(999, t + 1));
      }, 1000);
    }

    if (newGrid[r][c].isMine) {
      // Game Over
      clearInterval(timerRef.current);
      setGameState('lost');
      soundManager.playError();
      // Reveal all mines
      newGrid.forEach((row) =>
        row.forEach((c) => {
          if (c.isMine) c.isOpen = true;
        })
      );
      setGrid(newGrid);
      return;
    }

    // Flood fill
    const reveal = (row: number, col: number) => {
      const { rows, cols } = CONFIGS[difficulty];
      if (row < 0 || row >= rows || col < 0 || col >= cols) return;
      const target = newGrid[row][col];
      if (target.isOpen || target.isFlagged || target.isMine) return;

      target.isOpen = true;
      if (target.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(row + dr, col + dc);
          }
        }
      }
    };

    reveal(r, c);
    setGrid(newGrid);

    // Check Win condition
    const { rows, cols, mines } = CONFIGS[difficulty];
    let closedCount = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newGrid[row][col].isOpen) closedCount++;
      }
    }

    if (closedCount === mines) {
      clearInterval(timerRef.current);
      setGameState('won');
      soundManager.playVictory();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState === 'won' || gameState === 'lost') return;
    const cell = grid[r][c];
    if (cell.isOpen) return;

    soundManager.playClick();
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const target = newGrid[r][c];
    target.isFlagged = !target.isFlagged;
    setFlagsRemaining((f) => (target.isFlagged ? f - 1 : f + 1));
    setGrid(newGrid);
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1:
        return 'text-blue-400 font-bold';
      case 2:
        return 'text-emerald-400 font-bold';
      case 3:
        return 'text-red-400 font-bold';
      case 4:
        return 'text-indigo-400 font-bold';
      case 5:
        return 'text-amber-500 font-bold';
      case 6:
        return 'text-cyan-400 font-bold';
      case 7:
        return 'text-purple-400 font-bold';
      case 8:
        return 'text-pink-400 font-bold';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c] text-white select-none">
      {/* Top Menu */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-white/10 text-xs">
        <div className="flex items-center space-x-1">
          {(['beginner', 'intermediate', 'expert'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                initGame(d);
              }}
              className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                difficulty === d ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="text-white/50 text-[11px]">Right-click to flag</div>
      </div>

      {/* Main Game Frame */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4">
        <div className="bg-[#2a2a2a] p-3 rounded-lg border border-white/20 shadow-2xl inline-block">
          {/* Header Panel */}
          <div className="flex items-center justify-between bg-[#191919] border-2 border-white/10 p-2 rounded mb-3">
            {/* Flags LED */}
            <div className="bg-black text-red-500 font-mono text-xl font-bold px-2 py-0.5 rounded border border-red-900 tracking-wider">
              {String(Math.max(-99, flagsRemaining)).padStart(3, '0')}
            </div>

            {/* Smiley Face Button */}
            <button
              onClick={() => initGame(difficulty)}
              className="w-9 h-9 bg-neutral-700 hover:bg-neutral-600 active:scale-95 rounded-md flex items-center justify-center text-xl shadow border border-white/20"
              title="Reset Game"
            >
              {gameState === 'lost' ? '💀' : gameState === 'won' ? '😎' : isFaceGasp ? '😮' : '🙂'}
            </button>

            {/* Timer LED */}
            <div className="bg-black text-red-500 font-mono text-xl font-bold px-2 py-0.5 rounded border border-red-900 tracking-wider">
              {String(timer).padStart(3, '0')}
            </div>
          </div>

          {/* Grid Area */}
          <div
            className="grid gap-[1px] bg-neutral-900 p-1 rounded border border-white/10 shadow-inner"
            style={{
              gridTemplateColumns: `repeat(${CONFIGS[difficulty].cols}, minmax(0, 1fr))`,
            }}
            onMouseDown={() => setIsFaceGasp(true)}
            onMouseUp={() => setIsFaceGasp(false)}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => handleCellRightClick(e, r, c)}
                  className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-bold transition-colors select-none ${
                    cell.isOpen
                      ? cell.isMine
                        ? 'bg-red-600/80 text-white'
                        : 'bg-[#181818] border border-white/5'
                      : 'bg-[#3b3b3b] hover:bg-[#484848] active:bg-[#252525] border-t border-l border-white/25 border-b-2 border-r-2 border-black/50'
                  }`}
                >
                  {cell.isOpen ? (
                    cell.isMine ? (
                      '💣'
                    ) : cell.neighborMines > 0 ? (
                      <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                    ) : (
                      ''
                    )
                  ) : cell.isFlagged ? (
                    '🚩'
                  ) : (
                    ''
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
