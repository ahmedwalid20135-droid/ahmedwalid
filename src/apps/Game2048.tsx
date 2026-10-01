import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, Sparkles } from 'lucide-react';
import { soundManager } from '../services/sound';

type Board = number[][];

const BEST_SCORE_KEY = 'win11_2048_best';

export const Game2048: React.FC = () => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
    } catch (_) {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const addRandomTile = useCallback((b: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return b;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = b.map((row) => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const initGame = useCallback(() => {
    let b: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const slideAndMerge = (row: number[]): { newRow: number[]; gainedScore: number } => {
    let filtered = row.filter((val) => val !== 0);
    let gainedScore = 0;

    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        gainedScore += filtered[i];
        filtered[i + 1] = 0;
      }
    }
    filtered = filtered.filter((val) => val !== 0);
    while (filtered.length < 4) {
      filtered.push(0);
    }
    return { newRow: filtered, gainedScore };
  };

  const move = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;
      let totalGained = 0;
      let moved = false;
      const newBoard: Board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];

      if (direction === 'left') {
        for (let r = 0; r < 4; r++) {
          const { newRow, gainedScore } = slideAndMerge(board[r]);
          newBoard[r] = newRow;
          totalGained += gainedScore;
          if (newRow.some((val, i) => val !== board[r][i])) moved = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < 4; r++) {
          const reversed = [...board[r]].reverse();
          const { newRow, gainedScore } = slideAndMerge(reversed);
          newBoard[r] = newRow.reverse();
          totalGained += gainedScore;
          if (newBoard[r].some((val, i) => val !== board[r][i])) moved = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < 4; c++) {
          const col = [board[0][c], board[1][c], board[2][c], board[3][c]];
          const { newRow, gainedScore } = slideAndMerge(col);
          totalGained += gainedScore;
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = newRow[r];
            if (newRow[r] !== board[r][c]) moved = true;
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < 4; c++) {
          const col = [board[3][c], board[2][c], board[1][c], board[0][c]];
          const { newRow, gainedScore } = slideAndMerge(col);
          totalGained += gainedScore;
          const unreversed = newRow.reverse();
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = unreversed[r];
            if (unreversed[r] !== board[r][c]) moved = true;
          }
        }
      }

      if (moved) {
        soundManager.playClick();
        const updatedBoard = addRandomTile(newBoard);
        setBoard(updatedBoard);
        const newScore = score + totalGained;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          try {
            localStorage.setItem(BEST_SCORE_KEY, String(newScore));
          } catch (_) {}
        }

        // Check if 2048 reached
        if (!hasWon && updatedBoard.some((row) => row.some((val) => val === 2048))) {
          setHasWon(true);
          soundManager.playVictory();
        }

        // Check game over
        let hasMoves = false;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (updatedBoard[r][c] === 0) hasMoves = true;
            if (r < 3 && updatedBoard[r][c] === updatedBoard[r + 1][c]) hasMoves = true;
            if (c < 3 && updatedBoard[r][c] === updatedBoard[r][c + 1]) hasMoves = true;
          }
        }
        if (!hasMoves) {
          setGameOver(true);
          soundManager.playError();
        }
      }
    },
    [board, gameOver, score, bestScore, hasWon, addRandomTile]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') move('left');
        if (e.key === 'ArrowRight') move('right');
        if (e.key === 'ArrowUp') move('up');
        if (e.key === 'ArrowDown') move('down');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-[#eee4da] text-[#776e65]';
      case 4: return 'bg-[#ede0c8] text-[#776e65]';
      case 8: return 'bg-[#f2b179] text-white';
      case 16: return 'bg-[#f59563] text-white';
      case 32: return 'bg-[#f67c5f] text-white';
      case 64: return 'bg-[#f65e3b] text-white';
      case 128: return 'bg-[#edcf72] text-white text-xl shadow-lg';
      case 256: return 'bg-[#edcc61] text-white text-xl shadow-lg';
      case 512: return 'bg-[#edc850] text-white text-xl shadow-lg';
      case 1024: return 'bg-[#edc53f] text-white text-lg shadow-xl';
      case 2048: return 'bg-[#edc22e] text-white text-lg shadow-2xl ring-4 ring-yellow-300';
      default: return 'bg-white/10 text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white select-none p-5 items-center justify-between">
      {/* Top Header */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wider">2048</h1>
          <p className="text-[11px] text-white/50">Win11 Web OS Edition</p>
        </div>

        <div className="flex space-x-2">
          <div className="bg-[#2c2c2c] px-3 py-1.5 rounded-xl border border-white/10 text-center min-w-16">
            <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Score</div>
            <div className="text-sm font-bold text-white">{score}</div>
          </div>
          <div className="bg-[#2c2c2c] px-3 py-1.5 rounded-xl border border-white/10 text-center min-w-16">
            <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold flex items-center justify-center space-x-0.5">
              <Trophy size={9} />
              <span>Best</span>
            </div>
            <div className="text-sm font-bold text-amber-300">{bestScore}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative w-80 h-80 bg-[#282828] border-2 border-white/15 p-3 rounded-2xl shadow-2xl grid grid-cols-4 gap-2.5 my-2">
        {board.map((row, r) =>
          row.map((val, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-2xl transition-all duration-100 ${
                val === 0 ? 'bg-white/5' : getTileColor(val)
              }`}
            >
              {val > 0 ? val : ''}
            </div>
          ))
        )}

        {/* Game Over / Win Overlay */}
        {(gameOver || hasWon) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white">
              {hasWon ? '🎉 2048 Achieved!' : 'Game Over!'}
            </h2>
            <p className="text-xs text-white/70">Final Score: {score}</p>
            <button
              onClick={initGame}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons & Direction Keys */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <button
          onClick={initGame}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-medium text-white transition"
        >
          <RotateCcw size={14} />
          <span>New Game</span>
        </button>

        {/* Direction Controls for touch or mouse */}
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onClick={() => move('up')}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold"
          >
            ▲
          </button>
          <div />
          <button
            onClick={() => move('left')}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold"
          >
            ◀
          </button>
          <button
            onClick={() => move('down')}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold"
          >
            ▼
          </button>
          <button
            onClick={() => move('right')}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
