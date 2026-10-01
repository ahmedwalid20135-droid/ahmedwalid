import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Table as TableIcon,
  Image as ImageIcon,
  Save,
  Download,
  FolderOpen,
  Printer,
  Sparkles,
  Check,
  FileText,
  Clock,
  Layers,
  Undo2,
  Redo2,
  Copy,
  Scissors,
} from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';
import { webSearchService } from '../services/webSearchService';

interface WordAppProps {
  initialContent?: string;
  initialFileName?: string;
  initialFileId?: string;
  onSave?: (fileName: string, content: string) => void;
}

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Document',
    desc: 'Start with a clean page',
    content: `<h1>Untitled Document</h1><p>Start typing your thoughts, reports, or research here...</p>`,
  },
  {
    id: 'proposal',
    name: 'Business Project Proposal',
    desc: 'Professional executive proposal',
    content: `<h1 style="color: #185abd;">Project Horizon: Executive Proposal</h1>
<p style="color: #64748b; font-size: 14px;">Prepared for: Lenovo Executive Leadership • Date: October 2026</p>
<hr/>
<h2>1. Executive Summary</h2>
<p>Project Horizon represents a strategic initiative to deploy next-generation AI workflows directly onto the Lenovo Legion G14 hardware infrastructure. Leveraging the AMD Ryzen 9 8945HS and NVIDIA RTX 4070 Laptop GPU, we achieve sub-millisecond local processing latencies.</p>
<h2>2. Objectives & Milestones</h2>
<ul>
  <li><strong>Q1:</strong> Finalize neural runtime architecture and PCIe Gen4 disk caching pipelines.</li>
  <li><strong>Q2:</strong> Implement real-time hardware telemetry and Nahimic audio matrixing.</li>
  <li><strong>Q3:</strong> Enterprise beta rollout with 99.9% uptime SLA.</li>
</ul>
<h2>3. Budget & Resource Allocation</h2>
<table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border-color: #cbd5e1;">
  <tr style="background: #f1f5f9; color: #0f172a;"><th>Phase</th><th>Deliverables</th><th>Allocation ($)</th></tr>
  <tr><td>Phase I - Architecture</td><td>Core virtual OS drivers & UI integration</td><td>$145,000</td></tr>
  <tr><td>Phase II - Quality & RTX</td><td>DLSS 3.5 benchmarking & stress testing</td><td>$98,000</td></tr>
  <tr><td>Phase III - Deployment</td><td>Global distribution and customer onboarding</td><td>$65,000</td></tr>
</table>
<h2>4. Recommendation</h2>
<p>We recommend immediate approval to begin Phase I operations starting next sprint.</p>`,
  },
  {
    id: 'resume',
    name: 'Modern Executive Resume',
    desc: 'Clean two-column style CV',
    content: `<h1 style="color: #0f172a; margin-bottom: 2px;">ALEXANDER WRIGHT</h1>
<p style="color: #185abd; font-weight: bold; margin-top: 0;">Senior Lead Software Architect & Systems Engineer</p>
<p style="color: #64748b; font-size: 13px;">alex.wright@legion.cloud • (555) 382-9012 • San Francisco, CA</p>
<hr/>
<h2>Professional Summary</h2>
<p>Seasoned Systems Architect with 10+ years specializing in distributed operating systems, WebAssembly virtual runtimes, and GPU acceleration. Proven record leading high-impact engineering teams to deliver mission-critical platforms.</p>
<h2>Core Technical Competencies</h2>
<ul>
  <li>TypeScript, Rust, React, C++, Python, Node.js</li>
  <li>NVIDIA CUDA, WebGL, Real-Time Audio Synthesis (Web Audio API)</li>
  <li>Virtual Filesystem Architecture, NVMe I/O Optimization</li>
</ul>
<h2>Work Experience</h2>
<p><strong>Principal Architect — Legion OS Technologies (2022 – Present)</strong></p>
<ul>
  <li>Designed and shipped high-performance virtual desktop simulator running 60+ FPS in-browser.</li>
  <li>Reduced memory overhead by 42% through lazy modular component loading and virtualized memory blocks.</li>
</ul>`,
  },
  {
    id: 'meeting',
    name: 'Meeting Minutes & Action Items',
    desc: 'Structured meeting notes',
    content: `<h1 style="color: #185abd;">Weekly Engineering Sync & Roadmap Review</h1>
<p style="color: #64748b;">Attendees: Ahmed Walid, Engineering Lead, DevOps Team • Date: October 1, 2026</p>
<hr/>
<h2>Key Discussion Topics</h2>
<ul>
  <li>Integration of full Microsoft Office Suite (Word, Excel, PowerPoint) directly inside Lenovo Web OS.</li>
  <li>Enabling user file uploads from physical PC (pictures, documents, executables).</li>
  <li>Action Center notifications, functional Wi-Fi selector, Audio output switcher, and real battery tracking.</li>
</ul>
<h2>Agreed Action Items</h2>
<table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; border-color: #cbd5e1;">
  <tr style="background: #f8fafc;"><th>Task</th><th>Owner</th><th>Status</th><th>Target Date</th></tr>
  <tr><td>Deploy Word, Excel, PowerPoint modules</td><td>Ahmed</td><td>Complete</td><td>Today</td></tr>
  <tr><td>Test physical file upload and drag-and-drop</td><td>QA Lead</td><td>In Progress</td><td>Immediate</td></tr>
  <tr><td>Hardware telemetry & battery sync</td><td>Systems</td><td>Verified</td><td>Today</td></tr>
</table>`,
  },
];

