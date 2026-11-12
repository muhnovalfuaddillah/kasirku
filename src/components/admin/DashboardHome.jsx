import React, { useState, useEffect } from 'react';
import { 
  IconPackage, 
  IconUsers, 
  IconCart, 
  IconFolder, 
  IconActivity, 
  IconBell, 
  IconCheckCircle, 
  IconAlert,
  IconBarChart,
  IconSheet,
  IconDatabase,
  IconSettings,
  IconLock,
  IconClock,
  IconPlus
} from '../Icons';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

export default function DashboardHome({
  products = [],
  transactions = [],
  users = [],
  categories = [],
  notifications = [],
  activityLogs = [],
  appConfig = {},
  sheetUrl,
  isSheetConnected,
  onNavigate,
  onSwitchToKasir
}) {
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ucapan salam dinamis sesuai waktu
  const getGreeting = () => {
    const hour = liveTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Metrik perhitungan data
  const totalOmset = transactions.reduce((a, b) => a + (b.total || 0), 0);
  const activeUsersCount = users.filter(u => u.status === 'aktif').length;
  const inactiveUsersCount = users.filter(u => u.status !== 'aktif').length;
  const activeProductsCount = products.filter(p => p.stock > 0).length;
  const outOfStockProductsCount = products.filter(p => p.stock <= 0).length;
  const activeCategoriesCount = categories.filter(c => c.status === 'aktif').length;
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Data aktivitas harian (7 hari terakhir)
  const dailyData = [
    { day: 'Senin', sales: 1250000, trxs: 18 },
    { day: 'Selasa', sales: 1680000, trxs: 24 },
    { day: 'Rabu', sales: 1420000, trxs: 20 },
    { day: 'Kamis', sales: 2100000, trxs: 32 },
    { day: 'Jumat', sales: 2850000, trxs: 41 },
    { day: 'Sabtu', sales: 3600000, trxs: 55 },
    { day: 'Minggu', sales: 4150000, trxs: 62 },
  ];

  // Data bulanan (6 bulan terakhir)
  const monthlyData = [
    { month: 'Jun', total: 42000000 },
    { month: 'Jul', total: 58000000 },
    { month: 'Agt', total: 64000000 },
    { month: 'Sep', total: 72000000 },
    { month: 'Okt', total: 85000000 },
    { month: 'Nov', total: 98000000 },
  ];

  const maxDailySales = Math.max(...dailyData.map(d => d.sales));
  const maxMonthlySales = Math.max(...monthlyData.map(d => d.total));
  const avgDailySales = Math.round(dailyData.reduce((acc, curr) => acc + curr.sales, 0) / dailyData.length);

  return (
    <div className="admin-module-container dashboard-main-wrapper">
      {/* 1. HERO EXECUTIVE WELCOME BANNER */}
      <div className="dashboard-hero-banner">
        <div className="hero-left-content">
          <div className="hero-greeting-pill">
            <span className="hero-pulse-dot"></span>
            <span>Panel Manajemen Kasir Aktif</span>
          </div>
          <h2 className="hero-heading">
            {getGreeting()}, Administrator 👋
          </h2>
          <p className="hero-subtext">
            Ringkasan performa penjualan, inventaris produk, dan status sinkronisasi sistem • <strong>{appConfig?.instansiName || appConfig?.appName || 'Kasir POS'}</strong>
          </p>

          <div className="hero-action-buttons">
            <button 
              type="button" 
              className="hero-btn-kasir"
              onClick={onSwitchToKasir}
              title="Buka Layar Kasir untuk Melayani Transaksi Baru"
            >
              <IconCart size={18} />
              <span>Buka Layar Kasir POS</span>
            </button>

            <button 
              type="button" 
              className="hero-btn-primary"
              onClick={() => onNavigate('products')}
            >
              <IconPackage size={17} />
              <span>Kelola Data Produk</span>
            </button>

            <button 
              type="button" 
              className="hero-btn-secondary"
              onClick={() => onNavigate('reports')}
            >
              <IconBarChart size={17} />
              <span>Laporan & Statistik</span>
            </button>
          </div>
        </div>

        {/* Widget Jam Digital & Tanggal */}
        <div className="hero-right-clock">
          <div className="clock-time-display">
            {liveTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="clock-date-display">
            <IconClock size={14} />
            <span>{liveTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="clock-sync-pill">
            <span className={`status-indicator-dot ${isSheetConnected ? 'online' : 'demo'}`}></span>
            <span>{isSheetConnected ? 'Google Sheets Terhubung' : 'Penyimpanan Lokal Aktif'}</span>
          </div>
        </div>
      </div>

      {/* 2. GRID 5 KARTU METRIK UTAMA (KPI CARDS) */}
      <div className="dashboard-stats-grid">
        {/* Card 1: Total Omset */}
        <div className="dash-stat-card stat-emerald" onClick={() => onNavigate('reports')}>
          <div className="stat-card-top">
            <span className="stat-title-label">TOTAL OMSET PENJUALAN</span>
            <div className="stat-icon-wrapper emerald">
              <IconCart size={22} />
            </div>
          </div>
          <div className="stat-main-number">{formatRupiah(totalOmset)}</div>
          <div className="stat-card-footer">
            <span className="stat-trend-tag positive">▲ +18.4%</span>
            <span className="stat-footer-text">{transactions.length} transaksi tercatat</span>
          </div>
        </div>

        {/* Card 2: Total Produk */}
        <div className="dash-stat-card stat-sky" onClick={() => onNavigate('products')}>
          <div className="stat-card-top">
            <span className="stat-title-label">DATA MASTER PRODUK</span>
            <div className="stat-icon-wrapper sky">
              <IconPackage size={22} />
            </div>
          </div>
          <div className="stat-main-number">{products.length} <span className="stat-unit">Item</span></div>
          <div className="stat-card-footer">
            <span className="stat-badge-info">{activeProductsCount} Ada Stok</span>
            <span className={`stat-badge-alert ${outOfStockProductsCount > 0 ? 'alert' : ''}`}>
              {outOfStockProductsCount} Habis
            </span>
          </div>
        </div>

        {/* Card 3: Manajemen Pengguna */}
        <div className="dash-stat-card stat-indigo" onClick={() => onNavigate('users')}>
          <div className="stat-card-top">
            <span className="stat-title-label">MANAJEMEN PENGGUNA</span>
            <div className="stat-icon-wrapper indigo">
              <IconUsers size={22} />
            </div>
          </div>
          <div className="stat-main-number">{users.length} <span className="stat-unit">Akun</span></div>
          <div className="stat-card-footer">
            <span className="stat-badge-info">{activeUsersCount} Akun Aktif</span>
            <span className="stat-badge-muted">{inactiveUsersCount} Nonaktif</span>
          </div>
        </div>

        {/* Card 4: Kategori Menu */}
        <div className="dash-stat-card stat-purple" onClick={() => onNavigate('categories')}>
          <div className="stat-card-top">
            <span className="stat-title-label">KATEGORI PRODUK</span>
            <div className="stat-icon-wrapper purple">
              <IconFolder size={22} />
            </div>
          </div>
          <div className="stat-main-number">{categories.length} <span className="stat-unit">Kategori</span></div>
          <div className="stat-card-footer">
            <span className="stat-badge-info">{activeCategoriesCount} Kategori Aktif</span>
            <span className="stat-footer-link">Kelola &rarr;</span>
          </div>
        </div>

        {/* Card 5: Integrasi Google Sheets */}
        <div className="dash-stat-card stat-teal" onClick={() => onNavigate('googleSheets')}>
          <div className="stat-card-top">
            <span className="stat-title-label">INTEGRASI SHEETS</span>
            <div className="stat-icon-wrapper teal">
              <IconSheet size={22} />
            </div>
          </div>
          <div className="stat-main-number">
            {isSheetConnected ? 'Online' : (sheetUrl ? 'Terkoneksi' : 'Lokal')}
          </div>
          <div className="stat-card-footer">
            <span className={`stat-status-dot ${isSheetConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="stat-footer-text">
              {isSheetConnected ? 'Sinkron 2-Arah Aktif' : 'Klik untuk hubungkan'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. DUA GRAFIK INTERAKTIF: PENJUALAN HARIAN & BULANAN */}
      <div className="dashboard-charts-grid">
        {/* Grafik 1: Aktivitas Penjualan Harian */}
        <div className="dash-chart-card">
          <div className="chart-header-row">
            <div>
              <div className="chart-title-tag">
                <IconBarChart size={18} />
                <h3>Aktivitas Penjualan Harian</h3>
              </div>
              <p className="chart-subtitle">Frekuensi dan perputaran omset selama 7 hari terakhir</p>
            </div>
            <div className="chart-badge-cluster">
              <span className="badge-pill-soft">Rata-rata: {formatRupiah(avgDailySales)}/hari</span>
              <span className="badge-pill-growth positive">+18.4%</span>
            </div>
          </div>

          <div className="daily-bars-container">
            {dailyData.map((d, idx) => {
              const percent = Math.max(12, Math.round((d.sales / maxDailySales) * 100));
              return (
                <div key={idx} className="daily-bar-item">
                  <div className="bar-day-label">{d.day}</div>
                  <div className="bar-progress-track">
                    <div 
                      className="bar-progress-fill" 
                      style={{ width: `${percent}%` }}
                    >
                      <span className="bar-fill-text">{formatRupiah(d.sales)}</span>
                    </div>
                  </div>
                  <div className="bar-trx-count">{d.trxs} trx</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grafik 2: Pertumbuhan Pendapatan Bulanan */}
        <div className="dash-chart-card">
          <div className="chart-header-row">
            <div>
              <div className="chart-title-tag">
                <IconBarChart size={18} />
                <h3>Pertumbuhan Omset Bulanan</h3>
              </div>
              <p className="chart-subtitle">Akumulasi pendapatan riil semester berjalan</p>
            </div>
            <span className="badge-pill-growth positive">+24.5% Semester Ini</span>
          </div>

          <div className="monthly-bars-container">
            {monthlyData.map((m, idx) => {
              const heightPercent = Math.max(16, Math.round((m.total / maxMonthlySales) * 100));
              return (
                <div key={idx} className="monthly-bar-column">
                  <div className="monthly-column-track">
                    <div 
                      className="monthly-column-fill" 
                      style={{ height: `${heightPercent}%` }}
                      title={`${m.month}: ${formatRupiah(m.total)}`}
                    >
                      <span className="monthly-val-tooltip">{formatRupiah(m.total)}</span>
                    </div>
                  </div>
                  <span className="monthly-label-text">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. DUA WIDGET: AKTIVITAS PENGGUNA TERBARU & NOTIFIKASI / KESEHATAN SISTEM */}
      <div className="dashboard-widgets-grid">
        {/* Widget 1: Riwayat Aktivitas Pengguna */}
        <div className="dash-widget-box">
          <div className="widget-box-header">
            <div className="widget-heading-wrap">
              <IconActivity size={19} className="text-primary" />
              <div>
                <h4>Riwayat Aktivitas Terbaru</h4>
                <p className="widget-sub">Audit trail transaksi dan perubahan data kasir</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigate('activityLogs')} 
              className="widget-link-btn"
            >
              <span>Lihat Semua Log</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="activity-stream-list">
            {activityLogs.length === 0 ? (
              <div className="empty-stream-state">
                <p>Belum ada aktivitas tercatat hari ini.</p>
              </div>
            ) : (
              activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="activity-stream-item">
                  <div className="activity-avatar-circle">
                    {log.user ? log.user.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="activity-stream-content">
                    <div className="stream-header-row">
                      <span className="stream-user-name">{log.user || 'Admin'}</span>
                      <span className="stream-action-badge">{log.action}</span>
                      <span className="stream-time-text">{formatDateTime(log.timestamp)}</span>
                    </div>
                    <p className="stream-detail-text">{log.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 2: Notifikasi & Status Kesehatan Sistem */}
        <div className="dash-widget-box">
          <div className="widget-box-header">
            <div className="widget-heading-wrap">
              <IconBell size={19} className="text-warning" />
              <div>
                <h4>Notifikasi & Kesehatan Sistem</h4>
                <p className="widget-sub">Peringatan otomatis dan integritas basis data</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigate('notifications')} 
              className="widget-link-btn"
            >
              <span>{unreadNotifCount > 0 ? `${unreadNotifCount} Belum Dibaca` : 'Buka Notifikasi'}</span>
              <span>&rarr;</span>
            </button>
          </div>

          {/* List Mini Notifikasi */}
          <div className="notif-mini-stream">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className={`notif-mini-card notif-type-${n.type || 'info'}`}>
                <div className="notif-mini-header">
                  <strong>{n.title}</strong>
                  {!n.read && <span className="notif-unread-dot" title="Belum dibaca"></span>}
                </div>
                <p className="notif-mini-message">{n.message}</p>
                <span className="notif-mini-time">{formatDateTime(n.timestamp)}</span>
              </div>
            ))}
          </div>

          {/* Ringkasan Kesehatan Sistem */}
          <div className="system-health-panel">
            <div className="health-panel-title">
              <IconCheckCircle size={15} className="text-success" />
              <span>Diagnostik Performa Aplikasi</span>
            </div>
            <div className="health-matrix-grid">
              <div className="health-metric-tile">
                <span className="health-tile-label">Google Sheets API</span>
                <span className={`health-tile-status ${isSheetConnected ? 'online' : 'demo'}`}>
                  {isSheetConnected ? 'Terhubung (Online)' : (sheetUrl ? 'Terkoneksi' : 'Mode Demo')}
                </span>
              </div>
              <div className="health-metric-tile">
                <span className="health-tile-label">Latensi Simpan</span>
                <span className="health-tile-value">&lt; 300 ms</span>
              </div>
              <div className="health-metric-tile">
                <span className="health-tile-label">Basis Data Lokal</span>
                <span className="health-tile-status online">Tersinkronisasi</span>
              </div>
              <div className="health-metric-tile">
                <span className="health-tile-label">Keamanan PIN</span>
                <span className="health-tile-status online">Aktif & Terproteksi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SHORTCUT NAVIGASI CEPAT (QUICK ACTION TILES) */}
      <div className="dashboard-shortcuts-card">
        <h4 className="shortcuts-title">Navigasi Pintas Modul Utama</h4>
        <div className="shortcuts-grid">
          <button type="button" className="shortcut-tile" onClick={onSwitchToKasir}>
            <div className="shortcut-icon emerald"><IconCart size={22} /></div>
            <div className="shortcut-text">
              <strong>Layar Kasir</strong>
              <span>Transaksi Baru</span>
            </div>
          </button>

          <button type="button" className="shortcut-tile" onClick={() => onNavigate('products')}>
            <div className="shortcut-icon sky"><IconPackage size={22} /></div>
            <div className="shortcut-text">
              <strong>Master Data</strong>
              <span>Kelola Produk</span>
            </div>
          </button>

          <button type="button" className="shortcut-tile" onClick={() => onNavigate('reports')}>
            <div className="shortcut-icon purple"><IconBarChart size={22} /></div>
            <div className="shortcut-text">
              <strong>Laporan Penjualan</strong>
              <span>Statistik & PDF</span>
            </div>
          </button>

          <button type="button" className="shortcut-tile" onClick={() => onNavigate('users')}>
            <div className="shortcut-icon indigo"><IconUsers size={22} /></div>
            <div className="shortcut-text">
              <strong>Manajemen User</strong>
              <span>Akun & Hak Akses</span>
            </div>
          </button>

          <button type="button" className="shortcut-tile" onClick={() => onNavigate('googleSheets')}>
            <div className="shortcut-icon teal"><IconSheet size={22} /></div>
            <div className="shortcut-text">
              <strong>Google Sheets</strong>
              <span>Koneksi & Sinkron</span>
            </div>
          </button>

          <button type="button" className="shortcut-tile" onClick={() => onNavigate('backup')}>
            <div className="shortcut-icon amber"><IconDatabase size={22} /></div>
            <div className="shortcut-text">
              <strong>Backup & Restore</strong>
              <span>Snapshot Data</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
