import React, { useState } from 'react';
import { 
  IconTag, 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconCheck, 
  IconX, 
  IconAlert,
  IconPackage
} from '../Icons';

export default function CategoryManagement({
  categories,
  products,
  onSaveCategories,
  onLogActivity,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'aktif'
  });

  // Hitung jumlah produk untuk setiap kategori
  const categoryWithCounts = categories.map(cat => {
    const count = products.filter(p => p.category === cat.name).length;
    return {
      ...cat,
      itemCount: count
    };
  });

  const filteredCategories = categoryWithCounts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      status: 'aktif'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      code: cat.code || '',
      name: cat.name,
      description: cat.description || '',
      status: cat.status || 'aktif'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      onShowToast?.('Kode dan Nama kategori wajib diisi', 'error');
      return;
    }

    if (editingCategory) {
      // Update
      const updated = categories.map(c => c.id === editingCategory.id ? {
        ...c,
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status
      } : c);
      onSaveCategories(updated);
      onLogActivity?.('UPDATE_CATEGORY', 'Manajemen Kategori', `Memperbarui kategori: ${formData.name}`);
      onShowToast?.(`Kategori "${formData.name}" berhasil diperbarui!`, 'success');
    } else {
      // Create
      // Cek duplikasi kode atau nama
      const exists = categories.find(c => 
        c.code.toUpperCase() === formData.code.toUpperCase().trim() ||
        c.name.toLowerCase() === formData.name.toLowerCase().trim()
      );
      if (exists) {
        onShowToast?.(`Kategori dengan kode "${formData.code}" atau nama "${formData.name}" sudah ada!`, 'error');
        return;
      }

      const newCat = {
        id: `CAT-${Date.now()}`,
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        createdAt: new Date().toISOString()
      };
      const updated = [...categories, newCat];
      onSaveCategories(updated);
      onLogActivity?.('CREATE_CATEGORY', 'Manajemen Kategori', `Menambah kategori baru: ${newCat.name}`);
      onShowToast?.(`Kategori "${newCat.name}" berhasil ditambahkan!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (cat) => {
    if (cat.itemCount > 0) {
      if (!window.confirm(`Kategori "${cat.name}" memiliki ${cat.itemCount} produk terhubung. Tetap hapus kategori ini?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Hapus kategori "${cat.name}"?`)) {
        return;
      }
    }

    const updated = categories.filter(c => c.id !== cat.id);
    onSaveCategories(updated);
    onLogActivity?.('DELETE_CATEGORY', 'Manajemen Kategori', `Menghapus kategori: ${cat.name}`);
    onShowToast?.(`Kategori "${cat.name}" berhasil dihapus.`, 'info');
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconTag size={24} className="text-primary" />
            Manajemen Kategori
          </h2>
          <p className="admin-page-subtitle">
            Klasifikasi produk kasir, kode singkatan, deskripsi, status aktif, dan jumlah produk terhubung
          </p>
        </div>
        <button 
          type="button" 
          className="admin-btn-primary"
          onClick={openAddModal}
        >
          <IconPlus size={18} />
          Tambah Kategori
        </button>
      </div>

      {/* Toolbar Pencarian */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-row">
          <div className="search-input-wrapper flex-1">
            <IconSearch size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama atau kode kategori..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input-search"
            />
          </div>
          <span className="text-muted text-sm self-center">
            Total: <strong>{categories.length}</strong> Kategori
          </span>
        </div>
      </div>

      {/* Grid Kartu Kategori */}
      <div className="category-cards-grid">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="category-item-card">
            <div className="category-card-top">
              <div className="category-code-badge">
                <IconTag size={16} />
                <span>{cat.code}</span>
              </div>
              <span className={`badge-status ${cat.status === 'aktif' ? 'success' : 'danger'}`}>
                {cat.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            <h3 className="category-card-title">{cat.name}</h3>
            <p className="category-card-desc">{cat.description || 'Tidak ada deskripsi'}</p>

            <div className="category-card-stats">
              <div className="flex items-center gap-2 text-muted text-sm">
                <IconPackage size={16} />
                <span>Jumlah Produk:</span>
              </div>
              <strong className="text-primary font-bold">{cat.itemCount} item</strong>
            </div>

            <div className="category-card-actions">
              <button 
                type="button" 
                className="btn-link text-primary"
                onClick={() => openEditModal(cat)}
              >
                <IconEdit size={14} /> Edit
              </button>
              <button 
                type="button" 
                className="btn-link text-danger"
                onClick={() => handleDelete(cat)}
              >
                <IconTrash size={14} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="empty-state">
          <IconTag size={48} className="text-muted" />
          <p>Tidak ada kategori yang cocok dengan pencarian.</p>
        </div>
      )}

      {/* Modal Tambah / Edit Kategori */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>{editingCategory ? `Edit Kategori: ${editingCategory.name}` : 'Tambah Kategori Baru'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Kode Kategori <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="admin-input uppercase font-mono"
                      placeholder="MKN / MNM"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="admin-select"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>Nama Kategori <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input"
                    placeholder="Contoh: Sembako & Beras"
                  />
                </div>

                {!editingCategory && (
                  <div className="quick-category-suggestions mb-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-2xs text-muted block mb-1 font-semibold">⚡ Template Kategori Toko Sembako (Klik untuk Pasang):</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { name: 'Sembako & Beras', code: 'SBK' },
                        { name: 'Minyak & Margarin', code: 'MYK' },
                        { name: 'Mie & Makanan Instan', code: 'MIE' },
                        { name: 'Gula, Teh & Kopi', code: 'GTK' },
                        { name: 'Bumbu Dapur', code: 'BMB' },
                        { name: 'Susu & Olahan', code: 'SSU' },
                        { name: 'Snack & Biskuit', code: 'SNK' },
                        { name: 'Minuman', code: 'MNM' },
                        { name: 'Sabun & Kebersihan', code: 'SBN' },
                        { name: 'Gas & Galon', code: 'GLN' },
                        { name: 'Rokok & Korek', code: 'RKK' }
                      ].map(preset => (
                        <button
                          key={preset.code}
                          type="button"
                          className="chip-unit"
                          onClick={() => setFormData({
                            ...formData,
                            name: preset.name,
                            code: preset.code,
                            description: `Kategori sembako untuk aneka ${preset.name}`
                          })}
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group mb-3">
                  <label>Deskripsi Kategori</label>
                  <textarea 
                    rows="3"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="admin-textarea"
                    placeholder="Keterangan singkat produk yang masuk ke kategori ini"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="admin-btn-primary">
                  <IconCheck size={18} /> Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

