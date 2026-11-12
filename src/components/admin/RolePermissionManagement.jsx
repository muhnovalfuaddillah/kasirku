import React, { useState } from 'react';
import { 
  IconShield, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCheck, 
  IconX, 
  IconAlert, 
  IconSearch, 
  IconLock 
} from '../Icons';

const MODULE_LIST = [
  { id: 'dashboard', label: 'Dashboard Utama' },
  { id: 'users', label: 'Manajemen Pengguna' },
  { id: 'roles', label: 'Role & Hak Akses' },
  { id: 'products', label: 'Manajemen Data Produk' },
  { id: 'categories', label: 'Manajemen Kategori' },
  { id: 'reports', label: 'Laporan & Statistik' },
  { id: 'notifications', label: 'Notifikasi' },
  { id: 'activityLogs', label: 'Riwayat Aktivitas' },
  { id: 'settings', label: 'Pengaturan Aplikasi' },
  { id: 'googleSheets', label: 'Integrasi Google Sheets' },
  { id: 'security', label: 'Keamanan Sistem' },
  { id: 'backup', label: 'Backup & Restore' }
];

export default function RolePermissionManagement({
  roles,
  onSaveRoles,
  onLogActivity,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(roles[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: {}
  });

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const initEmptyPermissions = () => {
    const perms = {};
    MODULE_LIST.forEach(m => {
      perms[m.id] = { view: false, add: false, edit: false, delete: false };
    });
    return perms;
  };

  const handleStartCreate = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: initEmptyPermissions()
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleStartEdit = (role) => {
    // Clone permissions to avoid direct mutation
    const clonedPerms = {};
    MODULE_LIST.forEach(m => {
      clonedPerms[m.id] = {
        view: !!(role.permissions?.[m.id]?.view),
        add: !!(role.permissions?.[m.id]?.add),
        edit: !!(role.permissions?.[m.id]?.edit),
        delete: !!(role.permissions?.[m.id]?.delete)
      };
    });

    setRoleForm({
      id: role.id,
      name: role.name,
      description: role.description || '',
      isSystem: !!role.isSystem,
      permissions: clonedPerms
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handlePermissionToggle = (moduleId, action) => {
    setRoleForm(prev => {
      const currentMod = prev.permissions[moduleId] || { view: false, add: false, edit: false, delete: false };
      const updatedMod = { ...currentMod, [action]: !currentMod[action] };
      
      // Jika add/edit/delete aktif, otomatis view harus aktif
      if ((action === 'add' || action === 'edit' || action === 'delete') && updatedMod[action]) {
        updatedMod.view = true;
      }
      // Jika view dimatikan, matikan juga add/edit/delete
      if (action === 'view' && !updatedMod.view) {
        updatedMod.add = false;
        updatedMod.edit = false;
        updatedMod.delete = false;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: updatedMod
        }
      };
    });
  };

  const handleToggleAllForModule = (moduleId, grantAll) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          view: grantAll,
          add: grantAll,
          edit: grantAll,
          delete: grantAll
        }
      }
    }));
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      onShowToast?.('Nama role wajib diisi', 'error');
      return;
    }

    if (isCreating) {
      const newRole = {
        id: `role-${Date.now()}`,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        isSystem: false,
        permissions: roleForm.permissions
      };
      const updated = [...roles, newRole];
      onSaveRoles(updated);
      setSelectedRole(newRole);
      onLogActivity?.('CREATE_ROLE', 'Role & Hak Akses', `Menambahkan role baru: ${newRole.name}`);
      onShowToast?.(`Role ${newRole.name} berhasil dibuat!`, 'success');
    } else if (isEditing) {
      const updated = roles.map(r => r.id === roleForm.id ? {
        ...r,
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions: roleForm.permissions
      } : r);
      onSaveRoles(updated);
      const current = updated.find(r => r.id === roleForm.id);
      setSelectedRole(current);
      onLogActivity?.('UPDATE_ROLE', 'Role & Hak Akses', `Memperbarui hak akses role: ${roleForm.name}`);
      onShowToast?.(`Hak akses role ${roleForm.name} berhasil disimpan!`, 'success');
    }

    setIsCreating(false);
    setIsEditing(false);
  };

  const handleDeleteRole = (role) => {
    if (role.isSystem) {
      onShowToast?.('Role sistem bawaan (Admin / Kasir) tidak dapat dihapus.', 'error');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus role "${role.name}"? Pengguna dengan role ini akan kehilangan akses.`)) {
      const updated = roles.filter(r => r.id !== role.id);
      onSaveRoles(updated);
      setSelectedRole(updated[0] || null);
      onLogActivity?.('DELETE_ROLE', 'Role & Hak Akses', `Menghapus role: ${role.name}`);
      onShowToast?.(`Role ${role.name} berhasil dihapus.`, 'info');
    }
  };

  return (
    <div className="admin-module-container">
      {/* Header Modul */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconShield size={24} className="text-primary" />
            Manajemen Role & Hak Akses
          </h2>
          <p className="admin-page-subtitle">
            Konfigurasi granular izin setiap menu (Lihat, Tambah, Edit, Hapus) untuk Admin, Operator, Petugas, Kasir
          </p>
        </div>
        <button 
          type="button" 
          className="admin-btn-primary"
          onClick={handleStartCreate}
        >
          <IconPlus size={18} />
          Tambah Role Baru
        </button>
      </div>

      {/* Grid: Daftar Role di Kiri, Matriks Hak Akses di Kanan */}
      <div className="role-matrix-layout">
        {/* Kolom Kiri: Daftar Role */}
        <div className="role-sidebar-card">
          <div className="role-search-box">
            <IconSearch size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Cari role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="role-search-input"
            />
          </div>

          <div className="role-list">
            {filteredRoles.map(role => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div 
                  key={role.id}
                  className={`role-item-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                >
                  <div className="role-item-header">
                    <div className="role-title-row">
                      <span className="role-badge-icon">
                        <IconShield size={16} />
                      </span>
                      <strong className="role-name">{role.name}</strong>
                    </div>
                    {role.isSystem && (
                      <span className="badge-system" title="Role Sistem Default">
                        <IconLock size={12} /> Sistem
                      </span>
                    )}
                  </div>
                  <p className="role-desc">{role.description || 'Tidak ada deskripsi'}</p>
                  <div className="role-item-actions">
                    <button 
                      type="button"
                      className="btn-link text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(role);
                      }}
                    >
                      <IconEdit size={14} /> Atur Izin
                    </button>
                    {!role.isSystem && (
                      <button 
                        type="button"
                        className="btn-link text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                      >
                        <IconTrash size={14} /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Detail & Matriks Perizinan */}
        <div className="role-matrix-card">
          {(isCreating || isEditing) ? (
            /* Mode Form Edit / Tambah */
            <form onSubmit={handleSaveRole}>
              <div className="form-card-header">
                <div>
                  <h3 className="section-title">
                    {isCreating ? 'Tambah Role & Izin Akses' : `Edit Hak Akses: ${roleForm.name}`}
                  </h3>
                  <p className="text-muted text-sm">
                    Tentukan menu mana saja yang boleh dilihat, ditambah, diubah, atau dihapus
                  </p>
                </div>
                <div className="form-action-buttons">
                  <button 
                    type="button" 
                    className="admin-btn-secondary"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    <IconCheck size={16} />
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nama Role <span className="text-danger">*</span></label>
                  <input 
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="Contoh: Supervisor Toko"
                    className="admin-input"
                    disabled={roleForm.isSystem && roleForm.name === 'Admin'}
                  />
                </div>
                <div className="form-group">
                  <label>Deskripsi Tugas & Wewenang</label>
                  <input 
                    type="text"
                    value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Keterangan singkat hak akses role ini"
                    className="admin-input"
                  />
                </div>
              </div>

              {/* Tabel Matriks Izin */}
              <div className="matrix-table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Modul / Menu Sistem</th>
                      <th style={{ textAlign: 'center' }}>Lihat (View)</th>
                      <th style={{ textAlign: 'center' }}>Tambah (Create)</th>
                      <th style={{ textAlign: 'center' }}>Ubah (Update)</th>
                      <th style={{ textAlign: 'center' }}>Hapus (Delete)</th>
                      <th style={{ textAlign: 'center' }}>Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_LIST.map(mod => {
                      const p = roleForm.permissions[mod.id] || { view: false, add: false, edit: false, delete: false };
                      return (
                        <tr key={mod.id}>
                          <td>
                            <strong>{mod.label}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={!!p.view}
                              onChange={() => handlePermissionToggle(mod.id, 'view')}
                              className="matrix-checkbox"
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={!!p.add}
                              onChange={() => handlePermissionToggle(mod.id, 'add')}
                              className="matrix-checkbox"
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={!!p.edit}
                              onChange={() => handlePermissionToggle(mod.id, 'edit')}
                              className="matrix-checkbox"
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox"
                              checked={!!p.delete}
                              onChange={() => handlePermissionToggle(mod.id, 'delete')}
                              className="matrix-checkbox"
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              type="button"
                              className="btn-pill-xs"
                              onClick={() => handleToggleAllForModule(mod.id, !(p.view && p.add && p.edit && p.delete))}
                            >
                              {(p.view && p.add && p.edit && p.delete) ? 'Batal Semua' : 'Pilih Semua'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </form>
          ) : selectedRole ? (
            /* Mode View Detail Role Terpilih */
            <div>
              <div className="view-card-header">
                <div>
                  <div className="title-with-badge">
                    <h3 className="section-title">{selectedRole.name}</h3>
                    {selectedRole.isSystem && (
                      <span className="badge-system"><IconLock size={12} /> Role Sistem</span>
                    )}
                  </div>
                  <p className="text-muted text-sm">{selectedRole.description}</p>
                </div>
                <button 
                  type="button" 
                  className="admin-btn-primary"
                  onClick={() => handleStartEdit(selectedRole)}
                >
                  <IconEdit size={16} />
                  Ubah Hak Akses
                </button>
              </div>

              {/* Tabel Matriks Read-Only */}
              <div className="matrix-table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Modul / Menu Sistem</th>
                      <th style={{ textAlign: 'center' }}>Lihat</th>
                      <th style={{ textAlign: 'center' }}>Tambah</th>
                      <th style={{ textAlign: 'center' }}>Ubah</th>
                      <th style={{ textAlign: 'center' }}>Hapus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULE_LIST.map(mod => {
                      const p = selectedRole.permissions?.[mod.id] || { view: false, add: false, edit: false, delete: false };
                      return (
                        <tr key={mod.id}>
                          <td><strong>{mod.label}</strong></td>
                          <td style={{ textAlign: 'center' }}>
                            {p.view ? <span className="perm-pill allowed">Diizinkan</span> : <span className="perm-pill denied">Dilarang</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {p.add ? <span className="perm-pill allowed">Diizinkan</span> : <span className="perm-pill denied">Dilarang</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {p.edit ? <span className="perm-pill allowed">Diizinkan</span> : <span className="perm-pill denied">Dilarang</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {p.delete ? <span className="perm-pill allowed">Diizinkan</span> : <span className="perm-pill denied">Dilarang</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <IconShield size={48} className="text-muted" />
              <p>Pilih salah satu role di samping untuk melihat atau mengedit hak akses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

