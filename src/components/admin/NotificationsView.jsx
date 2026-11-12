import React, { useState } from 'react';
import { 
  IconBell, 
  IconCheck, 
  IconTrash, 
  IconAlert, 
  IconCheckCircle, 
  IconClock, 
  IconFilter, 
  IconSettings 
} from '../Icons';
import { formatDateTime } from '../../utils/formatters';

export default function NotificationsView({
  notifications,
  onSaveNotifications,
  onLogActivity,
  onShowToast
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD' | 'warning' | 'success' | 'info'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifPreferences, setNotifPreferences] = useState({
    stockAlert: true,
    newOrderAlert: true,
    sheetSyncAlert: true,
    systemBackupAlert: true
  });

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'UNREAD') return !n.read;
    if (filterType !== 'ALL') return n.type === filterType;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    onSaveNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    onSaveNotifications(updated);
    onShowToast?.('Semua notifikasi ditandai sebagai sudah dibaca', 'success');
  };

  const handleDeleteNotif = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    onSaveNotifications(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Yakin ingin menghapus seluruh riwayat notifikasi?')) {
      onSaveNotifications([]);
      onLogActivity?.('CLEAR_NOTIFICATIONS', 'Notifikasi', 'Menghapus seluruh notifikasi sistem');
      onShowToast?.('Riwayat notifikasi telah dibersihkan', 'info');
    }
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconBell size={24} className="text-primary" />
            Notifikasi Sistem & Aktivitas
          </h2>
          <p className="admin-page-subtitle">
            Pemberitahuan stok tipis, pembaruan data produk, status sinkronisasi, dan peringatan operasional
          </p>
        </div>
        <div className="admin-header-actions">
          {unreadCount > 0 && (
            <button 
              type="button" 
              className="admin-btn-secondary"
              onClick={handleMarkAllAsRead}
            >
              <IconCheck size={18} />
              Tandai Semua Dibaca
            </button>
          )}
          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={() => setShowSettingsModal(true)}
          >
            <IconSettings size={18} />
            Pengaturan Notifikasi
          </button>
          {notifications.length > 0 && (
            <button 
              type="button" 
              className="admin-btn-danger"
              onClick={handleClearAll}
            >
              <IconTrash size={18} />
              Bersihkan Semua
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-toolbar-card">
        <div className="period-pill-group">
          <button 
            type="button" 
            className={`btn-period-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            Semua ({notifications.length})
          </button>
          <button 
            type="button" 
            className={`btn-period-pill ${filterType === 'UNREAD' ? 'active' : ''}`}
            onClick={() => setFilterType('UNREAD')}
          >
            Belum Dibaca ({unreadCount})
          </button>
          <button 
            type="button" 
            className={`btn-period-pill ${filterType === 'warning' ? 'active' : ''}`}
            onClick={() => setFilterType('warning')}
          >
            Peringatan
          </button>
          <button 
            type="button" 
            className={`btn-period-pill ${filterType === 'success' ? 'active' : ''}`}
            onClick={() => setFilterType('success')}
          >
            Berhasil
          </button>
          <button 
            type="button" 
            className={`btn-period-pill ${filterType === 'info' ? 'active' : ''}`}
            onClick={() => setFilterType('info')}
          >
            Informasi
          </button>
        </div>
      </div>

      {/* Daftar Notifikasi */}
      <div className="notification-list-wrapper">
        {filteredNotifs.length === 0 ? (
          <div className="empty-state">
            <IconBell size={48} className="text-muted" />
            <p>Tidak ada notifikasi pada kategori ini.</p>
          </div>
        ) : (
          filteredNotifs.map(item => {
            const isUnread = !item.read;
            return (
              <div 
                key={item.id} 
                className={`notification-item-card ${isUnread ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(item.id)}
              >
                <div className="notif-icon-col">
                  {item.type === 'warning' && (
                    <div className="notif-icon bg-amber-100 text-amber-600">
                      <IconAlert size={20} />
                    </div>
                  )}
                  {item.type === 'success' && (
                    <div className="notif-icon bg-emerald-100 text-emerald-600">
                      <IconCheckCircle size={20} />
                    </div>
                  )}
                  {item.type === 'info' && (
                    <div className="notif-icon bg-blue-100 text-primary">
                      <IconBell size={20} />
                    </div>
                  )}
                  {item.type === 'danger' && (
                    <div className="notif-icon bg-red-100 text-danger">
                      <IconAlert size={20} />
                    </div>
                  )}
                </div>

                <div className="notif-content-col">
                  <div className="notif-title-row">
                    <h4 className="notif-title">{item.title}</h4>
                    {isUnread && <span className="notif-new-dot" title="Belum dibaca" />}
                  </div>
                  <p className="notif-message">{item.message}</p>
                  <div className="notif-time">
                    <IconClock size={12} />
                    <span>{formatDateTime(item.timestamp)}</span>
                  </div>
                </div>

                <div className="notif-action-col">
                  <button 
                    type="button" 
                    className="btn-icon-action text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotif(item.id);
                    }}
                    title="Hapus notifikasi ini"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Preferensi Notifikasi */}
      {showSettingsModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Pengaturan Preferensi Notifikasi</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowSettingsModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted text-sm mb-4">
                Pilih jenis notifikasi dan peringatan sistem yang ingin ditampilkan di panel admin:
              </p>

              <div className="preference-list">
                <label className="preference-row">
                  <div>
                    <strong className="text-main">Peringatan Stok Menipis</strong>
                    <div className="text-xs text-muted">Beri tahu ketika stok produk sisa di bawah batas minimum</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={notifPreferences.stockAlert}
                    onChange={e => setNotifPreferences({ ...notifPreferences, stockAlert: e.target.checked })}
                    className="matrix-checkbox"
                  />
                </label>

                <label className="preference-row">
                  <div>
                    <strong className="text-main">Notifikasi Transaksi Baru</strong>
                    <div className="text-xs text-muted">Tampilkan notifikasi saat kasir menyelesaikan checkout pemesanan</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={notifPreferences.newOrderAlert}
                    onChange={e => setNotifPreferences({ ...notifPreferences, newOrderAlert: e.target.checked })}
                    className="matrix-checkbox"
                  />
                </label>

                <label className="preference-row">
                  <div>
                    <strong className="text-main">Status Sinkronisasi Google Sheets</strong>
                    <div className="text-xs text-muted">Beri tahu ketika sinkronisasi spreadsheet berhasil atau gagal terhubung</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={notifPreferences.sheetSyncAlert}
                    onChange={e => setNotifPreferences({ ...notifPreferences, sheetSyncAlert: e.target.checked })}
                    className="matrix-checkbox"
                  />
                </label>

                <label className="preference-row">
                  <div>
                    <strong className="text-main">Pemberitahuan Backup Sistem</strong>
                    <div className="text-xs text-muted">Informasikan saat cadangan database snapshot berhasil dibuat</div>
                  </div>
                  <input 
                    type="checkbox"
                    checked={notifPreferences.systemBackupAlert}
                    onChange={e => setNotifPreferences({ ...notifPreferences, systemBackupAlert: e.target.checked })}
                    className="matrix-checkbox"
                  />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="admin-btn-primary"
                onClick={() => {
                  setShowSettingsModal(false);
                  onShowToast?.('Pengaturan notifikasi berhasil disimpan!', 'success');
                }}
              >
                Simpan Preferensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