export const WordApp: React.FC<WordAppProps> = ({
  initialContent,
  initialFileName = 'Document1.docx',
  initialFileId,
  onSave,
}) => {
  const [fileName, setFileName] = useState(initialFileName);
  const [fileId, setFileId] = useState<string | null>(initialFileId || null);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout' | 'view'>('home');
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSize, setFontSize] = useState('11pt');
  const [fontColor, setFontColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(!initialContent);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTargetFolder, setSaveTargetFolder] = useState<'documents' | 'desktop'>('documents');

  const editorRef = useRef<HTMLDivElement | null>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      if (initialContent) {
        editorRef.current.innerHTML = initialContent;
      } else {
        editorRef.current.innerHTML = TEMPLATES[0].content;
      }
      updateCounts();
    }
  }, [initialContent]);

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const executeCommand = (command: string, value: string = '') => {
    soundManager.playClick();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      updateCounts();
    }
  };

  const handleApplyHeading = (tag: 'h1' | 'h2' | 'p') => {
    executeCommand('formatBlock', tag);
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table border="1" cellpadding="6" style="border-collapse: collapse; width: 100%; margin: 12px 0; border-color: #cbd5e1;">
        <tr style="background: #f1f5f9;">
          <th style="padding: 8px;">Header 1</th>
          <th style="padding: 8px;">Header 2</th>
          <th style="padding: 8px;">Header 3</th>
        </tr>
        <tr>
          <td style="padding: 8px;">Data A1</td>
          <td style="padding: 8px;">Data B1</td>
          <td style="padding: 8px;">Data C1</td>
        </tr>
        <tr>
          <td style="padding: 8px;">Data A2</td>
          <td style="padding: 8px;">Data B2</td>
          <td style="padding: 8px;">Data C2</td>
        </tr>
      </table>
      <p></p>
    `;
    executeCommand('insertHTML', tableHtml);
  };

  const handleInsertImage = () => {
    const url = prompt('Enter Image URL (or paste an online picture link):', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const handleSaveToOS = () => {
    soundManager.playDing();
    const content = editorRef.current?.innerHTML || '';
    const validName = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;

    if (fileId) {
      fs.updateFile(fileId, content);
      setStatusMsg(`Updated ${validName} in PC storage!`);
    } else {
      const created = fs.createFile(validName, saveTargetFolder, content, 'docx');
      setFileId(created.id);
      setStatusMsg(`Saved to ${saveTargetFolder === 'documents' ? 'Documents' : 'Desktop'} on PC!`);
    }

    if (onSave) onSave(validName, content);
    setShowSaveModal(false);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleDownloadPhysical = () => {
    soundManager.playClick();
    const content = editorRef.current?.innerHTML || '';
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fileName}</title><style>body{font-family:Calibri,sans-serif;padding:40px;line-height:1.6;color:#1e293b;max-width:800px;margin:0 auto;}</style></head><body>${content}</body></html>`;
    webSearchService.downloadToPhysicalComputer(fileName.endsWith('.docx') ? fileName.replace('.docx', '.html') : `${fileName}.html`, fullHtml);
    setStatusMsg('Exported file to your physical computer!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handlePrint = () => {
    soundManager.playClick();
    const content = editorRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${fileName}</title><style>body{font-family:Calibri,sans-serif;padding:40px;color:#000;}</style></head><body>${content}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    soundManager.playClick();
    if (editorRef.current) {
      editorRef.current.innerHTML = template.content;
      setFileName(`${template.name}.docx`);
      updateCounts();
    }
    setShowTemplatesModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] text-[#1e293b] select-none font-sans relative">
      {/* Top Application Bar (Word Ribbon Header) */}
      <div className="bg-[#185abd] text-white flex items-center justify-between px-3 py-1.5 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center font-bold text-base shadow-sm">
            W
          </div>
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="bg-transparent hover:bg-white/10 focus:bg-white/20 px-2 py-0.5 rounded text-xs font-semibold text-white outline-none w-48 transition"
              title="Click to rename document"
            />
            <span className="text-[11px] text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {fileId ? 'Saved to PC' : 'Unsaved'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
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
            title="Open Templates"
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
            onClick={handleDownloadPhysical}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded text-white text-xs font-medium transition"
            title="Download copy to your physical computer"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition"
            title="Print Document"
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* Ribbon Tabs Header */}
      <div className="flex items-center space-x-1 bg-[#154c9e] text-white/80 px-3 text-xs border-b border-[#0f3875] shrink-0">
        {[
          { id: 'home', label: 'Home' },
          { id: 'insert', label: 'Insert' },
          { id: 'layout', label: 'Layout' },
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
                ? 'bg-[#f3f4f6] text-[#185abd] font-bold rounded-t-sm shadow'
                : 'hover:bg-white/10 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ribbon Toolbar Panel */}
      <div className="bg-[#fafafa] border-b border-neutral-300 p-1.5 flex items-center space-x-2 text-xs text-neutral-700 overflow-x-auto shrink-0 shadow-xs">
        {activeTab === 'home' && (
          <>
            {/* Clipboard Group */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-neutral-300">
              <button
                onClick={() => executeCommand('undo')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 hover:text-black transition"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={14} />
              </button>
              <button
                onClick={() => executeCommand('redo')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600 hover:text-black transition"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={14} />
              </button>
            </div>

            {/* Font Family & Size */}
            <div className="flex items-center space-x-1 pr-2 border-r border-neutral-300">
              <select
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  executeCommand('fontName', e.target.value);
                }}
                className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs outline-none cursor-pointer"
              >
                <option value="Calibri">Calibri</option>
                <option value="Segoe UI">Segoe UI</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
              </select>

              <select
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  executeCommand('fontSize', e.target.value);
                }}
                className="bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs outline-none cursor-pointer"
              >
                <option value="1">8 pt</option>
                <option value="2">10 pt</option>
                <option value="3">12 pt</option>
                <option value="4">14 pt</option>
                <option value="5">18 pt</option>
                <option value="6">24 pt</option>
              </select>
            </div>

            {/* Formatting styles */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-neutral-300">
              <button
                onClick={() => executeCommand('bold')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 font-bold transition"
                title="Bold (Ctrl+B)"
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => executeCommand('italic')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 italic transition"
                title="Italic (Ctrl+I)"
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => executeCommand('underline')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 underline transition"
                title="Underline (Ctrl+U)"
              >
                <Underline size={14} />
              </button>
              <button
                onClick={() => executeCommand('strikeThrough')}
                className="p-1.5 hover:bg-neutral-200 rounded text-neutral-700 line-through transition"
                title="Strikethrough"
              >
                <Strikethrough size={14} />
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center space-x-1.5 pr-2 border-r border-neutral-300">
              <label className="flex items-center space-x-1 cursor-pointer" title="Font Color">
                <span className="font-bold underline text-xs">A</span>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => {
                    setFontColor(e.target.value);
                    executeCommand('foreColor', e.target.value);
                  }}
                  className="w-4 h-4 p-0 border-0 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center space-x-1 cursor-pointer" title="Highlight Color">
                <span className="bg-yellow-200 px-1 rounded text-[10px] font-bold">ab</span>
                <input
                  type="color"
                  value={highlightColor === 'transparent' ? '#ffff00' : highlightColor}
                  onChange={(e) => {
                    setHighlightColor(e.target.value);
                    executeCommand('hiliteColor', e.target.value);
                  }}
                  className="w-4 h-4 p-0 border-0 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Paragraph / Alignment */}
            <div className="flex items-center space-x-0.5 pr-2 border-r border-neutral-300">
              <button
                onClick={() => executeCommand('justifyLeft')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Align Left"
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => executeCommand('justifyCenter')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Center"
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => executeCommand('justifyRight')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Align Right"
              >
                <AlignRight size={14} />
              </button>
              <button
                onClick={() => executeCommand('justifyFull')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Justify"
              >
                <AlignJustify size={14} />
              </button>
              <button
                onClick={() => executeCommand('insertUnorderedList')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Bullets"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => executeCommand('insertOrderedList')}
                className="p-1.5 hover:bg-neutral-200 rounded transition"
                title="Numbering"
              >
                <ListOrdered size={14} />
              </button>
            </div>

            {/* Quick Headings */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleApplyHeading('h1')}
                className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded font-bold text-xs"
              >
                Heading 1
              </button>
              <button
                onClick={() => handleApplyHeading('h2')}
                className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded font-semibold text-xs"
              >
                Heading 2
              </button>
              <button
                onClick={() => handleApplyHeading('p')}
                className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-xs"
              >
                Normal
              </button>
            </div>
          </>
        )}

        {activeTab === 'insert' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInsertTable}
              className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <TableIcon size={14} className="text-[#185abd]" />
              <span>Insert Table</span>
            </button>
            <button
              onClick={handleInsertImage}
              className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <ImageIcon size={14} className="text-[#185abd]" />
              <span>Insert Picture</span>
            </button>
            <button
              onClick={() => executeCommand('insertHorizontalRule')}
              className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <span>Horizontal Line</span>
            </button>
            <button
              onClick={() => {
                const now = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                executeCommand('insertText', now);
              }}
              className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded text-xs font-medium"
            >
              <Clock size={14} className="text-[#185abd]" />
              <span>Date & Time</span>
            </button>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-medium">Page Setup:</span>
            <button
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.style.maxWidth = '850px';
                  soundManager.playClick();
                }
              }}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded font-medium"
            >
              Standard Letter (8.5&quot; x 11&quot;)
            </button>
            <button
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.style.maxWidth = '100%';
                  soundManager.playClick();
                }
              }}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded font-medium"
            >
              Wide / Full Width
            </button>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-500 font-medium">Zoom & Mode:</span>
            <button
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.style.transform = 'scale(1)';
                  soundManager.playClick();
                }
              }}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded"
            >
              100% Zoom
            </button>
            <button
              onClick={() => {
                if (editorRef.current) {
                  editorRef.current.style.transform = 'scale(1.15)';
                  soundManager.playClick();
                }
              }}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded"
            >
              115% Zoom
            </button>
          </div>
        )}
      </div>

      {/* Main Page Canvas Container */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#e2e8f0]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={updateCounts}
          style={{
            fontFamily,
            fontSize,
            minHeight: '840px',
            maxWidth: '820px',
            transformOrigin: 'top center',
          }}
          className="w-full bg-white text-[#0f172a] p-12 shadow-2xl rounded-sm outline-none border border-neutral-200 select-text leading-relaxed transition-all"
        />
      </div>

      {/* Document Status Bar */}
      <div className="bg-[#185abd] text-white/90 px-4 py-1 text-[11px] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center space-x-4">
          <span>Page 1 of 1</span>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>English (United States)</span>
        </div>
        <div className="flex items-center space-x-3 text-white/70">
          <span>Lenovo Legion G14 Pro Word</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="All changes ready" />
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#242424] text-white p-5 rounded-2xl max-w-sm w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#185abd] flex items-center justify-center font-bold text-white shadow">
                W
              </div>
              <h3 className="font-bold text-sm">Save to Lenovo PC Storage</h3>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Save Location</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSaveTargetFolder('documents')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'documents'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                  }`}
                >
                  📁 Documents
                </button>
                <button
                  onClick={() => setSaveTargetFolder('desktop')}
                  className={`p-2 rounded-lg border text-xs text-center transition ${
                    saveTargetFolder === 'desktop'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-bold'
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
                className="px-4 py-1.5 bg-[#185abd] hover:bg-[#124b9e] text-white rounded-lg text-xs font-semibold shadow transition"
              >
                Save File
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
                <h3 className="font-bold text-base text-white">Choose a Word Document Template</h3>
                <p className="text-xs text-white/60">Start from scratch or pick a professional design</p>
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
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/60 p-4 rounded-xl cursor-pointer transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#185abd]/30 text-[#60a5fa] border border-[#185abd]/50 flex items-center justify-center font-bold text-sm mb-2 group-hover:scale-105 transition-transform">
                    W
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition">
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
