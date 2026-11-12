import React, { useState, useEffect } from 'react';
import {
  IconStore,
  IconCart,
  IconPackage,
  IconHistory,
  IconSettings,
  IconSun,
  IconMoon,
  IconMaximize,
  IconUser
} from './Icons';

export default function Header({
  currentRole, // 'kasir' | 'admin'
  onOpenAdminLogin,
  onSwitchToKasir,
  currentTab,
  setCurrentTab,
  storeConfig,
  cartCount,
  isSheetConnected,
  sheetUrl,
  darkMode,
  onToggleDarkMode,
  onOpenStoreSettings
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const timeString = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="header-container">
      <div className="header-left">
        <div 
          className={`logo-box ${currentRole === 'admin' ? 'logo-admin' : ''} ${storeConfig.logo ? 'has-custom-logo' : ''}`}
          onClick={onOpenStoreSettings}
          title="Klik untuk ubah Nama & Logo Toko"
          style={{ cursor: 'pointer' }}
        >
          {storeConfig.logo ? (
            <img 
              src={storeConfig.logo} 
              alt={storeConfig.name || 'Logo Toko'} 
              className="header-logo-image"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{ display: storeConfig.logo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconStore size={24} className="logo-icon" />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 
              className="store-title cursor-pointer-store" 
              onClick={onOpenStoreSettings}
              title="Klik untuk ubah Nama & Logo Toko"
            >
              {storeConfig.name || 'Kasir Pintar POS'}
            </h1>
            
            <button
              type="button"
              onClick={onOpenStoreSettings}
              className="btn-store-setting-pill"
              title="Ubah Nama & Logo Toko"
            >
              <span>⚙️ Atur Toko</span>
            </button>

            <span className={`role-badge ${currentRole === 'admin' ? 'badge-role-admin' : 'badge-role-kasir'}`}>
              {currentRole === 'admin' ? '👑 Panel Admin' : '🛒 Layar Kasir'}
            </span>
            {currentRole === 'kasir' && (
              <span className="cashier-active-tag">
                <IconUser size={13} />
                <span>{storeConfig.cashierName || 'Kasir 1'}</span>
              </span>
            )}
          </div>
          <div className="status-indicator-row">
            <span className={`status-pill ${sheetUrl ? (isSheetConnected ? 'status-online' : 'status-syncing') : 'status-demo'}`}>
              <span className="dot"></span>
              {sheetUrl 
                ? (isSheetConnected ? 'Google Sheet Otomatis (Tersinkron)' : 'Menghubungkan Google Sheet...') 
                : 'Mode Demo (Lokal)'}
            </span>
            <span className="time-badge">{dateString} • {timeString}</span>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        {/* Tombol Kiosk Fullscreen & Dark Mode (Tersedia di Layar Kasir) */}
        <div className="header-quick-actions">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn-header-tool"
            title="Layar Penuh / Kiosk Mode (F11)"
          >
            <IconMaximize size={17} />
          </button>

          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="btn-header-tool"
              title={darkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            >
              {darkMode ? <IconSun size={17} /> : <IconMoon size={17} />}
            </button>
          )}
        </div>

        {currentRole === 'kasir' ? (
          /* ================= TAMPILAN MODE KASIR (KHUSUS PEMESANAN) ================= */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="kasir-active-pill">
              <IconCart size={18} />
              <span className="hidden-on-mobile">Layar Kasir Aktif</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>

            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="btn-admin-switch"
              title="Masuk ke Panel Pengaturan & Laporan Admin"
            >
              <span>🔒 Masuk Admin</span>
            </button>
          </div>
        ) : (
          /* ================= TAMPILAN MODE ADMIN ================= */
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`nav-btn ${currentTab === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentTab('products')}
            >
              <IconPackage size={18} />
              <span>Kelola Produk</span>
            </button>

            <button
              className={`nav-btn ${currentTab === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentTab('history')}
            >
              <IconHistory size={18} />
              <span>Laporan & Transaksi</span>
            </button>

            <button
              className={`nav-btn ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentTab('settings')}
            >
              <IconSettings size={18} />
              <span>Google Sheet & Toko</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToKasir}
              className="btn-kasir-return"
              title="Buka Layar Kasir untuk Melayani Pesanan"
            >
              <IconCart size={16} />
              <span>Buka Kasir</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
