import React, { useState } from 'react';
import { 
  IconStore,
  IconCart,
  IconBarChart,
  IconUsers,
  IconShield,
  IconPackage,
  IconTag,
  IconBell,
  IconActivity,
  IconSettings,
  IconSheet,
  IconLock,
  IconDatabase,
  IconUser,
  IconSun,
  IconMoon,
  IconMaximize,
  IconLogOut,
  IconMenu,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconCheckCircle,
  IconAlert
} from '../Icons';

export default function AdminLayout({
  activeTab,
  setActiveTab,
  onSwitchToKasir,
  storeConfig,
  appConfig,
  onToggleDarkMode,
  darkMode,
  unreadNotifCount = 0,
  isSheetConnected,
  currentUser,
  children
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const tabLabels = {
    dashboard: 'Dashboard Utama',
    users: 'Manajemen Pengguna',
    roles: 'Role & Hak Akses',
    products: 'Manajemen Data Produk',
    categories: 'Manajemen Kategori',
    reports: 'Manajemen Laporan & Statistik',
    notifications: 'Notifikasi Sistem',
    activityLogs: 'Riwayat Aktivitas (Audit Log)',
    settings: 'Pengaturan Aplikasi',
    googleSheets: 'Integrasi Google Sheets',
    security: 'Keamanan Sistem',
    backup: 'Backup & Restore Data',
    profile: 'Profil Administrator'
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const menuSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard Utama', icon: IconBarChart }
      ]
    },
    {
      title: 'DATA & MASTER',
      items: [
        { id: 'users', label: 'Manajemen Pengguna', icon: IconUsers },
        { id: 'roles', label: 'Role & Hak Akses', icon: IconShield },
        { id: 'products', label: 'Manajemen Data Produk', icon: IconPackage },
        { id: 'categories', label: 'Manajemen Kategori', icon: IconTag }
      ]
    },
    {
      title: 'LAPORAN & LOG',
      items: [
        { id: 'reports', label: 'Laporan & Statistik', icon: IconBarChart },
        { id: 'notifications', label: 'Notifikasi', icon: IconBell, badge: unreadNotifCount },
        { id: 'activityLogs', label: 'Riwayat Aktivitas', icon: IconActivity }
      ]
    },
    {
      title: 'SISTEM & KEAMANAN',
      items: [
        { id: 'settings', label: 'Pengaturan Aplikasi', icon: IconSettings },
        { id: 'googleSheets', label: 'Integrasi Google Sheets', icon: IconSheet, statusDot: isSheetConnected },
        { id: 'security', label: 'Keamanan Sistem', icon: IconLock },
        { id: 'backup', label: 'Backup & Restore', icon: IconDatabase },
        { id: 'profile', label: 'Profil Admin', icon: IconUser }
      ]
    }
  ];

  const handleSelectMenu = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`admin-app-layout ${darkMode ? 'dark-theme' : ''}`}>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <div className="admin-brand-wrap">
            <div className="admin-brand-icon">
              <IconStore size={22} />
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-brand-text">
                <span className="brand-name">{appConfig?.appName || storeConfig?.name || 'Kasir Pintar'}</span>
                <span className="brand-badge">ADMIN ERP</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="sidebar-collapse-btn hidden-on-mobile"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Perlebar Sidebar" : "Persempit Sidebar"}
          >
            {isSidebarCollapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
          </button>
          <button 
            type="button" 
            className="sidebar-close-btn visible-on-mobile"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Quick Switch to Kasir POS */}
        <div className="sidebar-quick-kasir">
          <button 
            type="button" 
            className="btn-switch-kasir"
            onClick={onSwitchToKasir}
            title="Beralih ke Layar Kasir POS (Pemesanan)"
          >
            <IconCart size={18} />
            {!isSidebarCollapsed && <span>Buka Layar Kasir</span>}
          </button>
        </div>

        {/* Navigation Menus */}
        <nav className="admin-sidebar-nav custom-scrollbar">
          {menuSections.map((sec, idx) => (
            <div key={idx} className="nav-section-group">
              {!isSidebarCollapsed && <div className="nav-section-title">{sec.title}</div>}
              {sec.items.map(item => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectMenu(item.id)}
                    title={item.label}
                  >
                    <span className="nav-item-icon">
                      <IconComponent size={19} />
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="nav-item-label">{item.label}</span>
                    )}
                    {item.badge > 0 && !isSidebarCollapsed && (
                      <span className="nav-item-badge">{item.badge}</span>
                    )}
                    {item.statusDot !== undefined && !isSidebarCollapsed && (
                      <span 
                        className={`nav-status-dot ${item.statusDot ? 'connected' : 'disconnected'}`} 
                        title={item.statusDot ? 'Google Sheets Terkoneksi' : 'Google Sheets Terputus'}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="sidebar-bottom-user">
          <div className="user-avatar-pill">
            <img 
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} 
              alt="Admin"
              className="user-avatar-img"
            />
            {!isSidebarCollapsed && (
              <div className="user-details-text">
                <span className="user-name-text">{currentUser?.name || 'Budi Santoso'}</span>
                <span className="user-role-text">Administrator</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="admin-main-viewport">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              type="button" 
              className="topbar-hamburger-btn visible-on-mobile"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <IconMenu size={22} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="breadcrumb-root">Admin Panel</span>
              <span className="breadcrumb-separator">/</span>
              <strong className="breadcrumb-active">
                {tabLabels[activeTab] || (activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* Indikator Live Google Sheets */}
            <div className={`sheets-status-pill ${isSheetConnected ? 'online' : 'offline'}`} title="Status Sinkronisasi Google Sheets">
              <span className="status-indicator-dot" />
              <span className="hidden-on-mobile">
                {isSheetConnected ? 'Google Sheet Otomatis (Realtime)' : 'Menghubungkan Sheet...'}
              </span>
            </div>

            {/* Tombol Cepat Buka Kasir POS */}
            <button 
              type="button" 
              className="btn-topbar-kasir"
              onClick={onSwitchToKasir}
              title="Beralih ke Layar Kasir"
            >
              <IconCart size={16} />
              <span>Layar Kasir</span>
            </button>

            {/* Fullscreen Button */}
            <button 
              type="button" 
              className="btn-topbar-icon hidden-on-mobile"
              onClick={toggleFullscreen}
              title="Layar Penuh (F11)"
            >
              <IconMaximize size={18} />
            </button>

            {/* Dark Mode Toggle */}
            <button 
              type="button" 
              className="btn-topbar-icon"
              onClick={onToggleDarkMode}
              title={darkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            >
              {darkMode ? <IconSun size={18} /> : <IconMoon size={18} />}
            </button>

            {/* Notification Bell */}
            <button 
              type="button" 
              className="btn-topbar-icon relative"
              onClick={() => setActiveTab('notifications')}
              title="Notifikasi Sistem"
            >
              <IconBell size={18} />
              {unreadNotifCount > 0 && (
                <span className="topbar-badge">{unreadNotifCount}</span>
              )}
            </button>

            {/* Admin Avatar Dropdown Toggle */}
            <div className="relative">
              <button 
                type="button" 
                className="topbar-avatar-btn"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'} 
                  alt="Admin"
                  className="topbar-avatar-img"
                />
              </button>

              {isProfileDropdownOpen && (
                <div className="topbar-dropdown-menu">
                  <div className="dropdown-user-header">
                    <strong>{currentUser?.name || 'Budi Santoso'}</strong>
                    <div className="text-xs text-muted">admin@kasirpos.id</div>
                  </div>
                  <div className="dropdown-divider" />
                  <button 
                    type="button" 
                    className="dropdown-item"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <IconUser size={16} /> Profil Admin
                  </button>
                  <button 
                    type="button" 
                    className="dropdown-item"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <IconSettings size={16} /> Pengaturan Aplikasi
                  </button>
                  <div className="dropdown-divider" />
                  <button 
                    type="button" 
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSwitchToKasir();
                    }}
                  >
                    <IconLogOut size={16} /> Keluar ke Kasir
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC MODULE BODY */}
        <main className="admin-content-scroll custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

