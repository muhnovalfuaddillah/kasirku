import React, { useState } from 'react';
import {
  IconShield,
  IconLock,
  IconKey,
  IconCheck,
  IconAlert,
  IconCheckCircle,
  IconClock,
  IconLogOut
} from '../Icons';

export default function SecurityView({
  adminPin,
  onSaveAdminPin,
  appConfig,
  onSaveAppConfig,
  onLogActivity,
  onShowToast,
  onLogoutAdmin
}) {
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');

  const [securityConfig, setSecurityConfig] = useState({
    sessionTimeoutMinutes: appConfig?.sessionTimeoutMinutes || 60,
    maxLoginAttempts: appConfig?.maxLoginAttempts || 5,
    enforceDeleteConfirmation: true,
    maskSensitiveTotals: false
  });

  // Mock Sesi Aktif
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'SES-01',
      device: 'Google Chrome / Windows 11 (Perangkat Ini)',
      ip: '127.0.0.1 (Localhost)',
      lastActive: 'Sedang Aktif',
      isCurrent: true
    },
    {
      id: 'SES-02',
      device: 'Mobile Safari / iPhone 13 (Kasir Tablet POS)',
      ip: '192.168.1.18',
      lastActive: '12 menit yang lalu',
      isCurrent: false
    }
  ]);

  const handleChangePin = (e) => {
    e.preventDefault();
    setPinChangeError('');

    if (currentPinInput !== adminPin) {
      setPinChangeError('PIN Lama salah. Masukkan PIN yang sesuai.');
      return;
    }

    if (newPinInput.length < 4) {
      setPinChangeError('PIN Baru minimal harus 4 digit.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinChangeError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    onSaveAdminPin(newPinInput);
    onLogActivity?.('CHANGE_PIN', 'Keamanan Sistem', 'Memperbarui PIN otentikasi Admin');
    onShowToast?.('PIN Admin berhasil diperbarui!', 'success');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleSaveSecurityPolicy = (e) => {
    e.preventDefault();
    onSaveAppConfig?.({
      ...appConfig,
      ...securityConfig
    });
    onLogActivity?.('UPDATE_SECURITY_POLICY', 'Keamanan Sistem', 'Memperbarui kebijakan timeout sesi dan pembatasan login');
    onShowToast?.('Kebijakan keamanan sistem berhasil diperbarui!', 'success');
  };

  const handleRevokeAllSessions = () => {
    if (window.confirm('Yakin ingin memutuskan semua sesi aktif lainnya? Perangkat lain akan diarahkan logout.')) {
      setActiveSessions(activeSessions.filter(s => s.isCurrent));
      onLogActivity?.('REVOKE_SESSIONS', 'Keamanan Sistem', 'Memutuskan semua sesi login aktif perangkat lain');
      onShowToast?.('Seluruh sesi login perangkat lain telah diputus!', 'info');
    }
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconShield size={24} className="text-primary" />
            Keamanan Sistem & Otentikasi
          </h2>
          <p className="admin-page-subtitle">
            Ganti PIN otentikasi admin, batas percobaan login, durasi sesi, dan pemutusan akses perangkat
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Kolom 1: Ganti PIN Admin & Kebijakan Sesi */}
        <div className="settings-forms-column">
          {/* Card Ganti PIN */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconKey size={18} className="text-primary" />
                Ganti PIN / Sandi Admin
              </h3>
            </div>

            <form onSubmit={handleChangePin}>
              {pinChangeError && (
                <div className="alert-banner alert-danger mb-3">
                  <IconAlert size={16} />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <div className="form-group mb-3">
                <label>PIN Admin Saat Ini <span className="text-danger">*</span></label>
                <input
                  type="password"
                  required
                  maxLength="8"
                  value={currentPinInput}
                  onChange={e => setCurrentPinInput(e.target.value)}
                  className="admin-input font-mono"
                  placeholder="Masukkan PIN lama"
                />
              </div>

              <div className="form-grid-2 mb-3">
                <div className="form-group">
                  <label>PIN Baru <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    required
                    maxLength="8"
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value)}
                    className="admin-input font-mono"
                    placeholder="Min. 4 digit angka"
                  />
                </div>
                <div className="form-group">
                  <label>Ulangi PIN Baru <span className="text-danger">*</span></label>
                  <input
                    type="password"
                    required
                    maxLength="8"
                    value={confirmPinInput}
                    onChange={e => setConfirmPinInput(e.target.value)}
                    className="admin-input font-mono"
                    placeholder="Konfirmasi PIN"
                  />
                </div>
              </div>

              <button type="submit" className="admin-btn-primary">
                <IconCheck size={16} /> Simpan PIN Baru
              </button>
            </form>
          </div>

          {/* Card Kebijakan Keamanan */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconLock size={18} className="text-primary" />
                Kebijakan Sesi & Akses
              </h3>
            </div>

            <form onSubmit={handleSaveSecurityPolicy}>
              <div className="form-group mb-3">
                <label>Batas Waktu Sesi Tidak Aktif (Session Timeout)</label>
                <select
                  value={securityConfig.sessionTimeoutMinutes}
                  onChange={e => setSecurityConfig({ ...securityConfig, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="admin-select"
                >
                  <option value={15}>15 Menit</option>
                  <option value={30}>30 Menit</option>
                  <option value={60}>1 Jam (Standar)</option>
                  <option value={120}>2 Jam</option>
                  <option value={1440}>24 Jam</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label>Batas Percobaan Login Gagal Sebelum Terkunci</label>
                <select
                  value={securityConfig.maxLoginAttempts}
                  onChange={e => setSecurityConfig({ ...securityConfig, maxLoginAttempts: Number(e.target.value) })}
                  className="admin-select"
                >
                  <option value={3}>3 Kali Percobaan</option>
                  <option value={5}>5 Kali Percobaan (Rekomendasi)</option>
                  <option value={10}>10 Kali Percobaan</option>
                </select>
              </div>

              <div className="preference-row mb-3">
                <div>
                  <strong className="text-main">Wajibkan Konfirmasi Hapus Data</strong>
                  <div className="text-xs text-muted">Tampilkan kotak dialog konfirmasi sebelum menghapus barang atau transaksi</div>
                </div>
                <input
                  type="checkbox"
                  checked={securityConfig.enforceDeleteConfirmation}
                  onChange={e => setSecurityConfig({ ...securityConfig, enforceDeleteConfirmation: e.target.checked })}
                  className="matrix-checkbox"
                />
              </div>

              <button type="submit" className="admin-btn-primary">
                Simpan Kebijakan Keamanan
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 2: Sesi Login Aktif */}
        <div className="settings-guide-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconClock size={18} className="text-primary" />
                Sesi Perangkat yang Aktif
              </h3>
              <button
                type="button"
                className="btn-pill-xs text-danger"
                onClick={handleRevokeAllSessions}
              >
                Logout Perangkat Lain
              </button>
            </div>

            <p className="text-muted text-sm mb-3">
              Daftar peramban dan perangkat yang saat ini memiliki token sesi ke aplikasi:
            </p>

            <div className="session-card-list">
              {activeSessions.map(sess => (
                <div key={sess.id} className="session-item-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-sm text-main">{sess.device}</strong>
                      <div className="text-xs text-muted">IP: {sess.ip}</div>
                    </div>
                    {sess.isCurrent ? (
                      <span className="badge-status success">Perangkat Ini</span>
                    ) : (
                      <span className="badge-status info">Aktif</span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-2">
                    Terakhir aktif: {sess.lastActive}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                type="button"
                className="admin-btn-danger w-full justify-center"
                onClick={onLogoutAdmin}
              >
                <IconLogOut size={16} /> Keluar dari Panel Admin Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

