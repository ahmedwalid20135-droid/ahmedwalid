import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  FolderOpen,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  ArrowRight,
  Layout,
  Palette,
  Layers,
  Star,
  Zap,
} from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';
import { webSearchService } from '../services/webSearchService';

interface PowerPointAppProps {
  initialContent?: string;
  initialFileName?: string;
  initialFileId?: string;
  onSave?: (fileName: string, content: string) => void;
}

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  layout: 'title' | 'content' | 'two-column' | 'stat' | 'blank';
  theme: 'obsidian' | 'corporate' | 'sunset' | 'minimal' | 'cyber';
  imageUrl?: string;
  statValue?: string;
  statLabel?: string;
  columnRight?: string;
}

const THEMES = {
  obsidian: {
    name: 'Legion Obsidian Dark',
    bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0a0a0c]',
    titleColor: 'text-cyan-300',
    subtitleColor: 'text-cyan-100/70',
    bodyColor: 'text-white/80',
    accent: '#06b6d4',
  },
  corporate: {
    name: 'Corporate Executive',
    bg: 'bg-gradient-to-br from-[#0c2340] via-[#1e3a5f] to-[#0f172a]',
    titleColor: 'text-amber-300',
    subtitleColor: 'text-blue-100/70',
    bodyColor: 'text-white/90',
    accent: '#f59e0b',
  },
  sunset: {
    name: 'Sunset Horizon',
    bg: 'bg-gradient-to-br from-[#4c0519] via-[#831843] to-[#1e1b4b]',
    titleColor: 'text-rose-200',
    subtitleColor: 'text-pink-100/70',
    bodyColor: 'text-rose-100/90',
    accent: '#f43f5e',
  },
  minimal: {
    name: 'Pure Minimalist',
    bg: 'bg-white',
    titleColor: 'text-[#0f172a]',
    subtitleColor: 'text-neutral-500',
    bodyColor: 'text-neutral-700',
    accent: '#d24726',
  },
  cyber: {
    name: 'NVIDIA RTX Cyber',
    bg: 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#020617]',
    titleColor: 'text-emerald-300',
    subtitleColor: 'text-emerald-100/70',
    bodyColor: 'text-white/90',
    accent: '#10b981',
  },
};

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 's-1',
    title: 'Lenovo Legion G14 WinWeb 11 Pro',
    subtitle: 'Next-Gen AMD Ryzen 9 8945HS & NVIDIA GeForce RTX 4070 Architecture',
    body: 'A revolution in portable workstation compute with 1.0 TB NVMe Gen4 SSD storage and OLED PureSight display.',
    layout: 'title',
    theme: 'obsidian',
  },
  {
    id: 's-2',
    title: 'Core Architecture & Hardware Benchmarks',
    subtitle: 'Engineered for extreme responsiveness and creative multi-tasking',
    body: '• AMD Ryzen 9 8945HS: 8 Cores, 16 Threads @ 5.2 GHz Boost\n• NVIDIA RTX 4070 8GB GDDR6 with 140W Max TGP\n• 32 GB LPDDR5X-7500 MHz Low-Latency Memory\n• 1.0 TB M.2 2280 PCIe 4.0x4 Solid-State Drive',
    layout: 'content',
    theme: 'obsidian',
    statValue: '7,100 MB/s',
    statLabel: 'PCIe Gen4 NVMe Read Bandwidth',
  },
  {
    id: 's-3',
    title: 'Microsoft Office & User File Hub',
    subtitle: 'Full productivity suite built into the OS',
    body: '• Word: Rich document composition with templates & styling\n• Excel: Intelligent spreadsheet grid with SUM/AVG and live charts\n• PowerPoint: High-impact slide presentations with presentation mode\n• User File Loader: Load files, pictures, and apps directly from your physical PC!',
    layout: 'two-column',
    theme: 'corporate',
    columnRight: 'Key Innovations:\n✓ Drag-and-drop from physical PC\n✓ Real audio volume output switcher\n✓ Live Wi-Fi network scanner\n✓ Active battery health & power modes',
  },
  {
    id: 's-4',
    title: 'Performance Metric Breakthrough',
    subtitle: 'Sub-millisecond OS response times in-browser',
    body: 'Our custom Web Audio synthesis, virtual memory filesystem, and GPU ray tracing provide desktop-class immersion.',
    layout: 'stat',
    theme: 'cyber',
    statValue: '120 FPS',
    statLabel: 'Fluid Fluent UI & RTX Path Tracing Render Rate',
  },
];

