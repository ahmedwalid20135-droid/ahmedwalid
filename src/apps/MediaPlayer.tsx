import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Disc3, ListMusic } from 'lucide-react';
import { soundManager } from '../services/sound';

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number; // in seconds
  notes: number[]; // MIDI-like note frequencies
}

const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Rain & Chill',
    artist: 'Windows Lo-Fi Ensemble',
    bpm: 76,
    duration: 120,
    notes: [261.63, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0, 329.63], // C4, E4, G4, A4, C5...
  },
  {
    id: '2',
    title: 'Cyber Horizon 2077',
    artist: 'Aura Synthesizer',
    bpm: 110,
    duration: 140,
    notes: [220.0, 261.63, 329.63, 349.23, 392.0, 329.63, 261.63, 196.0],
  },
  {
    id: '3',
    title: 'Midnight Stargaze',
    artist: 'Ambient Dreams',
    bpm: 60,
    duration: 180,
    notes: [196.0, 246.94, 293.66, 329.63, 392.0, 440.0, 329.63, 246.94],
  },
  {
    id: '4',
    title: 'Tokyo Coffee Shop',
    artist: 'Rainy City Beats',
    bpm: 82,
    duration: 135,
    notes: [329.63, 392.0, 493.88, 523.25, 587.33, 523.25, 493.88, 392.0],
  },
];

export const MediaPlayer: React.FC = () => {
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioIntervalRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const currentNoteIdx = useRef(0);

  const track = TRACKS[currentTrackIdx];

  // Visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bars = 28;
    const heights = Array(bars).fill(10);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width - bars * 3) / bars;

      for (let i = 0; i < bars; i++) {
        if (isPlaying) {
          // Dynamic frequency oscillation
          const target = Math.random() * 80 + 15;
          heights[i] += (target - heights[i]) * 0.25;
        } else {
          heights[i] += (4 - heights[i]) * 0.1;
        }

        const h = heights[i];
        const x = i * (barWidth + 3);
        const y = canvas.height - h;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(0.5, '#60a5fa');
        grad.addColorStop(1, '#93c5fd');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, [3, 3, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Audio Synth Engine for current track
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(audioIntervalRef.current);
      clearInterval(progressIntervalRef.current);
      return;
    }

    // Synthesize notes in rhythmic sequence
    const beatMs = (60 / track.bpm) * 1000 * 0.5;

    audioIntervalRef.current = setInterval(() => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx || isMuted || volume <= 0) return;
      const ctx = new AudioCtx();

      const freq = track.notes[currentNoteIdx.current % track.notes.length];
      currentNoteIdx.current++;

      // Synth pad voice
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const effectiveVol = isMuted ? 0 : volume * 0.08;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(effectiveVol, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      // Bass note on downbeats
      if (currentNoteIdx.current % 4 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime);
        bassGain.gain.setValueAtTime(effectiveVol * 1.2, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start();
        bassOsc.stop(ctx.currentTime + 0.6);
      }
    }, beatMs);

    progressIntervalRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= track.duration) {
          handleNext();
          return 0;
        }
        return t + 1;
      });
    }, 1000);

    return () => {
      clearInterval(audioIntervalRef.current);
      clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, currentTrackIdx, volume, isMuted, track]);

  const handleNext = () => {
    soundManager.playClick();
    setCurrentTrackIdx((idx) => (idx + 1) % TRACKS.length);
    setCurrentTime(0);
    currentNoteIdx.current = 0;
  };

  const handlePrev = () => {
    soundManager.playClick();
    setCurrentTrackIdx((idx) => (idx - 1 + TRACKS.length) % TRACKS.length);
    setCurrentTime(0);
    currentNoteIdx.current = 0;
  };

  const togglePlay = () => {
    soundManager.playClick();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#161616] text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1f1f1f]">
        <div className="flex items-center space-x-2">
          <Disc3 className={`text-blue-400 ${isPlaying ? 'animate-spin' : ''}`} size={18} />
          <span className="text-xs font-semibold tracking-wide">Windows Media Player</span>
        </div>
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className={`p-1.5 rounded transition ${
            showPlaylist ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
          }`}
          title="Toggle Playlist"
        >
          <ListMusic size={16} />
        </button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-[#181e2b] via-[#141414] to-[#121212]">
        {/* Album Artwork Simulation */}
        <div className="relative mb-5 group">
          <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 shadow-2xl flex items-center justify-center border border-white/20 p-4 text-center transform transition group-hover:scale-105">
            <Music size={48} className="text-white/80" />
          </div>
          {isPlaying && (
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-4 z-10">
          <h2 className="text-lg font-bold text-white tracking-wide truncate max-w-xs">{track.title}</h2>
          <p className="text-xs text-blue-400 font-medium">{track.artist}</p>
        </div>

        {/* Canvas Visualizer */}
        <div className="w-full max-w-md h-20 mb-2 flex items-center justify-center">
          <canvas ref={canvasRef} width={380} height={80} className="w-full h-full" />
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md px-2 flex flex-col space-y-1">
          <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(currentTime / track.duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/50 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>
      </div>

      {/* Playback Controls Footer */}
      <div className="px-6 py-3 bg-[#1e1e1e] border-t border-white/10 flex items-center justify-between">
        {/* Volume */}
        <div className="flex items-center space-x-2 w-28">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/60 hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 accent-blue-500 cursor-pointer h-1"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrev}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Previous"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={handleNext}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
            title="Next"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* BPM Indicator */}
        <div className="w-28 text-right text-[11px] text-white/40 font-mono">
          {track.bpm} BPM
        </div>
      </div>

      {/* Slide-in Playlist */}
      {showPlaylist && (
        <div className="absolute inset-y-0 right-0 w-64 bg-[#232323] border-l border-white/10 p-3 shadow-2xl z-30 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="text-xs font-semibold text-white/90">Play Queue</span>
            <span className="text-[10px] text-white/50">{TRACKS.length} tracks</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {TRACKS.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => {
                  setCurrentTrackIdx(idx);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }}
                className={`p-2 rounded cursor-pointer transition flex items-center justify-between text-xs ${
                  idx === currentTrackIdx
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-[10px] text-white/40">{t.artist}</div>
                </div>
                <span className="text-[10px] font-mono text-white/40">{formatTime(t.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
