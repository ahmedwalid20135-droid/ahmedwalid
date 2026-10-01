import React, { useState, useEffect } from 'react';
import {
  Palette,
  Monitor,
  Volume2,
  HardDrive,
  Info,
  Check,
  Moon,
  Sun,
  Layout,
  RotateCcw,
  Sparkles,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Zap,
  Plug,
  Download,
  Copy,
  FileCode,
  Power,
  Laptop,
  Edit2,
  Lock,
  Key,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Keyboard,
  Smile,
  Command,
  UserPlus,
  LogIn,
  Sliders,
  Maximize2,
  Minimize2,
  Shield,
  Clock,
  Wifi,
  Search,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  User,
} from 'lucide-react';
import { SystemSettings, ThemeMode, AppId } from '../types/os';
import { soundManager } from '../services/sound';
import { fs } from '../services/filesystem';
import { accountManager, UserAccount, PRESET_AVATAR_PHOTOS } from '../services/accountManager';

interface SettingsAppProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  onOpenApp?: (appId: AppId, data?: any) => void;
  onShutdown?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onLock?: () => void;
  initialTab?: 'personalize' | 'taskbar' | 'system' | 'sound' | 'storage' | 'accounts' | 'about';
}

export const WALLPAPERS = [
  {
    id: 'solar-glow-orb',
    name: 'Windows 11 Solar Glow Orb (Lenovo Edition)',
    type: 'solar-glow-orb',
    url: '/wallpapers/windows_glow_solar_orb.jpg',
  },
  {
    id: 'bloom-dark',
    name: 'Windows 11 Bloom Dark (Official 4K)',
    type: 'bloom-dark',
    url: '/wallpapers/windows_bloom_dark.jpg',
  },
  {
    id: 'bloom-light',
    name: 'Windows 11 Bloom Light (Official 4K)',
    type: 'bloom-light',
    url: '/wallpapers/windows_bloom_light.jpg',
  },
  {
    id: 'glow-abstract',
    name: 'Flowing Ribbon Glow',
    type: 'glow-abstract',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'bliss-xp',
    name: 'Windows XP Bliss Nostalgia',
    type: 'bliss-xp',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Skyline',
    type: 'cyber-neon',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 'sunset-mountain',
    name: 'Sunset Peaks',
    type: 'sunset-mountain',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
  },
];

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onUpdateSettings,
  onOpenApp,
  onShutdown,
  onSleep,
  onRestart,
  onLock,
  initialTab = 'personalize',
}) => {
  const [activeTab, setActiveTab] = useState<'personalize' | 'taskbar' | 'system' | 'sound' | 'storage' | 'accounts' | 'about'>(initialTab);
  const [customUrl, setCustomUrl] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Accounts state
  const [currentUser, setCurrentUser] = useState<UserAccount>(accountManager.getCurrentUser());
  const [allAccounts, setAllAccounts] = useState<UserAccount[]>(accountManager.getAccounts());
  const [accountAction, setAccountAction] = useState<'view' | 'signup' | 'signin'>('view');

  // Sign up inputs
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💻');
  const [accountSuccessMsg, setAccountSuccessMsg] = useState('');
  const [accountErrorMsg, setAccountErrorMsg] = useState('');

  // Sign in inputs
  const [signInUsername, setSignInUsername] = useState('');
  const [signInCredential, setSignInCredential] = useState('');

  // Profile Name & Photo edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.displayName);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [photoTab, setPhotoTab] = useState<'presets' | 'upload' | 'emoji'>('presets');

  // Custom Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Password / PIN quick edit state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  // Live keyboard tester state for Windows Key -> Ctrl Key
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  useEffect(() => {
    const unsub = accountManager.subscribe((user) => {
      setCurrentUser(user);
      setNameInput(user.displayName);
      setAllAccounts(accountManager.getAccounts());
    });
    return unsub;
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    soundManager.playDing();
    accountManager.updateProfile(currentUser.id, { displayName: nameInput.trim() });
    onUpdateSettings({ deviceName: nameInput.trim() });
    setIsEditingName(false);
    setAccountSuccessMsg('Display name updated successfully!');
    setTimeout(() => setAccountSuccessMsg(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAccountErrorMsg('Image file size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        soundManager.playDing();
        accountManager.updateProfile(currentUser.id, { avatarPhotoUrl: url });
        setIsChangingPhoto(false);
        setAccountSuccessMsg('Profile photo updated from PC!');
        setTimeout(() => setAccountSuccessMsg(''), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetPhoto = (url: string) => {
    soundManager.playClick();
    accountManager.updateProfile(currentUser.id, { avatarPhotoUrl: url });
    setIsChangingPhoto(false);
    setAccountSuccessMsg('Profile avatar updated!');
    setTimeout(() => setAccountSuccessMsg(''), 4000);
  };

  const handleSelectEmojiAvatar = (emoji: string, color?: string) => {
    soundManager.playClick();
    accountManager.updateProfile(currentUser.id, {
      avatarEmoji: emoji,
      avatarColor: color || currentUser.avatarColor,
      avatarPhotoUrl: '',
    });
    setIsChangingPhoto(false);
    setAccountSuccessMsg('Avatar emoji updated!');
    setTimeout(() => setAccountSuccessMsg(''), 4000);
  };

  const handleRemovePhoto = () => {
    soundManager.playClick();
    accountManager.updateProfile(currentUser.id, { avatarPhotoUrl: '' });
    setIsChangingPhoto(false);
    setAccountSuccessMsg('Custom photo removed. Restored avatar icon.');
    setTimeout(() => setAccountSuccessMsg(''), 4000);
  };

  const handleSaveCustomPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!newPasswordInput || newPasswordInput.length < 4) {
      soundManager.playError();
      setPasswordErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      soundManager.playError();
      setPasswordErrorMsg('Passwords do not match.');
      return;
    }

    soundManager.playDing();
    accountManager.setCustomPassword(currentUser.id, newPasswordInput);
    setPasswordSuccessMsg('Custom password enabled! You can now use your password or PIN to sign in.');
    setIsChangingPassword(false);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setTimeout(() => setPasswordSuccessMsg(''), 5000);
  };

  const handleRemoveCustomPassword = () => {
    soundManager.playClick();
    accountManager.removeCustomPassword(currentUser.id);
    setPasswordSuccessMsg('Custom password removed. Your account now unlocks with PIN only.');
    setTimeout(() => setPasswordSuccessMsg(''), 5000);
  };

  useEffect(() => {
    const handleKeyTest = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
        setLastKeyPressed('Windows (Meta) Key ➔ Remapped to Ctrl');
      } else if (e.key === 'Control' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        setLastKeyPressed('Control (Ctrl) Key');
      }
    };
    window.addEventListener('keydown', handleKeyTest);
    return () => window.removeEventListener('keydown', handleKeyTest);
  }, []);

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountErrorMsg('');
    setAccountSuccessMsg('');

    const res = accountManager.signUp({
      username: newUsername,
      displayName: newDisplayName || newUsername,
      password: newPassword,
      pin: newPin || '1234',
      avatarEmoji: selectedEmoji,
    });

    if (res.success && res.user) {
      soundManager.playDing();
      fs.loadUserFiles(res.user.username);
      setAccountSuccessMsg(`Account created! Welcome ${res.user.displayName}. Your files are securely saved to your profile.`);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewPin('');
      setAccountAction('view');
      setTimeout(() => setAccountSuccessMsg(''), 5000);
    } else {
      soundManager.playError();
      setAccountErrorMsg(res.error || 'Failed to create account.');
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountErrorMsg('');
    setAccountSuccessMsg('');

    const res = accountManager.signIn(signInUsername, signInCredential);
    if (res.success && res.user) {
      soundManager.playDing();
      fs.loadUserFiles(res.user.username);
      setAccountSuccessMsg(`Signed in as ${res.user.displayName}! All your personal files and settings are loaded.`);
      setSignInUsername('');
      setSignInCredential('');
      setAccountAction('view');
      setTimeout(() => setAccountSuccessMsg(''), 5000);
    } else {
      soundManager.playError();
      setAccountErrorMsg(res.error || 'Invalid credentials.');
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinErrorMsg('');
    setPinSuccessMsg('');

    const currentSavedPin = currentUser.pin || settings.pin || '1234';
    if (currentPinInput && currentPinInput !== currentSavedPin) {
      soundManager.playError();
      setPinErrorMsg(`Current PIN is incorrect.`);
      return;
    }

    if (!newPinInput || newPinInput.length < 4) {
      soundManager.playError();
      setPinErrorMsg('PIN must be at least 4 digits.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      soundManager.playError();
      setPinErrorMsg('New PIN and confirmation PIN do not match.');
      return;
    }

    soundManager.playDing();
    accountManager.updateUser(currentUser.id, { pin: newPinInput });
    onUpdateSettings({ pin: newPinInput });
    setPinSuccessMsg('Windows Hello PIN updated successfully!');
    setIsChangingPin(false);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setTimeout(() => setPinSuccessMsg(''), 4000);
  };

  const handleWallpaperChange = (wp: typeof WALLPAPERS[0]) => {
    soundManager.playClick();
    onUpdateSettings({
      wallpaper: wp.url,
      wallpaperType: wp.type as any,
    });
  };

  const handleCustomWallpaper = () => {
    if (!customUrl.trim()) return;
    soundManager.playClick();
    onUpdateSettings({
      wallpaper: customUrl.trim(),
      wallpaperType: 'custom',
    });
  };

  const handleResetDrive = () => {
    soundManager.playTrashEmpty();
    fs.resetToDefault();
    setResetMessage('Virtual drive reset to default factory state!');
    setTimeout(() => setResetMessage(''), 3000);
  };

  return (
    <div className="flex h-full bg-[#1f1f1f] text-white select-none">
      {/* Left Categories Sidebar */}
      <div className="w-56 bg-[#181818] border-r border-white/10 p-3 flex flex-col justify-between">
        <div className="space-y-1">
          {/* User Profile Tile */}
          <div
            onClick={() => setActiveTab('accounts')}
            className="flex items-center space-x-2.5 px-2.5 py-2.5 mb-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition border border-white/5"
            title="Click to manage User Accounts & Save Files"
          >
            <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${currentUser.avatarColor || 'from-blue-600 to-indigo-600'} flex items-center justify-center font-bold text-base text-white shadow`}>
              {currentUser.avatarEmoji || '💻'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentUser.displayName}</div>
              <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Files Saved</span>
              </div>
            </div>
          </div>

          {[
            { id: 'personalize', label: 'Personalization', icon: Palette },
            { id: 'taskbar', label: 'Taskbar Behaviors', icon: Layout },
            { id: 'system', label: 'System & Battery', icon: Monitor },
            { id: 'storage', label: '1.0 TB Storage (C:)', icon: HardDrive },
            { id: 'accounts', label: 'Accounts & Sign-in', icon: Key },
            { id: 'sound', label: 'Sound & Audio', icon: Volume2 },
            { id: 'about', label: 'About Lenovo G14', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600/30 text-blue-300 border-l-2 border-blue-500 font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Lenovo Badge */}
        <div className="p-2 bg-black/30 rounded-xl border border-white/5 text-[11px] text-white/50">
          <div className="flex items-center justify-between text-white font-semibold mb-0.5">
            <span>Lenovo Legion G14</span>
            <span className="text-[9px] bg-red-600 text-white px-1 rounded font-bold">11 PRO</span>
          </div>
          <div>1.0 TB NVMe PCIe Gen4 SSD</div>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#1f1f1f]">
        {/* TAB 1: PERSONALIZATION */}
        {activeTab === 'personalize' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Personalization</h2>
              <p className="text-xs text-white/50">Choose desktop wallpapers, themes, and visual styles on Lenovo Legion G14.</p>
            </div>

            {/* Current Wallpaper Preview */}
            <div className="rounded-2xl overflow-hidden border border-white/15 relative h-48 shadow-2xl group">
              <img
                src={settings.wallpaper}
                alt="Active Wallpaper"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between p-4">
                <div>
                  <span className="text-xs font-semibold text-white/90 block">
                    Current Theme: {settings.wallpaperType}
                  </span>
                  <span className="text-[10px] text-white/50">High-Resolution Desktop Background</span>
                </div>
                <button
                  onClick={() => setActiveTab('taskbar')}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-medium text-white transition flex items-center space-x-1.5"
                >
                  <Layout size={13} />
                  <span>Configure Taskbar</span>
                </button>
              </div>
            </div>

            {/* Curated Wallpapers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Select Wallpaper
                </h3>
                <span className="text-[11px] text-blue-400">Includes Solar Glow Orb & Bloom 4K</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {WALLPAPERS.map((wp) => {
                  const isSelected = settings.wallpaper === wp.url;
                  return (
                    <div
                      key={wp.id}
                      onClick={() => handleWallpaperChange(wp)}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition transform hover:scale-[1.02] shadow-lg ${
                        isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={wp.url} alt={wp.name} className="w-full h-24 object-cover" />
                      <div className="p-2 bg-[#181818] text-[11px] text-white/80 truncate font-medium flex items-center justify-between">
                        <span className="truncate">{wp.name}</span>
                        {isSelected && <Check size={13} className="text-blue-400 shrink-0 ml-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Wallpaper URL */}
            <div className="bg-[#181818] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-white">Custom Wallpaper URL</div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/wallpaper.jpg or /wallpapers/my_image.png"
                  className="flex-1 bg-black/30 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCustomWallpaper}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TASKBAR SETTINGS */}
        {activeTab === 'taskbar' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Taskbar Behaviors &amp; Settings</h2>
              <p className="text-xs text-white/50">
                Full control over taskbar alignment, auto-hide, size, system tray icons, and visual effects.
              </p>
            </div>

            {/* 1. Taskbar Alignment */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Taskbar Alignment</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Position the Start button and running applications at the Center or Left of the screen.
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarAlignment: 'center' });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      settings.taskbarAlignment === 'center'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarAlignment: 'left' });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      settings.taskbarAlignment === 'left'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Left
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Automatically Hide Taskbar */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 flex items-center justify-between shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white">Automatically Hide the Taskbar</h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Taskbar drops down when not in use and slides up smoothly when you hover at the bottom of the screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onUpdateSettings({ taskbarAutoHide: !settings.taskbarAutoHide });
                }}
                className={`w-12 h-6 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                  settings.taskbarAutoHide ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                }`}
                title="Toggle Auto-Hide"
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* 3. Taskbar Sizing */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Taskbar Size &amp; Height</h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Adjust icon and taskbar dimensions to match your display scaling.
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  {(['compact', 'default', 'large'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        soundManager.playClick();
                        onUpdateSettings({ taskbarSize: s });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition ${
                        (settings.taskbarSize || 'default') === s
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Taskbar Corner Items & System Tray Toggles */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-2">Taskbar Corner &amp; System Tray Items</h3>
              
              <div className="space-y-3 text-xs">
                {/* Search */}
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <Search size={14} className="text-blue-400" />
                    <span>Search Bar / Pill</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarShowSearch: settings.taskbarShowSearch === false ? true : false });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                      settings.taskbarShowSearch !== false ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Widgets */}
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <span>⛅</span>
                    <span>Widgets &amp; Weather</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarShowWidgets: settings.taskbarShowWidgets === false ? true : false });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                      settings.taskbarShowWidgets !== false ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Battery */}
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <Battery size={14} className="text-emerald-400" />
                    <span>Battery Status Indicator</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarShowBattery: settings.taskbarShowBattery === false ? true : false });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                      settings.taskbarShowBattery !== false ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <div className="flex items-center space-x-2">
                    <Volume2 size={14} className="text-white/80" />
                    <span>Volume &amp; Audio Quick Settings</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarShowVolume: settings.taskbarShowVolume === false ? true : false });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                      settings.taskbarShowVolume !== false ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Clock */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <Clock size={14} className="text-white/80" />
                    <span>Clock &amp; Calendar Flyout</span>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarShowClock: settings.taskbarShowClock === false ? true : false });
                    }}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                      settings.taskbarShowClock !== false ? 'bg-blue-600 justify-end' : 'bg-neutral-700 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Taskbar Theme & Material */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-3 shadow-xl">
              <h3 className="text-sm font-bold text-white">Taskbar Acrylic &amp; Blur Style</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'acrylic', label: 'Acrylic Glass', desc: 'Fluent mica translucent' },
                  { id: 'blur', label: 'Deep Blur', desc: 'Dark frosted effect' },
                  { id: 'opaque', label: 'Solid Dark', desc: 'High contrast black' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateSettings({ taskbarTheme: m.id as any });
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      (settings.taskbarTheme || 'acrylic') === m.id
                        ? 'border-blue-500 bg-blue-600/20 text-white'
                        : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{m.label}</div>
                    <div className="text-[10px] text-white/50 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Keyboard & Start Menu Controls: Control Key as Windows Key */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 flex items-center justify-between shadow-xl">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 font-mono text-[11px] font-bold border border-blue-400/30">
                    Ctrl = Win Key
                  </span>
                  <h3 className="text-sm font-bold text-white">Control Key Works as Windows Key</h3>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Tapping the <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-white/90">Control</kbd> key directly opens and toggles the Windows Start Menu, and Ctrl combinations (Ctrl+E, Ctrl+I, Ctrl+S, Ctrl+D, Ctrl+R, Ctrl+L) run Windows desktop shortcuts.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold shrink-0">
                Active
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNTS & USER PROFILES */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">User Accounts &amp; File Storage</h2>
              <p className="text-xs text-white/50">
                Sign in or create a personalized account to permanently save and isolate your documents, downloads, and files.
              </p>
            </div>

            {/* Notifications */}
            {accountSuccessMsg && (
              <div className="p-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>{accountSuccessMsg}</span>
              </div>
            )}
            {accountErrorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2 animate-in fade-in">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{accountErrorMsg}</span>
              </div>
            )}

            {/* Current Active Account Card with Name & Photo Edit */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Avatar with Interactive Change Photo Button */}
                  <div className="relative group shrink-0">
                    {currentUser.avatarPhotoUrl ? (
                      <img
                        src={currentUser.avatarPhotoUrl}
                        alt={currentUser.displayName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentUser.avatarColor || 'from-blue-600 to-indigo-600'} flex items-center justify-center font-bold text-2xl text-white shadow-xl`}>
                        {currentUser.avatarEmoji || '💻'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsChangingPhoto(!isChangingPhoto)}
                      className="absolute inset-0 bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-semibold transition cursor-pointer"
                      title="Change Profile Photo"
                    >
                      <Camera size={18} className="mb-0.5 text-blue-400" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{currentUser.displayName}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(currentUser.displayName);
                          setIsEditingName(!isEditingName);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition cursor-pointer"
                        title="Edit Display Name"
                      >
                        <Edit2 size={13} />
                      </button>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">Username: @{currentUser.username}</div>
                    <div className="flex items-center space-x-2 mt-1.5">
                      {!currentUser.hasCustomPassword ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300">
                          PIN Only Mode (Default: 1234) • No Password Required
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[10px] font-semibold text-purple-300">
                          Custom Password Enabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsChangingPhoto(!isChangingPhoto)}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera size={13} />
                    <span>Change Profile Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(currentUser.displayName);
                      setIsEditingName(!isEditingName);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit Name</span>
                  </button>
                  <button
                    onClick={() => setAccountAction(accountAction === 'signup' ? 'view' : 'signup')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus size={13} />
                    <span>Sign Up New User</span>
                  </button>
                  <button
                    onClick={() => setAccountAction(accountAction === 'signin' ? 'view' : 'signin')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <LogIn size={13} />
                    <span>Switch User</span>
                  </button>
                </div>
              </div>

              {/* Inline Edit Name Form */}
              {isEditingName && (
                <form onSubmit={handleSaveName} className="p-4 bg-black/40 border border-white/15 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <User size={14} className="text-blue-400" />
                    <span>Change Account Display Name</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter new display name"
                      required
                      className="flex-1 bg-[#121216] border border-white/20 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                    >
                      Save Name
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Change Profile Photo Panel */}
              {isChangingPhoto && (
                <div className="p-4 bg-black/40 border border-blue-500/30 rounded-xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white">
                      <Camera size={14} className="text-blue-400" />
                      <span>Choose Your Profile Photo or Avatar</span>
                    </div>
                    {currentUser.avatarPhotoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Remove Custom Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Tabs: Presets vs Upload vs Emoji */}
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPhotoTab('presets')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        photoTab === 'presets' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Featured Avatars
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab('upload')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        photoTab === 'upload' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Upload from Computer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoTab('emoji')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        photoTab === 'emoji' ? 'bg-blue-600 text-white font-semibold' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Emoji &amp; Icon
                    </button>
                  </div>

                  {/* Tab 1: Presets */}
                  {photoTab === 'presets' && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {PRESET_AVATAR_PHOTOS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPresetPhoto(p.url)}
                          className={`flex flex-col items-center p-2 rounded-xl border transition cursor-pointer group ${
                            currentUser.avatarPhotoUrl === p.url
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-white/10 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover mb-1.5 shadow"
                          />
                          <span className="text-[10px] text-white/80 group-hover:text-white text-center truncate w-full">
                            {p.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab 2: Upload from PC */}
                  {photoTab === 'upload' && (
                    <div className="p-4 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center space-y-2 text-center bg-black/20">
                      <Upload size={24} className="text-blue-400" />
                      <div className="text-xs font-semibold text-white">Upload image from your laptop / PC</div>
                      <p className="text-[11px] text-white/50">Supports JPG, PNG, WEBP (Max 5MB)</p>
                      <label className="mt-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow">
                        Browse Photo File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Tab 3: Emoji */}
                  {photoTab === 'emoji' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['💻', '🚀', '⚡', '🎮', '🌟', '🦊', '🎨', '🔥', '🛡️', '🎧', '💎', '👑'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleSelectEmojiAvatar(emoji)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition cursor-pointer ${
                              !currentUser.avatarPhotoUrl && currentUser.avatarEmoji === emoji
                                ? 'bg-blue-600 scale-110 shadow-lg'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SIGN UP FORM (Create Account to save files) */}
            {accountAction === 'signup' && (
              <div className="bg-[#181818] p-5 rounded-2xl border border-blue-500/30 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center space-x-2 text-blue-400">
                  <UserPlus size={18} />
                  <h3 className="text-sm font-bold text-white">Create New Lenovo WinWeb 11 Pro Account</h3>
                </div>
                <p className="text-xs text-white/60">
                  Register a profile to have an isolated workspace. Password is not required by default — you can unlock with PIN only.
                </p>

                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Your Full Name / Display Name</label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="e.g. Alex Taylor"
                        required
                        className="w-full bg-[#121216] border border-white/15 focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Username (for sign in)</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. alex"
                        required
                        className="w-full bg-[#121216] border border-white/15 focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">
                        Account Password <span className="text-white/40 font-normal">(Optional - leave empty for PIN only)</span>
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave empty for PIN only mode"
                        className="w-full bg-[#121216] border border-white/15 focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">
                        Windows Hello PIN <span className="text-emerald-400 font-normal">(Default: 1234)</span>
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="4 digits (e.g. 1234)"
                        className="w-full bg-[#121216] border border-white/15 focus:border-blue-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/60 mb-1.5">Choose Avatar Emoji</label>
                    <div className="flex space-x-2">
                      {['💻', '🚀', '⚡', '🎮', '🌟', '🎨', '🔥', '🦊'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition ${
                            selectedEmoji === emoji ? 'bg-blue-600 scale-110 shadow' : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setAccountAction('view')}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
                    >
                      Sign Up &amp; Save My Files
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SIGN IN FORM (Switch to another account) */}
            {accountAction === 'signin' && (
              <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <LogIn size={18} />
                  <h3 className="text-sm font-bold text-white">Sign In to an Existing Account</h3>
                </div>

                <form onSubmit={handleSignInSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Username</label>
                      <input
                        type="text"
                        value={signInUsername}
                        onChange={(e) => setSignInUsername(e.target.value)}
                        placeholder="e.g. lenovo"
                        required
                        className="w-full bg-[#121216] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">PIN or Password</label>
                      <input
                        type="password"
                        value={signInCredential}
                        onChange={(e) => setSignInCredential(e.target.value)}
                        placeholder="PIN (1234) or Custom Password"
                        className="w-full bg-[#121216] border border-white/15 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Registered Accounts Quick Pick */}
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1">Quick Select User:</label>
                    <div className="flex flex-wrap gap-2">
                      {allAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setSignInUsername(acc.username);
                            setSignInCredential(acc.pin || '1234');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs flex items-center space-x-1.5 border border-white/5 cursor-pointer"
                        >
                          {acc.avatarPhotoUrl ? (
                            <img src={acc.avatarPhotoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <span>{acc.avatarEmoji}</span>
                          )}
                          <span>{acc.displayName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setAccountAction('view')}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                    >
                      Sign In &amp; Load Files
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECURITY & LOGIN OPTIONS: PIN & CUSTOM PASSWORD */}
            <div className="space-y-4">
              {/* Informational Banner */}
              <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-start space-x-3 text-xs text-blue-200">
                <ShieldCheck size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-white">First-Time User Password Policy</div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    A password is <strong>not required</strong> on first boot or sign-up. You only need your 4-digit Windows Hello PIN (default: <strong>1234</strong>). A password is only needed if you choose to set your own custom password below.
                  </p>
                </div>
              </div>

              {/* Custom Password Card */}
              <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Key size={16} className="text-blue-400" />
                      <h3 className="text-sm font-bold text-white">Account Password</h3>
                      {currentUser.hasCustomPassword ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          CUSTOM PASSWORD ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          NOT SET (PIN ONLY)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {currentUser.hasCustomPassword
                        ? 'Custom password is set and can be used on the lock screen along with PIN.'
                        : 'No password is required. You can unlock your Lenovo G14 with PIN (1234).'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentUser.hasCustomPassword && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomPassword}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-xs font-medium transition cursor-pointer"
                      >
                        Remove Password (PIN only)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
                    >
                      {isChangingPassword
                        ? 'Cancel'
                        : currentUser.hasCustomPassword
                        ? 'Change Password'
                        : 'Set a Custom Password'}
                    </button>
                  </div>
                </div>

                {isChangingPassword && (
                  <form onSubmit={handleSaveCustomPassword} className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in">
                    {passwordErrorMsg && (
                      <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300">
                        {passwordErrorMsg}
                      </div>
                    )}
                    {passwordSuccessMsg && (
                      <div className="p-2 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300">
                        {passwordSuccessMsg}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1">New Custom Password</label>
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="At least 4 characters"
                          required
                          className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1">Confirm Custom Password</label>
                        <input
                          type="password"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="Re-enter password"
                          required
                          className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer"
                      >
                        Save Custom Password
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Windows Hello PIN Card */}
              <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Lock size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Windows Hello PIN</h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Current PIN: <span className="font-mono text-white font-semibold">{currentUser.pin || '1234'}</span> (Primary quick sign-in method)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(!isChangingPin)}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    {isChangingPin ? 'Cancel' : 'Change PIN'}
                  </button>
                </div>

                {isChangingPin && (
                  <form onSubmit={handleSavePin} className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in">
                    {pinErrorMsg && (
                      <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300">
                        {pinErrorMsg}
                      </div>
                    )}
                    {pinSuccessMsg && (
                      <div className="p-2 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300">
                        {pinSuccessMsg}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1">Current PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={currentPinInput}
                          onChange={(e) => setCurrentPinInput(e.target.value)}
                          placeholder="e.g. 1234"
                          className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1">New 4-Digit PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={newPinInput}
                          onChange={(e) => setNewPinInput(e.target.value)}
                          placeholder="4 digits"
                          className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1">Confirm PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          value={confirmPinInput}
                          onChange={(e) => setConfirmPinInput(e.target.value)}
                          placeholder="Re-enter PIN"
                          className="w-full bg-black/40 border border-white/15 focus:border-blue-400 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsChangingPin(false)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow cursor-pointer"
                      >
                        Save New PIN
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 1.0 TB STORAGE */}
        {activeTab === 'storage' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">1.0 TB NVMe PCIe Gen4 Storage</h2>
              <p className="text-xs text-white/50">Lenovo Legion High-Speed Gen4 Solid State Drive management &amp; allocation.</p>
            </div>

            {/* Storage Drive Overview Card */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">Local Disk (C:)</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                        HEALTHY (100%)
                      </span>
                    </div>
                    <div className="text-xs text-white/50 mt-0.5">
                      Samsung PM9A1 1024GB M.2 2280 PCIe 4.0x4 NVMe SSD
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">892.4 GB free</div>
                  <div className="text-xs text-white/50">of 1,024 GB (1.0 TB)</div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 h-full w-[4%]" title="System & Reserved: 34.8 GB" />
                <div className="bg-purple-500 h-full w-[4.5%]" title="Apps & Games: 42.6 GB" />
                <div className="bg-emerald-500 h-full w-[4%]" title="Documents & Downloads: 46.0 GB" />
                <div className="bg-amber-500 h-full w-[1%]" title="Temporary Files: 8.2 GB" />
              </div>

              {/* Usage Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>System &amp; OS</span>
                  </div>
                  <div className="text-base font-bold text-white">34.8 GB</div>
                  <div className="text-[10px] text-white/40">WinWeb 11 Pro</div>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-1.5 text-xs text-purple-400 font-semibold mb-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Apps &amp; Games</span>
                  </div>
                  <div className="text-base font-bold text-white">42.6 GB</div>
                  <div className="text-[10px] text-white/40">GeForce, VSCode, Chrome</div>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>User Storage</span>
                  </div>
                  <div className="text-base font-bold text-white">46.0 GB</div>
                  <div className="text-[10px] text-white/40">Downloads &amp; Files</div>
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Available Free</span>
                  </div>
                  <div className="text-base font-bold text-emerald-400">892.4 GB</div>
                  <div className="text-[10px] text-white/40">Ready for downloads</div>
                </div>
              </div>
            </div>

            {/* Storage Drive Performance Specs */}
            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                SSD Performance Benchmarks
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-black/20 rounded-lg">
                  <span className="text-white/50 text-[10px] block">Sequential Read</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">7,100 MB/s</span>
                </div>
                <div className="p-2.5 bg-black/20 rounded-lg">
                  <span className="text-white/50 text-[10px] block">Sequential Write</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">6,500 MB/s</span>
                </div>
                <div className="p-2.5 bg-black/20 rounded-lg">
                  <span className="text-white/50 text-[10px] block">Drive Interface</span>
                  <span className="text-sm font-semibold text-white">PCIe 4.0 x4</span>
                </div>
                <div className="p-2.5 bg-black/20 rounded-lg">
                  <span className="text-white/50 text-[10px] block">TRIM &amp; S.M.A.R.T.</span>
                  <span className="text-sm font-semibold text-emerald-400">Enabled</span>
                </div>
              </div>
            </div>

            {/* Factory Reset Drive */}
            <div className="bg-[#181818] p-4 rounded-xl border border-white/10 space-y-2">
              <div className="text-xs font-semibold text-white">Reset User File Storage</div>
              <p className="text-[11px] text-white/50">
                Restores default documents, sample pictures, and clears recycle bin.
              </p>
              <button
                onClick={handleResetDrive}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/30 text-red-300 hover:bg-red-600/40 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Drive to Factory Default</span>
              </button>
              {resetMessage && (
                <div className="text-emerald-400 text-xs mt-2">{resetMessage}</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM & BATTERY */}
        {activeTab === 'system' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">System, Display &amp; Battery</h2>
              <p className="text-xs text-white/50">Manage virtual power status, battery level, display brightness, and Lenovo Legion performance mode.</p>
            </div>

            {/* Lenovo G14 Hardware Overview */}
            <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white relative">
                    <Laptop size={26} className="text-blue-400" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#e11424] rounded-full border border-[#181818]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white tracking-wide">
                        Lenovo Legion G14
                      </span>
                      <span className="bg-[#e11424] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                        LEGION
                      </span>
                    </div>
                    <div className="text-xs text-white/50">
                      AMD Ryzen 9 8945HS · RTX 4070 · 32GB RAM · 1TB NVMe SSD
                    </div>
                  </div>
                </div>

                {/* Power buttons */}
                <div className="flex items-center space-x-2">
                  {onSleep && (
                    <button
                      onClick={onSleep}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition"
                      title="Sleep Mode"
                    >
                      <Moon size={16} />
                    </button>
                  )}
                  {onRestart && (
                    <button
                      onClick={onRestart}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition"
                      title="Restart"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                  {onShutdown && (
                    <button
                      onClick={onShutdown}
                      className="p-2 rounded-lg bg-red-600/30 text-red-400 hover:bg-red-600/50 transition"
                      title="Shut Down"
                    >
                      <Power size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Battery Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Battery Level</span>
                    <span className="text-emerald-400 font-bold">{settings.batteryLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={settings.batteryLevel}
                    onChange={(e) => onUpdateSettings({ batteryLevel: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Power Supply</div>
                    <div className="text-[10px] text-white/50">{settings.isCharging ? 'AC Adapter Connected' : 'On Battery'}</div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ isCharging: !settings.isCharging })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      settings.isCharging ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {settings.isCharging ? 'Plugged In' : 'Unplugged'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SOUND & AUDIO */}
        {activeTab === 'sound' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Sound &amp; Audio</h2>
              <p className="text-xs text-white/50">Lenovo Legion Nahimic Audio and system sound effects.</p>
            </div>

            <div className="bg-[#181818] p-5 rounded-xl border border-white/10 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Master Sound Volume</h3>
                  <p className="text-xs text-white/50 mt-0.5">Control web audio engine volume for apps and notifications.</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    settings.soundEnabled ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400'
                  }`}
                >
                  {settings.soundEnabled ? 'Mute' : 'Unmute'}
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <Volume2 size={18} className="text-white/60" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <span className="font-mono text-xs text-white/80 w-10 text-right">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ABOUT LENOVO G14 */}
        {activeTab === 'about' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">About Lenovo Legion G14</h2>
              <p className="text-xs text-white/50">Lenovo device specifications and Windows 11 system build details.</p>
            </div>

            <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Device Hardware Specifications
                </span>
                <span className="bg-[#e11424] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                  LENOVO LEGION
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs border-t border-white/10 pt-3">
                <span className="text-white/50">Device name</span>
                <span className="text-white font-semibold">Lenovo Legion G14</span>
                <span className="text-white/50">Manufacturer</span>
                <span className="text-white font-medium">Lenovo</span>
                <span className="text-white/50">Model</span>
                <span className="text-white">Lenovo Legion G14 WinWeb 11 Pro</span>
                <span className="text-white/50">Processor</span>
                <span className="text-white">AMD Ryzen 9 8945HS with Radeon 780M (8 Cores, 16 Threads, 4.0 - 5.2 GHz)</span>
                <span className="text-white/50">Graphics GPU</span>
                <span className="text-white">NVIDIA GeForce RTX 4070 Laptop GPU 8GB GDDR6 (140W TGP)</span>
                <span className="text-white/50">Installed RAM</span>
                <span className="text-white">32.0 GB LPDDR5X-7500 MHz Dual-Channel</span>
                <span className="text-white/50">Storage Drive</span>
                <span className="text-white font-semibold text-emerald-400">1.0 TB NVMe PCIe Gen4 High-Performance SSD</span>
                <span className="text-white/50">Display</span>
                <span className="text-white">14.5" 2.8K OLED PureSight (2880 x 1800), 120Hz, 0.2ms</span>
                <span className="text-white/50">System type</span>
                <span className="text-white">64-bit operating system, x64-based processor</span>
              </div>
            </div>

            <div className="bg-[#181818] p-5 rounded-2xl border border-white/10 space-y-3 shadow-xl">
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Windows Specifications
              </div>
              <div className="grid grid-cols-2 gap-y-2.5 text-xs border-t border-white/10 pt-3">
                <span className="text-white/50">Edition</span>
                <span className="text-white font-medium">Lenovo WinWeb 11 Pro 64-bit</span>
                <span className="text-white/50">Version</span>
                <span className="text-white">24H2</span>
                <span className="text-white/50">OS Build</span>
                <span className="text-white font-mono">26100.2100</span>
                <span className="text-white/50">Experience</span>
                <span className="text-white">Lenovo Vantage + WinWeb Feature Experience Pack</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
