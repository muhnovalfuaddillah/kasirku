import React, { useState } from 'react';
import { 
  IconSheet, 
  IconCheck, 
  IconCopy, 
  IconAlert, 
  IconCheckCircle, 
  IconRefresh, 
  IconSettings,
  IconStore
} from './Icons';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptCode';

export default function SettingsView({
  sheetUrl,
  onSaveSheetUrl,
  onTestConnection,
  testStatus,
  isTesting,
  storeConfig,
  onSaveStoreConfig,
  adminPin = '1234',
  onSaveAdminPin
}) {
  const [urlInput, setUrlInput] = useState(sheetUrl || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [configForm, setConfigForm] = useState({ ...storeConfig });
  const [pinForm, setPinForm] = useState(adminPin);
  const [activeGuideTab, setActiveGuideTab] = useState('steps'); // 'steps' | 'code' | 'structure'
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isWritingTest, setIsWritingTest] = useState(false);
  const [testWriteResult, setTestWriteResult] = useState('');

  const handleTestWrite = async () => {
    if (!urlInput.trim()) return;
    setIsWritingTest(true);
    setTestWriteResult('');
    try {
      const url = new URL(urlInput.trim());
      url.searchParams.set('action', 'testWrite');
      const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      const data = await res.json();
      setTestWriteResult(data.message || 'Berhasil menulis data!');
    } catch (err) {
      setTestWriteResult('Gagal: ' + err.message);
    } finally {
      setIsWritingTest(false);
    }
  };

  const handleSaveUrl = (e) => {
    e.preventDefault();
    onSaveSheetUrl(urlInput.trim());
    setSaveSuccessMsg('URL Google Sheets berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSaveStore = (e) => {
    e.preventDefault();
    onSaveStoreConfig(configForm);
    setSaveSuccessMsg('Pengaturan toko berhasil diperbarui!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (!pinForm.trim()) {
      alert('PIN tidak boleh kosong!');
      return;
    }
    if (onSaveAdminPin) onSaveAdminPin(pinForm.trim());
    setSaveSuccessMsg('PIN Admin berhasil diperbarui!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="settings-container">
      {/* Top Banner Alert / Notification */}
      {saveSuccessMsg && (
        <div className="alert-banner alert-success">
          <IconCheckCircle size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid: Kiri Pengaturan, Kanan Panduan Setup Google Sheets */}
      <div className="settings-grid">
        {/* Kolom 1: Konfigurasi Google Sheets & Profil Toko */}
        <div className="settings-forms-column">
          {/* Card 1: Koneksi Google Sheets */}
          <div className="settings-card">
            <div className="settings-card-header">
              <IconSheet size={22} className="text-success" />
              <div>
                <h3>Integrasi Google Sheets</h3>
                <p>Hubungkan aplikasi kasir ke spreadsheet Google Sheets Anda via Google Apps Script.</p>
              </div>
            </div>

            <form onSubmit={handleSaveUrl} className="url-form">
              <div className="form-group">
                <label>URL Web App Google Apps Script</label>
                <input 
                  type="url" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="input-sheet-url"
                  required
                />
                <span className="form-help-text">
                  URL ini didapat setelah melakukan <strong>Deploy (Penerapan)</strong> di Google Apps Script dengan akses <strong>"Siapa saja" (Anyone)</strong>.
                </span>
              </div>

              <div className="url-actions-row">
                <button type="submit" className="btn-primary-action">
                  <IconCheck size={16} />
                  <span>Simpan URL</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => onTestConnection(urlInput)}
                  disabled={isTesting || !urlInput.trim()}
                  className="btn-test-connection"
                >
                  <IconRefresh size={16} className={isTesting ? 'spin-icon' : ''} />
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                {urlInput.trim() && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setUrlInput('');
                      onSaveSheetUrl('');
                      setSaveSuccessMsg('URL dihapus. Kasir kembali menggunakan Mode Demo / Lokal.');
                    }}
                    className="btn-secondary"
                    title="Gunakan penyimpanan lokal tanpa Google Sheets"
                  >
                    Reset ke Mode Lokal
                  </button>
                )}
              </div>

              {urlInput.trim() && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={handleTestWrite}
                      disabled={isWritingTest}
                      style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {isWritingTest ? 'Menulis ke Google Sheets...' : '⚡ Kirim 1 Baris Uji Coba ke Tab Transaksi'}
                    </button>
                    <a 
                      href={urlInput.trim().includes('?') ? `${urlInput.trim()}&action=testWrite` : `${urlInput.trim()}?action=testWrite`}
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#0284c7', fontSize: '12px', fontWeight: '600', textDecoration: 'underline' }}
                    >
                      (atau Buka Link Tes Tulis di Tab Baru ↗)
                    </a>
                  </div>
                  {testWriteResult && (
                    <div style={{ 
                      fontSize: '12px', 
                      padding: '8px 12px', 
                      background: testWriteResult.startsWith('BERHASIL') ? '#ecfdf5' : '#fee2e2', 
                      color: testWriteResult.startsWith('BERHASIL') ? '#065f46' : '#991b1b',
                      borderRadius: '6px',
                      border: testWriteResult.startsWith('BERHASIL') ? '1px solid #a7f3d0' : '1px solid #fecaca'
                    }}>
                      {testWriteResult}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Status Hasil Pengujian */}
            {testStatus && (
              <div className={`connection-status-box ${testStatus.success ? 'status-ok' : 'status-fail'}`}>
                {testStatus.success ? (
                  <IconCheckCircle size={20} className="icon-success" />
                ) : (
                  <IconAlert size={20} className="icon-fail" />
                )}
                <div className="status-message">
                  <strong>{testStatus.success ? 'Berhasil Terhubung!' : 'Koneksi Gagal'}</strong>
                  <p>{testStatus.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Pengaturan Toko & Kasir */}
          <div className="settings-card">
            <div className="settings-card-header">
              <IconStore size={22} className="text-primary" />
              <div>
                <h3>Informasi Toko & Struk</h3>
                <p>Sesuaikan nama toko, alamat, dan nomor telepon yang akan dicetak pada struk belanja.</p>
              </div>
            </div>

            <form onSubmit={handleSaveStore} className="store-form">
              <div className="form-group">
                <label>Nama Toko / Usaha</label>
                <input 
                  type="text" 
                  value={configForm.name} 
                  onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                  placeholder="Contoh: Kopi Nusantara POS"
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Nomor Telepon / WhatsApp</label>
                  <input 
                    type="text" 
                    value={configForm.phone} 
                    onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>

                <div className="form-group">
                  <label>Nama Kasir Default</label>
                  <input 
                    type="text" 
                    value={configForm.cashierName} 
                    onChange={(e) => setConfigForm({ ...configForm, cashierName: e.target.value })}
                    placeholder="Kasir 1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Lengkap</label>
                <input 
                  type="text" 
                  value={configForm.address} 
                  onChange={(e) => setConfigForm({ ...configForm, address: e.target.value })}
                  placeholder="Jl. Merdeka No. 10, Jakarta"
                />
              </div>

              <div className="form-group">
                <label>Pesan Footer Struk</label>
                <input 
                  type="text" 
                  value={configForm.receiptFooter} 
                  onChange={(e) => setConfigForm({ ...configForm, receiptFooter: e.target.value })}
                  placeholder="Terima kasih atas kunjungan Anda!"
                />
              </div>

              <button type="submit" className="btn-primary-action">
                <IconCheck size={16} />
                <span>Simpan Profil Toko</span>
              </button>
            </form>
          </div>

          {/* Card 3: Keamanan & PIN Admin */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span style={{ fontSize: '22px' }}>🔒</span>
              <div>
                <h3>Keamanan & PIN Admin</h3>
                <p>Ubah PIN yang digunakan untuk masuk ke panel pengaturan dan laporan omset.</p>
              </div>
            </div>

            <form onSubmit={handleSavePin} className="store-form">
              <div className="form-group">
                <label>PIN Admin Baru (Maksimal 6 Angka)</label>
                <input 
                  type="password" 
                  value={pinForm} 
                  onChange={(e) => setPinForm(e.target.value)}
                  placeholder="Masukkan PIN baru"
                  maxLength={6}
                  required
                />
                <span className="form-help-text">
                  PIN ini akan diminta saat kasir ingin membuka menu <strong>Admin</strong>.
                </span>
              </div>

              <button type="submit" className="btn-primary-action">
                <IconCheck size={16} />
                <span>Simpan PIN Baru</span>
              </button>
            </form>
          </div>
        </div>

        {/* Kolom 2: Panduan Lengkap Setup Google Sheets */}
        <div className="settings-guide-column">
          <div className="guide-card">
            <div className="guide-header">
              <h3>Panduan Menghubungkan Google Sheets</h3>
              <div className="guide-tabs">
                <button 
                  type="button" 
                  className={`guide-tab-btn ${activeGuideTab === 'steps' ? 'active' : ''}`}
                  onClick={() => setActiveGuideTab('steps')}
                >
                  Langkah-Langkah
                </button>
                <button 
                  type="button" 
                  className={`guide-tab-btn ${activeGuideTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveGuideTab('code')}
                >
                  Salin Kode Script
                </button>
                <button 
                  type="button" 
                  className={`guide-tab-btn ${activeGuideTab === 'structure' ? 'active' : ''}`}
                  onClick={() => setActiveGuideTab('structure')}
                >
                  Struktur Kolom
                </button>
              </div>
            </div>

            {/* Konten Tab 1: Langkah-langkah */}
            {activeGuideTab === 'steps' && (
              <div className="guide-content steps-list">
                <div className="guide-step">
                  <div className="step-number">1</div>
                  <div className="step-body">
                    <strong>Buat Google Sheets Baru</strong>
                    <p>Buka <a href="https://sheets.new" target="_blank" rel="noreferrer">sheets.new</a> di browser Anda dan beri nama dokumen, misalnya <code>Database Kasir POS</code>.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">2</div>
                  <div className="step-body">
                    <strong>Buka Google Apps Script</strong>
                    <p>Di menu atas Google Sheets, klik <strong>Ekstensi (Extensions)</strong> &rarr; <strong>Apps Script</strong>.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-body">
                    <strong>Tempelkan Kode Script</strong>
                    <p>Hapus kode yang ada di editor Apps Script, lalu klik tombol tab <strong>"Salin Kode Script"</strong> di samping dan tempelkan seluruh kodenya. Jangan lupa klik tombol <strong>Simpan (Save / icon disket)</strong>.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">4</div>
                  <div className="step-body">
                    <strong>Deploy sebagai Aplikasi Web (Web App)</strong>
                    <p>Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &rarr; <strong>Penerapan Baru (New deployment)</strong>.</p>
                    <ul className="step-sublist">
                      <li>Pilih jenis penerapan: <strong>Aplikasi Web (Web App)</strong></li>
                      <li>Jalankan sebagai: <strong>Saya (Me)</strong></li>
                      <li>Akses: <strong className="text-danger">Siapa saja (Anyone)</strong> <em>(Wajib agar React bisa mengirim data!)</em></li>
                    </ul>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">5</div>
                  <div className="step-body">
                    <strong>Salin URL & Tempel di Form</strong>
                    <p>Setelah mengklik <strong>Terapkan</strong> dan mengizinkan akses otorisasi, salin <strong>URL Aplikasi Web (Web App URL)</strong> yang berakhiran <code>/exec</code>, lalu tempelkan ke kolom URL di sebelah kiri.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Konten Tab 2: Salin Kode Apps Script */}
            {activeGuideTab === 'code' && (
              <div className="guide-content code-tab-view">
                <div className="code-header-action">
                  <p>Kode ini menangani pembacaan produk, pembuatan invoice transaksi, serta pemotongan stok otomatis di Google Sheets.</p>
                  <button 
                    type="button" 
                    onClick={handleCopyCode} 
                    className={`btn-copy-code ${copiedCode ? 'copied' : ''}`}
                  >
                    {copiedCode ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
                  </button>
                </div>

                <div className="code-block-wrapper">
                  <pre className="code-pre">
                    <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Konten Tab 3: Struktur Kolom Sheet */}
            {activeGuideTab === 'structure' && (
              <div className="guide-content structure-tab-view">
                <p className="structure-note">
                  <em>*Catatan: Script di atas akan otomatis membuat sheet dan kolom ini jika belum ada. Anda juga bisa membuatnya manual:</em>
                </p>

                <div className="structure-card">
                  <h4>Sheet 1: <code>Produk</code></h4>
                  <table className="mini-structure-table">
                    <thead>
                      <tr>
                        <th>Kolom A</th>
                        <th>Kolom B</th>
                        <th>Kolom C</th>
                        <th>Kolom D</th>
                        <th>Kolom E</th>
                        <th>Kolom F</th>
                        <th>Kolom G</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ID</td>
                        <td>Nama Produk</td>
                        <td>Kategori</td>
                        <td>Harga</td>
                        <td>Stok</td>
                        <td>Barcode</td>
                        <td>Gambar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="structure-card">
                  <h4>Sheet 2: <code>Transaksi</code></h4>
                  <table className="mini-structure-table">
                    <thead>
                      <tr>
                        <th>Kolom A-D</th>
                        <th>Kolom E-H</th>
                        <th>Kolom I-M</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Invoice, Tanggal, Pelanggan, Detail Item</td>
                        <td>Subtotal, Diskon, Pajak, Total Akhir</td>
                        <td>Metode Bayar, Bayar, Kembalian, Kasir, Catatan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

