import { INITIAL_PRODUCTS, DEFAULT_STORE_CONFIG } from '../data/initialData';
import { 
  SEED_ROLES, 
  SEED_USERS, 
  SEED_CATEGORIES, 
  SEED_NOTIFICATIONS, 
  SEED_ACTIVITY_LOGS,
  DEFAULT_APP_CONFIG 
} from '../data/adminSeedData';

export const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbxW1_UiseUS3K_LJnwhYXT1R5fivTVOgDiEQSyQH_Jp-Jv18OkpUacrTti9gfXDhybkMg/exec";

const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  TRANSACTIONS: 'pos_transactions',
  SETTINGS: 'pos_settings',
  SHEET_URL: 'pos_sheet_url',
  ADMIN_PIN: 'pos_admin_pin',
  USERS: 'pos_users',
  ROLES: 'pos_roles',
  CATEGORIES: 'pos_categories',
  NOTIFICATIONS: 'pos_notifications',
  ACTIVITY_LOGS: 'pos_activity_logs',
  APP_CONFIG: 'pos_app_config',
  BACKUP_HISTORY: 'pos_backup_history'
};

// Purge dummy demo data on startup agar pengguna mulai dengan data kosong & bersih
const PURGE_KEY = 'pos_clean_slate_v5';
try {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(PURGE_KEY)) {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.BACKUP_HISTORY);
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, DEFAULT_SHEET_URL);
    localStorage.setItem(PURGE_KEY, 'true');
  }
} catch (e) {
  console.error('Storage purge error:', e);
}