export const PowerPointApp: React.FC<PowerPointAppProps> = ({
  initialContent,
  initialFileName = 'Presentation1.pptx',
  initialFileId,
  onSave,
}) => {
  const [fileName, setFileName] = useState(initialFileName);
  const [fileId, setFileId] = useState<string | null>(initialFileId || null);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'design' | 'slideshow'>('home');
  const [statusMsg, setStatusMsg] = useState('');
  const [isPresenting, setIsPresenting] = useState(false);
  const [laserPointer, setLaserPointer] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTargetFolder, setSaveTargetFolder] = useState<'documents' | 'desktop'>('documents');

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // Parse initial content
  useEffect(() => {
    if (initialContent) {
      try {
        const parsed = JSON.parse(initialContent);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          setSlides(parsed.slides);
        }
      } catch (_) {}
    }
  }, [initialContent]);

  // Slideshow keyboard navigation
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        soundManager.playClick();
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        soundManager.playClick();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, slides.length]);

  const updateCurrentSlide = (patch: Partial<Slide>) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[currentSlideIndex] = { ...updated[currentSlideIndex], ...patch };
      return updated;
    });
  };

  const handleAddSlide = () => {
    soundManager.playClick();
    const newSlide: Slide = {
      id: `s-${Date.now()}`,
      title: 'New Slide Title',
      subtitle: 'Add subtitle here',
      body: '• First bullet point\n• Second bullet point\n• Third bullet point',
      layout: 'content',
      theme: currentSlide.theme || 'obsidian',
    };
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDuplicateSlide = () => {
    soundManager.playClick();
    const dup: Slide = {
      ...currentSlide,
      id: `s-${Date.now()}`,
      title: `${currentSlide.title} (Copy)`,
    };
    const updated = [...slides];
    updated.splice(currentSlideIndex + 1, 0, dup);
    setSlides(updated);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return;
    soundManager.playTrashEmpty();
    const updated = slides.filter((_, idx) => idx !== currentSlideIndex);
    setSlides(updated);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const handleSaveToOS = () => {
    soundManager.playDing();
    const payload = JSON.stringify({ slides });
    const validName = fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`;

    if (fileId) {
      fs.updateFile(fileId, payload);
      setStatusMsg(`Updated ${validName} in PC storage!`);
    } else {
      const created = fs.createFile(validName, saveTargetFolder, payload, 'pptx');
      setFileId(created.id);
      setStatusMsg(`Saved to ${saveTargetFolder === 'documents' ? 'Documents' : 'Desktop'} on PC!`);
    }

    if (onSave) onSave(validName, payload);
    setShowSaveModal(false);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleDownloadPresentation = () => {
    soundManager.playClick();
    const payload = JSON.stringify({ slides }, null, 2);
    webSearchService.downloadToPhysicalComputer(
      fileName.endsWith('.pptx') ? fileName.replace('.pptx', '.json') : `${fileName}.json`,
      payload
    );
    setStatusMsg('Exported presentation to your physical PC!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const currentTheme = THEMES[currentSlide.theme] || THEMES.obsidian;

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] text-[#1e293b] select-none font-sans relative">
      {/* Top Application Bar (PowerPoint Ribbon Header) */}
      <div className="bg-[#d24726] text-white flex items-center justify-between px-3 py-1.5 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center font-bold text-base shadow-sm">
            P
          </div>
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent hover:bg-white/10 focus:bg-white/20 px-2 py-0.5 rounded text-xs font-semibold text-white outline-none w-48 transition"
              title="Click to rename presentation"
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
            onClick={() => {
              soundManager.playDing();
              setIsPresenting(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1 bg-white text-[#d24726] hover:bg-white/90 rounded text-xs font-bold transition shadow"
            title="Start Full-Screen Slideshow Presentation"
          >
            <Play size={13} fill="currentColor" />
            <span>Present Slideshow</span>
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
            onClick={handleDownloadPresentation}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded text-white text-xs font-medium transition"
            title="Download presentation to physical PC"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Ribbon Navigation Tabs */}
      <div className="flex items-center space-x-1 bg-[#b73a1e] text-white/80 px-3 text-xs border-b border-[#8c2912] shrink-0">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'design', label: 'Themes & Design' },
          { id: 'slideshow', label: 'Slide Show' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              setActiveTab(tab.id as any);
            }}
            className={`px-3 py-1 font-medium transition ${
              activeTab === tab.id
                ? 'bg-[#fafafa] text-[#d24726] font-bold rounded-t-sm shadow'
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
            <button
              onClick={handleAddSlide}
              className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition shadow-xs"
            >
              <Plus size={14} />
              <span>New Slide</span>
            </button>
            <button
              onClick={handleDuplicateSlide}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <Copy size={13} />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleDeleteSlide}
              disabled={slides.length <= 1}
              className="flex items-center space-x-1 px-2.5 py-1 bg-white border border-neutral-300 hover:bg-red-50 text-red-600 disabled:opacity-40 rounded text-xs font-medium"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <div className="border-l border-neutral-300 h-5 mx-1" />

            {/* Layout picker */}
            <span className="text-neutral-500 text-[11px] font-medium">Layout:</span>
            {[
              { id: 'title', label: 'Title Slide' },
              { id: 'content', label: 'Title & Content' },
              { id: 'two-column', label: 'Two Column' },
              { id: 'stat', label: 'Big Stat' },
            ].map((ly) => (
              <button
                key={ly.id}
                onClick={() => updateCurrentSlide({ layout: ly.id as any })}
                className={`px-2 py-0.5 rounded text-xs ${
                  currentSlide.layout === ly.id
                    ? 'bg-[#d24726] text-white font-semibold'
                    : 'bg-white border border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                {ly.label}
              </button>
            ))}
          </>
        )}

        {activeTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const url = prompt(
                  'Enter Image URL:',
                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
                );
                if (url) updateCurrentSlide({ imageUrl: url });
              }}
              className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <ImageIcon size={14} className="text-[#d24726]" />
              <span>Insert Picture</span>
            </button>
            {currentSlide.imageUrl && (
              <button
                onClick={() => updateCurrentSlide({ imageUrl: undefined })}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
              >
                Remove Picture
              </button>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="flex items-center space-x-2">
            <span className="text-neutral-500 text-[11px] font-medium">Select Theme:</span>
            {Object.entries(THEMES).map(([themeKey, themeData]) => (
              <button
                key={themeKey}
                onClick={() => {
                  soundManager.playClick();
                  updateCurrentSlide({ theme: themeKey as any });
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium border transition ${
                  currentSlide.theme === themeKey
                    ? 'border-[#d24726] ring-2 ring-[#d24726]/40 font-bold bg-white'
                    : 'bg-white border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: themeData.accent }}
                />
                <span>{themeData.name}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'slideshow' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPresenting(true)}
              className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-xs"
            >
              <Play size={13} fill="currentColor" />
              <span>Start from Beginning</span>
            </button>
            <span className="text-neutral-500 text-[11px]">
              Tip: Use Space / Arrow Keys to advance slides or Esc to exit.
            </span>
          </div>
        )}
      </div>

      {/* Main Studio View: Slide Navigator + Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Thumbnails Sidebar */}
        <div className="w-52 bg-[#e5e7eb] border-r border-neutral-300 p-3 overflow-y-auto space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold px-1">
            <span>SLIDES ({slides.length})</span>
            <button
              onClick={handleAddSlide}
              className="p-1 hover:bg-neutral-300 rounded text-neutral-700"
              title="Add Slide"
            >
              <Plus size={14} />
            </button>
          </div>

          {slides.map((s, idx) => {
            const isSelected = currentSlideIndex === idx;
            const t = THEMES[s.theme] || THEMES.obsidian;
            return (
              <div
                key={s.id}
                onClick={() => {
                  soundManager.playClick();
                  setCurrentSlideIndex(idx);
                }}
                className={`flex items-center space-x-2 cursor-pointer group`}
              >
                <span className="text-[11px] font-bold text-neutral-500 w-4 text-right">
                  {idx + 1}
                </span>
                <div
                  className={`flex-1 h-24 rounded-lg p-2 flex flex-col justify-between border-2 transition ${t.bg} ${
                    isSelected
                      ? 'border-[#d24726] shadow-md scale-102 ring-2 ring-[#d24726]/30'
                      : 'border-transparent hover:border-neutral-400 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className={`text-[10px] font-bold line-clamp-1 ${t.titleColor}`}>
                    {s.title}
                  </div>
                  <div className={`text-[8px] line-clamp-2 ${t.bodyColor}`}>
                    {s.body}
                  </div>
                  <div className="text-[7px] text-white/40 text-right uppercase">
                    {s.layout}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide Canvas Editor */}
        <div className="flex-1 bg-[#cbd5e1] p-8 overflow-y-auto flex items-center justify-center">
          <div
            className={`w-full max-w-4xl aspect-[16/9] rounded-xl shadow-2xl p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300 border border-black/10 ${currentTheme.bg}`}
          >
            {/* Top Slide Header */}
            <div>
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => updateCurrentSlide({ title: e.target.value })}
                placeholder="Click to add Title..."
                className={`w-full bg-transparent outline-none font-extrabold text-3xl tracking-tight leading-tight ${currentTheme.titleColor} placeholder-white/30`}
              />
              <input
                type="text"
                value={currentSlide.subtitle || ''}
                onChange={(e) => updateCurrentSlide({ subtitle: e.target.value })}
                placeholder="Click to add subtitle or presenter name..."
                className={`w-full bg-transparent outline-none text-sm font-medium mt-1.5 ${currentTheme.subtitleColor} placeholder-white/30`}
              />
            </div>

            {/* Slide Body Content Area based on layout */}
            <div className="my-auto py-4">
              {currentSlide.layout === 'stat' ? (
                <div className="flex items-center space-x-8">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={currentSlide.statValue || '100%'}
                      onChange={(e) => updateCurrentSlide({ statValue: e.target.value })}
                      className="text-6xl font-black bg-transparent outline-none text-emerald-400 w-full"
                    />
                    <input
                      type="text"
                      value={currentSlide.statLabel || 'Key Performance Indicator'}
                      onChange={(e) => updateCurrentSlide({ statLabel: e.target.value })}
                      className="text-sm font-semibold uppercase tracking-wider text-white/70 bg-transparent outline-none w-full mt-1"
                    />
                  </div>
                  <textarea
                    value={currentSlide.body}
                    onChange={(e) => updateCurrentSlide({ body: e.target.value })}
                    className={`flex-1 h-32 bg-transparent outline-none resize-none text-sm leading-relaxed ${currentTheme.bodyColor}`}
                  />
                </div>
              ) : currentSlide.layout === 'two-column' ? (
                <div className="grid grid-cols-2 gap-8 h-44">
                  <textarea
                    value={currentSlide.body}
                    onChange={(e) => updateCurrentSlide({ body: e.target.value })}
                    placeholder="Left Column bullet points..."
                    className={`w-full h-full bg-transparent outline-none resize-none text-sm leading-relaxed p-2 rounded border border-white/10 ${currentTheme.bodyColor}`}
                  />
                  <textarea
                    value={currentSlide.columnRight || ''}
                    onChange={(e) => updateCurrentSlide({ columnRight: e.target.value })}
                    placeholder="Right Column bullet points..."
                    className={`w-full h-full bg-transparent outline-none resize-none text-sm leading-relaxed p-2 rounded border border-white/10 ${currentTheme.bodyColor}`}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-6">
                  <textarea
                    value={currentSlide.body}
                    onChange={(e) => updateCurrentSlide({ body: e.target.value })}
                    placeholder="Click to add slide content or bullet points..."
                    className={`flex-1 h-44 bg-transparent outline-none resize-none text-base leading-relaxed p-2 ${currentTheme.bodyColor}`}
                  />
                  {currentSlide.imageUrl && (
                    <img
                      src={currentSlide.imageUrl}
                      alt="Slide media"
                      className="w-1/3 h-44 object-cover rounded-xl shadow-xl border border-white/20"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Bottom Slide Footer */}
            <div className="flex items-center justify-between text-[11px] text-white/40 border-t border-white/10 pt-3">
              <span>Lenovo Legion G14 • WinWeb 11 Pro</span>
              <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#242424] text-white p-5 rounded-2xl max-w-sm w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d24726] flex items-center justify-center font-bold text-white shadow">
                P
              </div>
              <h3 className="font-bold text-sm">Save PowerPoint Presentation</h3>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Save Location</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSaveTargetFolder('documents')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'documents'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  📁 Documents
                </button>
                <button
                  onClick={() => setSaveTargetFolder('desktop')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'desktop'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300 font-bold'
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
                className="px-4 py-1.5 bg-[#d24726] hover:bg-[#b0371a] text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Save Presentation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN SLIDESHOW PRESENTER MODE */}
      {isPresenting && (
        <div
          onMouseMove={(e) => {
            if (laserPointer) {
              setMousePos({ x: e.clientX, y: e.clientY });
            }
          }}
          className={`fixed inset-0 z-[9999] flex flex-col justify-between p-12 transition-all duration-500 cursor-none select-none ${currentTheme.bg}`}
        >
          {/* Laser Pointer Dot */}
          {laserPointer && (
            <div
              style={{
                left: mousePos.x - 8,
                top: mousePos.y - 8,
              }}
              className="fixed w-4 h-4 rounded-full bg-red-500 pointer-events-none shadow-[0_0_12px_#ff0000] z-[10000] animate-pulse"
            />
          )}

          {/* Top Presenter Bar (Fades in on top hover) */}
          <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold text-white/60">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLaserPointer(!laserPointer)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  laserPointer ? 'bg-red-600 text-white shadow-[0_0_8px_#ff0000]' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                🔴 Laser Pointer
              </button>
              <button
                onClick={() => setIsPresenting(false)}
                className="px-3 py-1 bg-white/10 hover:bg-red-600 text-white rounded-full text-xs transition cursor-pointer"
              >
                ✕ Exit (Esc)
              </button>
            </div>
          </div>

          {/* Large Slide Presentation Body */}
          <div className="max-w-5xl mx-auto w-full my-auto space-y-8 animate-in fade-in duration-300">
            <div>
              <h1 className={`text-6xl font-black tracking-tight leading-tight ${currentTheme.titleColor}`}>
                {currentSlide.title}
              </h1>
              {currentSlide.subtitle && (
                <p className={`text-2xl font-light mt-3 ${currentTheme.subtitleColor}`}>
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            {currentSlide.layout === 'stat' ? (
              <div className="flex items-center space-x-12 pt-6">
                <div>
                  <div className="text-8xl font-black text-emerald-400 drop-shadow-lg">
                    {currentSlide.statValue}
                  </div>
                  <div className="text-xl font-bold uppercase tracking-widest text-white/80 mt-2">
                    {currentSlide.statLabel}
                  </div>
                </div>
                <div className={`text-2xl leading-relaxed font-light ${currentTheme.bodyColor}`}>
                  {currentSlide.body}
                </div>
              </div>
            ) : currentSlide.layout === 'two-column' ? (
              <div className="grid grid-cols-2 gap-12 text-2xl leading-relaxed pt-4">
                <div className={`whitespace-pre-line ${currentTheme.bodyColor}`}>
                  {currentSlide.body}
                </div>
                <div className={`whitespace-pre-line ${currentTheme.bodyColor}`}>
                  {currentSlide.columnRight}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-8 pt-4">
                <div className={`flex-1 text-2xl leading-relaxed whitespace-pre-line ${currentTheme.bodyColor}`}>
                  {currentSlide.body}
                </div>
                {currentSlide.imageUrl && (
                  <img
                    src={currentSlide.imageUrl}
                    alt="Slide visual"
                    className="w-1/3 rounded-2xl shadow-2xl border-2 border-white/20"
                  />
                )}
              </div>
            )}
          </div>

          {/* Bottom Presenter Controls */}
          <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentSlideIndex === 0}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full transition cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex space-x-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentSlideIndex === i ? 'bg-white w-6' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
              }}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white rounded-full transition cursor-pointer"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
