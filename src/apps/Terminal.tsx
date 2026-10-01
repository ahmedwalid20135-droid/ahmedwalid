import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Sparkles } from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';
import { AppId } from '../types/os';

interface TerminalProps {
  onTriggerBSOD?: () => void;
  onClose?: () => void;
  onOpenApp?: (appId: AppId, data?: any) => void;
  onShutdown?: () => void;
  onRestart?: () => void;
  onSleep?: () => void;
  deviceName?: string;
}

interface CommandLog {
  id: string;
  type: 'input' | 'output' | 'error';
  text: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  onTriggerBSOD,
  onClose,
  onOpenApp,
  onShutdown,
  onRestart,
  onSleep,
  deviceName = 'Lenovo',
}) => {
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      type: 'output',
      text: 'Windows PowerShell [Version 10.0.26100.1150]\n(c) Microsoft Corporation. All rights reserved.\n\nType "help" to view available terminal commands.\n',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [textColor, setTextColor] = useState('#22c55e'); // Matrix green default or cyan
  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      setLogs((prev) => [
        ...prev,
        { id: Math.random().toString(), type: 'input', text: 'PS C:\\Users\\Admin> ' },
      ]);
      return;
    }

    // Add to history
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newLogs: CommandLog[] = [
      { id: Math.random().toString(), type: 'input', text: `PS C:\\Users\\Admin> ${trimmed}` },
    ];

    switch (command) {
      case 'help':
        newLogs.push({
          id: Math.random().toString(),
          type: 'output',
          text: `Available Commands:
  help               Show this command list
  hostname           Display device computer name (${deviceName})
  shutdown [/s|/r]   Shut down or restart the ${deviceName} computer
  restart            Reboot the ${deviceName} system
  sleep              Put the ${deviceName} computer into sleep mode
  dir, ls            List files and directories
  cat <file>         Display file contents
  echo <txt> [> file]Print text or save to file
  mkdir <name>       Create a new directory
  rm <name>          Delete a file or folder
  taskmgr, ps        Launch Windows Task Manager
  neofetch           Display system specifications & ASCII art
  matrix             Toggle Matrix code rain effect
  calc <expression>  Calculate math formula (e.g. calc 25 * 4.2)
  ping <host>        Ping a remote server (e.g. ping google.com)
  date, time         Display current date and time
  whoami             Display current user and privilege
  color <color>      Change text color (green, cyan, yellow, white, red)
  cls, clear         Clear the terminal screen
  bsod               Trigger Blue Screen of Death easter egg
  exit               Close terminal session`,
        });
        break;

      case 'dir':
      case 'ls': {
        const desktopItems = fs.getItems('desktop');
        let listing = ' Mode                LastWriteTime         Length Name\n';
        listing += ' ----                -------------         ------ ----\n';
        desktopItems.forEach((item) => {
          const d = new Date(item.modifiedAt).toLocaleDateString();
          const mode = item.type === 'folder' ? 'd----' : '-a---';
          const size = item.size ? `${item.size} B` : (item.type === 'folder' ? '<DIR>' : '0 B');
          listing += ` ${mode}         ${d}        ${size.padEnd(8)} ${item.name}\n`;
        });
        newLogs.push({ id: Math.random().toString(), type: 'output', text: listing });
        break;
      }

      case 'cat':
      case 'type': {
        const target = args.join(' ');
        if (!target) {
          newLogs.push({ id: Math.random().toString(), type: 'error', text: 'Error: Specify file name to read. Example: cat Welcome.txt' });
          break;
        }
        const found = fs.getItems('desktop').find((f) => f.name.toLowerCase() === target.toLowerCase());
        if (found && found.content !== undefined) {
          newLogs.push({ id: Math.random().toString(), type: 'output', text: found.content });
        } else {
          newLogs.push({ id: Math.random().toString(), type: 'error', text: `cat: File '${target}' not found on Desktop.` });
        }
        break;
      }

      case 'echo': {
        const full = args.join(' ');
        if (full.includes('>')) {
          const [text, filename] = full.split('>').map((s) => s.trim());
          if (filename) {
            fs.createFile(filename, 'desktop', text, 'txt');
            newLogs.push({ id: Math.random().toString(), type: 'output', text: `Saved output to '${filename}' on Desktop.` });
          }
        } else {
          newLogs.push({ id: Math.random().toString(), type: 'output', text: full || '' });
        }
        break;
      }

      case 'mkdir': {
        const dirName = args.join(' ');
        if (!dirName) {
          newLogs.push({ id: Math.random().toString(), type: 'error', text: 'mkdir: Please specify a directory name.' });
        } else {
          fs.createFolder(dirName, 'desktop');
          newLogs.push({ id: Math.random().toString(), type: 'output', text: `Directory '${dirName}' created on Desktop.` });
        }
        break;
      }

      case 'rm':
      case 'del': {
        const target = args.join(' ');
        const item = fs.getItems('desktop').find((f) => f.name.toLowerCase() === target.toLowerCase());
        if (item) {
          fs.deleteItem(item.id);
          newLogs.push({ id: Math.random().toString(), type: 'output', text: `Item '${target}' moved to Recycle Bin.` });
        } else {
          newLogs.push({ id: Math.random().toString(), type: 'error', text: `rm: Item '${target}' not found.` });
        }
        break;
      }

      case 'neofetch': {
        const dev = deviceName || 'Lenovo';
        const art = `
  ################   ################     admin@${dev.toUpperCase()}
  ################   ################     -------------------
  ################   ################     OS: Windows 11 Pro (${dev} Edition)
  ################   ################     Host: ${dev} ThinkPad / Legion System
                                          Kernel: 10.0.26100.1150
  ################   ################     Uptime: ${Math.floor(performance.now() / 60000)} mins
  ################   ################     Shell: PowerShell 7.4.2
  ################   ################     Resolution: ${window.innerWidth}x${window.innerHeight}
  ################   ################     WM: Fluent Mica Window Manager
                                          CPU: Intel Core Ultra 7 (Lenovo Tuned)
                                          Memory: 16384 MB Virtual RAM
`;
        newLogs.push({ id: Math.random().toString(), type: 'output', text: art });
        break;
      }

      case 'hostname':
        newLogs.push({ id: Math.random().toString(), type: 'output', text: deviceName || 'Lenovo' });
        break;

      case 'shutdown': {
        const flag = args[0]?.toLowerCase();
        if (flag === '/r' || flag === '-r') {
          newLogs.push({ id: Math.random().toString(), type: 'output', text: `Initiating system restart for ${deviceName || 'Lenovo'}...` });
          setTimeout(() => onRestart && onRestart(), 600);
        } else if (flag === '/h' || flag === '-h') {
          newLogs.push({ id: Math.random().toString(), type: 'output', text: `Putting ${deviceName || 'Lenovo'} into sleep mode...` });
          setTimeout(() => onSleep && onSleep(), 600);
        } else {
          newLogs.push({ id: Math.random().toString(), type: 'output', text: `Shutting down ${deviceName || 'Lenovo'}...` });
          setTimeout(() => onShutdown && onShutdown(), 600);
        }
        break;
      }

      case 'restart':
      case 'reboot':
        newLogs.push({ id: Math.random().toString(), type: 'output', text: `Restarting ${deviceName || 'Lenovo'}...` });
        setTimeout(() => onRestart && onRestart(), 600);
        break;

      case 'sleep':
        newLogs.push({ id: Math.random().toString(), type: 'output', text: `Entering sleep mode on ${deviceName || 'Lenovo'}...` });
        setTimeout(() => onSleep && onSleep(), 600);
        break;

      case 'whoami':
        newLogs.push({ id: Math.random().toString(), type: 'output', text: `${(deviceName || 'LENOVO').toUpperCase()}\\Administrator` });
        break;

      case 'matrix': {
        setIsMatrixMode(!isMatrixMode);
        newLogs.push({
          id: Math.random().toString(),
          type: 'output',
          text: isMatrixMode ? 'Matrix Rain mode disabled.' : 'Wake up, Neo... Matrix Rain active. (Type "matrix" again to exit)',
        });
        break;
      }

      case 'calc': {
        const expr = args.join(' ');
        try {
          // Safe evaluate simple arithmetic only
          if (/^[0-9+\-*/().\s^%]+$/.test(expr)) {
            // eslint-disable-next-line no-eval
            const res = Function(`'use strict'; return (${expr})`)();
            newLogs.push({ id: Math.random().toString(), type: 'output', text: `= ${res}` });
          } else {
            newLogs.push({ id: Math.random().toString(), type: 'error', text: 'Error: Invalid mathematical expression.' });
          }
        } catch (e: any) {
          newLogs.push({ id: Math.random().toString(), type: 'error', text: `Calc error: ${e.message}` });
        }
        break;
      }

      case 'ping': {
        const host = args[0] || '127.0.0.1';
        let pingText = `Pinging ${host} [198.51.100.42] with 32 bytes of data:\n`;
        pingText += `Reply from ${host}: bytes=32 time=12ms TTL=117\n`;
        pingText += `Reply from ${host}: bytes=32 time=9ms TTL=117\n`;
        pingText += `Reply from ${host}: bytes=32 time=14ms TTL=117\n`;
        pingText += `Reply from ${host}: bytes=32 time=11ms TTL=117\n`;
        pingText += `\nPing statistics for ${host}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 9ms, Maximum = 14ms, Average = 11ms`;
        newLogs.push({ id: Math.random().toString(), type: 'output', text: pingText });
        break;
      }

      case 'date':
      case 'time':
        newLogs.push({ id: Math.random().toString(), type: 'output', text: new Date().toString() });
        break;

      case 'color': {
        const col = args[0]?.toLowerCase();
        if (col === 'green') setTextColor('#22c55e');
        else if (col === 'cyan') setTextColor('#06b6d4');
        else if (col === 'yellow') setTextColor('#eab308');
        else if (col === 'white') setTextColor('#f8fafc');
        else if (col === 'red') setTextColor('#ef4444');
        else if (col) setTextColor(col);
        newLogs.push({ id: Math.random().toString(), type: 'output', text: `Terminal color changed to ${col || 'default'}.` });
        break;
      }

      case 'cls':
      case 'clear':
        setLogs([]);
        return;

      case 'bsod':
        soundManager.playError();
        if (onTriggerBSOD) onTriggerBSOD();
        return;

      case '.\\configure-secondarydrivestorage.ps1':
      case 'configure-secondarydrivestorage.ps1':
      case './configure-secondarydrivestorage.ps1':
      case 'set-storagedrive': {
        const drive = args[0] || 'D:';
        soundManager.playDing();
        newLogs.push({
          id: Math.random().toString(),
          type: 'output',
          text: `==========================================================
 Windows 11 Storage Redirection to ${drive}
==========================================================
[+] Verified Administrator privilege.
[+] Created directory: ${drive}\\Downloads
[+] Created directory: ${drive}\\Documents
[+] Created directory: ${drive}\\Pictures
[+] Created directory: ${drive}\\Music
[+] Created directory: ${drive}\\Videos
[+] User Shell Folders redirected successfully in HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders
[+] Windows Store AppX default volume set to: ${drive}
[*] Restarting Windows Explorer...
[SUCCESS] Windows 11 now saves all new files and apps to ${drive}!`,
        });
        break;
      }

      case 'taskmgr':
      case 'taskmanager':
      case 'ps':
      case 'top':
        soundManager.playClick();
        if (onOpenApp) {
          onOpenApp('taskmanager');
          newLogs.push({
            id: Math.random().toString(),
            type: 'output',
            text: 'Launched Windows Task Manager (taskmgr.exe).',
          });
        } else {
          newLogs.push({
            id: Math.random().toString(),
            type: 'output',
            text: 'Task Manager process is active.',
          });
        }
        break;

      case 'exit':
        if (onClose) onClose();
        return;

      default:
        newLogs.push({
          id: Math.random().toString(),
          type: 'error',
          text: `'${command}' is not recognized as an internal or external command. Type 'help' for available commands.`,
        });
        break;
    }

    setLogs((prev) => [...prev, ...newLogs]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-col h-full bg-[#0c0c0c] text-sm font-mono overflow-hidden select-text relative"
      style={{ color: textColor }}
    >
      {/* Matrix background effect if toggled */}
      {isMatrixMode && <MatrixBackground />}

      {/* Terminal Output */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 relative z-10 leading-relaxed">
        {logs.map((log) => (
          <div key={log.id} className="whitespace-pre-wrap break-words">
            {log.type === 'input' ? (
              <span className="text-white/80 font-semibold">{log.text}</span>
            ) : log.type === 'error' ? (
              <span className="text-red-400">{log.text}</span>
            ) : (
              <span>{log.text}</span>
            )}
          </div>
        ))}

        {/* Active Command Line */}
        <div className="flex items-center space-x-2 pt-1">
          <span className="text-white/80 font-semibold select-none">PS C:\Users\Admin&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ color: textColor }}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm caret-white"
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

// Canvas matrix rain effect
const MatrixBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = canvas.parentElement?.clientHeight || 400;

    const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const interval = setInterval(() => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-20 pointer-events-none z-0" />;
};
