import React, { useState } from 'react';
import { 
  IconDatabase, 
  IconDownload, 
  IconUpload, 
  IconTrash, 
  IconCheck, 
  IconAlert, 
  IconCheckCircle, 
  IconClock, 
  IconLayers,
  IconRefresh
} from '../Icons';
import { formatDateTime } from '../../utils/formatters';

export default function BackupRestoreView({
  backupHistory,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  onClearAllData,
  onLogActivity,
  onShowToast
}) {
  const [backupNote, setBackupNote] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreateManualBackup = (type = 'full') => {
    setIsBackingUp(true);
    try {
      const note = backupNote.trim() || (type === 'full' ? 'Cadangan Penuh Seluruh Sistem' : `Cadangan Parsial (${type})`);
      const newEntry = onCreateBackup(note);
      onShowToast?.(`Snapshot cadangan ${newEntry.id} berhasil dibuat!`, 'success');
      setBackupNote('');
    } catch (e) {
      onShowToast?.('Gagal membuat backup: ' + e.message, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadFile = (backupEntry) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupEntry.data || backupEntry, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `KASIR_BACKUP_${backupEntry.id}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onLogActivity?.('DOWNLOAD_BACKUP', 'Backup & Restore', `Mengunduh file cadangan ${backupEntry.id}`);
    onShowToast?.(`File cadangan ${backupEntry.id} berhasil diunduh!`, 'success');
  };

  const handleRestoreFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('PERINGATAN: Memulihkan database akan menimpa data produk, transaksi, dan pengaturan yang ada saat ini. Lanjutkan pemulihan?')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const res = onRestoreBackup(parsed);
        if (res.success) {
          onShowToast?.(res.message, 'success');
          // Opsional reload jika diperlukan agar seluruh state sync
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          onShowToast?.(res.message, 'error');
        }
      } catch (err) {
        onShowToast?.('File JSON backup tidak valid: ' + err.message, 'error');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteHistory = (id) => {
    if (window.confirm('Hapus arsip cadangan ini dari riwayat?')) {
      onDeleteBackup?.(id);
      onShowToast?.('Cadangan berhasil dihapus dari riwayat.', 'info');
    }
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconDatabase size={24} className="text-primary" />
            Manajemen Backup & Restore Database
          </h2>
          <p className="admin-page-subtitle">
            Amankan data inventaris produk, histori penjualan, dan profil pengguna dengan snapshot berkala
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Kolom 1: Buat Backup & Upload Restore */}
        <div className="settings-forms-column">
          {/* Card Buat Cadangan Manual */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconDownload size={18} className="text-primary" />
                Buat Snapshot Cadangan Baru
              </h3>
            </div>

            <div className="form-group mb-3">
              <label>Catatan / Keterangan Cadangan</label>
              <input 
                type="text" 
                placeholder="Contoh: Backup sebelum tutup buku bulanan"
                value={backupNote}
                onChange={e => setBackupNote(e.target.value)}
                className="admin-input"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button 
                type="button" 
                className="admin-btn-primary flex-1"
                disabled={isBackingUp}
                onClick={() => handleCreateManualBackup('full')}
              >
                <IconDownload size={16} />
                {isBackingUp ? 'Memproses...' : 'Backup Seluruh Data'}
              </button>
            </div>
            <span className="text-xs text-muted mt-2 block">
              Mencakup: Master Produk, Riwayat Transaksi, Kategori, Pengguna, Log, dan Konfigurasi Toko.
            </span>
          </div>

          {/* Card Pulihkan Data (Restore) */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconUpload size={18} className="text-amber-600" />
                Pemulihan Data (Restore Database)
              </h3>
            </div>

            <p className="text-sm text-muted mb-3">
              Unggah file cadangan <code>.json</code> yang telah diunduh sebelumnya untuk memulihkan seluruh data aplikasi.
            </p>

            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-center">
              <IconUpload size={32} className="text-muted mx-auto mb-2" />
              <label className="admin-btn-secondary inline-flex cursor-pointer">
                <span>Pilih File Backup (.json)</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestoreFromFile}
                  disabled={isRestoring}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="text-xs text-muted mt-2">
                {isRestoring ? 'Sedang memulihkan data...' : 'Pastikan file bersumber dari aplikasi Kasir POS ini'}
              </div>
            </div>
          </div>

          {/* Card Bersihkan / Kosongkan Seluruh Data */}
          <div className="admin-card border-danger-subtle" style={{ borderColor: 'rgba(239, 68, 68, 0.35)', borderStyle: 'solid' }}>
            <div className="admin-card-header">
              <h3 className="section-title text-danger">
                <IconTrash size={18} className="text-danger" />
                Kosongkan Seluruh Data (Mulai dari Nol)
              </h3>
            </div>

            <p className="text-sm text-muted mb-3">
              Gunakan opsi ini untuk menghapus seluruh data produk, riwayat transaksi, dan kategori lokal di aplikasi, sehingga Anda bisa menambahkan dan mengelola data Anda sendiri secara mandiri tanpa sisa data demo.
            </p>

            <button 
              type="button" 
              className="admin-btn-secondary text-danger"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => {
                if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan semua data lokal di aplikasi (produk, transaksi, riwayat) agar mulai dari nol?')) {
                  onClearAllData?.();
                }
              }}
            >
              <IconTrash size={16} /> Kosongkan Semua Data Sekarang
            </button>
          </div>
        </div>

        {/* Kolom 2: Riwayat File Cadangan */}
        <div className="settings-guide-column">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="section-title">
                <IconClock size={18} className="text-primary" />
                Daftar Riwayat Cadangan
              </h3>
              <span className="text-xs text-muted">{backupHistory.length} Arsip</span>
            </div>

            <div className="backup-history-list">
              {backupHistory.length === 0 ? (
                <div className="empty-state-sm">
                  <p>Belum ada riwayat cadangan. Klik tombol "Backup Seluruh Data" di sebelah kiri untuk membuat cadangan pertama Anda.</p>
                </div>
              ) : (
                backupHistory.map(item => (
                  <div key={item.id} className="backup-item-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <strong className="text-sm text-main">{item.notes || 'Cadangan Sistem'}</strong>
                        <div className="text-xs text-muted font-mono">{item.id}</div>
                      </div>
                      <span className="badge-category">{item.size || '32 KB'}</span>
                    </div>

                    <div className="text-xs text-muted mb-3">
                      Waktu dibuat: {formatDateTime(item.timestamp)}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        className="btn-pill-xs text-primary"
                        onClick={() => handleDownloadFile(item)}
                      >
                        <IconDownload size={12} /> Unduh File
                      </button>
                      <button 
                        type="button" 
                        className="btn-pill-xs text-danger"
                        onClick={() => handleDeleteHistory(item.id)}
                      >
                        <IconTrash size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

