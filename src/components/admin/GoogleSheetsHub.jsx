import React, { useState } from 'react';
import { 
  IconSheet, 
  IconCheck, 
  IconCopy, 
  IconAlert, 
  IconCheckCircle, 
  IconRefresh, 
  IconDownload, 
  IconUpload, 
  IconClock, 
  IconSettings 
} from '../Icons';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../data/googleAppsScriptCode';

export default function GoogleSheetsHub({
  sheetUrl,
  onSaveSheetUrl,
  onTestConnection,
  testStatus,
  isTesting,
  onSyncProducts,
  onSyncTransactions,
  isSyncing,
  onLogActivity,
  onShowToast
}) {
  const [urlInput, setUrlInput] = useState(sheetUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [productSheetName, setProductSheetName] = useState('Produk');
  const [transactionSheetName, setTransactionSheetName] = useState('Transaksi');
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [isWritingTest, setIsWritingTest] = useState(false);
  const [testWriteResult, setTestWriteResult] = useState(null);
  const [activeGuideTab, setActiveGuideTab] = useState('steps'); // 'steps' | 'code' | 'structure'

  const [syncHistory, setSyncHistory] = useState([
    {
      id: 1,
      action: 'Sinkronisasi Otomatis',
      target: 'Sheet Transaksi',
      status: 'success',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      details: 'Koneksi aktif, respons 200 OK'
    }
  ]);

  const handleSave = (e) => {
    e.preventDefault();
    onSaveSheetUrl(urlInput.trim());
    onLogActivity?.('UPDATE_SHEET_URL', 'Google Sheets', `Memperbarui Web App URL: ${urlInput.trim()}`);
    onShowToast?.('URL Google Sheets Web App berhasil disimpan!', 'success');
  };

  const handleTestWrite = async () => {
    if (!urlInput.trim()) {
      onShowToast?.('Masukkan URL Web App terlebih dahulu!', 'warning');
      return;
    }
    setIsWritingTest(true);
    setTestWriteResult(null);
    try {
      const url = new URL(urlInput.trim());
      url.searchParams.set('action', 'testWrite');
      const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      const data = await res.json();
      
      if (data.success) {
        setTestWriteResult({ success: true, message: data.message || 'Berhasil menulis data ke Sheet!' });
        onLogActivity?.('TEST_WRITE_SHEET', 'Google Sheets', 'Uji tulis baris ke Google Sheets berhasil');
        setSyncHistory(prev => [{
          id: Date.now(),
          action: 'Uji Tulis (Test Write)',
          target: 'Google Sheets',
          status: 'success',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          details: data.message
        }, ...prev]);
      } else {
        setTestWriteResult({ success: false, message: data.message || 'Gagal menulis data.' });
      }
    } catch (err) {
      setTestWriteResult({ success: false, message: 'Gagal terhubung: ' + err.message });
    } finally {
      setIsWritingTest(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    onShowToast?.('Kode Google Apps Script disalin ke clipboard!', 'success');
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconSheet size={24} className="text-emerald-600" />
            Integrasi & Sinkronisasi Google Sheets
          </h2>
          <p className="admin-page-subtitle">
            Jadikan Google Sheets sebagai basis data cloud real-time Anda tanpa biaya server database
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Kolom Kiri: Konfigurasi Koneksi & Status */}
        <div className="settings-forms-column">
          {/* Card URL Web App */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">Koneksi Google Apps Script Web App</h3>
              <span className={`badge-status ${sheetUrl ? 'success' : 'danger'}`}>
                {sheetUrl ? 'Terkoneksi' : 'Belum Terhubung'}
              </span>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group mb-3">
                <label>URL Web App Google Apps Script</label>
                <input 
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  className="admin-input font-mono text-sm"
                />
                <span className="text-xs text-muted mt-1 block">
                  Pastikan deploy diset ke: <strong>Akses Siapa saja (Anyone)</strong>
                </span>
              </div>

              <div className="form-grid-2 mb-3">
                <div className="form-group">
                  <label>Nama Sheet Produk</label>
                  <input 
                    type="text" 
                    value={productSheetName}
                    onChange={e => setProductSheetName(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="form-group">
                  <label>Nama Sheet Transaksi</label>
                  <input 
                    type="text" 
                    value={transactionSheetName}
                    onChange={e => setTransactionSheetName(e.target.value)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button type="submit" className="admin-btn-primary">
                  <IconCheck size={16} /> Simpan URL
                </button>
                <button 
                  type="button" 
                  className="admin-btn-secondary"
                  onClick={() => onTestConnection(urlInput)}
                  disabled={isTesting || !urlInput}
                >
                  <IconRefresh size={16} className={isTesting ? "animate-spin" : ""} />
                  {isTesting ? 'Menguji...' : 'Uji Ping API'}
                </button>
                <button 
                  type="button" 
                  className="admin-btn-secondary"
                  onClick={handleTestWrite}
                  disabled={isWritingTest || !urlInput}
                >
                  <IconUpload size={16} className={isWritingTest ? "animate-spin" : ""} />
                  {isWritingTest ? 'Menulis...' : 'Tes Tulis Baris'}
                </button>
              </div>
            </form>

            {/* Status Tes Koneksi */}
            {testStatus && (
              <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${
                testStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testStatus.success ? <IconCheckCircle size={18} /> : <IconAlert size={18} />}
                <div>
                  <strong>{testStatus.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</strong>
                  <div className="text-xs mt-0.5">{testStatus.message}</div>
                </div>
              </div>
            )}

            {/* Status Tes Tulis */}
            {testWriteResult && (
              <div className={`mt-2 p-3 rounded-lg text-sm flex items-start gap-2 ${
                testWriteResult.success ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {testWriteResult.success ? <IconCheckCircle size={18} /> : <IconAlert size={18} />}
                <div>
                  <strong>{testWriteResult.success ? 'Tes Tulis Sukses!' : 'Tes Tulis Gagal'}</strong>
                  <div className="text-xs mt-0.5">{testWriteResult.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Card Sinkronisasi Manual 2 Arah */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">Sinkronisasi Data Manual</h3>
              <span className="text-xs text-muted">Tarik Data dari Cloud</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button 
                type="button" 
                className="admin-btn-primary flex-1"
                onClick={onSyncProducts}
                disabled={isSyncing || !sheetUrl}
              >
                <IconDownload size={16} className={isSyncing ? "animate-spin" : ""} />
                Tarik Produk dari Sheet
              </button>

              <button 
                type="button" 
                className="admin-btn-secondary flex-1"
                onClick={onSyncTransactions}
                disabled={isSyncing || !sheetUrl}
              >
                <IconDownload size={16} className={isSyncing ? "animate-spin" : ""} />
                Tarik Transaksi dari Sheet
              </button>
            </div>
          </div>

          {/* Card Riwayat Sinkronisasi */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">Monitoring Sinkronisasi</h3>
              <span className="text-xs text-muted">Aktivitas Terakhir</span>
            </div>

            <div className="sync-log-list">
              {syncHistory.map(item => (
                <div key={item.id} className="sync-log-item">
                  <div className="sync-log-left">
                    <span className="sync-status-dot success" />
                    <div>
                      <strong className="text-sm text-main">{item.action}</strong>
                      <div className="text-xs text-muted">{item.target} • {item.details}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted">{item.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Panduan Setup & Salin Kode */}
        <div className="settings-guide-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">Panduan Setup Google Apps Script</h3>
            </div>

            <div className="guide-tabs-header mb-3">
              <button 
                type="button"
                className={`guide-tab-btn ${activeGuideTab === 'steps' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('steps')}
              >
                Langkah Setup
              </button>
              <button 
                type="button"
                className={`guide-tab-btn ${activeGuideTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveGuideTab('code')}
              >
                Kode Apps Script
              </button>
            </div>

            {activeGuideTab === 'steps' && (
              <div className="guide-content-steps">
                <ol className="steps-ordered-list">
                  <li>
                    <strong>Buat Spreadsheet Baru:</strong>
                    <p>Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-primary underline">sheets.new</a> di browser.</p>
                  </li>
                  <li>
                    <strong>Buka Apps Script:</strong>
                    <p>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</p>
                  </li>
                  <li>
                    <strong>Salin & Tempel Kode:</strong>
                    <p>Hapus seluruh kode default di <code>Code.gs</code>, lalu tempel kode yang tersedia di tab <strong>"Kode Apps Script"</strong>.</p>
                  </li>
                  <li>
                    <strong>Deploy sebagai Web App:</strong>
                    <p>Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong>.</p>
                    <ul className="sub-steps">
                      <li>Pilih jenis: <strong>Aplikasi Web (Web App)</strong></li>
                      <li>Jalankan sebagai: <strong>Saya (Me)</strong></li>
                      <li>Akses: <strong className="text-danger">Siapa saja (Anyone)</strong> (Wajib!)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Salin URL Web App:</strong>
                    <p>Salin URL berakhiran <code>/exec</code> dan tempelkan pada kolom URL di panel kiri.</p>
                  </li>
                </ol>
              </div>
            )}

            {activeGuideTab === 'code' && (
              <div className="guide-code-viewer">
                <div className="code-viewer-actions">
                  <span className="text-xs text-muted">Google Apps Script (Code.gs)</span>
                  <button 
                    type="button" 
                    className="btn-pill-xs text-primary"
                    onClick={handleCopyCode}
                  >
                    <IconCopy size={12} /> {copiedCode ? 'Tersalin!' : 'Salin Semua Kode'}
                  </button>
                </div>
                <pre className="code-pre-box">
                  <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

