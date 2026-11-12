import React, { useState } from 'react';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch, 
  IconRefresh, 
  IconPackage,
  IconX,
  IconCheck
} from './Icons';
import { formatRupiah } from '../utils/formatters';

export default function ProductManagement({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSyncProducts,
  isSyncing,
  sheetUrl
}) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Makanan',
    price: '',
    stock: '',
    barcode: '',
    imageUrl: ''
  });

  const categories = ['Semua', 'Makanan', 'Minuman', 'Snack', 'Sembako', 'Lainnya'];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      id: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      category: 'Makanan',
      price: '',
      stock: '50',
      barcode: '',
      imageUrl: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      id: prod.id,
      name: prod.name,
      category: prod.category || 'Makanan',
      price: prod.price.toString(),
      stock: prod.stock.toString(),
      barcode: prod.barcode || '',
      imageUrl: prod.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert('Nama produk dan harga wajib diisi!');
      return;
    }

    const payload = {
      id: formData.id || `PRD-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      barcode: formData.barcode.trim(),
      imageUrl: formData.imageUrl.trim()
    };

    if (editingProduct) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }

    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Yakin ingin menghapus produk "${name}"?`)) {
      onDeleteProduct(id);
    }
  };

  const filtered = products.filter(p => {
    const matchCat = filterCategory === 'Semua' || p.category === filterCategory;
    const q = search.toLowerCase();
    const matchSearch = (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.id && p.id.toLowerCase().includes(q)) ||
                        (p.barcode && p.barcode.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="management-container">
      {/* Top Action Bar */}
      <div className="management-header">
        <div>
          <h2>Kelola Produk & Inventaris</h2>
          <p className="subtitle-text">Tambah, edit, dan perbarui stok produk Anda di kasir dan Google Sheet.</p>
        </div>

        <div className="management-top-actions">
          {sheetUrl && (
            <button 
              type="button" 
              onClick={onSyncProducts} 
              disabled={isSyncing}
              className="btn-sync-sheet"
              title="Tarik produk terbaru dari Google Sheet"
            >
              <IconRefresh size={16} className={isSyncing ? 'spin-icon' : ''} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron Google Sheet'}</span>
            </button>
          )}

          <button 
            type="button" 
            onClick={handleOpenAdd}
            className="btn-primary-action"
          >
            <IconPlus size={18} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="management-toolbar">
        <div className="search-input-wrapper">
          <IconSearch size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari produk berdasarkan nama, kode, atau barcode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-scroll-container">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              className={`category-pill ${filterCategory === c ? 'active' : ''}`}
              onClick={() => setFilterCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Produk */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Foto</th>
              <th>Kode</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th>Harga Jual</th>
              <th>Stok Tersedia</th>
              <th>Barcode</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  <IconPackage size={36} />
                  <p>Tidak ada produk ditemukan.</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="table-thumbnail" />
                    ) : (
                      <div className="table-thumbnail-placeholder">
                        <IconPackage size={18} />
                      </div>
                    )}
                  </td>
                  <td className="font-mono text-muted">{p.id}</td>
                  <td className="font-semibold">{p.name}</td>
                  <td>
                    <span className="badge-category">{p.category || 'Umum'}</span>
                  </td>
                  <td className="font-semibold">{formatRupiah(p.price)}</td>
                  <td>
                    <span className={`stock-badge ${p.stock <= 0 ? 'stock-empty' : (p.stock <= 10 ? 'stock-warning' : 'stock-ok')}`}>
                      {p.stock <= 0 ? 'Habis (0)' : `${p.stock} pcs`}
                    </span>
                  </td>
                  <td className="font-mono text-muted">{p.barcode || '-'}</td>
                  <td>
                    <div className="table-actions-cell">
                      <button 
                        type="button" 
                        onClick={() => handleOpenEdit(p)}
                        className="btn-action-edit"
                        title="Edit Produk"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDelete(p.id, p.name)}
                        className="btn-action-delete"
                        title="Hapus Produk"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah / Edit Produk */}
      {showModal && (
        <div className="modal-overlay">
          <div className="form-modal-container">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="btn-close-modal">
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>ID / Kode Produk</label>
                  <input 
                    type="text" 
                    value={formData.id} 
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="Contoh: PRD-001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kategori</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Snack">Snack</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Nama Produk *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Nasi Goreng Spesial"
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Harga Jual (Rp) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Contoh: 25000"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stok Awal *</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="Contoh: 50"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Barcode / SKU (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.barcode} 
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Contoh: 8991001"
                />
              </div>

              <div className="form-group">
                <label>URL Gambar (Opsional)</label>
                <input 
                  type="url" 
                  value={formData.imageUrl} 
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary-action">
                  <IconCheck size={18} />
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

