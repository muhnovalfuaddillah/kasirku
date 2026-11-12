import React, { useState, useRef } from 'react';
import { 
  IconStore, 
  IconX, 
  IconCheck, 
  IconTrash, 
  IconUpload, 
  IconCheckCircle 
} from './Icons';
import { processLogoImage } from '../utils/formatters';

const PRESET_ICONS = [
  { label: 'Sembako', emoji: '🛒' },
  { label: 'Minimarket', emoji: '🏪' },
  { label: 'Beras/Pangan', emoji: '🍚' },
  { label: 'Kelontong', emoji: '📦' },
  { label: 'Warung/Kedai', emoji: '☕' },
  { label: 'Daging/Sayur', emoji: '🥩' },
  { label: 'Roti/Kue', emoji: '🍞' }
];

export default function StoreSettingsModal({
  storeConfig,
  onSaveStoreConfig,
  onClose,
  onShowToast,
  onLogActivity
}) {
  const [formData, setFormData] = useState({
    name: storeConfig.name || 'Kasir Toko Saya',
    logo: storeConfig.logo || '',
    slogan: storeConfig.slogan || '',
    address: storeConfig.address || '',
    phone: storeConfig.phone || '',
    receiptFooter: storeConfig.receiptFooter || 'Terima kasih atas kunjungan Anda!',
    cashierName: storeConfig.cashierName || 'Kasir 1',
    taxRate: storeConfig.taxRate || 10,
    enableTax: !!storeConfig.enableTax
  });

  const [isUploading, setIsUploading] = useState(false);
  const [logoMode, setLogoMode] = useState(formData.logo ? (formData.logo.startsWith('data:') ? 'upload' : 'url') : 'upload');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await processLogoImage(file);
      setFormData(prev => ({ ...prev, logo: dataUrl }));
      onShowToast?.('Logo toko berhasil diproses!', 'success');
    } catch (err) {
      alert(err.message || 'Gagal memproses gambar logo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama toko wajib diisi.');
      return;
    }

    const updated = {
      ...storeConfig,
      ...formData,
      name: formData.name.trim(),
      slogan: formData.slogan.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      receiptFooter: formData.receiptFooter.trim(),
      cashierName: formData.cashierName.trim() || 'Kasir 1'
    };

    onSaveStoreConfig(updated);
    onLogActivity?.('UPDATE_STORE_SETTINGS', 'Identitas Toko', `Memperbarui nama toko menjadi: "${updated.name}"`);
    onShowToast?.(`Identitas toko "${updated.name}" berhasil disimpan!`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="store-settings-modal-card">
        {/* Header Modal */}
        <div className="store-settings-header">
          <div className="store-settings-title-group">
            <div className="store-settings-icon-halo">
              <IconStore size={22} />
            </div>
            <div>
              <h2 className="store-settings-title">Pengaturan Nama & Logo Toko</h2>
              <p className="store-settings-subtitle">
                Atur nama toko, logo, alamat, dan nomor HP yang tampil di kasir dan struk belanjaan
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Tutup">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="store-settings-form">
          <div className="store-settings-scroll-body">
            {/* Live Preview Card */}
            <div className="store-live-preview-box">
              <div className="preview-label-tag">👁️ Pratinjau Tampilan Header & Struk:</div>
              <div className="preview-store-identity">
                <div className="preview-logo-box">
                  {formData.logo ? (
                    <img 
                      src={formData.logo} 
                      alt="Logo Toko" 
                      className="preview-logo-img"
                      onError={() => setFormData(prev => ({ ...prev, logo: '' }))}
                    />
                  ) : (
                    <div className="preview-logo-placeholder">
                      <IconStore size={28} />
                    </div>
                  )}
                </div>
                <div className="preview-text-content">
                  <h3 className="preview-store-name">{formData.name || 'Nama Toko Anda'}</h3>
                  {formData.slogan && <div className="preview-store-slogan">{formData.slogan}</div>}
                  <div className="preview-store-meta">
                    {formData.address ? <span>📍 {formData.address}</span> : <span>📍 Alamat Toko Belum Diisi</span>}
                    {formData.phone && <span> • 📞 {formData.phone}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 1: Logo Toko */}
            <div className="settings-field-section">
              <div className="field-section-title">
                <span>1. Logo Toko</span>
                {formData.logo && (
                  <button 
                    type="button" 
                    onClick={handleRemoveLogo} 
                    className="btn-remove-logo"
                  >
                    <IconTrash size={13} /> Hapus Logo
                  </button>
                )}
              </div>

              <div className="logo-upload-options">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }}
                />

                <div className="logo-buttons-row">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-upload-logo-file"
                    disabled={isUploading}
                  >
                    <IconUpload size={16} />
                    <span>{isUploading ? 'Memproses Gambar...' : 'Upload File Logo (Dari HP / Komputer)'}</span>
                  </button>

                  <button 
                    type="button" 
                    className={`btn-mode-toggle ${logoMode === 'url' ? 'active' : ''}`}
                    onClick={() => setLogoMode(logoMode === 'url' ? 'upload' : 'url')}
                  >
                    {logoMode === 'url' ? 'Sembunyikan URL' : 'Gunakan Link URL Gambar'}
                  </button>
                </div>

                {logoMode === 'url' && (
                  <div className="url-input-group mt-2">
                    <input 
                      type="url" 
                      placeholder="https://contoh-domain.com/logo-toko.png" 
                      value={formData.logo}
                      onChange={e => setFormData({ ...formData, logo: e.target.value })}
                      className="admin-input"
                    />
                    <span className="text-xs text-muted">Tempelkan link gambar logo online jika tidak ingin upload file.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bagian 2: Nama & Slogan Toko */}
            <div className="settings-field-section">
              <div className="field-section-title">2. Identitas Utama Toko</div>

              <div className="form-group mb-3">
                <label className="form-label">
                  Nama Toko / Usaha <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Toko Sembako Berkah, Kedai Kopi Kita, Minimarket 99"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Slogan / Tagline Toko (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Murah, Lengkap, dan Terpercaya"
                  value={formData.slogan}
                  onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            {/* Bagian 3: Alamat, Kontak & Catatan Struk */}
            <div className="settings-field-section">
              <div className="field-section-title">3. Informasi Kontak & Struk Belanja</div>

              <div className="form-group mb-3">
                <label className="form-label">Alamat Toko (Tercetak di Struk)</label>
                <textarea 
                  rows="2"
                  placeholder="Contoh: Jl. Diponegoro No. 12, Pasar Anyar"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="admin-textarea"
                />
              </div>

              <div className="form-grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Nomor Telp / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 0812-3456-7890"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Kasir Aktif</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Kasir 1 / Nama Anda"
                    value={formData.cashierName}
                    onChange={e => setFormData({ ...formData, cashierName: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="form-group mb-2">
                <label className="form-label">Catatan Kaki Struk (Receipt Footer)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Terima kasih atas kunjungan Anda! Semoga berkah."
                  value={formData.receiptFooter}
                  onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Footer Modal Action Buttons */}
          <div className="store-settings-modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="admin-btn-secondary"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="admin-btn-primary"
            >
              <IconCheck size={18} />
              <span>Simpan & Terapkan Toko</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

