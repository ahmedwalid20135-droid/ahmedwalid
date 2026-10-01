import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  RotateCcw,
  Moon,
  Power,
  Wifi,
  Sparkles,
  ChevronUp,
  AlertCircle,
  Check,
  HelpCircle,
  Smile,
  Delete,
  UserPlus,
  Users,
  Info,
  Camera,
  Edit2,
  X,
  Upload,
  Trash2,
} from 'lucide-react';
import { SystemSettings } from '../types/os';
import { soundManager } from '../services/sound';
import { accountManager, UserAccount, PRESET_AVATAR_PHOTOS } from '../services/accountManager';
import { fs } from '../services/filesystem';

interface LockScreenProps {
  isLocked: boolean;
  settings: SystemSettings;
  onUnlock: () => void;
  onShutdown: () => void;
  onSleep: () => void;
  onRestart: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  isLocked,
  settings,
  onUnlock,
  onShutdown,
  onSleep,
  onRestart,
}) => {
  const [stage, setStage] = useState<'cover' | 'login'>('cover');
  const [loginMethod, setLoginMethod] = useState<'pin' | 'password'>('pin');
  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  // User Accounts
  const [currentUser, setCurrentUser] = useState<UserAccount>(accountManager.getCurrentUser());
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(accountManager.getAccounts());
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Quick Sign-up inputs on Lock Screen
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPin, setSignupPin] = useState('');

  // Lockscreen Profile Customization (Name & Photo)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editPhotoUrl, setEditPhotoUrl] = useState(currentUser.avatarPhotoUrl || '');
  const [profileTab, setProfileTab] = useState<'presets' | 'upload' | 'emoji'>('presets');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Time & Date state
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = accountManager.subscribe((user) => {
      setCurrentUser(user);
      setAllAccounts(accountManager.getAccounts());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // When stage changes to login, focus the input
  useEffect(() => {
    if (stage === 'login' && !isSigningUp && !showUserSwitcher) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [stage, loginMethod, isSigningUp, showUserSwitcher]);

  // Handle keyboard events when locked
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === 'cover') {
        soundManager.playClick();
        setStage('login');
      } else if (e.key === 'Escape') {
        if (isSigningUp) {
          setIsSigningUp(false);
        } else if (showUserSwitcher) {
          setShowUserSwitcher(false);
        } else {
          setStage('cover');
          setInputVal('');
          setErrorMessage('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, stage, isSigningUp, showUserSwitcher]);

  if (!isLocked) {
    return null;
  }

  const deviceName = settings.deviceName || 'Lenovo Legion G14';

  const handleAttemptUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const val = inputVal.trim();
    const userPin = currentUser.pin || '1234';
    const hasCustomPassword = currentUser.hasCustomPassword && Boolean(currentUser.password);

    if (loginMethod === 'pin') {
      const isPinMatch = val === userPin || val === '1234' || val === '';
      if (isPinMatch) {
        soundManager.playDing();
        fs.loadUserFiles(currentUser.username);
        setErrorMessage('');
        setInputVal('');
        onUnlock();
        return;
      }
    } else {
      // Password mode: if no custom password set, password is not required
      if (!hasCustomPassword) {
        soundManager.playDing();
        fs.loadUserFiles(currentUser.username);
        setErrorMessage('');
        setInputVal('');
        onUnlock();
        return;
      }
      if (val === currentUser.password) {
        soundManager.playDing();
        fs.loadUserFiles(currentUser.username);
        setErrorMessage('');
        setInputVal('');
        onUnlock();
        return;
      }
    }

    soundManager.playError();
    setIsShaking(true);
    setErrorMessage(
      loginMethod === 'pin'
        ? 'The PIN is incorrect. (Default PIN: 1234)'
        : 'The password is incorrect. Enter your custom password or switch to PIN (1234).'
    );
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleQuickUnlockWithPin = () => {
    soundManager.playDing();
    fs.loadUserFiles(currentUser.username);
    setErrorMessage('');
    setInputVal('');
    onUnlock();
  };

  const handleQuickSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = accountManager.signUp({
      username: signupUsername,
      displayName: signupName || signupUsername,
      password: signupPassword,
      pin: signupPin || '1234',
    });

    if (res.success && res.user) {
      soundManager.playDing();
      fs.loadUserFiles(res.user.username);
      setIsSigningUp(false);
      onUnlock();
    } else {
      soundManager.playError();
      setErrorMessage(res.error || 'Failed to sign up.');
    }
  };

  const handleOpenProfileEditor = () => {
    soundManager.playClick();
    setEditName(currentUser.displayName);
    setEditPhotoUrl(currentUser.avatarPhotoUrl || '');
    setIsEditingProfile(true);
    setProfileSuccessMsg('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playDing();
    accountManager.updateProfile(currentUser.id, {
      displayName: editName.trim() || currentUser.displayName,
      avatarPhotoUrl: editPhotoUrl,
    });
    setProfileSuccessMsg('Profile updated successfully!');
    setTimeout(() => {
      setIsEditingProfile(false);
      setProfileSuccessMsg('');
    }, 1000);
  };

  const handleLockscreenFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      soundManager.playError();
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        soundManager.playDing();
        setEditPhotoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-[99990] select-none font-sans overflow-hidden text-white transition-all duration-500"
      style={{
        backgroundImage: `url(${settings.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. COVER SCREEN (Time, Date, Notifications, Click to raise) */}
      <div
        onClick={() => {
          if (stage === 'cover') {
            soundManager.playClick();
            setStage('login');
          }
        }}
        className={`absolute inset-0 flex flex-col justify-between p-8 sm:p-14 transition-all duration-500 cursor-pointer ${
          stage === 'login'
            ? '-translate-y-full opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100 bg-black/25 backdrop-blur-[2px]'
        }`}
      >
        {/* Top Lenovo Branding Tag */}
        <div className="flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center space-x-2">
            <span className="bg-[#e11424] text-white text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase shadow">
              LENOVO LEGION
            </span>
            <span className="text-white/80 font-medium">G14 WinWeb 11 Pro</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-white/70">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Windows Hello &amp; File Protection Active</span>
          </div>
        </div>

        {/* Center Clock & Date */}
        <div className="text-center space-y-2 mb-16">
          <div className="text-7xl sm:text-8xl md:text-9xl font-extralight tracking-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]">
            {timeStr}
          </div>
          <div className="text-base sm:text-xl font-normal text-white/95 drop-shadow-md">
            {dateStr}
          </div>
        </div>

        {/* Bottom Bar: Widgets & Swipe Indicator */}
        <div className="flex items-center justify-between">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center space-x-3 text-xs text-white/90 shadow-lg">
            <span>⛅ 68° Partly Sunny</span>
            <span className="text-white/30">•</span>
            <span>Lenovo G14 (1TB SSD): Protected</span>
          </div>

          <div className="flex flex-col items-center animate-bounce text-xs text-white/90 font-medium">
            <ChevronUp size={20} />
            <span>Click or press any key to unlock</span>
          </div>
        </div>
      </div>

      {/* 2. WINDOWS HELLO LOGIN SCREEN */}
      <div
        className={`absolute inset-0 bg-black/45 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 transition-all duration-500 ${
          stage === 'login'
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Back Button & Brand */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => {
              soundManager.playClick();
              setIsSigningUp(false);
              setShowUserSwitcher(false);
              setStage('cover');
              setInputVal('');
              setErrorMessage('');
            }}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white/90 hover:text-white cursor-pointer"
          >
            <span>← Lock Screen</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="bg-[#e11424] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              LEGION G14
            </span>
            <span className="text-xs text-white/70">Lenovo WinWeb 11 Pro</span>
          </div>
        </div>

        {/* Center Box: Sign-in OR Sign-up */}
        {isSigningUp ? (
          /* Sign Up Form on Lock Screen */
          <div className="max-w-sm mx-auto w-full bg-[#1e1e1ed9] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center text-xl mx-auto">
                🚀
              </div>
              <h2 className="text-base font-bold text-white">Create Lenovo G14 Account</h2>
              <p className="text-xs text-white/60">
                Register a new profile to permanently save your files and settings.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2 bg-red-950/70 border border-red-500/40 rounded-lg text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleQuickSignUp} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] text-white/60 mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Alex"
                  required
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/60 mb-0.5">Username</label>
                <input
                  type="text"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  placeholder="e.g. alex"
                  required
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/60 mb-0.5">
                  Password <span className="text-white/40 font-normal">(Optional - leave empty for PIN only)</span>
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Leave empty for PIN only (or 4+ chars)"
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-white/60 mb-0.5">
                  Windows Hello PIN <span className="text-emerald-400 font-normal">(Default: 1234)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value)}
                  placeholder="4 digits (e.g. 1234)"
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-400 font-mono"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsSigningUp(false)}
                  className="px-3 py-1.5 text-white/60 hover:text-white"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow"
                >
                  Create &amp; Sign In
                </button>
              </div>
            </form>
          </div>
        ) : isEditingProfile ? (
          /* Profile Customization (Name & Photo) on Lock Screen */
          <div className="max-w-md mx-auto w-full bg-[#1e1e1eeb] border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Camera size={18} className="text-blue-400" />
                <h2 className="text-base font-bold text-white">Customize Profile Name &amp; Photo</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Preview & Display Name */}
              <div className="flex items-center space-x-4 bg-black/30 p-3 rounded-xl border border-white/10">
                {editPhotoUrl ? (
                  <img
                    src={editPhotoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-lg shrink-0"
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-tr ${currentUser.avatarColor || 'from-blue-700 to-indigo-600'} border-2 border-blue-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg shrink-0`}
                  >
                    {currentUser.avatarEmoji || '💻'}
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="block text-[11px] text-white/70 font-medium">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full bg-[#121216] border border-white/20 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <div className="text-[10px] text-white/40">Username: @{currentUser.username}</div>
                </div>
              </div>

              {/* Photo Source Tabs */}
              <div>
                <div className="flex items-center space-x-2 border-b border-white/10 pb-2 text-xs mb-3">
                  <button
                    type="button"
                    onClick={() => setProfileTab('presets')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      profileTab === 'presets' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Featured Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('upload')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      profileTab === 'upload' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('emoji')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      profileTab === 'emoji' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Emoji
                  </button>
                </div>

                {profileTab === 'presets' && (
                  <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                    {PRESET_AVATAR_PHOTOS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setEditPhotoUrl(p.url);
                        }}
                        className={`flex flex-col items-center p-1.5 rounded-xl border transition cursor-pointer ${
                          editPhotoUrl === p.url ? 'border-blue-500 bg-blue-600/30' : 'border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                      >
                        <img src={p.url} alt={p.name} className="w-10 h-10 rounded-full object-cover mb-1 shadow" />
                        <span className="text-[10px] text-white/80 truncate w-full text-center">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {profileTab === 'upload' && (
                  <div className="p-3 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center space-y-1.5 text-center bg-black/20">
                    <Upload size={20} className="text-blue-400" />
                    <div className="text-xs font-semibold text-white">Upload image from your computer</div>
                    <label className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium cursor-pointer shadow">
                      Browse Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLockscreenFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {profileTab === 'emoji' && (
                  <div className="flex flex-wrap gap-2 justify-center max-h-28 overflow-y-auto p-1">
                    {['💻', '🚀', '⚡', '🎮', '🌟', '🦊', '🎨', '🔥', '🛡️', '🎧', '💎', '👑'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setEditPhotoUrl('');
                          accountManager.updateProfile(currentUser.id, { avatarEmoji: emoji });
                        }}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600/30 text-lg flex items-center justify-center transition cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 text-white/60 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center space-x-2">
                  {editPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditPhotoUrl('')}
                      className="px-2.5 py-1.5 text-red-400 hover:text-red-300 text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Remove Photo</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          /* Normal Sign-In Screen */
          <div className="max-w-xs mx-auto w-full flex flex-col items-center text-center space-y-4">
            {/* User Profile Avatar with Lenovo Badge & Interactive Photo Change */}
            <div
              className="relative group cursor-pointer"
              onClick={handleOpenProfileEditor}
              title="Click to change profile photo or name"
            >
              {currentUser.avatarPhotoUrl ? (
                <img
                  src={currentUser.avatarPhotoUrl}
                  alt={currentUser.displayName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/40 shadow-2xl group-hover:opacity-85 transition"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${currentUser.avatarColor || 'from-blue-700 to-indigo-600'} border-2 border-white/30 flex items-center justify-center font-bold text-3xl text-white shadow-2xl group-hover:scale-105 transition-transform`}>
                  {currentUser.avatarEmoji || '💻'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-semibold transition">
                <Camera size={18} className="text-blue-300 mb-0.5" />
                <span>Change</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#e11424] text-white flex items-center justify-center font-extrabold text-xs shadow-md border-2 border-black">
                L
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center space-x-1.5">
                <h2 className="text-xl font-semibold text-white tracking-wide">{currentUser.displayName}</h2>
                <button
                  type="button"
                  onClick={handleOpenProfileEditor}
                  className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                  title="Change name & photo profile"
                >
                  <Edit2 size={13} />
                </button>
              </div>
              <div className="text-xs text-white/60 flex items-center justify-center space-x-1 mt-0.5">
                <span>@{currentUser.username}</span>
                <span>•</span>
                <span className="text-emerald-400">1TB Storage Connected</span>
              </div>
            </div>

            {/* Windows Hello Banner Pill */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-600/25 border border-blue-400/40 text-xs text-blue-200 shadow-sm backdrop-blur-md">
                <Smile size={14} className="text-blue-300 animate-pulse" />
                <span className="font-semibold tracking-wide">Windows Hello</span>
                <span className="text-[10px] text-blue-300/70 uppercase">({loginMethod === 'pin' ? 'PIN' : 'Password'})</span>
              </div>
              {!currentUser.hasCustomPassword && (
                <div className="text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center space-x-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span>Password not required • Use PIN (Default: 1234)</span>
                </div>
              )}
            </div>

            {/* Quick 1-click Unlock Button for PIN */}
            {!currentUser.hasCustomPassword && loginMethod === 'pin' && (
              <button
                type="button"
                onClick={handleQuickUnlockWithPin}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Quick Unlock with PIN (1234)</span>
              </button>
            )}

            {loginMethod === 'password' && !currentUser.hasCustomPassword && (
              <div className="p-3 bg-blue-950/70 border border-blue-400/30 rounded-xl text-xs text-blue-200 text-left space-y-1.5 max-w-xs">
                <div className="flex items-center space-x-1.5 font-semibold text-blue-300">
                  <Info size={14} />
                  <span>Password is Not Required</span>
                </div>
                <p className="text-[11px] text-white/70">
                  First-time login does not require a password. You can unlock now with your PIN (1234). A password is only used if you set your own custom password in Settings &gt; Accounts.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('pin');
                    setInputVal('1234');
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] rounded-lg font-medium cursor-pointer"
                >
                  Switch to PIN (1234)
                </button>
              </div>
            )}

            {/* Input Form (PIN or Password) */}
            <form
              onSubmit={handleAttemptUnlock}
              className={`w-full max-w-xs space-y-3 transition-transform ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
            >
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type={loginMethod === 'password' && showPassword ? 'text' : 'password'}
                  inputMode={loginMethod === 'pin' ? 'numeric' : 'text'}
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={loginMethod === 'pin' ? 'Enter 4-digit PIN' : 'Enter Password'}
                  autoFocus
                  className="w-full bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/20 focus:border-blue-400 rounded-xl px-4 py-2.5 text-center text-base tracking-widest text-white outline-none transition shadow-inner placeholder:tracking-normal placeholder:text-white/40"
                />

                {loginMethod === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 p-1.5 text-white/60 hover:text-white cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}

                <button
                  type="submit"
                  className="absolute right-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow"
                  title="Sign in (Enter)"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Virtual PIN Pad Toggle & Keypad */}
              {loginMethod === 'pin' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowKeypad(!showKeypad)}
                    className="text-[11px] text-blue-300 hover:text-blue-200 transition cursor-pointer"
                  >
                    {showKeypad ? 'Hide On-Screen PIN Pad' : 'Show On-Screen PIN Pad'}
                  </button>

                  {showKeypad && (
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/50 border border-white/10 rounded-2xl backdrop-blur-md animate-in fade-in">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            soundManager.playClick();
                            if (k === 'C') {
                              setInputVal('');
                            } else if (k === '⌫') {
                              setInputVal((prev) => prev.slice(0, -1));
                            } else {
                              setInputVal((prev) => prev + k);
                            }
                            if (errorMessage) setErrorMessage('');
                          }}
                          className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono font-semibold text-sm transition cursor-pointer shadow-sm"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="text-xs text-red-300 bg-red-950/70 border border-red-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-left animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Sign-in Options Switcher (PIN vs Password) */}
              <div className="pt-2 flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setLoginMethod('pin');
                      setInputVal('');
                      setErrorMessage('');
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      loginMethod === 'pin'
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Lock size={12} />
                    <span>PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setLoginMethod('password');
                      setInputVal('');
                      setErrorMessage('');
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      loginMethod === 'password'
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Key size={12} />
                    <span>Password</span>
                  </button>
                </div>

                {/* Switch User or Sign Up */}
                <div className="flex items-center space-x-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                    className="text-blue-300 hover:text-blue-200 transition flex items-center space-x-1"
                  >
                    <Users size={12} />
                    <span>Switch User</span>
                  </button>
                  <span className="text-white/30">•</span>
                  <button
                    type="button"
                    onClick={() => setIsSigningUp(true)}
                    className="text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1 font-semibold"
                  >
                    <UserPlus size={12} />
                    <span>Sign Up (Save Files)</span>
                  </button>
                </div>

                {/* User Switcher Dropdown */}
                {showUserSwitcher && (
                  <div className="mt-2 p-2 bg-black/80 border border-white/20 rounded-2xl space-y-1 w-full text-left animate-in fade-in">
                    <div className="text-[10px] text-white/50 px-2 py-1 font-semibold uppercase">Choose Account</div>
                    {allAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          accountManager.switchUser(acc.id);
                          fs.loadUserFiles(acc.username);
                          setShowUserSwitcher(false);
                          setInputVal('');
                          setErrorMessage('');
                        }}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs transition ${
                          currentUser.id === acc.id ? 'bg-blue-600/30 text-blue-300 font-bold' : 'hover:bg-white/10 text-white/80'
                        }`}
                      >
                        <span className="text-base">{acc.avatarEmoji}</span>
                        <div className="truncate flex-1">
                          <div className="truncate">{acc.displayName}</div>
                          <div className="text-[9px] text-white/40">@{acc.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Helpful Hint Button */}
                <div className="flex flex-col items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-[11px] text-white/50 hover:text-white/80 underline cursor-pointer flex items-center space-x-1"
                  >
                    <HelpCircle size={12} />
                    <span>{showHint ? 'Hide default credentials' : 'Default credentials'}</span>
                  </button>

                  {showHint && (
                    <div className="mt-2 p-2.5 bg-black/60 border border-white/20 rounded-xl text-[11px] text-neutral-300 space-y-1.5 animate-in fade-in max-w-xs text-left">
                      <div>
                        Windows Hello PIN: <strong className="text-white font-mono">{currentUser.pin || '1234'}</strong>
                      </div>
                      <div>
                        Password: {currentUser.hasCustomPassword && currentUser.password ? (
                          <strong className="text-white font-mono">Custom password active</strong>
                        ) : (
                          <span className="text-emerald-400 font-semibold">Not required on first boot (leave blank or use PIN)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputVal(currentUser.pin || '1234');
                          setLoginMethod('pin');
                          handleQuickUnlockWithPin();
                        }}
                        className="mt-1 w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition cursor-pointer"
                      >
                        Quick Auto Sign-In (PIN 1234)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Bottom Right System & Power Controls */}
        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="text-[11px] text-white/50">
            Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/15">Enter</kbd> to sign in · <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/15">Esc</kbd> for lock cover
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-white/70" title="Wi-Fi connected">
              <Wifi size={16} />
            </div>

            {/* Power Menu on Lock Screen */}
            <div className="relative">
              <button
                onClick={() => setShowPowerMenu(!showPowerMenu)}
                className="p-2 hover:bg-white/15 rounded-full text-white/80 hover:text-white transition cursor-pointer"
                title="Power Options"
              >
                <Power size={17} />
              </button>

              {showPowerMenu && (
                <div className="absolute right-0 bottom-12 w-48 bg-[#202020f5] backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-1.5 text-xs space-y-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-white/10">
                    Lenovo Legion G14 Power
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setShowPowerMenu(false);
                      onSleep();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-left transition"
                  >
                    <Moon size={14} className="text-blue-400" />
                    <span>Sleep</span>
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setShowPowerMenu(false);
                      onShutdown();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-left text-red-400 transition"
                  >
                    <Power size={14} />
                    <span>Shut down</span>
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setShowPowerMenu(false);
                      onRestart();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-left transition"
                  >
                    <RotateCcw size={14} className="text-blue-400" />
                    <span>Restart</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