export const storageService = {
  // ===================== PRODUCTS =====================
  getProducts: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch (e) {
      console.error('Error reading products:', e);
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts: (products) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },

  // ===================== TRANSACTIONS =====================
  getTransactions: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading transactions:', e);
      return [];
    }
  },

  saveTransaction: (transaction) => {
    try {
      const current = storageService.getTransactions();
      const updated = [transaction, ...current];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving transaction:', e);
      return [];
    }
  },

  setAllTransactions: (transactions) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error setting all transactions:', e);
    }
  },

  // ===================== SETTINGS & STORE =====================
  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_STORE_CONFIG, ...JSON.parse(data) } : DEFAULT_STORE_CONFIG;
    } catch (e) {
      console.error('Error reading settings:', e);
      return DEFAULT_STORE_CONFIG;
    }
  },

  saveSettings: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // ===================== GOOGLE SHEET URL & PIN =====================
  getSheetUrl: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHEET_URL);
      if (stored && stored.trim()) return stored.trim();
      const envUrl = (import.meta.env && import.meta.env.VITE_GOOGLE_SHEETS_URL) || '';
      return (envUrl && envUrl.trim()) ? envUrl.trim() : DEFAULT_SHEET_URL;
    } catch (e) {
      console.error('Error reading sheet url:', e);
      return DEFAULT_SHEET_URL;
    }
  },

  saveSheetUrl: (url) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, (url || '').trim());
    } catch (e) {
      console.error('Error saving sheet url:', e);
    }
  },

  getAdminPin: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
    } catch (e) {
      return '1234';
    }
  },

  saveAdminPin: (pin) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, (pin || '1234').trim());
    } catch (e) {
      console.error('Error saving admin pin:', e);
    }
  },

  // ===================== USERS (MANAJEMEN PENGGUNA) =====================
  getUsers: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : SEED_USERS;
    } catch (e) {
      return SEED_USERS;
    }
  },

  saveUsers: (users) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  },

  // ===================== ROLES & HAK AKSES =====================
  getRoles: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROLES);
      return data ? JSON.parse(data) : SEED_ROLES;
    } catch (e) {
      return SEED_ROLES;
    }
  },

  saveRoles: (roles) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
    } catch (e) {
      console.error('Error saving roles:', e);
    }
  },

  // ===================== KATEGORI =====================
  getCategories: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : SEED_CATEGORIES;
    } catch (e) {
      return SEED_CATEGORIES;
    }
  },

  saveCategories: (categories) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving categories:', e);
    }
  },

  // ===================== NOTIFIKASI =====================
  getNotifications: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : SEED_NOTIFICATIONS;
    } catch (e) {
      return SEED_NOTIFICATIONS;
    }
  },

  saveNotifications: (notifications) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  },

  addNotification: (notif) => {
    try {
      const current = storageService.getNotifications();
      const newNotif = {
        id: `NOTIF-${Date.now()}`,
        read: false,
        timestamp: new Date().toISOString(),
        ...notif
      };
      const updated = [newNotif, ...current];
      storageService.saveNotifications(updated);
      return updated;
    } catch (e) {
      console.error('Error adding notification:', e);
      return [];
    }
  },

  // ===================== RIWAYAT AKTIVITAS (ACTIVITY LOGS) =====================
  getActivityLogs: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return data ? JSON.parse(data) : SEED_ACTIVITY_LOGS;
    } catch (e) {
      return SEED_ACTIVITY_LOGS;
    }
  },

  saveActivityLogs: (logs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving logs:', e);
    }
  },

  logActivity: (action, module, detail, user = 'Budi Santoso (Admin)', role = 'Admin') => {
    try {
      const current = storageService.getActivityLogs();
      const newLog = {
        id: `LOG-${Date.now()}`,
        user,
        role,
        action,
        module,
        detail,
        ip: '127.0.0.1 (Localhost)',
        timestamp: new Date().toISOString()
      };
      const updated = [newLog, ...current];
      storageService.saveActivityLogs(updated);
      return updated;
    } catch (e) {
      console.error('Error logging activity:', e);
      return [];
    }
  },

  // ===================== PENGATURAN APLIKASI (APP CONFIG) =====================
  getAppConfig: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      return data ? { ...DEFAULT_APP_CONFIG, ...JSON.parse(data) } : DEFAULT_APP_CONFIG;
    } catch (e) {
      return DEFAULT_APP_CONFIG;
    }
  },

  saveAppConfig: (config) => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving app config:', e);
    }
  },

  // ===================== BACKUP & RESTORE =====================
  getBackupHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BACKUP_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveBackupHistory: (history) => {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving backup history:', e);
    }
  },

  createFullBackup: (notes = 'Manual Backup') => {
    const backupData = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      notes,
      data: {
        products: storageService.getProducts(),
        transactions: storageService.getTransactions(),
        categories: storageService.getCategories(),
        users: storageService.getUsers(),
        roles: storageService.getRoles(),
        settings: storageService.getSettings(),
        appConfig: storageService.getAppConfig(),
        sheetUrl: storageService.getSheetUrl()
      }
    };

    const history = storageService.getBackupHistory();
    const newEntry = {
      id: `BAK-${Date.now()}`,
      timestamp: backupData.timestamp,
      notes,
      size: `${(JSON.stringify(backupData).length / 1024).toFixed(1)} KB`,
      itemCount: {
        products: backupData.data.products.length,
        transactions: backupData.data.transactions.length,
        users: backupData.data.users.length
      },
      data: backupData
    };

    storageService.saveBackupHistory([newEntry, ...history]);
    storageService.logActivity('BACKUP_DATABASE', 'Backup & Restore', `Membuat cadangan database: ${notes}`);
    storageService.addNotification({
      type: 'success',
      title: 'Cadangan Sistem Selesai',
      message: `Cadangan ${newEntry.id} berhasil disimpan (${newEntry.size}).`
    });

    return newEntry;
  },

  restoreBackup: (backupObject) => {
    try {
      if (!backupObject || !backupObject.data) {
        throw new Error('Format file backup tidak valid.');
      }
      const d = backupObject.data;
      if (d.products) storageService.saveProducts(d.products);
      if (d.transactions) storageService.setAllTransactions(d.transactions);
      if (d.categories) storageService.saveCategories(d.categories);
      if (d.users) storageService.saveUsers(d.users);
      if (d.roles) storageService.saveRoles(d.roles);
      if (d.settings) storageService.saveSettings(d.settings);
      if (d.appConfig) storageService.saveAppConfig(d.appConfig);
      if (d.sheetUrl) storageService.saveSheetUrl(d.sheetUrl);

      storageService.logActivity('RESTORE_DATABASE', 'Backup & Restore', `Memulihkan database dari snapshot ${backupObject.timestamp}`);
      return { success: true, message: 'Pemulihan data berhasil! Seluruh tabel data telah diperbarui.' };
    } catch (e) {
      console.error('Error restoring backup:', e);
      return { success: false, message: 'Gagal memulihkan cadangan: ' + e.message };
    }
  },

  // ===================== WIPE / RESET CLEAN SLATE =====================
  clearAllData: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
      localStorage.removeItem(STORAGE_KEYS.BACKUP_HISTORY);
      localStorage.setItem(STORAGE_KEYS.SHEET_URL, DEFAULT_SHEET_URL);
      return true;
    } catch (e) {
      console.error('Error clearing all data:', e);
      return false;
    }
  }
};
