import React, { useState } from 'react';
import { 
  IconUser, 
  IconEdit, 
  IconCheck, 
  IconKey, 
  IconShield, 
  IconLogOut, 
  IconCheckCircle, 
  IconClock 
} from '../Icons';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'
];

export default function AdminProfileView({
  currentUser,
  onUpdateProfile,
  adminPin,
  onSaveAdminPin,
  onLogout,
  onLogActivity,
  onShowToast
}) {
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || 'Budi Santoso (Super Admin)',
    email: currentUser?.email || 'admin@kasirpos.id',
    phone: currentUser?.phone || '0812-9876-5432',
    avatar: currentUser?.avatar || AVATAR_PRESETS[0]
  });

  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile?.({
      ...currentUser,
      ...profileForm
    });
    onLogActivity?.('UPDATE_PROFILE', 'Profil Admin', `Memperbarui data profil: ${profileForm.name}`);
    onShowToast?.('Profil admin berhasil diperbarui!', 'success');
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (pinForm.currentPin !== adminPin) {
      onShowToast?.('PIN lama salah.', 'error');
      return;
    }
    if (pinForm.newPin.length < 4) {
      onShowToast?.('PIN baru minimal 4 digit.', 'error');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      onShowToast?.('Konfirmasi PIN baru tidak sesuai.', 'error');
      return;
    }

    onSaveAdminPin?.(pinForm.newPin);
    onLogActivity?.('CHANGE_PIN', 'Profil Admin', 'Mengubah PIN admin dari halaman profil');
    onShowToast?.('PIN admin berhasil diganti!', 'success');
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconUser size={24} className="text-primary" />
            Profil Pengguna & Akun Admin
          </h2>
          <p className="admin-page-subtitle">
            Kelola identitas akun Anda, foto avatar, email korespondensi, dan PIN sandi masuk
          </p>
        </div>
        <button 
          type="button" 
          className="admin-btn-danger"
          onClick={onLogout}
        >
          <IconLogOut size={18} />
          Keluar ke Layar Kasir
        </button>
      </div>

      <div className="settings-grid">
        {/* Kolom 1: Informasi Profil & Form Edit */}
        <div className="settings-forms-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">Informasi Akun</h3>
              <span className="badge-status success">Akun Aktif</span>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="profile-banner-top mb-4">
                <img 
                  src={profileForm.avatar} 
                  alt={profileForm.name}
                  className="profile-avatar-large"
                />
                <div>
                  <h3 className="font-bold text-lg text-main">{profileForm.name}</h3>
                  <div className="text-sm text-primary font-medium flex items-center gap-1">
                    <IconShield size={14} /> Super Administrator
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Bergabung sejak 10 Januari 2026
                  </div>
                </div>
              </div>

              {/* Pilihan Foto Avatar */}
              <div className="form-group mb-4">
                <label className="block mb-2 font-medium">Pilih Foto Avatar</label>
                <div className="avatar-preset-grid">
                  {AVATAR_PRESETS.map((imgUrl, i) => (
                    <img 
                      key={i} 
                      src={imgUrl} 
                      alt="Preset" 
                      className={`avatar-preset-thumb ${profileForm.avatar === imgUrl ? 'active' : ''}`}
                      onClick={() => setProfileForm({ ...profileForm, avatar: imgUrl })}
                    />
                  ))}
                </div>
                <input 
                  type="url"
                  placeholder="Atau masukkan URL foto kustom..."
                  value={profileForm.avatar}
                  onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className="admin-input mt-2"
                />
              </div>

              <div className="form-group mb-3">
                <label>Nama Lengkap <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div className="form-grid-2 mb-4">
                <div className="form-group">
                  <label>Email Pengguna <span className="text-danger">*</span></label>
                  <input 
                    type="email" 
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Nomor WhatsApp / HP</label>
                  <input 
                    type="text" 
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <button type="submit" className="admin-btn-primary">
                <IconCheck size={16} /> Simpan Pembaruan Profil
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 2: Ganti PIN Masuk */}
        <div className="settings-guide-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconKey size={18} className="text-primary" />
                Ganti PIN Masuk Admin
              </h3>
            </div>

            <form onSubmit={handleSavePin}>
              <div className="form-group mb-3">
                <label>PIN Lama <span className="text-danger">*</span></label>
                <input 
                  type="password"
                  required
                  maxLength="8"
                  value={pinForm.currentPin}
                  onChange={e => setPinForm({ ...pinForm, currentPin: e.target.value })}
                  className="admin-input font-mono"
                  placeholder="PIN saat ini"
                />
              </div>

              <div className="form-group mb-3">
                <label>PIN Baru <span className="text-danger">*</span></label>
                <input 
                  type="password"
                  required
                  maxLength="8"
                  value={pinForm.newPin}
                  onChange={e => setPinForm({ ...pinForm, newPin: e.target.value })}
                  className="admin-input font-mono"
                  placeholder="Min. 4 digit"
                />
              </div>

              <div className="form-group mb-4">
                <label>Konfirmasi PIN Baru <span className="text-danger">*</span></label>
                <input 
                  type="password"
                  required
                  maxLength="8"
                  value={pinForm.confirmPin}
                  onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  className="admin-input font-mono"
                  placeholder="Ulangi PIN baru"
                />
              </div>

              <button type="submit" className="admin-btn-primary w-full justify-center">
                Perbarui PIN Masuk
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

