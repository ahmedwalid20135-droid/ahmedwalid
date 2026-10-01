import React, { useState } from 'react';
import { Play, Save, Download, FileCode, Check, Copy } from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';

export const VSCodeApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [htmlCode, setHtmlCode] = useState(
    `<div class="card">\n  <h1>Hello from Win11 Web OS!</h1>\n  <p>Edit this code live and click Run Preview.</p>\n  <button onclick="greet()">Click Me</button>\n</div>`
  );
  const [cssCode, setCssCode] = useState(
    `body {\n  background: #0f172a;\n  color: #f8fafc;\n  font-family: sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n.card {\n  background: #1e293b;\n  padding: 24px;\n  border-radius: 12px;\n  border: 1px solid rgba(255,255,255,0.1);\n  text-align: center;\n}\nbutton {\n  background: #3b82f6;\n  color: white;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 6px;\n  cursor: pointer;\n}`
  );
  const [jsCode, setJsCode] = useState(
    `function greet() {\n  alert('Hello from VS Code Lite running on Win11 Web OS!');\n}`
  );
  const [previewSrc, setPreviewSrc] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const runCode = () => {
    soundManager.playClick();
    const combined = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${cssCode}</style>
        </head>
        <body>
          ${htmlCode}
          <script>${jsCode}</script>
        </body>
      </html>
    `;
    setPreviewSrc(combined);
  };

  const handleSaveToOS = () => {
    soundManager.playClick();
    fs.createFile('index.html', 'documents', htmlCode, 'txt');
    fs.createFile('style.css', 'documents', cssCode, 'txt');
    fs.createFile('script.js', 'documents', jsCode, 'txt');
    setStatusMsg('Saved project to Win11 Documents Storage!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] text-white select-none">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252525] border-b border-white/10 text-xs">
        {/* Tabs */}
        <div className="flex items-center space-x-1">
          {[
            { id: 'html', label: 'index.html', icon: '🌐' },
            { id: 'css', label: 'style.css', icon: '🎨' },
            { id: 'js', label: 'script.js', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-t-lg transition text-xs font-mono ${
                activeTab === tab.id
                  ? 'bg-[#1e1e1e] text-blue-400 border-t-2 border-blue-500 font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {statusMsg && (
            <span className="text-emerald-400 text-xs flex items-center space-x-1 mr-2">
              <Check size={12} />
              <span>{statusMsg}</span>
            </span>
          )}
          <button
            onClick={runCode}
            className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            <Play size={13} fill="currentColor" />
            <span>Run Preview</span>
          </button>
          <button
            onClick={handleSaveToOS}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
          >
            <Save size={13} />
            <span>Save to OS Storage</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Pane */}
        <div className="w-1/2 h-full bg-[#1e1e1e] border-r border-white/10 flex flex-col">
          <textarea
            value={activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode}
            onChange={(e) => {
              if (activeTab === 'html') setHtmlCode(e.target.value);
              else if (activeTab === 'css') setCssCode(e.target.value);
              else setJsCode(e.target.value);
            }}
            spellCheck={false}
            className="w-full h-full p-4 bg-transparent text-emerald-400 font-mono text-xs resize-none outline-none leading-relaxed select-text"
          />
        </div>

        {/* Live Preview Pane */}
        <div className="w-1/2 h-full bg-white flex flex-col">
          <div className="px-3 py-1 bg-[#252525] border-b border-white/10 text-[11px] text-white/50 select-none flex justify-between">
            <span>Live Output Preview</span>
            <span>Sandbox Mode</span>
          </div>
          <iframe
            title="Preview"
            srcDoc={previewSrc || `<div style="padding:20px;font-family:sans-serif;color:#555">Click 'Run Preview' above to execute code.</div>`}
            className="w-full flex-1 border-none bg-white"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};
