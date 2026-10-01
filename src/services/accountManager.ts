export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  password?: string;
  hasCustomPassword?: boolean;
  pin: string;
  avatarColor: string;
  avatarEmoji: string;
  avatarPhotoUrl?: string; // Custom uploaded or selected photo URL
  role: 'Administrator' | 'Standard User';
  createdAt: number;
  lastLoginAt: number;
}

const ACCOUNTS_STORAGE_KEY = 'win11_user_accounts';
const CURRENT_USER_KEY = 'win11_current_user_id';

export const PRESET_AVATAR_PHOTOS = [
  {
    id: 'cyber-gamer',
    name: 'Cyber Legion',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'tech-dev',
    name: 'Futuristic Dev',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'minimal-3d',
    name: 'Neon Spheres',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'nature-zen',
    name: 'Aura Abstract',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fox-gamer',
    name: 'Cyber Fox',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'pro-user',
    name: 'Modern Executive',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_lenovo_admin',
    username: 'lenovo',
    displayName: 'Lenovo G14 User',
    password: '',
    hasCustomPassword: false, // First time user doesn't require a password!
    pin: '1234',
    avatarColor: 'from-blue-600 via-indigo-600 to-purple-600',
    avatarEmoji: '💻',
    avatarPhotoUrl: '',
    role: 'Administrator',
    createdAt: Date.now() - 86400000 * 7,
    lastLoginAt: Date.now(),
  },
];

type AccountListener = (user: UserAccount) => void;

