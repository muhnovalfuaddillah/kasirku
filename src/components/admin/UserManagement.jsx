import React, { useState } from 'react';
import { 
  IconUsers, 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconEye, 
  IconLock, 
  IconDownload, 
  IconUpload, 
  IconX, 
  IconCheck, 
  IconAlert,
  IconShield,
  IconClock
} from '../Icons';
import { formatDateTime } from '../../utils/formatters';

export default function UserManagement({
  users,
  roles,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  onSaveUsers,
  onLogActivity,
  onShowToast
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Kasir',
    status: 'aktif',
    avatar: ''
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'Kasir',
      status: 'aktif',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      avatar: user.avatar || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      onShowToast?.('Nama dan Username wajib diisi!', 'error');
      return;
    }

    if (editingUser) {
      const updatedUser = {
        ...editingUser,
        ...formData
      };
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      } else if (onSaveUsers) {
        onSaveUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      }
      onLogActivity?.('UPDATE_USER', 'Manajemen Pengguna', `Memperbarui akun pengguna: ${formData.name}`);
      onShowToast?.(`Pengguna ${formData.name} berhasil diperbarui!`, 'success');
    } else {
      const newUser = {
        ...formData,
        createdAt: new Date().toISOString(),
        lastLogin: '-'
      };
      if (onAddUser) {
        onAddUser(newUser);
      } else if (onSaveUsers) {
        onSaveUsers([newUser, ...users]);
      }
      onLogActivity?.('CREATE_USER', 'Manajemen Pengguna', `Menambahkan pengguna baru: ${formData.name} (${formData.role})`);
      onShowToast?.(`Pengguna ${formData.name} berhasil ditambahkan!`, 'success');
    }
    setShowModal(false);
  };

  const handleDelete = (user) => {
    if (user.username === 'admin') {
      onShowToast?.('Akun Super Admin utama tidak dapat dihapus demi keamanan!', 'error');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus pengguna "${user.name}"?`)) {
      if (onDeleteUser) {
        onDeleteUser(user.id);
      } else if (onSaveUsers) {
        onSaveUsers(users.filter(u => u.id !== user.id));
      }
      onLogActivity?.('DELETE_USER', 'Manajemen Pengguna', `Menghapus pengguna: ${user.name}`);
      onShowToast?.(`Pengguna ${user.name} berhasil dihapus.`, 'info');
    }
  };

  const handleToggleStatus = (user, newStatus) => {
    const updated = {
      ...user,
      status: newStatus
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    } else if (onSaveUsers) {
      onSaveUsers(users.map(u => u.id === user.id ? updated : u));
    }
    onLogActivity?.('UPDATE_USER_STATUS', 'Manajemen Pengguna', `Mengubah status ${user.name} menjadi ${newStatus}`);
    onShowToast?.(`Status ${user.name} diubah menjadi ${newStatus}.`, 'info');
  };

  const handleResetPassword = (user) => {
    if (window.confirm(`Reset password untuk pengguna "${user.name}" ke default (123456)?`)) {
      if (onResetPassword) {
        onResetPassword(user.id);
      }
      onLogActivity?.('RESET_PASSWORD', 'Manajemen Pengguna', `Mereset password pengguna: ${user.name}`);
      onShowToast?.(`Password untuk ${user.name} berhasil direset ke "123456"!`, 'success');
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Lengkap', 'Username', 'Email', 'No Telepon', 'Role', 'Status', 'Terdaftar'];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.username}"`,
      `"${u.email}"`,
      `"${u.phone || ''}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.createdAt || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Data_Pengguna_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onLogActivity?.('EXPORT_USERS', 'Manajemen Pengguna', 'Mengekspor data pengguna ke CSV');
    onShowToast?.('Data pengguna berhasil diekspor ke CSV!', 'success');
  };

  // Import Real CSV
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target.result;
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          if (lines.length < 2) {
            onShowToast?.('File CSV kosong atau tidak memiliki baris data.', 'error');
            return;
          }

          let added = 0;
          const newUsersList = [...users];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            if (parts.length >= 2) {
              const name = parts[1] || parts[0];
              const username = (parts[2] || name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100)).trim();
              const email = parts[3] || `${username}@toko.id`;
              const phone = parts[4] || '0812-0000-0000';
              const role = parts[5] || 'Kasir';
              const status = parts[6] || 'aktif';

              if (!newUsersList.some(u => u.username.toLowerCase() === username.toLowerCase())) {
                newUsersList.push({
                  id: `USR-${Date.now().toString().slice(-4)}-${i}`,
                  name,
                  username,
                  email,
                  phone,
                  role,
                  status,
                  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
                  createdAt: new Date().toISOString(),
                  lastLogin: '-'
                });
                added++;
              }
            }
          }

          if (added > 0) {
            if (onSaveUsers) onSaveUsers(newUsersList);
            onLogActivity?.('IMPORT_USERS', 'Manajemen Pengguna', `Mengimpor ${added} pengguna dari CSV`);
            onShowToast?.(`Berhasil mengimpor ${added} pengguna baru dari CSV!`, 'success');
          } else {
            onShowToast?.('Tidak ada pengguna baru yang ditambahkan (mungkin duplikat username).', 'warning');
          }
        } catch (err) {
          onShowToast?.('Gagal memproses file CSV: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Filter list
  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'Semua' || u.role === roleFilter;
    const matchStatus = statusFilter === 'Semua' || u.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || 
                        u.username.toLowerCase().includes(q) || 
                        u.email.toLowerCase().includes(q);
    return matchRole && matchStatus && matchSearch;
  });

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconUsers size={24} className="text-primary" />
            Manajemen Pengguna & Staf Kasir
          </h2>
          <p className="admin-page-subtitle">
            Kelola data staf kasir, operator, supervisor, akses login, dan status akun aktif/blokir
          </p>
        </div>

        <div className="admin-header-actions">
          <button type="button" onClick={handleExportCSV} className="admin-btn-secondary">
            <IconDownload size={16} />
            <span>Ekspor CSV</span>
          </button>

          <button type="button" onClick={handleImportClick} className="admin-btn-secondary">
            <IconUpload size={16} />
            <span>Impor CSV</span>
          </button>

          <button type="button" onClick={handleOpenAdd} className="admin-btn-primary">
            <IconPlus size={16} />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Toolbar Pencarian & Filter */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-row">
          <div className="search-input-wrapper flex-1">
            <IconSearch size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama, username, atau email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input-search"
            />
          </div>

          <div className="filter-select-group">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="admin-select">
              <option value="Semua">Semua Role ({users.length})</option>
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
              <option value="Petugas">Petugas Gudang</option>
              <option value="Kasir">Kasir POS</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-select">
              <option value="Semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="diblokir">Diblokir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Username</th>
                <th>Kontak & Email</th>
                <th>Role Akses</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    <IconUsers size={36} className="text-muted mb-2" />
                    <p>Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="product-table-item">
                        <img 
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} 
                          alt={u.name}
                          className="product-table-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80';
                          }}
                        />
                        <div>
                          <div className="font-semibold text-main">{u.name}</div>
                          <span className="text-xs text-muted font-mono">{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="sku-badge">{u.username}</code>
                    </td>
                    <td>
                      <div className="text-sm text-main">{u.email}</div>
                      <div className="text-xs text-muted">{u.phone || '-'}</div>
                    </td>
                    <td>
                      <span className="badge-category font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${u.status === 'aktif' ? 'success' : (u.status === 'nonaktif' ? 'warning' : 'danger')}`}>
                        {u.status === 'aktif' ? '● Aktif' : (u.status === 'nonaktif' ? '○ Nonaktif' : '✕ Diblokir')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <IconClock size={12} />
                        <span>{u.lastLogin && u.lastLogin !== '-' ? formatDateTime(u.lastLogin) : 'Belum pernah'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-row-actions">
                        <button 
                          type="button" 
                          onClick={() => setDetailUser(u)}
                          className="btn-icon-action"
                          title="Lihat Detail Profil"
                        >
                          <IconEye size={16} />
                        </button>

                        <button 
                          type="button" 
                          onClick={() => handleOpenEdit(u)}
                          className="btn-icon-action"
                          title="Edit Pengguna"
                        >
                          <IconEdit size={16} />
                        </button>

                        <button 
                          type="button" 
                          onClick={() => handleResetPassword(u)}
                          className="btn-icon-action text-warning"
                          title="Reset Password Default"
                        >
                          <IconLock size={16} />
                        </button>

                        {u.username !== 'admin' && (
                          <button 
                            type="button" 
                            onClick={() => handleDelete(u)}
                            className="btn-icon-action text-danger"
                            title="Hapus Pengguna"
                          >
                            <IconTrash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>{editingUser ? `Edit Data: ${editingUser.name}` : 'Tambah Pengguna Baru'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="modal-close-btn">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>ID Pengguna</label>
                    <input type="text" value={formData.id} readOnly className="admin-input bg-slate-100 font-mono" />
                  </div>
                  <div className="form-group">
                    <label>Username <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      value={formData.username} 
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                      placeholder="nama.pengguna" 
                      required 
                      className="admin-input font-mono"
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Nama Lengkap <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Contoh: Budi Santoso" 
                    required 
                    className="admin-input"
                  />
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Alamat Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="user@toko.com" 
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>No. HP / WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="0812-xxxx-xxxx" 
                      className="admin-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Role / Jabatan</label>
                    <select 
                      value={formData.role} 
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="admin-select"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Operator">Operator</option>
                      <option value="Petugas">Petugas Gudang</option>
                      <option value="Kasir">Kasir</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status Akun</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="admin-select"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                      <option value="diblokir">Diblokir</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>URL Foto Profil</label>
                  <input 
                    type="url" 
                    value={formData.avatar} 
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })} 
                    placeholder="https://..." 
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">
                  Batal
                </button>
                <button type="submit" className="admin-btn-primary">
                  <IconCheck size={16} />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Pengguna */}
      {detailUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3>Detail Profil Pengguna</h3>
              <button type="button" onClick={() => setDetailUser(null)} className="modal-close-btn">
                <IconX size={20} />
              </button>
            </div>

            <div className="modal-body text-center">
              <img 
                src={detailUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'} 
                alt={detailUser.name} 
                className="profile-avatar-large mx-auto mb-3"
              />
              <h3 className="text-lg font-bold text-main">{detailUser.name}</h3>
              <p className="text-muted text-sm font-mono">@{detailUser.username} • {detailUser.id}</p>

              <div className="detail-table-list mt-4 text-left">
                <div className="detail-item-row">
                  <span className="text-muted">Role Akses:</span>
                  <span className="badge-category font-bold">{detailUser.role}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Status Akun:</span>
                  <span className={`badge-status ${detailUser.status === 'aktif' ? 'success' : (detailUser.status === 'nonaktif' ? 'warning' : 'danger')}`}>
                    {detailUser.status}
                  </span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Email:</span>
                  <span>{detailUser.email || '-'}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">No. Telepon:</span>
                  <span>{detailUser.phone || '-'}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Waktu Pendaftaran:</span>
                  <span>{formatDateTime(detailUser.createdAt)}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Login Terakhir:</span>
                  <span>{detailUser.lastLogin && detailUser.lastLogin !== '-' ? formatDateTime(detailUser.lastLogin) : 'Belum pernah'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {detailUser.status === 'aktif' ? (
                  <button 
                    type="button" 
                    onClick={() => { handleToggleStatus(detailUser, 'nonaktif'); setDetailUser(null); }}
                    className="admin-btn-secondary flex-1" 
                    style={{ color: '#b45309' }}
                  >
                    Nonaktifkan
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => { handleToggleStatus(detailUser, 'aktif'); setDetailUser(null); }}
                    className="admin-btn-primary flex-1" 
                  >
                    Aktifkan Akun
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={() => { handleToggleStatus(detailUser, 'diblokir'); setDetailUser(null); }}
                  className="admin-btn-danger flex-1" 
                >
                  Blokir Akun
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="admin-btn-secondary" 
                onClick={() => {
                  const u = detailUser;
                  setDetailUser(null);
                  handleOpenEdit(u);
                }}
              >
                <IconEdit size={16} /> Edit
              </button>
              <button type="button" className="admin-btn-primary" onClick={() => setDetailUser(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
