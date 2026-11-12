import React, { useState, useRef } from 'react';
import { 
  IconSettings, 
  IconCheck, 
  IconMoon, 
  IconSun, 
  IconGlobe, 
  IconClock, 
  IconStore,
  IconLayers,
  IconShield,
  IconUpload,
  IconTrash
} from '../Icons';
import { processLogoImage } from '../../utils/formatters';

const THEME_COLORS = [
  { id: '#0284c7', name: 'Sky Blue (Default)', hex: '#0284c7' },
  { id: '#10b981', name: 'Emerald Green', hex: '#10b981' },
  { id: '#6366f1', name: 'Indigo Purple', hex: '#6366f1' },
  { id: '#f59e0b', name: 'Amber Gold', hex: '#f59e0b' },
  { id: '#ef4444', name: 'Rose Red', hex: '#ef4444' },
  { id: '#8b5cf6', name: 'Violet Modern', hex: '#8b5cf6' }
];

export default function AppSettingsView({
  appConfig,
  onSaveAppConfig,
  storeConfig,
  onSaveStoreConfig,
  onLogActivity,
  onShowToast
}) {
  const [config, setConfig] = useState({
    ...appConfig,
    ...storeConfig,
    appName: storeConfig?.name || appConfig?.appName || 'Kasir Toko Saya',
    name: storeConfig?.name || appConfig?.appName || 'Kasir Toko Saya',
    logo: storeConfig?.logo || appConfig?.logo || '',
    slogan: storeConfig?.slogan || ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await processLogoImage(file);
      setConfig(prev => ({ ...prev, logo: dataUrl }));
      onShowToast?.('Logo toko berhasil diproses!', 'success');
    } catch (err) {
      alert(err.message || 'Gagal memproses gambar logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setConfig(prev => ({ ...prev, logo: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const storeName = (config.appName || config.name || '').trim() || 'Kasir Toko Saya';

    const updatedStore = {
      ...storeConfig,
      name: storeName,
      logo: config.logo || '',
      slogan: (config.slogan || '').trim(),
      address: (config.address || '').trim(),
      phone: (config.phone || '').trim(),
      receiptFooter: (config.footerMessage || config.receiptFooter || 'Terima kasih atas kunjungan Anda!').trim(),
      cashierName: config.cashierName || storeConfig?.cashierName || 'Kasir 1'
    };

    const updatedApp = {
      ...config,
      appName: storeName,
      name: storeName,
      logo: config.logo || ''
    };

    onSaveAppConfig?.(updatedApp);
    onSaveStoreConfig?.(updatedStore);

    onLogActivity?.('UPDATE_APP_SETTINGS', 'Pengaturan Aplikasi', `Memperbarui nama toko menjadi: "${storeName}"`);
    onShowToast?.(`Identitas toko "${storeName}" & logo berhasil disimpan!`, 'success');
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconSettings size={24} className="text-primary" />
            Pengaturan Aplikasi & Branding
          </h2>
          <p className="admin-page-subtitle">
            Kustomisasi nama toko, instansi, logo, tema visual, mode gelap/terang, bahasa, dan zona waktu
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-grid-layout">
          {/* Kolom 1: Profil Toko & Instansi */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconStore size={18} className="text-primary" />
                Identitas Toko / Instansi
              </h3>
            </div>

            {/* Logo Toko */}
            <div className="form-group mb-4">
              <label className="block mb-2 font-medium">Logo Toko (Tampil di Header & Struk Kasir)</label>
              <div className="admin-logo-upload-box">
                <div className="admin-logo-preview">
                  {config.logo ? (
                    <img src={config.logo} alt="Logo Toko" className="admin-preview-img" />
                  ) : (
                    <div className="admin-preview-empty">
                      <IconStore size={28} />
                    </div>
                  )}
                </div>
                <div className="admin-logo-actions">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="admin-btn-secondary"
                      disabled={isUploading}
                    >
                      <IconUpload size={14} /> {isUploading ? 'Memproses...' : 'Upload File Logo'}
                    </button>
                    {config.logo && (
                      <button 
                        type="button" 
                        onClick={handleRemoveLogo} 
                        className="btn-remove-logo"
                      >
                        <IconTrash size={14} /> Hapus
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Atau tempel Link URL Logo (https://...)" 
                    value={config.logo || ''}
                    onChange={e => setConfig({ ...config, logo: e.target.value })}
                    className="admin-input mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Nama Aplikasi / Toko <span className="text-danger">*</span></label>
              <input 
                type="text" 
                required
                value={config.appName || ''}
                onChange={e => setConfig({ ...config, appName: e.target.value, name: e.target.value })}
                className="admin-input"
                placeholder="Contoh: Kasir Berkah Sejahtera"
              />
            </div>

            <div className="form-group mb-3">
              <label>Slogan / Tagline Toko (Opsional)</label>
              <input 
                type="text" 
                value={config.slogan || ''}
                onChange={e => setConfig({ ...config, slogan: e.target.value })}
                className="admin-input"
                placeholder="Contoh: Murah, Lengkap, dan Terpercaya"
              />
            </div>

            <div className="form-group mb-3">
              <label>Nama Badan Usaha / PT / Instansi</label>
              <input 
                type="text" 
                value={config.instansiName || ''}
                onChange={e => setConfig({ ...config, instansiName: e.target.value })}
                className="admin-input"
                placeholder="Contoh: PT Berkah Retail Nusantara"
              />
            </div>

            <div className="form-group mb-3">
              <label>Alamat Lengkap</label>
              <textarea 
                rows="2"
                value={config.address || ''}
                onChange={e => setConfig({ ...config, address: e.target.value })}
                className="admin-textarea"
                placeholder="Alamat fisik toko yang tercetak pada struk"
              />
            </div>

            <div className="form-grid-2 mb-3">
              <div className="form-group">
                <label>Nomor Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  value={config.phone || ''}
                  onChange={e => setConfig({ ...config, phone: e.target.value })}
                  className="admin-input"
                  placeholder="0812-3456-7890"
                />
              </div>
              <div className="form-group">
                <label>Email Instansi</label>
                <input 
                  type="email" 
                  value={config.email || ''}
                  onChange={e => setConfig({ ...config, email: e.target.value })}
                  className="admin-input"
                  placeholder="kontak@toko.com"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Pesan Footer Struk Belanja</label>
              <input 
                type="text" 
                value={config.footerMessage || ''}
                onChange={e => setConfig({ ...config, footerMessage: e.target.value })}
                className="admin-input"
                placeholder="Terima kasih atas kunjungan Anda!"
              />
            </div>
          </div>

          {/* Kolom 2: Tampilan, Tema & Preferensi Sistem */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconLayers size={18} className="text-primary" />
                Tampilan & Preferensi Sistem
              </h3>
            </div>

            {/* Warna Tema */}
            <div className="form-group mb-4">
              <label className="block mb-2 font-medium">Warna Tema Utama</label>
              <div className="theme-color-picker">
                {THEME_COLORS.map(c => {
                  const isSelected = config.primaryColor === c.hex;
                  return (
                    <button 
                      key={c.id}
                      type="button"
                      className={`theme-color-bubble ${isSelected ? 'active' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setConfig({ ...config, primaryColor: c.hex })}
                      title={c.name}
                    >
                      {isSelected && <IconCheck size={16} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dark Mode */}
            <div className="preference-row mb-4">
              <div>
                <strong className="text-main">Mode Gelap (Dark Mode)</strong>
                <div className="text-xs text-muted">Ubah palet warna antarmuka ke mode gelap untuk kenyamanan mata</div>
              </div>
              <input 
                type="checkbox"
                checked={!!config.darkMode}
                onChange={e => setConfig({ ...config, darkMode: e.target.checked })}
                className="matrix-checkbox"
              />
            </div>

            {/* Sidebar Default */}
            <div className="preference-row mb-4">
              <div>
                <strong className="text-main">Sidebar Diciutkan Otomatis</strong>
                <div className="text-xs text-muted">Kecilkan lebar sidebar secara default untuk area kerja lebih luas</div>
              </div>
              <input 
                type="checkbox"
                checked={!!config.sidebarCollapsed}
                onChange={e => setConfig({ ...config, sidebarCollapsed: e.target.checked })}
                className="matrix-checkbox"
              />
            </div>

            {/* Bahasa */}
            <div className="form-group mb-3">
              <label>Bahasa Antarmuka</label>
              <select 
                value={config.language || 'id'}
                onChange={e => setConfig({ ...config, language: e.target.value })}
                className="admin-select"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English (US)</option>
              </select>
            </div>

            {/* Format Tanggal */}
            <div className="form-group mb-3">
              <label>Format Tanggal</label>
              <select 
                value={config.dateFormat || 'DD/MM/YYYY'}
                onChange={e => setConfig({ ...config, dateFormat: e.target.value })}
                className="admin-select"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (11/11/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-11)</option>
                <option value="DD MMMM YYYY">DD MMMM YYYY (11 November 2026)</option>
              </select>
            </div>

            {/* Zona Waktu */}
            <div className="form-group mb-3">
              <label>Zona Waktu Operasional</label>
              <select 
                value={config.timezone || 'Asia/Jakarta (WIB GMT+7)'}
                onChange={e => setConfig({ ...config, timezone: e.target.value })}
                className="admin-select"
              >
                <option value="Asia/Jakarta (WIB GMT+7)">Asia/Jakarta (WIB GMT+7)</option>
                <option value="Asia/Makassar (WITA GMT+8)">Asia/Makassar (WITA GMT+8)</option>
                <option value="Asia/Jayapura (WIT GMT+9)">Asia/Jayapura (WIT GMT+9)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-submit-bar mt-4">
          <button type="submit" className="admin-btn-primary">
            <IconCheck size={18} /> Simpan Seluruh Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}

