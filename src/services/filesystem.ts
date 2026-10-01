import { FSItem } from '../types/os';
import { accountManager } from './accountManager';

const LEGACY_STORAGE_KEY = 'win11_virtual_filesystem';

export const getLenovoDefaultFiles = (userName: string = 'Lenovo User'): FSItem[] => [
  // Core system folders
  { id: 'desktop', name: 'Desktop', type: 'folder', parentId: null, createdAt: Date.now(), modifiedAt: Date.now() },
  { id: 'documents', name: 'Documents', type: 'folder', parentId: null, createdAt: Date.now(), modifiedAt: Date.now() },
  { id: 'pictures', name: 'Pictures', type: 'folder', parentId: null, createdAt: Date.now(), modifiedAt: Date.now() },
  { id: 'downloads', name: 'Downloads', type: 'folder', parentId: null, createdAt: Date.now(), modifiedAt: Date.now() },
  { id: 'trash', name: 'Recycle Bin', type: 'folder', parentId: null, createdAt: Date.now(), modifiedAt: Date.now() },

  // Desktop files
  {
    id: 'welcome-txt',
    name: 'Welcome to Lenovo G14.txt',
    type: 'file',
    fileType: 'txt',
    parentId: 'desktop',
    content: `Welcome to Lenovo Legion G14 - WinWeb 11 Pro!
User Profile: ${userName}
Storage: 1.0 TB NVMe PCIe Gen4 High-Performance SSD
Display: 14.5" 2.8K OLED PureSight (120Hz)
CPU: AMD Ryzen 9 8945HS with Radeon 780M (8 Cores, 16 Threads)
GPU: NVIDIA GeForce RTX 4070 Laptop GPU (8GB GDDR6)
RAM: 32 GB LPDDR5X-7500 MHz

What you can do:
1. Real Web Browsing & Downloads:
   - Use Google Chrome or Microsoft Edge to open any website URL!
   - Download real applications (.exe), games, tools, and files directly to this laptop's Downloads storage.
   - Double-click any downloaded .exe or app file in File Explorer to launch and run it directly!

2. User Accounts & File Saving:
   - Create your personal account via Sign Up / Sign In.
   - All your files, documents, drawings, code, and downloads are automatically preserved and saved specifically for your account!

3. Taskbar Customization:
   - Right-click the Taskbar and select "Taskbar settings" to control Taskbar Alignment (Center/Left), Size (Default/Compact/Large), Auto-Hide, Search bar, Widgets, and System Tray icons!

4. Storage:
   - Your Lenovo G14 is equipped with a lightning-fast 1.0 TB NVMe SSD with over 890 GB of free storage.

Enjoy your Lenovo Legion G14 WinWeb 11 Pro!`,
    createdAt: Date.now() - 3600000,
    modifiedAt: Date.now() - 3600000,
    size: 1120,
  },
  {
    id: 'g14-specs',
    name: 'Lenovo_G14_Hardware_Specs.txt',
    type: 'file',
    fileType: 'txt',
    parentId: 'desktop',
    content: `========================================================
LENOVO LEGION G14 WINWEB 11 PRO - FACTORY SPECIFICATION
========================================================
Device Name:      Lenovo Legion G14
System Model:     83DX0002US (Lenovo G14 Gen 9)
Operating System: Lenovo WinWeb 11 Pro 64-bit (Build 26100.2100)
Processor:        AMD Ryzen 9 8945HS with Radeon 780M Graphics @ 4.0 GHz (up to 5.2 GHz Boost)
Cores / Threads:  8 Cores / 16 Logical Processors
Graphics:         NVIDIA GeForce RTX 4070 Laptop GPU 8GB GDDR6 (140W Max TGP)
Installed RAM:    32.0 GB LPDDR5X-7500 MHz
Storage (C:):     1.0 TB M.2 2280 PCIe 4.0x4 NVMe SSD (Read: 7,100 MB/s, Write: 6,500 MB/s)
Display:          14.5" 2.8K OLED (2880 x 1800), 120Hz, 0.2ms, 100% DCI-P3, HDR 500
Audio:            Stereo speakers, 2W x4, Nahimic Audio, Smart AMP
Battery:          73.6 Wh with Rapid Charge Express (50% in 30 mins)
Security:         Firmware TPM 2.0, Windows Hello Face & PIN, Lenovo Shield Root-of-Trust
========================================================`,
    createdAt: Date.now() - 7200000,
    modifiedAt: Date.now() - 7200000,
    size: 980,
  },

  // Documents
  {
    id: 'system-specs',
    name: 'Lenovo_SSD_Storage_Info.txt',
    type: 'file',
    fileType: 'txt',
    parentId: 'documents',
    content: `Drive: Local Disk (C:)
Type: NVMe PCIe Gen 4 Solid State Drive
Capacity: 1,024.0 GB (1.0 TB)
Allocated / Used: 131.6 GB (System, Drivers, Lenovo Vantage, Preloaded Apps)
Available Free Space: 892.4 GB (Ready for user apps, games, and downloads)
Partition Style: GUID Partition Table (GPT)
File System: NTFS / WebFS Virtual Storage
TRIM Status: Enabled`,
    createdAt: Date.now() - 86400000,
    modifiedAt: Date.now() - 86400000,
    size: 380,
  },
  {
    id: 'passwords-txt',
    name: 'Personal Notes.txt',
    type: 'file',
    fileType: 'txt',
    parentId: 'documents',
    content: `Lenovo G14 WinWeb 11 Pro Workspace Notes
----------------------------------------
- Default PIN: 1234
- Default Admin Password: lenovo
- Backup your files by signing into your personalized account!
- Downloads from Google Chrome and Edge are stored in Downloads folder.`,
    createdAt: Date.now() - 50000000,
    modifiedAt: Date.now() - 50000000,
    size: 260,
  },

  // Pictures
  {
    id: 'sample-drawing',
    name: 'Windows 11 Solar Glow Orb.png',
    type: 'file',
    fileType: 'png',
    parentId: 'pictures',
    content: '/wallpapers/windows_glow_solar_orb.jpg',
    createdAt: Date.now() - 100000000,
    modifiedAt: Date.now() - 100000000,
    size: 827000,
  },
  {
    id: 'sample-bloom',
    name: 'Windows 11 Bloom Dark.png',
    type: 'file',
    fileType: 'png',
    parentId: 'pictures',
    content: '/wallpapers/windows_bloom_dark.jpg',
    createdAt: Date.now() - 90000000,
    modifiedAt: Date.now() - 90000000,
    size: 1400000,
  },

  // Downloads - sample downloaded installers ready to test launch
  {
    id: 'dl-vscode',
    name: 'VS Code Setup.exe',
    type: 'file',
    fileType: 'sys',
    parentId: 'downloads',
    content: 'app:vscode',
    createdAt: Date.now() - 12000000,
    modifiedAt: Date.now() - 12000000,
    size: 88400000,
  },
  {
    id: 'dl-nvidia',
    name: 'NVIDIA GeForce Experience.exe',
    type: 'file',
    fileType: 'sys',
    parentId: 'downloads',
    content: 'app:nvidia',
    createdAt: Date.now() - 8000000,
    modifiedAt: Date.now() - 8000000,
    size: 124000000,
  },
  {
    id: 'dl-game',
    name: 'Minecraft 2048 Edition.exe',
    type: 'file',
    fileType: 'sys',
    parentId: 'downloads',
    content: 'app:game2048',
    createdAt: Date.now() - 4000000,
    modifiedAt: Date.now() - 4000000,
    size: 32000000,
  },
];

