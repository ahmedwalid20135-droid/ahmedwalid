import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Sparkles, Image, Check, Download, Video } from 'lucide-react';
import { fs } from '../services/filesystem';
import { soundManager } from '../services/sound';

type FilterType = 'normal' | 'cyberpunk' | 'vintage' | 'warm' | 'cool';

export const CameraApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [hasWebcam, setHasWebcam] = useState<boolean>(false);
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Try to access user camera or fallback gracefully
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCam = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasWebcam(true);
          }
        }
      } catch (_) {
        setHasWebcam(false);
      }
    };
    startCam();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getFilterStyle = (f: FilterType): string => {
    switch (f) {
      case 'cyberpunk': return 'hue-rotate-90 contrast-125 saturate-200';
      case 'vintage': return 'grayscale sepia contrast-110';
      case 'warm': return 'sepia-[0.4] saturate-150 brightness-105';
      case 'cool': return 'hue-rotate-180 brightness-110';
      default: return '';
    }
  };

  const takePhoto = () => {
    soundManager.playCameraShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    if (hasWebcam && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    } else {
      // Draw scenic photo booth mirror
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 480);
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#9333ea');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(320, 240, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Win11 Photo Booth Snapshot', 320, 240);
      ctx.font = '14px sans-serif';
      ctx.fillText(new Date().toLocaleTimeString(), 320, 270);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setRecentPhotos((prev) => [dataUrl, ...prev.slice(0, 5)]);

    // Save directly to Win11 OS Storage (Pictures folder)
    const fileName = `Photo_${Date.now()}.png`;
    fs.createFile(fileName, 'pictures', dataUrl, 'png');

    setStatusMessage('Saved to Win11 Pictures Storage!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-white select-none">
      {/* Viewport Area */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {hasWebcam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${getFilterStyle(filter)}`}
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#111827] via-[#1e1b4b] to-[#0f172a] ${getFilterStyle(filter)}`}>
            <div className="w-24 h-24 rounded-full bg-blue-600/30 border-2 border-blue-400/50 flex items-center justify-center text-4xl mb-3 shadow-2xl">
              📸
            </div>
            <h3 className="text-lg font-bold text-white">Win11 Photo Studio</h3>
            <p className="text-xs text-white/60 max-w-sm mt-1">
              Virtual camera viewport ready. Click the capture button below to take a snapshot and save directly to your Win11 Web OS Storage.
            </p>
          </div>
        )}

        {/* Flash effect overlay */}
        {flash && <div className="absolute inset-0 bg-white z-50 pointer-events-none" />}

        {/* Hidden capture canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Status Toast */}
        {statusMessage && (
          <div className="absolute top-4 bg-emerald-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium text-white shadow-xl flex items-center space-x-1.5 animate-bounce z-40">
            <Check size={14} />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Camera Controls & Filters Bar */}
      <div className="px-6 py-4 bg-[#1c1c1c] border-t border-white/10 flex flex-col space-y-3">
        {/* Filters Row */}
        <div className="flex items-center justify-center space-x-2">
          {[
            { id: 'normal', label: 'Original' },
            { id: 'cyberpunk', label: 'Cyberpunk' },
            { id: 'vintage', label: 'Vintage B&W' },
            { id: 'warm', label: 'Golden Warm' },
            { id: 'cool', label: 'Cool Neon' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                soundManager.playClick();
                setFilter(item.id as any);
              }}
              className={`px-3 py-1 rounded-full text-xs transition ${
                filter === item.id
                  ? 'bg-blue-600 text-white font-medium shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Bottom Shutter & Recent Snaps */}
        <div className="flex items-center justify-between">
          {/* Recent thumbnail */}
          <div className="w-24 flex items-center space-x-1.5">
            {recentPhotos[0] ? (
              <img
                src={recentPhotos[0]}
                alt="Recent"
                className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 text-xs">
                <Image size={16} />
              </div>
            )}
            <span className="text-[10px] text-white/40 truncate">Pictures</span>
          </div>

          {/* Shutter Button */}
          <button
            onClick={takePhoto}
            className="w-14 h-14 rounded-full bg-white border-4 border-neutral-700 flex items-center justify-center text-neutral-900 shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            title="Take Photo"
          >
            <Camera size={24} />
          </button>

          <div className="w-24 text-right text-[11px] text-white/50">
            {recentPhotos.length} taken
          </div>
        </div>
      </div>
    </div>
  );
};