class AccountManager {
  private accounts: UserAccount[] = [];
  private currentUserId: string = '';
  private listeners: AccountListener[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const savedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (savedAccounts) {
        const parsed: UserAccount[] = JSON.parse(savedAccounts);
        this.accounts = parsed.map((acc) => ({
          ...acc,
          hasCustomPassword: acc.hasCustomPassword !== undefined ? acc.hasCustomPassword : Boolean(acc.password && acc.password.length > 0 && acc.password !== 'lenovo'),
          password: acc.hasCustomPassword ? acc.password : '',
          pin: acc.pin || '1234',
          avatarPhotoUrl: acc.avatarPhotoUrl || '',
        }));
      } else {
        this.accounts = [...DEFAULT_ACCOUNTS];
        this.saveAccounts();
      }

      const savedCurrentId = localStorage.getItem(CURRENT_USER_KEY);
      if (savedCurrentId && this.accounts.some((a) => a.id === savedCurrentId)) {
        this.currentUserId = savedCurrentId;
      } else {
        this.currentUserId = this.accounts[0]?.id || DEFAULT_ACCOUNTS[0].id;
        localStorage.setItem(CURRENT_USER_KEY, this.currentUserId);
      }
    } catch (_) {
      this.accounts = [...DEFAULT_ACCOUNTS];
      this.currentUserId = DEFAULT_ACCOUNTS[0].id;
    }
  }

  private saveAccounts() {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(this.accounts));
    } catch (_) {}
  }

  public getAccounts(): UserAccount[] {
    return [...this.accounts];
  }

  public getCurrentUser(): UserAccount {
    const user = this.accounts.find((a) => a.id === this.currentUserId);
    return user || this.accounts[0] || DEFAULT_ACCOUNTS[0];
  }

  public subscribe(listener: AccountListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const current = this.getCurrentUser();
    this.listeners.forEach((l) => l(current));
  }

  public signUp(data: {
    username: string;
    displayName: string;
    password?: string;
    pin?: string;
    avatarColor?: string;
    avatarEmoji?: string;
    avatarPhotoUrl?: string;
  }): { success: boolean; error?: string; user?: UserAccount } {
    const cleanUsername = data.username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    if (this.accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }

    const hasCustomPassword = Boolean(data.password && data.password.trim().length >= 4);
    if (data.password && data.password.trim().length > 0 && data.password.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters if provided.' };
    }

    const defaultColors = [
      'from-blue-600 via-indigo-600 to-purple-600',
      'from-emerald-600 via-teal-600 to-cyan-600',
      'from-rose-600 via-pink-600 to-purple-600',
      'from-amber-600 via-orange-600 to-red-600',
      'from-violet-600 via-fuchsia-600 to-pink-600',
    ];
    const defaultEmojis = ['💻', '🚀', '⚡', '🎮', '🌟', '🦊', '🎨', '🔥'];

    const newAccount: UserAccount = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      displayName: data.displayName.trim() || cleanUsername,
      password: hasCustomPassword ? data.password!.trim() : '',
      hasCustomPassword,
      pin: data.pin?.trim() || '1234',
      avatarColor: data.avatarColor || defaultColors[this.accounts.length % defaultColors.length],
      avatarEmoji: data.avatarEmoji || defaultEmojis[this.accounts.length % defaultEmojis.length],
      avatarPhotoUrl: data.avatarPhotoUrl || '',
      role: 'Standard User',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    this.accounts.push(newAccount);
    this.saveAccounts();
    this.switchUser(newAccount.id);

    return { success: true, user: newAccount };
  }

  public signIn(
    usernameOrId: string,
    passwordOrPin: string
  ): { success: boolean; error?: string; user?: UserAccount } {
    const query = usernameOrId.trim().toLowerCase();
    const cred = passwordOrPin.trim();

    const account = this.accounts.find(
      (a) => a.id === usernameOrId || a.username.toLowerCase() === query
    );

    if (!account) {
      return { success: false, error: 'Account not found. Please check username or sign up.' };
    }

    const isPinMatch = account.pin ? cred === account.pin : cred === '1234';
    // If account has custom password, verify custom password
    const isPasswordMatch = account.hasCustomPassword && account.password ? cred === account.password : false;

    // If account has NO custom password, PIN is all that's needed! Or if they type '1234'
    const allowed = isPinMatch || isPasswordMatch || cred === '1234' || (!account.hasCustomPassword && cred === '');

    if (!allowed) {
      if (account.hasCustomPassword) {
        return { success: false, error: 'Incorrect PIN or Password.' };
      }
      return { success: false, error: 'Incorrect PIN. Default PIN is 1234.' };
    }

    account.lastLoginAt = Date.now();
    this.saveAccounts();
    this.switchUser(account.id);

    return { success: true, user: account };
  }

  public switchUser(userId: string): boolean {
    const target = this.accounts.find((a) => a.id === userId);
    if (!target) return false;

    this.currentUserId = target.id;
    try {
      localStorage.setItem(CURRENT_USER_KEY, target.id);
    } catch (_) {}

    this.notify();
    return true;
  }

  public updateProfile(
    userId: string,
    updates: {
      displayName?: string;
      avatarPhotoUrl?: string;
      avatarEmoji?: string;
      avatarColor?: string;
    }
  ): boolean {
    const idx = this.accounts.findIndex((a) => a.id === userId);
    if (idx === -1) return false;

    this.accounts[idx] = {
      ...this.accounts[idx],
      ...updates,
      displayName: updates.displayName?.trim() || this.accounts[idx].displayName,
    };
    this.saveAccounts();
    this.notify();
    return true;
  }

  public setCustomPassword(userId: string, newPassword: string): boolean {
    const idx = this.accounts.findIndex((a) => a.id === userId);
    if (idx === -1) return false;

    this.accounts[idx] = {
      ...this.accounts[idx],
      password: newPassword,
      hasCustomPassword: true,
    };
    this.saveAccounts();
    this.notify();
    return true;
  }

  public removeCustomPassword(userId: string): boolean {
    const idx = this.accounts.findIndex((a) => a.id === userId);
    if (idx === -1) return false;

    this.accounts[idx] = {
      ...this.accounts[idx],
      password: '',
      hasCustomPassword: false,
    };
    this.saveAccounts();
    this.notify();
    return true;
  }

  public setPin(userId: string, newPin: string): boolean {
    const idx = this.accounts.findIndex((a) => a.id === userId);
    if (idx === -1) return false;

    this.accounts[idx] = {
      ...this.accounts[idx],
      pin: newPin.trim(),
    };
    this.saveAccounts();
    this.notify();
    return true;
  }

  public updateUser(userId: string, updates: Partial<UserAccount>): boolean {
    const idx = this.accounts.findIndex((a) => a.id === userId);
    if (idx === -1) return false;

    this.accounts[idx] = {
      ...this.accounts[idx],
      ...updates,
    };
    this.saveAccounts();
    this.notify();
    return true;
  }

  public logout(): void {
    this.notify();
  }

  public deleteAccount(userId: string): boolean {
    if (this.accounts.length <= 1) return false;
    const targetIdx = this.accounts.findIndex((a) => a.id === userId);
    if (targetIdx === -1) return false;

    this.accounts.splice(targetIdx, 1);
    if (this.currentUserId === userId) {
      this.currentUserId = this.accounts[0].id;
      localStorage.setItem(CURRENT_USER_KEY, this.currentUserId);
    }
    this.saveAccounts();
    this.notify();
    return true;
  }
}

export const accountManager = new AccountManager();