export class FileSystemManager {
  private items: FSItem[] = [];
  private currentUsername: string = 'lenovo';

  constructor() {
    const user = accountManager.getCurrentUser();
    this.currentUsername = user.username || 'lenovo';
    this.loadUserFiles(this.currentUsername);

    // Subscribe to account switches so filesystem dynamically loads that user's files
    accountManager.subscribe((user) => {
      if (user.username !== this.currentUsername) {
        this.currentUsername = user.username;
        this.loadUserFiles(user.username);
      }
    });
  }

  private getUserStorageKey(username: string): string {
    return `win11_virtual_filesystem_${username.toLowerCase()}`;
  }

  public loadUserFiles(username: string) {
    this.currentUsername = username.toLowerCase();
    const key = this.getUserStorageKey(this.currentUsername);
    try {
      const data = localStorage.getItem(key);
      if (data) {
        this.items = JSON.parse(data);
      } else {
        // Check if legacy storage exists for default user
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyData && this.currentUsername === 'lenovo') {
          this.items = JSON.parse(legacyData);
          this.save();
        } else {
          // Initialize fresh filesystem for this user
          const currentUser = accountManager.getCurrentUser();
          this.items = getLenovoDefaultFiles(currentUser.displayName);
          this.save();
        }
      }
    } catch (_) {
      this.items = getLenovoDefaultFiles(username);
    }
  }

  private save() {
    try {
      const key = this.getUserStorageKey(this.currentUsername);
      localStorage.setItem(key, JSON.stringify(this.items));
      // Keep legacy in sync if admin for backward compatibility
      if (this.currentUsername === 'lenovo') {
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(this.items));
      }
    } catch (_) {}
  }

  getAllItems(): FSItem[] {
    return this.items;
  }

  getItems(parentId: string | null): FSItem[] {
    return this.items.filter((item) => item.parentId === parentId);
  }

  getItem(id: string): FSItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  createFile(
    name: string,
    parentId: string,
    content: string = '',
    fileType: 'txt' | 'png' | 'url' | 'sys' = 'txt'
  ): FSItem {
    const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newItem: FSItem = {
      id,
      name,
      type: 'file',
      fileType,
      parentId,
      content,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      size: content.length > 0 ? content.length : Math.floor(Math.random() * 50000 + 1024),
    };
    this.items.push(newItem);
    this.save();
    return newItem;
  }

  createFolder(name: string, parentId: string): FSItem {
    const id = 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newFolder: FSItem = {
      id,
      name,
      type: 'folder',
      parentId,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    this.items.push(newFolder);
    this.save();
    return newFolder;
  }

  updateFile(id: string, content: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (item && item.type === 'file') {
      item.content = content;
      item.modifiedAt = Date.now();
      item.size = content.length;
      this.save();
      return true;
    }
    return false;
  }

  renameItem(id: string, newName: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.name = newName;
      item.modifiedAt = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  deleteItem(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;

    // If not in trash, move to trash
    if (item.parentId !== 'trash' && id !== 'trash' && id !== 'desktop') {
      item.parentId = 'trash';
      item.modifiedAt = Date.now();
      this.save();
      return true;
    }

    // If already in trash, permanently delete
    this.items = this.items.filter((i) => i.id !== id && i.parentId !== id);
    this.save();
    return true;
  }

  emptyTrash(): void {
    this.items = this.items.filter((item) => item.parentId !== 'trash');
    this.save();
  }

  restoreItem(id: string): boolean {
    const item = this.items.find((i) => i.id === id);
    if (item && item.parentId === 'trash') {
      item.parentId = 'desktop';
      item.modifiedAt = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  resetToDefault(): void {
    const currentUser = accountManager.getCurrentUser();
    this.items = getLenovoDefaultFiles(currentUser.displayName);
    this.save();
  }
}

export const fs = new FileSystemManager();
