import React, { useState, useMemo } from 'react';
import { 
  IconActivity, 
  IconSearch, 
  IconFilter, 
  IconDownload, 
  IconClock, 
  IconUser, 
  IconEye, 
  IconTrash, 
  IconX 
} from '../Icons';
import { formatDateTime } from '../../utils/formatters';

export default function ActivityLogView({
  activityLogs,
  onClearLogs,
  onLogActivity,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [activeLog, setActiveLog] = useState(null);

  // Filter list
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchSearch = 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.module && log.module.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchSearch) return false;

      if (moduleFilter !== 'ALL' && log.module !== moduleFilter) {
        return false;
      }

      if (actionFilter !== 'ALL' && !log.action.includes(actionFilter)) {
        return false;
      }

      return true;
    });
  }, [activityLogs, searchTerm, moduleFilter, actionFilter]);

  // Unique modules for select
  const uniqueModules = useMemo(() => {
    const set = new Set();
    activityLogs.forEach(l => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [activityLogs]);

  // Export CSV
  const handleExportCSV = () => {
    if (activityLogs.length === 0) {
      onShowToast?.('Tidak ada riwayat aktivitas untuk diekspor', 'warning');
      return;
    }

    const headers = ['ID Log', 'Tanggal & Waktu', 'Pengguna', 'Role', 'Aksi', 'Modul', 'Detail Aktivitas', 'Alamat IP'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${formatDateTime(l.timestamp)}"`,
      `"${l.user}"`,
      `"${l.role || '-'}"`,
      `"${l.action}"`,
      `"${l.module || '-'}"`,
      `"${l.detail.replace(/"/g, '""')}"`,
      `"${l.ip || '127.0.0.1'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Trail_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast?.('Log audit aktivitas berhasil diekspor ke CSV!', 'success');
  };

  const handleClearAll = () => {
    if (window.confirm('Yakin ingin membersihkan seluruh rekaman log aktivitas? Tindakan ini tidak dapat dibatalkan.')) {
      onClearLogs?.();
      onShowToast?.('Seluruh riwayat log aktivitas telah dibersihkan.', 'info');
    }
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CREATE') || action.includes('ADD')) return 'success';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'warning';
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'danger';
    if (action.includes('LOGIN')) return 'primary';
    return 'info';
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconActivity size={24} className="text-primary" />
            Riwayat Aktivitas & Audit Trail
          </h2>
          <p className="admin-page-subtitle">
            Pelacakan jejak audit lengkap: login, penambahan barang, pembaruan harga, penghapusan data, dan IP pengakses
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={handleExportCSV}
          >
            <IconDownload size={18} />
            Unduh CSV Log
          </button>
          {activityLogs.length > 0 && (
            <button 
              type="button" 
              className="admin-btn-danger"
              onClick={handleClearAll}
            >
              <IconTrash size={18} />
              Bersihkan Log
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-row">
          <div className="search-input-wrapper flex-1">
            <IconSearch size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama pengguna, detail aktivitas, aksi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input-search"
            />
          </div>

          <div className="filter-select-group">
            <select 
              value={moduleFilter} 
              onChange={e => setModuleFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Semua Modul</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select 
              value={actionFilter} 
              onChange={e => setActionFilter(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Semua Tipe Aksi</option>
              <option value="LOGIN">Login & Sesi</option>
              <option value="CREATE">Penambahan Data (Create)</option>
              <option value="UPDATE">Perubahan Data (Update)</option>
              <option value="DELETE">Penghapusan Data (Delete)</option>
              <option value="BACKUP">Backup & Restore</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Log Aktivitas */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Waktu & Tanggal</th>
                <th>Pengguna</th>
                <th>Modul</th>
                <th>Aksi</th>
                <th>Detail Aktivitas</th>
                <th>Alamat IP</th>
                <th style={{ textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    <IconActivity size={36} className="text-muted mb-2" />
                    <p>Tidak ada riwayat aktivitas yang sesuai pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <IconClock size={14} className="text-muted" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-main">{log.user}</div>
                      <span className="text-xs text-muted">Role: {log.role || 'Admin'}</span>
                    </td>
                    <td>
                      <span className="badge-category">{log.module || 'Umum'}</span>
                    </td>
                    <td>
                      <span className={`badge-status ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm text-main line-clamp-1 max-w-md" title={log.detail}>
                        {log.detail}
                      </div>
                    </td>
                    <td>
                      <code className="text-xs text-muted">{log.ip || '127.0.0.1'}</code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        className="btn-icon-action"
                        onClick={() => setActiveLog(log)}
                        title="Inspeksi detail log"
                      >
                        <IconEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Log */}
      {activeLog && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Detail Audit Log: {activeLog.id}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setActiveLog(null)}>
                <IconX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-table-list">
                <div className="detail-item-row">
                  <span className="text-muted">ID Log:</span>
                  <code>{activeLog.id}</code>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Waktu Eksekusi:</span>
                  <strong>{formatDateTime(activeLog.timestamp)}</strong>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Pengguna:</span>
                  <span>{activeLog.user} ({activeLog.role || 'Admin'})</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Modul:</span>
                  <span className="badge-category">{activeLog.module}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Aksi:</span>
                  <span className={`badge-status ${getActionBadgeClass(activeLog.action)}`}>
                    {activeLog.action}
                  </span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Alamat IP & Client:</span>
                  <code>{activeLog.ip || '127.0.0.1 (Localhost)'}</code>
                </div>
                <div className="detail-item-row flex-col items-start gap-1">
                  <span className="text-muted">Rincian Perubahan:</span>
                  <div className="p-3 bg-muted rounded-md w-full text-sm font-mono whitespace-pre-wrap">
                    {activeLog.detail}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="admin-btn-primary" onClick={() => setActiveLog(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

