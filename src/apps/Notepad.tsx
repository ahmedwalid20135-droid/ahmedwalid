import React, { useState, useEffect } from 'react';
import { Save, FileText, Download, Copy, Trash2, Check } from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';

interface NotepadProps {
  initialFileId?: string;
  initialContent?: string;
  initialFileName?: string;
  onSaveCallback?: () => void;
}

export const Notepad: React.FC<NotepadProps> = ({
  initialFileId,
  initialContent = '',
  initialFileName = 'Untitled.txt',
  onSaveCallback,
}) => {
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(initialFileName);
  const [fileId, setFileId] = useState<string | undefined>(initialFileId);
  const [isSaved, setIsSaved] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (initialFileId) {
      const item = fs.getItem(initialFileId);
      if (item && item.content !== undefined) {
        setContent(item.content);
        setFileName(item.name);
        setFileId(item.id);
        setIsSaved(true);
      }
    }
  }, [initialFileId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (fileId) {
      fs.updateFile(fileId, content);
      setIsSaved(true);
      setStatusMsg('Saved!');
      soundManager.playClick();
      if (onSaveCallback) onSaveCallback();
    } else {
      // Create new file on Desktop
      const newFile = fs.createFile(fileName.endsWith('.txt') ? fileName : `${fileName}.txt`, 'desktop', content, 'txt');
      setFileId(newFile.id);
      setIsSaved(true);
      setStatusMsg('Saved to Desktop!');
      soundManager.playClick();
      if (onSaveCallback) onSaveCallback();
    }
    setTimeout(() => setStatusMsg(''), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playClick();
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white/90 font-sans">
      {/* Menu & Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#252525] text-xs">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setIsSaved(false);
            }}
            className="bg-transparent border border-transparent hover:border-white/20 focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white font-medium focus:outline-none"
          />
          {!isSaved && <span className="text-yellow-400 text-xs font-bold">• Unsaved</span>}
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition"
            title="Save file to desktop"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white/90 rounded text-xs transition"
            title="Download as .txt"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <div className="h-4 w-px bg-white/15 mx-1" />
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-2 py-1 rounded text-xs transition ${
              wordWrap ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
            }`}
            title="Toggle Word Wrap"
          >
            Wrap
          </button>
          <button
            onClick={() => setFontSize((s) => Math.max(10, s - 2))}
            className="px-2 py-1 text-white/70 hover:text-white rounded text-xs"
            title="Smaller Font"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize((s) => Math.min(26, s + 2))}
            className="px-2 py-1 text-white/70 hover:text-white rounded text-xs"
            title="Larger Font"
          >
            A+
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          value={content}
          onChange={handleTextChange}
          spellCheck={false}
          style={{
            fontSize: `${fontSize}px`,
            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
          }}
          className="w-full h-full p-4 bg-transparent text-gray-100 font-mono resize-none focus:outline-none overflow-auto leading-relaxed select-text"
          placeholder="Start typing..."
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#1a1a1a] border-t border-white/10 text-[11px] text-white/60">
        <div className="flex items-center space-x-4">
          <span>Ln {lineCount}, Col {content.length - content.lastIndexOf('\n')}</span>
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center space-x-3">
          {statusMsg && (
            <span className="text-emerald-400 font-medium flex items-center space-x-1">
              <Check size={11} />
              <span>{statusMsg}</span>
            </span>
          )}
          <span>UTF-8</span>
          <span>Windows (CRLF)</span>
        </div>
      </div>
    </div>
  );
};
