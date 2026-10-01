import React, { useState, useEffect } from 'react';
import { History, Delete } from 'lucide-react';
import { soundManager } from '../services/sound';

export const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleDigit = (digit: string) => {
    soundManager.playClick();
    if (isNewNumber) {
      setDisplay(digit);
      setIsNewNumber(false);
    } else {
      setDisplay((prev) => (prev === '0' && digit !== '.' ? digit : prev + digit));
    }
  };

  const handleOperator = (op: string) => {
    soundManager.playClick();
    setEquation(`${display} ${op}`);
    setIsNewNumber(true);
  };

  const handleEqual = () => {
    soundManager.playClick();
    if (!equation) return;
    try {
      const fullExpr = `${equation} ${display}`
        .replace(/×/g, '*')
        .replace(/÷/g, '/');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${fullExpr})`)();
      const rounded = Math.round(result * 100000000) / 100000000;
      const historyItem = `${equation} ${display} = ${rounded}`;
      setHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
      setDisplay(String(rounded));
      setEquation('');
      setIsNewNumber(true);
    } catch (_) {
      setDisplay('Error');
      setIsNewNumber(true);
    }
  };

  const handleClear = () => {
    soundManager.playClick();
    setDisplay('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleBackspace = () => {
    soundManager.playClick();
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setIsNewNumber(true);
    }
  };

  const handleScientificOp = (op: string) => {
    soundManager.playClick();
    const val = parseFloat(display);
    let result = 0;
    switch (op) {
      case 'sin':
        result = Math.sin((val * Math.PI) / 180);
        break;
      case 'cos':
        result = Math.cos((val * Math.PI) / 180);
        break;
      case 'tan':
        result = Math.tan((val * Math.PI) / 180);
        break;
      case 'sqrt':
        result = Math.sqrt(val);
        break;
      case 'sqr':
        result = val * val;
        break;
      case 'log':
        result = Math.log10(val);
        break;
      case 'ln':
        result = Math.log(val);
        break;
      case '1/x':
        result = 1 / val;
        break;
      case 'neg':
        result = -val;
        break;
    }
    const rounded = Math.round(result * 100000000) / 100000000;
    setHistory((prev) => [`${op}(${display}) = ${rounded}`, ...prev]);
    setDisplay(String(rounded));
    setIsNewNumber(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#202020] text-white font-sans select-none relative">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsScientific(false)}
            className={`px-2.5 py-1 rounded transition ${
              !isScientific ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setIsScientific(true)}
            className={`px-2.5 py-1 rounded transition ${
              isScientific ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Scientific
          </button>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded transition ${
            showHistory ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="History"
        >
          <History size={16} />
        </button>
      </div>

      {/* Screen Display */}
      <div className="px-4 py-3 flex flex-col items-end justify-center min-h-[90px] border-b border-white/5">
        <div className="text-white/40 text-xs font-mono h-4 truncate">{equation}</div>
        <div className="text-3xl font-semibold tracking-tight text-white truncate max-w-full font-sans">
          {display}
        </div>
      </div>

      {/* Main Keypad */}
      <div className="flex-1 grid grid-cols-4 gap-1 p-2 bg-[#1b1b1b]">
        {isScientific && (
          <>
            <button onClick={() => handleScientificOp('sin')} className="sci-btn">sin</button>
            <button onClick={() => handleScientificOp('cos')} className="sci-btn">cos</button>
            <button onClick={() => handleScientificOp('tan')} className="sci-btn">tan</button>
            <button onClick={() => handleScientificOp('log')} className="sci-btn">log</button>
            <button onClick={() => handleScientificOp('sqrt')} className="sci-btn">√</button>
            <button onClick={() => handleScientificOp('sqr')} className="sci-btn">x²</button>
            <button onClick={() => handleScientificOp('1/x')} className="sci-btn">1/x</button>
            <button onClick={() => handleScientificOp('ln')} className="sci-btn">ln</button>
          </>
        )}

        {/* Standard Keys */}
        <button onClick={handleClear} className="fn-btn">C</button>
        <button onClick={handleBackspace} className="fn-btn flex items-center justify-center">
          <Delete size={16} />
        </button>
        <button onClick={() => handleScientificOp('neg')} className="fn-btn">±</button>
        <button onClick={() => handleOperator('÷')} className="op-btn">÷</button>

        <button onClick={() => handleDigit('7')} className="num-btn">7</button>
        <button onClick={() => handleDigit('8')} className="num-btn">8</button>
        <button onClick={() => handleDigit('9')} className="num-btn">9</button>
        <button onClick={() => handleOperator('×')} className="op-btn">×</button>

        <button onClick={() => handleDigit('4')} className="num-btn">4</button>
        <button onClick={() => handleDigit('5')} className="num-btn">5</button>
        <button onClick={() => handleDigit('6')} className="num-btn">6</button>
        <button onClick={() => handleOperator('-')} className="op-btn">-</button>

        <button onClick={() => handleDigit('1')} className="num-btn">1</button>
        <button onClick={() => handleDigit('2')} className="num-btn">2</button>
        <button onClick={() => handleDigit('3')} className="num-btn">3</button>
        <button onClick={() => handleOperator('+')} className="op-btn">+</button>

        <button onClick={() => handleDigit('0')} className="num-btn col-span-2">0</button>
        <button onClick={() => handleDigit('.')} className="num-btn">.</button>
        <button onClick={handleEqual} className="bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-lg active:scale-95 transition">
          =
        </button>
      </div>

      {/* History Slide-over */}
      {showHistory && (
        <div className="absolute inset-y-0 right-0 w-56 bg-[#252525] border-l border-white/10 p-3 shadow-xl z-20 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/80">History</span>
            <button
              onClick={() => setHistory([])}
              className="text-[10px] text-red-400 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {history.length === 0 ? (
              <div className="text-white/40 italic text-center py-6">There's no history yet</div>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="p-2 bg-white/5 rounded border border-white/5 hover:border-white/20 font-mono text-right">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Custom Key Styling */}
      <style>{`
        .num-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-weight: 500;
          font-size: 15px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s;
        }
        .num-btn:hover {
          background: rgba(255, 255, 255, 0.16);
        }
        .num-btn:active {
          transform: scale(0.97);
        }
        .fn-btn {
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fn-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .op-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #60a5fa;
          font-size: 16px;
          font-weight: 600;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .op-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .sci-btn {
          background: rgba(255, 255, 255, 0.04);
          color: #a78bfa;
          font-size: 11px;
          font-family: monospace;
          border-radius: 4px;
          padding: 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sci-btn:hover {
          background: rgba(167, 139, 250, 0.2);
        }
      `}</style>
    </div>
  );
};
