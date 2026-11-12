export const SEED_ROLES = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Akses penuh ke seluruh sistem, master data, keuangan, dan pengaturan',
    isSystem: true,
    permissions: {
      dashboard: { view: true, add: true, edit: true, delete: true },
      users: { view: true, add: true, edit: true, delete: true },
      roles: { view: true, add: true, edit: true, delete: true },
      products: { view: true, add: true, edit: true, delete: true },
      categories: { view: true, add: true, edit: true, delete: true },
      reports: { view: true, add: true, edit: true, delete: true },
      notifications: { view: true, add: true, edit: true, delete: true },
      activityLogs: { view: true, add: true, edit: true, delete: true },
      settings: { view: true, add: true, edit: true, delete: true },
      googleSheets: { view: true, add: true, edit: true, delete: true },
      security: { view: true, add: true, edit: true, delete: true },
      backup: { view: true, add: true, edit: true, delete: true }
    }
  },
  {
    id: 'role-operator',
    name: 'Operator',
    description: 'Mengelola produk, stok, kategori, dan melihat laporan penjualan',
    isSystem: false,
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      roles: { view: false, add: false, edit: false, delete: false },
      products: { view: true, add: true, edit: true, delete: false },
      categories: { view: true, add: true, edit: true, delete: false },
      reports: { view: true, add: false, edit: false, delete: false },
      notifications: { view: true, add: false, edit: false, delete: false },
      activityLogs: { view: true, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
      googleSheets: { view: true, add: false, edit: true, delete: false },
      security: { view: false, add: false, edit: false, delete: false },
      backup: { view: false, add: false, edit: false, delete: false }
    }
  },
  {
    id: 'role-petugas',
    name: 'Petugas Gudang',
    description: 'Memantau stok dan memperbarui inventaris barang',
    isSystem: false,
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      roles: { view: false, add: false, edit: false, delete: false },
      products: { view: true, add: false, edit: true, delete: false },
      categories: { view: true, add: false, edit: false, delete: false },
      reports: { view: false, add: false, edit: false, delete: false },
      notifications: { view: true, add: false, edit: false, delete: false },
      activityLogs: { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
      googleSheets: { view: false, add: false, edit: false, delete: false },
      security: { view: false, add: false, edit: false, delete: false },
      backup: { view: false, add: false, edit: false, delete: false }
    }
  },
  {
    id: 'role-kasir',
    name: 'Kasir',
    description: 'Khusus melayani pemesanan, kasir POS, dan mencetak struk belanja',
    isSystem: true,
    permissions: {
      dashboard: { view: false, add: false, edit: false, delete: false },
      users: { view: false, add: false, edit: false, delete: false },
      roles: { view: false, add: false, edit: false, delete: false },
      products: { view: true, add: false, edit: false, delete: false },
      categories: { view: true, add: false, edit: false, delete: false },
      reports: { view: false, add: false, edit: false, delete: false },
      notifications: { view: false, add: false, edit: false, delete: false },
      activityLogs: { view: false, add: false, edit: false, delete: false },
      settings: { view: false, add: false, edit: false, delete: false },
      googleSheets: { view: false, add: false, edit: false, delete: false },
      security: { view: false, add: false, edit: false, delete: false },
      backup: { view: false, add: false, edit: false, delete: false }
    }
  }
];

export const SEED_USERS = [
  {
    id: 'USR-001',
    name: 'Admin Toko',
    username: 'admin',
    email: 'admin@pos.id',
    phone: '0812-3456-7890',
    role: 'Admin',
    status: 'aktif',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

export const SEED_CATEGORIES = [];

export const SEED_NOTIFICATIONS = [];

export const SEED_ACTIVITY_LOGS = [];

export const DEFAULT_APP_CONFIG = {
  appName: 'Kasir Pintar POS & ERP',
  instansiName: 'PT Berkah Retail Nusantara',
  address: 'Jl. Merdeka Raya No. 45, Jakarta Pusat',
  phone: '0812-3456-7890',
  email: 'admin@kasirpos.id',
  primaryColor: '#0284c7', // Sky Blue
  darkMode: false,
  sidebarCollapsed: false,
  language: 'id', // 'id' | 'en'
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Asia/Jakarta (WIB GMT+7)',
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  autoBackupDaily: true
};

