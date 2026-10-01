import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Download,
  FolderOpen,
  Sparkles,
  Check,
  Plus,
  Trash2,
  BarChart2,
  PieChart,
  LineChart,
  Calculator,
  DollarSign,
  Percent,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';
import { webSearchService } from '../services/webSearchService';

interface ExcelAppProps {
  initialContent?: string;
  initialFileName?: string;
  initialFileId?: string;
  onSave?: (fileName: string, content: string) => void;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROW_COUNT = 30;

interface CellData {
  raw: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    bg?: string;
    align?: 'left' | 'center' | 'right';
    isCurrency?: boolean;
    isPercent?: boolean;
  };
}

type SheetGrid = Record<string, CellData>;

const TEMPLATES = [
  {
    id: 'budget',
    name: 'Lenovo Hardware & Tech Budget',
    desc: 'Financial tracking with built-in SUM formulas',
    grid: {
      A1: { raw: 'Category', format: { bold: true, bg: '#107c41', color: '#ffffff' } },
      B1: { raw: 'Item Description', format: { bold: true, bg: '#107c41', color: '#ffffff' } },
      C1: { raw: 'Allocated ($)', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },
      D1: { raw: 'Actual Cost ($)', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },
      E1: { raw: 'Variance ($)', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },

      A2: { raw: 'Hardware' },
      B2: { raw: 'Lenovo Legion G14 Laptop (RTX 4070)' },
      C2: { raw: '1899', format: { isCurrency: true } },
      D2: { raw: '1749', format: { isCurrency: true } },
      E2: { raw: '=C2-D2', format: { isCurrency: true, bold: true } },

      A3: { raw: 'Display' },
      B3: { raw: 'Lenovo Legion 27" 240Hz Gaming Monitor' },
      C3: { raw: '350', format: { isCurrency: true } },
      D3: { raw: '320', format: { isCurrency: true } },
      E3: { raw: '=C3-D3', format: { isCurrency: true, bold: true } },

      A4: { raw: 'Storage' },
      B4: { raw: '2TB PCIe Gen4 NVMe Expansion SSD' },
      C4: { raw: '160', format: { isCurrency: true } },
      D4: { raw: '145', format: { isCurrency: true } },
      E4: { raw: '=C4-D4', format: { isCurrency: true, bold: true } },

      A5: { raw: 'Peripherals' },
      B5: { raw: 'Nahimic Pro Gaming Headset & Mouse' },
      C5: { raw: '120', format: { isCurrency: true } },
      D5: { raw: '99', format: { isCurrency: true } },
      E5: { raw: '=C5-D5', format: { isCurrency: true, bold: true } },

      A6: { raw: 'TOTAL', format: { bold: true, bg: '#f1f5f9' } },
      B6: { raw: 'Consolidated Spend', format: { bold: true, bg: '#f1f5f9' } },
      C6: { raw: '=SUM(C2:C5)', format: { bold: true, bg: '#f1f5f9', isCurrency: true } },
      D6: { raw: '=SUM(D2:D5)', format: { bold: true, bg: '#f1f5f9', isCurrency: true } },
      E6: { raw: '=SUM(E2:E5)', format: { bold: true, bg: '#f1f5f9', isCurrency: true } },
    } as SheetGrid,
  },
  {
    id: 'sales',
    name: 'Quarterly Revenue & Profit Forecast',
    desc: 'Sales metrics with growth percentages',
    grid: {
      A1: { raw: 'Quarter', format: { bold: true, bg: '#107c41', color: '#ffffff' } },
      B1: { raw: 'Units Sold', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },
      C1: { raw: 'Revenue ($)', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },
      D1: { raw: 'Margin %', format: { bold: true, bg: '#107c41', color: '#ffffff', align: 'right' } },
      A2: { raw: 'Q1 2026' },
      B2: { raw: '1420' },
      C2: { raw: '284000', format: { isCurrency: true } },
      D2: { raw: '28.5%', format: { bold: true } },
      A3: { raw: 'Q2 2026' },
      B3: { raw: '1850' },
      C3: { raw: '370000', format: { isCurrency: true } },
      D3: { raw: '31.2%', format: { bold: true } },
      A4: { raw: 'Q3 2026' },
      B4: { raw: '2210' },
      C4: { raw: '442000', format: { isCurrency: true } },
      D4: { raw: '34.0%', format: { bold: true } },
      A5: { raw: 'Q4 2026 (Est)' },
      B5: { raw: '2900' },
      C5: { raw: '580000', format: { isCurrency: true } },
      D5: { raw: '36.5%', format: { bold: true } },
      A6: { raw: 'Total / Avg', format: { bold: true, bg: '#e2e8f0' } },
      B6: { raw: '=SUM(B2:B5)', format: { bold: true, bg: '#e2e8f0' } },
      C6: { raw: '=SUM(C2:C5)', format: { bold: true, bg: '#e2e8f0', isCurrency: true } },
      D6: { raw: '32.5%', format: { bold: true, bg: '#e2e8f0' } },
    } as SheetGrid,
  },
  {
    id: 'blank',
    name: 'Blank Workbook',
    desc: 'Empty spreadsheet ready for your custom formulas',
    grid: {} as SheetGrid,
  },
];

export const ExcelApp: React.FC<ExcelAppProps> = ({
  initialContent,
  initialFileName = 'Book1.xlsx',
  initialFileId,
  onSave,
}) => {
  const [fileName, setFileName] = useState(initialFileName);
  const [fileId, setFileId] = useState<string | null>(initialFileId || null);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'formulas' | 'view'>('home');
  const [sheets, setSheets] = useState<{ id: string; name: string; grid: SheetGrid }[]>([
    { id: 's1', name: 'Sheet1', grid: TEMPLATES[0].grid },
  ]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showChart, setShowChart] = useState<'bar' | 'pie' | 'line' | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(!initialContent);
  const [saveTargetFolder, setSaveTargetFolder] = useState<'documents' | 'desktop'>('documents');

  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentGrid = sheets[activeSheetIndex]?.grid || {};

  // Parse initial content if passed as JSON or CSV
  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (parsed.sheets && Array.isArray(parsed.sheets)) {
          setSheets(parsed.sheets);
          return;
        }
      } catch (_) {
        // Parse simple CSV
        const rows = initialContent.split('\n');
        const grid: SheetGrid = {};
        rows.forEach((r, rIdx) => {
          const cells = r.split(',');
          cells.forEach((c, cIdx) => {
            if (cIdx < COLS.length && rIdx < ROW_COUNT) {
              const key = `${COLS[cIdx]}${rIdx + 1}`;
              grid[key] = { raw: c.trim().replace(/^"|"$/g, '') };
            }
          });
        });
        setSheets([{ id: 's1', name: 'Sheet1', grid }]);
      }
    }
  }, [initialContent]);

  // Synchronize formula bar with selected cell
  useEffect(() => {
    const cell = currentGrid[selectedCell];
    setEditValue(cell?.raw || '');
  }, [selectedCell, activeSheetIndex, currentGrid]);

  // Evaluates formula or returns raw value
  const evaluateCell = (cellKey: string, grid: SheetGrid, visited: Set<string> = new Set()): string => {
    const cell = grid[cellKey];
    if (!cell || !cell.raw) return '';

    const val = cell.raw.trim();
    if (!val.startsWith('=')) {
      return formatDisplay(val, cell.format);
    }

    if (visited.has(cellKey)) return '#REF!';
    visited.add(cellKey);

    const expr = val.substring(1).trim().toUpperCase();

    // Check SUM
    const sumMatch = expr.match(/^SUM\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/);
    if (sumMatch) {
      const sum = calculateRange(sumMatch[1], sumMatch[2], grid, (acc, n) => acc + n, 0, visited);
      return formatDisplay(sum.toString(), cell.format);
    }

    // Check AVERAGE
    const avgMatch = expr.match(/^AVERAGE\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/);
    if (avgMatch) {
      let count = 0;
      const sum = calculateRange(
        avgMatch[1],
        avgMatch[2],
        grid,
        (acc, n) => {
          count++;
          return acc + n;
        },
        0,
        visited
      );
      const avg = count > 0 ? (sum / count).toFixed(2) : '0';
      return formatDisplay(avg, cell.format);
    }

    // Check COUNT
    const countMatch = expr.match(/^COUNT\(([A-Z][0-9]+):([A-Z][0-9]+)\)$/);
    if (countMatch) {
      let count = 0;
      calculateRange(
        countMatch[1],
        countMatch[2],
        grid,
        (acc) => {
          count++;
          return acc;
        },
        0,
        visited
      );
      return count.toString();
    }

    // Simple arithmetic cell replacement like =C2-D2 or =A1+B1
    try {
      const replaced = expr.replace(/[A-Z][0-9]+/g, (match) => {
        const evaluated = evaluateCell(match, grid, new Set(visited));
        const num = parseFloat(evaluated.replace(/[$,%]/g, ''));
        return isNaN(num) ? '0' : num.toString();
      });

      // Basic safe math parser
      if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
        // eslint-disable-next-line no-eval
        const res = Function(`"use strict"; return (${replaced})`)();
        return formatDisplay(Number(res).toFixed(2).replace(/\.00$/, ''), cell.format);
      }
    } catch (_) {
      return '#VALUE!';
    }

    return val;
  };

  const calculateRange = (
    start: string,
    end: string,
    grid: SheetGrid,
    op: (acc: number, val: number) => number,
    initial: number,
    visited: Set<string>
  ): number => {
    const startCol = start.charAt(0);
    const startRow = parseInt(start.substring(1), 10);
    const endCol = end.charAt(0);
    const endRow = parseInt(end.substring(1), 10);

    const c1 = COLS.indexOf(startCol);
    const c2 = COLS.indexOf(endCol);
    const minC = Math.min(c1, c2);
    const maxC = Math.max(c1, c2);
    const minR = Math.min(startRow, endRow);
    const maxR = Math.max(startRow, endRow);

    let acc = initial;
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
        const k = `${COLS[c]}${r}`;
        const valStr = evaluateCell(k, grid, new Set(visited));
        const num = parseFloat(valStr.replace(/[$,%]/g, ''));
        if (!isNaN(num)) {
          acc = op(acc, num);
        }
      }
    }
    return acc;
  };

  const formatDisplay = (val: string, format?: CellData['format']): string => {
    if (!format) return val;
    const num = parseFloat(val.replace(/[$,%]/g, ''));
    if (isNaN(num)) return val;

    if (format.isCurrency) {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (format.isPercent) {
      return `${(num * 100).toFixed(1)}%`;
    }
    return val;
  };

  const handleUpdateCell = (key: string, value: string) => {
    setSheets((prev) => {
      const updated = [...prev];
      const targetSheet = { ...updated[activeSheetIndex] };
      const currentGridCopy = { ...targetSheet.grid };
      currentGridCopy[key] = {
        ...currentGridCopy[key],
        raw: value,
      };
      targetSheet.grid = currentGridCopy;
      updated[activeSheetIndex] = targetSheet;
      return updated;
    });
  };

  const handleFormatCell = (formatChanges: Partial<NonNullable<CellData['format']>>) => {
    soundManager.playClick();
    setSheets((prev) => {
      const updated = [...prev];
      const targetSheet = { ...updated[activeSheetIndex] };
      const currentGridCopy = { ...targetSheet.grid };
      const cell = currentGridCopy[selectedCell] || { raw: '' };
      currentGridCopy[selectedCell] = {
        ...cell,
        format: {
          ...cell.format,
          ...formatChanges,
        },
      };
      targetSheet.grid = currentGridCopy;
      updated[activeSheetIndex] = targetSheet;
      return updated;
    });
  };

  const handleSaveToOS = () => {
    soundManager.playDing();
    const payload = JSON.stringify({ sheets });
    const validName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    if (fileId) {
      fs.updateFile(fileId, payload);
      setStatusMsg(`Updated ${validName} in PC storage!`);
    } else {
      const created = fs.createFile(validName, saveTargetFolder, payload, 'xlsx');
      setFileId(created.id);
      setStatusMsg(`Saved to ${saveTargetFolder === 'documents' ? 'Documents' : 'Desktop'} on PC!`);
    }

    if (onSave) onSave(validName, payload);
    setShowSaveModal(false);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleDownloadCsv = () => {
    soundManager.playClick();
    let csv = '';
    for (let r = 1; r <= 15; r++) {
      const rowVals = COLS.map((c) => {
        const evaluated = evaluateCell(`${c}${r}`, currentGrid);
        return `"${evaluated.replace(/"/g, '""')}"`;
      });
      csv += rowVals.join(',') + '\n';
    }
    webSearchService.downloadToPhysicalComputer(
      fileName.endsWith('.xlsx') ? fileName.replace('.xlsx', '.csv') : `${fileName}.csv`,
      csv
    );
    setStatusMsg('Downloaded CSV to your physical PC!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Generate chart data based on columns A and C/D
  const getChartData = () => {
    const labels: string[] = [];
    const values: number[] = [];
    for (let r = 2; r <= 8; r++) {
      const label = currentGrid[`A${r}`]?.raw;
      const valStr = evaluateCell(`C${r}`, currentGrid);
      const num = parseFloat(valStr.replace(/[$,%]/g, ''));
      if (label && !isNaN(num)) {
        labels.push(label);
        values.push(num);
      }
    }
    return { labels, values };
  };

  const chartData = getChartData();
  const maxChartVal = Math.max(...chartData.values, 100);

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] text-[#1e293b] select-none font-sans relative">
      {/* Top Application Bar (Excel Ribbon Header) */}
      <div className="bg-[#107c41] text-white flex items-center justify-between px-3 py-1.5 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center font-bold text-base shadow-sm">
            X
          </div>
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent hover:bg-white/10 focus:bg-white/20 px-2 py-0.5 rounded text-xs font-semibold text-white outline-none w-44 transition"
              title="Click to rename workbook"
            />
            <span className="text-[11px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {fileId ? 'Saved to PC' : 'Unsaved'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 text-xs">
          {statusMsg && (
            <span className="text-emerald-200 text-xs flex items-center space-x-1 bg-emerald-900/40 px-2.5 py-0.5 rounded-full mr-2">
              <Check size={12} />
              <span>{statusMsg}</span>
            </span>
          )}

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded text-white text-xs font-medium transition"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white text-xs font-semibold transition shadow"
            title="Save to Virtual PC (Documents/Desktop)"
          >
            <Save size={13} />
            <span>Save to PC</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded text-white text-xs font-medium transition"
            title="Export CSV to physical PC"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Ribbon Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-[#0d6535] text-white/80 px-3 text-xs border-b border-[#094725] shrink-0">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert & Charts' },
          { id: 'formulas', label: 'Formulas' },
          { id: 'view', label: 'View' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              setActiveTab(tab.id as any);
            }}
            className={`px-3 py-1 font-medium transition ${
              activeTab === tab.id
                ? 'bg-[#fafafa] text-[#107c41] font-bold rounded-t-sm shadow'
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ribbon Toolbar */}
      <div className="bg-[#fafafa] border-b border-neutral-300 p-1.5 flex items-center space-x-2 text-xs text-neutral-700 overflow-x-auto shrink-0 shadow-xs">
        {activeTab === 'home' && (
          <>
            {/* Formatting */}
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-300">
              <button
                onClick={() =>
                  handleFormatCell({
                    bold: !currentGrid[selectedCell]?.format?.bold,
                  })
                }
                className={`p-1.5 rounded transition ${
                  currentGrid[selectedCell]?.format?.bold
                    ? 'bg-neutral-300 text-black font-bold'
                    : 'hover:bg-neutral-200'
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() =>
                  handleFormatCell({
                    italic: !currentGrid[selectedCell]?.format?.italic,
                  })
                }
                className={`p-1.5 rounded transition ${
                  currentGrid[selectedCell]?.format?.italic
                    ? 'bg-neutral-300 text-black italic'
                    : 'hover:bg-neutral-200'
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic size={14} />
              </button>
            </div>

            {/* Alignments */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-neutral-300">
              <button
                onClick={() => handleFormatCell({ align: 'left' })}
                className="p-1.5 hover:bg-neutral-200 rounded"
                title="Align Left"
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => handleFormatCell({ align: 'center' })}
                className="p-1.5 hover:bg-neutral-200 rounded"
                title="Center"
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => handleFormatCell({ align: 'right' })}
                className="p-1.5 hover:bg-neutral-200 rounded"
                title="Align Right"
              >
                <AlignRight size={14} />
              </button>
            </div>

            {/* Number Formats */}
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-300">
              <button
                onClick={() =>
                  handleFormatCell({
                    isCurrency: !currentGrid[selectedCell]?.format?.isCurrency,
                  })
                }
                className={`px-2 py-1 rounded flex items-center space-x-1 border text-xs font-semibold ${
                  currentGrid[selectedCell]?.format?.isCurrency
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                    : 'hover:bg-neutral-200 border-neutral-300'
                }`}
                title="Format as Currency ($)"
              >
                <DollarSign size={13} />
                <span>Currency</span>
              </button>

              <button
                onClick={() =>
                  handleFormatCell({
                    isPercent: !currentGrid[selectedCell]?.format?.isPercent,
                  })
                }
                className={`px-2 py-1 rounded flex items-center space-x-1 border text-xs font-semibold ${
                  currentGrid[selectedCell]?.format?.isPercent
                    ? 'bg-blue-100 border-blue-400 text-blue-800'
                    : 'hover:bg-neutral-200 border-neutral-300'
                }`}
                title="Format as Percentage (%)"
              >
                <Percent size={13} />
                <span>Percent</span>
              </button>
            </div>

            {/* Cell Fill Colors */}
            <div className="flex items-center space-x-1.5 pr-2 border-r border-neutral-300">
              <label className="flex items-center space-x-1 cursor-pointer" title="Cell Background Color">
                <span className="text-[10px] text-neutral-600 font-bold">Fill:</span>
                <input
                  type="color"
                  value={currentGrid[selectedCell]?.format?.bg || '#ffffff'}
                  onChange={(e) => handleFormatCell({ bg: e.target.value })}
                  className="w-5 h-5 p-0 border-0 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center space-x-1 cursor-pointer" title="Text Color">
                <span className="text-[10px] text-neutral-600 font-bold">Text:</span>
                <input
                  type="color"
                  value={currentGrid[selectedCell]?.format?.color || '#000000'}
                  onChange={(e) => handleFormatCell({ color: e.target.value })}
                  className="w-5 h-5 p-0 border-0 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Quick AutoSum */}
            <button
              onClick={() => {
                const col = selectedCell.charAt(0);
                const row = parseInt(selectedCell.substring(1), 10);
                const formula = `=SUM(${col}1:${col}${Math.max(1, row - 1)})`;
                handleUpdateCell(selectedCell, formula);
                setEditValue(formula);
              }}
              className="px-2.5 py-1 bg-neutral-200 hover:bg-neutral-300 rounded font-semibold text-xs flex items-center space-x-1"
              title="Insert AutoSum"
            >
              <span>∑ AutoSum</span>
            </button>
          </>
        )}

        {activeTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChart(showChart === 'bar' ? null : 'bar')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium border ${
                showChart === 'bar'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <BarChart2 size={14} />
              <span>Bar Chart</span>
            </button>
            <button
              onClick={() => setShowChart(showChart === 'line' ? null : 'line')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium border ${
                showChart === 'line'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <LineChart size={14} />
              <span>Line Trend</span>
            </button>
            <button
              onClick={() => setShowChart(showChart === 'pie' ? null : 'pie')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium border ${
                showChart === 'pie'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-white border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <PieChart size={14} />
              <span>Pie Distribution</span>
            </button>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-semibold">Common Formulas:</span>
            {[
              { label: 'SUM', snippet: '=SUM(A1:A5)' },
              { label: 'AVERAGE', snippet: '=AVERAGE(A1:A5)' },
              { label: 'COUNT', snippet: '=COUNT(A1:A5)' },
              { label: 'MULT', snippet: '=A1*B1' },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => {
                  handleUpdateCell(selectedCell, f.snippet);
                  setEditValue(f.snippet);
                }}
                className="px-2 py-0.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded font-mono"
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'view' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-medium">Grid Lines:</span>
            <span className="text-emerald-700 font-semibold">Active (Standard View)</span>
          </div>
        )}
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-neutral-300 px-3 py-1 flex items-center space-x-2 text-xs shrink-0">
        <div className="font-bold font-mono text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300 w-16 text-center">
          {selectedCell}
        </div>
        <div className="text-neutral-400 font-serif italic text-sm">fx</div>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            handleUpdateCell(selectedCell, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const row = parseInt(selectedCell.substring(1), 10);
              const col = selectedCell.charAt(0);
              if (row < ROW_COUNT) setSelectedCell(`${col}${row + 1}`);
            }
          }}
          placeholder="Enter formula or value (e.g. =SUM(C2:C5), 1500, or text)"
          className="flex-1 bg-transparent outline-none font-mono text-xs text-neutral-800"
        />
      </div>

      {/* Live Chart Visualizer Modal / Panel */}
      {showChart && chartData.labels.length > 0 && (
        <div className="bg-white border-b border-neutral-300 p-4 shadow-md shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-neutral-700">
              📊 Data Visualization: {chartData.labels.join(', ')}
            </span>
            <button
              onClick={() => setShowChart(null)}
              className="text-xs text-neutral-400 hover:text-black"
            >
              ✕ Close Chart
            </button>
          </div>
          <div className="flex items-end space-x-4 h-32 pt-2 px-4 bg-neutral-50 rounded-lg border border-neutral-200">
            {chartData.labels.map((lbl, idx) => {
              const val = chartData.values[idx];
              const pct = Math.max(10, Math.min(100, (val / maxChartVal) * 100));
              return (
                <div key={lbl} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-neutral-700 mb-1 group-hover:scale-110 transition-transform">
                    ${val.toLocaleString()}
                  </span>
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t shadow transition-all duration-300"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 truncate max-w-full" title={lbl}>
                    {lbl}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spreadsheet Grid Container */}
      <div className="flex-1 overflow-auto bg-neutral-100">
        <table className="border-collapse bg-white text-xs select-none">
          <thead>
            <tr className="bg-[#f3f4f6] text-neutral-500 sticky top-0 z-20">
              <th className="w-10 h-6 border border-neutral-300 bg-[#e5e7eb] text-center text-[10px] font-semibold sticky left-0 z-30">
                #
              </th>
              {COLS.map((col) => (
                <th
                  key={col}
                  className="w-28 h-6 border border-neutral-300 text-center font-bold text-[11px] bg-[#f3f4f6]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }).map((_, rIdx) => {
              const rowNum = rIdx + 1;
              return (
                <tr key={rowNum}>
                  <td className="h-6 border border-neutral-300 bg-[#f3f4f6] text-neutral-500 text-center text-[10px] font-semibold sticky left-0 z-10">
                    {rowNum}
                  </td>
                  {COLS.map((col) => {
                    const key = `${col}${rowNum}`;
                    const cell = currentGrid[key];
                    const isSelected = selectedCell === key;
                    const displayValue = evaluateCell(key, currentGrid);
                    const format = cell?.format;

                    return (
                      <td
                        key={key}
                        onClick={() => setSelectedCell(key)}
                        onDoubleClick={() => setIsEditing(true)}
                        style={{
                          backgroundColor: format?.bg || (isSelected ? '#ebfbee' : 'transparent'),
                          color: format?.color || '#1e293b',
                          fontWeight: format?.bold ? 'bold' : 'normal',
                          fontStyle: format?.italic ? 'italic' : 'normal',
                          textAlign: format?.align || (format?.isCurrency ? 'right' : 'left'),
                        }}
                        className={`h-6 px-1.5 border border-neutral-200 cursor-cell truncate relative transition-colors ${
                          isSelected ? 'outline-2 outline-[#107c41] z-10' : ''
                        }`}
                        title={`${key}: ${cell?.raw || ''}`}
                      >
                        {displayValue}
                        {isSelected && (
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#107c41]" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sheets Tab Bar & Status */}
      <div className="bg-[#f3f4f6] border-t border-neutral-300 px-3 py-1 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center space-x-1">
          {sheets.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSheetIndex(idx)}
              className={`px-3 py-1 rounded-t text-xs font-semibold transition ${
                activeSheetIndex === idx
                  ? 'bg-white text-[#107c41] border-t-2 border-[#107c41] shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {s.name}
            </button>
          ))}
          <button
            onClick={() => {
              const newNum = sheets.length + 1;
              setSheets((prev) => [
                ...prev,
                { id: `s${Date.now()}`, name: `Sheet${newNum}`, grid: {} },
              ]);
            }}
            className="p-1 hover:bg-neutral-200 rounded text-neutral-600"
            title="Add New Sheet"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-neutral-500">
          <span>Ready</span>
          <span>100% Zoom</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Formulas synchronized" />
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#242424] text-white p-5 rounded-2xl max-w-sm w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#107c41] flex items-center justify-center font-bold text-white shadow">
                X
              </div>
              <h3 className="font-bold text-sm">Save Excel Workbook</h3>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Save Location</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSaveTargetFolder('documents')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'documents'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  📁 Documents
                </button>
                <button
                  onClick={() => setSaveTargetFolder('desktop')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'desktop'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  🖥️ Desktop
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToOS}
                className="px-4 py-1.5 bg-[#107c41] hover:bg-[#0d6937] text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Save Workbook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="bg-[#242424] text-white p-6 rounded-2xl max-w-xl w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-white">Choose an Excel Workbook Template</h3>
                <p className="text-xs text-white/60">Start with formulas, data layout, and formatting ready to go</p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-white/40 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    soundManager.playClick();
                    setSheets([{ id: 's1', name: 'Sheet1', grid: tmpl.grid }]);
                    setFileName(`${tmpl.name}.xlsx`);
                    setShowTemplatesModal(false);
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#107c41]/30 text-emerald-400 border border-[#107c41]/50 flex items-center justify-center font-bold text-sm mb-2 group-hover:scale-105 transition-transform">
                    X
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                    {tmpl.name}
                  </h4>
                  <p className="text-[11px] text-white/50 mt-1">{tmpl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
