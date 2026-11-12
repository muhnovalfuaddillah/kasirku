import React, { useState, useMemo } from 'react';
import { 
  IconPackage, 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash, 
  IconEye, 
  IconFilter, 
  IconDownload, 
  IconUpload, 
  IconPrinter, 
  IconArchive, 
  IconCheck, 
  IconX, 
  IconAlert,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh
} from '../Icons';
import { formatRupiah } from '../../utils/formatters';

export default function DataManagement({
  products,
  categories,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onSyncProducts,
  isSyncing,
  sheetUrl,
  onLogActivity,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ARCHIVED'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Selection untuk bulk delete / bulk action
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    buyPrice: '',
    price: '',
    hasWholesale: false,
    wholesaleMinQty: '',
    wholesalePrice: '',
    wholesaleUnit: '',
    stock: '',
    minStock: '',
    unit: '',
    isArchived: false,
    image: ''
  });

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      // Search
      const matchSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Stock status / Archive status
      const isArchived = !!item.isArchived;
      if (stockFilter === 'ARCHIVED') {
        return isArchived;
      }
      if (isArchived && stockFilter !== 'ARCHIVED') {
        return false; // Jangan tampilkan yang diarsip kecuali filter arsip aktif
      }

      if (stockFilter === 'OUT_OF_STOCK') return item.stock <= 0;
      if (stockFilter === 'LOW_STOCK') return item.stock > 0 && item.stock <= 5;
      if (stockFilter === 'IN_STOCK') return item.stock > 5;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      return 0;
    });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Bulk Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Yakin ingin menghapus ${selectedIds.length} data produk terpilih secara massal?`)) {
      if (onBulkDeleteProducts) {
        onBulkDeleteProducts(selectedIds);
      } else {
        selectedIds.forEach(id => onDeleteProduct(id));
      }
      onLogActivity?.('BULK_DELETE_PRODUCT', 'Master Data', `Menghapus massal ${selectedIds.length} produk`);
      setSelectedIds([]);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      barcode: '',
      category: '',
      buyPrice: '',
      price: '',
      hasWholesale: false,
      wholesaleMinQty: '',
      wholesalePrice: '',
      wholesaleUnit: '',
      stock: '',
      minStock: '',
      unit: '',
      isArchived: false,
      image: ''
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setActiveProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || categories[0]?.name || 'Umum',
      buyPrice: product.buyPrice || 0,
      price: product.price || 0,
      hasWholesale: !!(product.hasWholesale || (Number(product.wholesalePrice) > 0 && Number(product.wholesaleMinQty) > 0)),
      wholesaleMinQty: product.wholesaleMinQty || 10,
      wholesalePrice: product.wholesalePrice || 0,
      wholesaleUnit: product.wholesaleUnit || 'dus',
      stock: product.stock || 0,
      minStock: product.minStock || 5,
      unit: product.unit || 'pcs',
      isArchived: !!product.isArchived,
      image: product.image || product.imageUrl || ''
    });
    setIsEditModalOpen(true);
  };

  // Open Detail Modal
  const openDetailModal = (product) => {
    setActiveProduct(product);
    setIsDetailModalOpen(true);
  };

  // Form Submit Add
  const handleSubmitAdd = (e) => {
    e.preventDefault();
    // Validasi duplikasi barcode
    if (formData.barcode) {
      const exists = products.find(p => p.barcode && p.barcode.toLowerCase() === formData.barcode.trim().toLowerCase());
      if (exists) {
        onShowToast?.(`Barcode/SKU "${formData.barcode}" sudah digunakan oleh produk "${exists.name}"!`, 'error');
        return;
      }
    }

    const newProd = {
      id: `PRD-${Date.now()}`,
      name: formData.name.trim(),
      barcode: formData.barcode ? formData.barcode.trim() : '',
      category: formData.category || (categories[0]?.name || 'Umum'),
      buyPrice: Number(formData.buyPrice) || 0,
      price: Number(formData.price) || 0,
      hasWholesale: Number(formData.wholesalePrice) > 0,
      wholesaleMinQty: Number(formData.wholesalePrice) > 0 ? (Number(formData.wholesaleMinQty) || 10) : 0,
      wholesalePrice: Number(formData.wholesalePrice) || 0,
      wholesaleUnit: formData.wholesaleUnit || '',
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      unit: formData.unit ? formData.unit.trim() : 'pcs',
      isArchived: !!formData.isArchived,
      image: formData.image ? formData.image.trim() : '',
      createdAt: new Date().toISOString()
    };

    onAddProduct(newProd);
    onLogActivity?.('CREATE_PRODUCT', 'Master Data', `Menambah produk baru: ${newProd.name}`);
    setIsAddModalOpen(false);
  };

  // Form Submit Edit
  const handleSubmitEdit = (e) => {
    e.preventDefault();
    if (!activeProduct) return;

    // Validasi barcode ganda
    if (formData.barcode) {
      const exists = products.find(p => p.id !== activeProduct.id && p.barcode && p.barcode.toLowerCase() === formData.barcode.trim().toLowerCase());
      if (exists) {
        onShowToast?.(`Barcode/SKU "${formData.barcode}" sudah digunakan oleh produk lain (${exists.name})!`, 'error');
        return;
      }
    }

    const updated = {
      ...activeProduct,
      name: formData.name.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      buyPrice: Number(formData.buyPrice) || 0,
      price: Number(formData.price) || 0,
      hasWholesale: Number(formData.wholesalePrice) > 0,
      wholesaleMinQty: Number(formData.wholesalePrice) > 0 ? (Number(formData.wholesaleMinQty) || 10) : 0,
      wholesalePrice: Number(formData.wholesalePrice) || 0,
      wholesaleUnit: formData.wholesaleUnit || '',
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 5,
      unit: formData.unit || 'pcs',
      isArchived: !!formData.isArchived,
      image: formData.image.trim(),
      updatedAt: new Date().toISOString()
    };

    onUpdateProduct(updated);
    onLogActivity?.('UPDATE_PRODUCT', 'Master Data', `Mengedit produk: ${updated.name}`);
    setIsEditModalOpen(false);
  };

  // Toggle Archive
  const handleToggleArchive = (product) => {
    const isNowArchived = !product.isArchived;
    const updated = { ...product, isArchived: isNowArchived };
    onUpdateProduct(updated);
    onLogActivity?.('ARCHIVE_PRODUCT', 'Master Data', `${isNowArchived ? 'Mengarsipkan' : 'Mengaktifkan kembali'} produk: ${product.name}`);
    onShowToast?.(`Produk "${product.name}" telah ${isNowArchived ? 'diarsipkan' : 'diaktifkan kembali'}!`, 'info');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      onShowToast?.('Tidak ada data produk untuk diekspor', 'warning');
      return;
    }
    const headers = ['ID', 'Nama Produk', 'Barcode/SKU', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan', 'Status'];
    const rows = products.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.barcode || ''}"`,
      `"${p.category || ''}"`,
      p.buyPrice || 0,
      p.price || 0,
      p.stock || 0,
      `"${p.unit || 'pcs'}"`,
      p.isArchived ? '"Diarsipkan"' : '"Aktif"'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Produk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onLogActivity?.('EXPORT_DATA', 'Master Data', 'Mengekspor seluruh data master produk ke CSV');
    onShowToast?.('Data produk berhasil diunduh ke CSV!', 'success');
  };

  // Cetak Dokumen / Print View
  const handlePrint = () => {
    window.print();
    onLogActivity?.('PRINT_DATA', 'Master Data', 'Mencetak daftar master produk');
  };

  // Import CSV
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
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

        let importedCount = 0;
        // Lewati header (baris 0)
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 4) {
            const name = parts[1] || parts[0];
            const barcode = parts[2] || `BRC-${Math.floor(100000 + Math.random() * 900000)}`;
            const category = parts[3] || 'Makanan';
            const price = parseFloat(parts[5] || parts[4]) || 10000;
            const stock = parseInt(parts[6] || parts[5], 10) || 10;

            const newProduct = {
              id: `PRD-${Date.now()}-${i}`,
              name,
              barcode,
              category,
              buyPrice: 0,
              price,
              stock,
              unit: 'pcs',
              isArchived: false,
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'
            };
            onAddProduct(newProduct);
            importedCount++;
          }
        }
        onShowToast?.(`Berhasil mengimpor ${importedCount} produk dari CSV!`, 'success');
        onLogActivity?.('IMPORT_DATA', 'Master Data', `Mengimpor ${importedCount} produk dari file CSV`);
      } catch (err) {
        onShowToast?.('Gagal membaca file CSV: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="admin-module-container">
      {/* Header Halaman */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <IconPackage size={24} className="text-primary" />
            Manajemen Data & Master Produk
          </h2>
          <p className="admin-page-subtitle">
            Katalog barang, barcode SKU, harga modal/jual, stok inventaris, validasi ganda, dan ekspor data
          </p>
        </div>
        <div className="admin-header-actions">
          {sheetUrl && (
            <button 
              type="button" 
              className="admin-btn-secondary"
              onClick={onSyncProducts}
              disabled={isSyncing}
              title="Sinkronkan dengan Google Sheets"
            >
              <IconRefresh size={18} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? 'Sinkronisasi...' : 'Sinkron Sheet'}
            </button>
          )}
          <button 
            type="button" 
            className="admin-btn-primary"
            onClick={openAddModal}
          >
            <IconPlus size={18} />
            Tambah Data Produk
          </button>
        </div>
      </div>

      {/* Bar Filter & Toolbar */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-row">
          <div className="search-input-wrapper flex-1">
            <IconSearch size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama barang, barcode SKU, atau kategori..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-input-search"
            />
          </div>

          <div className="filter-select-group">
            <select 
              value={selectedCategory} 
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="ALL">Semua Kategori ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select 
              value={stockFilter} 
              onChange={e => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-select"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="IN_STOCK">Tersedia (&gt; 5)</option>
              <option value="LOW_STOCK">Stok Menipis (1 - 5)</option>
              <option value="OUT_OF_STOCK">Habis (0)</option>
              <option value="ARCHIVED">Diarsipkan (Nonaktif)</option>
            </select>

            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="admin-select"
            >
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="stock_asc">Stok Paling Sedikit</option>
              <option value="stock_desc">Stok Paling Banyak</option>
            </select>
          </div>
        </div>

        {/* Action Bar Bawah (Export, Import, Bulk Delete, Cetak) */}
        <div className="toolbar-bottom-row">
          <div className="bulk-selection-info">
            {selectedIds.length > 0 ? (
              <div className="bulk-alert">
                <span><strong>{selectedIds.length}</strong> produk terpilih</span>
                <button 
                  type="button" 
                  className="btn-pill-danger"
                  onClick={handleBulkDelete}
                >
                  <IconTrash size={14} /> Hapus Massal
                </button>
                <button 
                  type="button" 
                  className="btn-pill-ghost"
                  onClick={() => setSelectedIds([])}
                >
                  Batalkan Pilihan
                </button>
              </div>
            ) : (
              <span className="text-muted text-sm">
                Menampilkan <strong>{filteredProducts.length}</strong> dari total {products.length} produk
              </span>
            )}
          </div>

          <div className="toolbar-export-buttons">
            <button 
              type="button" 
              className="btn-action-tool"
              onClick={handleExportCSV}
              title="Ekspor CSV / Excel"
            >
              <IconDownload size={16} /> Unduh CSV
            </button>

            <label className="btn-action-tool cursor-pointer" title="Impor Data dari file CSV">
              <IconUpload size={16} /> Impor CSV
              <input 
                type="file" 
                accept=".csv"
                onChange={handleImportCSV}
                style={{ display: 'none' }}
              />
            </label>

            <button 
              type="button" 
              className="btn-action-tool"
              onClick={handlePrint}
              title="Cetak Tabel Master Data"
            >
              <IconPrinter size={16} /> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Master Data */}
      <div className="admin-table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={paginatedProducts.length > 0 && selectedIds.length === paginatedProducts.length}
                    className="matrix-checkbox"
                  />
                </th>
                <th>Produk</th>
                <th>Barcode / SKU</th>
                <th>Kategori</th>
                <th>Harga Jual</th>
                <th>Stok</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty-cell" style={{ padding: '36px 16px', textAlign: 'center' }}>
                    <IconPackage size={44} className="text-muted mb-2" />
                    {products.length === 0 ? (
                      <div>
                        <h4 style={{ margin: '8px 0 4px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>Belum Ada Data Produk</h4>
                        <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Data demo telah dibersihkan. Tambahkan produk Anda secara mandiri di sini atau sinkronkan langsung dengan Google Sheets.</p>
                        <button type="button" className="admin-btn-primary" onClick={openAddModal}>
                          <IconPlus size={16} /> Tambah Produk Pertama
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: 0 }}>Tidak ada data produk yang sesuai filter pencarian.</p>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(prod => {
                  const isSelected = selectedIds.includes(prod.id);
                  const isLow = prod.stock > 0 && prod.stock <= (prod.minStock || 5);
                  const isZero = prod.stock <= 0;
                  return (
                    <tr key={prod.id} className={isSelected ? 'row-selected' : ''}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(prod.id)}
                          className="matrix-checkbox"
                        />
                      </td>
                      <td>
                        <div className="product-table-item">
                          <img 
                            src={prod.image || prod.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'} 
                            alt={prod.name}
                            className="product-table-thumb"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80';
                            }}
                          />
                          <div>
                            <div className="font-semibold text-main">{prod.name}</div>
                            <span className="text-xs text-muted">ID: {prod.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="sku-badge">{prod.barcode || '-'}</code>
                      </td>
                      <td>
                        <span className="badge-category">{prod.category || 'Umum'}</span>
                      </td>
                      <td>
                        <div>
                          <strong className="text-primary">{formatRupiah(prod.price)}</strong>
                          <span className="text-xs text-muted">/{prod.unit || 'pcs'}</span>
                        </div>
                        {Number(prod.wholesalePrice) > 0 && (
                          <div className="wholesale-badge-table mt-1" title={`Harga Grosir: Minimal ${prod.wholesaleMinQty || 10} ${prod.unit || 'pcs'}`}>
                            🏷️ Grosir: {formatRupiah(prod.wholesalePrice)} (≥{prod.wholesaleMinQty || 10} {prod.unit || 'pcs'})
                          </div>
                        )}
                        {prod.buyPrice > 0 && (
                          <div className="text-xs text-muted">Modal: {formatRupiah(prod.buyPrice)}</div>
                        )}
                      </td>
                      <td>
                        <span className={`stock-indicator ${isZero ? 'out' : isLow ? 'low' : 'safe'}`}>
                          {prod.stock} {prod.unit || 'pcs'}
                        </span>
                      </td>
                      <td>
                        {prod.isArchived ? (
                          <span className="badge-status danger">Diarsipkan</span>
                        ) : isZero ? (
                          <span className="badge-status danger">Habis</span>
                        ) : isLow ? (
                          <span className="badge-status warning">Menipis</span>
                        ) : (
                          <span className="badge-status success">Aktif</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-row-actions">
                          <button 
                            type="button" 
                            className="btn-icon-action"
                            onClick={() => openDetailModal(prod)}
                            title="Lihat Detail Produk"
                          >
                            <IconEye size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-icon-action"
                            onClick={() => openEditModal(prod)}
                            title="Edit Data Produk"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-icon-action"
                            onClick={() => handleToggleArchive(prod)}
                            title={prod.isArchived ? "Pulihkan dari Arsip" : "Arsipkan Produk"}
                          >
                            <IconArchive size={16} />
                          </button>
                          <button 
                            type="button" 
                            className="btn-icon-action text-danger"
                            onClick={() => {
                              if (window.confirm(`Hapus produk "${prod.name}" secara permanen?`)) {
                                onDeleteProduct(prod.id);
                                onLogActivity?.('DELETE_PRODUCT', 'Master Data', `Menghapus produk: ${prod.name}`);
                                onShowToast?.(`Produk ${prod.name} telah dihapus.`, 'info');
                              }
                            }}
                            title="Hapus Produk"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="admin-pagination-bar">
          <div className="pagination-info">
            Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            <span className="ml-3 text-muted">
              Tampilkan: 
              <select 
                value={itemsPerPage} 
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="select-per-page ml-2"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </span>
          </div>

          <div className="pagination-buttons">
            <button 
              type="button"
              className="btn-pagination"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <IconChevronLeft size={16} /> Sebelumnya
            </button>
            <button 
              type="button"
              className="btn-pagination"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Selanjutnya <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH PRODUK */}
      {isAddModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Tambah Data Produk Baru</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label>Nama Produk <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input"
                    placeholder="Contoh: Es Teh Manis Jumbo"
                  />
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Barcode / SKU <span className="text-muted font-normal">(Opsional)</span></label>
                    <input 
                      type="text" 
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="admin-input"
                      placeholder="Scan / ketik barcode (opsional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="admin-select"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.length > 0 ? (
                        categories.map(c => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))
                      ) : (
                        <option value="Umum">Umum</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Harga Modal (Rp)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.buyPrice}
                      onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Harga Jual (Rp) <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      min="0" 
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Pengaturan Harga Grosir (Langsung Tampil & Opsional) */}
                <div className="wholesale-config-box mb-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-main flex items-center gap-1">
                      🏷️ Harga Grosir Toko Sembako <span className="text-muted font-normal">(Opsional)</span>
                    </span>
                    {Number(formData.wholesalePrice) > 0 && (
                      <span className="badge-status success text-xs">Grosir Aktif</span>
                    )}
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="text-xs font-semibold">Harga Grosir (Rp)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.wholesalePrice || ''}
                        onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        className="admin-input font-bold text-emerald-600"
                        placeholder="0 (Kosongkan jika eceran)"
                      />
                      {formData.price > 0 && Number(formData.wholesalePrice) > 0 && (
                        <span className="text-2xs text-emerald-600 font-medium">
                          Hemat {formatRupiah(formData.price - formData.wholesalePrice)}/{formData.unit || 'pcs'}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="text-xs font-semibold">Min. Pembelian Grosir</label>
                      <input 
                        type="number" 
                        min="2"
                        value={formData.wholesaleMinQty || ''}
                        onChange={e => setFormData({ ...formData, wholesaleMinQty: e.target.value })}
                        className="admin-input"
                        placeholder="Contoh: 10"
                      />
                      <span className="text-2xs text-muted">Contoh: 10 {formData.unit || 'pcs'}</span>
                    </div>
                    <div className="form-group">
                      <label className="text-xs font-semibold">Kemasan Grosir</label>
                      <input 
                        type="text" 
                        value={formData.wholesaleUnit || ''}
                        onChange={e => setFormData({ ...formData, wholesaleUnit: e.target.value })}
                        className="admin-input"
                        placeholder="Contoh: Dus / Lusin"
                      />
                      <span className="text-2xs text-muted">Opsional (cth: 1 Dus)</span>
                    </div>
                  </div>
                </div>

                <div className="form-grid-3 mb-3">
                  <div className="form-group">
                    <label>Stok Awal</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Batas Stok Minim</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.minStock}
                      onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                      className="admin-input"
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Satuan Eceran</label>
                    <input 
                      type="text" 
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="admin-input"
                      placeholder="pcs / kg / liter"
                    />
                    <div className="unit-chips-container mt-1">
                      {['pcs', 'kg', 'liter', 'bks', 'btl', 'sachet', 'dus', 'karung', 'renceng', 'lusin'].map(u => (
                        <button 
                          key={u} 
                          type="button" 
                          className={`chip-unit ${formData.unit === u ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, unit: u })}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>URL Gambar Produk <span className="text-muted font-normal">(Opsional)</span></label>
                  <input 
                    type="url" 
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    className="admin-input"
                    placeholder="https://... (Kosongkan jika tidak ada)"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="admin-btn-primary">
                  <IconCheck size={18} /> Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PRODUK */}
      {isEditModalOpen && activeProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Edit Data Produk: {activeProduct.name}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label>Nama Produk <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Barcode / SKU <span className="text-muted font-normal">(Opsional)</span></label>
                    <input 
                      type="text" 
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="admin-input"
                      placeholder="Scan / ketik barcode (opsional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="admin-select"
                    >
                      {categories.length > 0 ? (
                        categories.map(c => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))
                      ) : (
                        <option value="Umum">Umum</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-group">
                    <label>Harga Modal (Rp)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.buyPrice}
                      onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Harga Jual (Rp) <span className="text-danger">*</span></label>
                    <input 
                      type="number" 
                      min="0" 
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>

                {/* Pengaturan Harga Grosir (Langsung Tampil & Opsional) */}
                <div className="wholesale-config-box mb-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-main flex items-center gap-1">
                      🏷️ Harga Grosir Toko Sembako <span className="text-muted font-normal">(Opsional)</span>
                    </span>
                    {Number(formData.wholesalePrice) > 0 && (
                      <span className="badge-status success text-xs">Grosir Aktif</span>
                    )}
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="text-xs font-semibold">Harga Grosir (Rp)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.wholesalePrice || ''}
                        onChange={e => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        className="admin-input font-bold text-emerald-600"
                        placeholder="0 (Kosongkan jika eceran)"
                      />
                      {formData.price > 0 && Number(formData.wholesalePrice) > 0 && (
                        <span className="text-2xs text-emerald-600 font-medium">
                          Hemat {formatRupiah(formData.price - formData.wholesalePrice)}/{formData.unit || 'pcs'}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="text-xs font-semibold">Min. Pembelian Grosir</label>
                      <input 
                        type="number" 
                        min="2"
                        value={formData.wholesaleMinQty || ''}
                        onChange={e => setFormData({ ...formData, wholesaleMinQty: e.target.value })}
                        className="admin-input"
                        placeholder="10 / 12 / 40"
                      />
                      <span className="text-2xs text-muted">Contoh: 10 {formData.unit || 'pcs'}</span>
                    </div>
                    <div className="form-group">
                      <label className="text-xs font-semibold">Kemasan Grosir</label>
                      <input 
                        type="text" 
                        value={formData.wholesaleUnit || ''}
                        onChange={e => setFormData({ ...formData, wholesaleUnit: e.target.value })}
                        className="admin-input"
                        placeholder="Dus / Karung / Lusin"
                      />
                      <span className="text-2xs text-muted">Opsional (cth: 1 Dus)</span>
                    </div>
                  </div>
                </div>

                <div className="form-grid-3 mb-3">
                  <div className="form-group">
                    <label>Stok Tersedia</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Batas Stok Minim</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.minStock}
                      onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Satuan Eceran</label>
                    <input 
                      type="text" 
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="admin-input"
                    />
                    <div className="unit-chips-container mt-1">
                      {['pcs', 'kg', 'liter', 'bks', 'btl', 'sachet', 'dus', 'karung', 'renceng', 'lusin'].map(u => (
                        <button 
                          key={u} 
                          type="button" 
                          className={`chip-unit ${formData.unit === u ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, unit: u })}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label>URL Gambar</label>
                  <input 
                    type="url" 
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    className="admin-input"
                  />
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={formData.isArchived}
                      onChange={e => setFormData({ ...formData, isArchived: e.target.checked })}
                      className="matrix-checkbox"
                    />
                    <span>Arsipkan produk ini (sembunyikan dari layar kasir POS)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="admin-btn-primary">
                  <IconCheck size={18} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PRODUK */}
      {isDetailModalOpen && activeProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="modal-header">
              <h3>Detail Produk</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsDetailModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="product-detail-preview">
                <img 
                  src={activeProduct.image || activeProduct.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'} 
                  alt={activeProduct.name}
                  className="product-detail-img"
                />
                <div className="product-detail-info">
                  <h4>{activeProduct.name}</h4>
                  <div className="text-muted text-sm mb-2">ID: {activeProduct.id}</div>
                  <div className="detail-meta-pill">
                    <span className="badge-category">{activeProduct.category || 'Umum'}</span>
                    <span className="sku-badge">{activeProduct.barcode || 'NO-SKU'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Harga Jual</span>
                  <strong className="stat-val text-primary">{formatRupiah(activeProduct.price)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Harga Modal</span>
                  <strong className="stat-val">{formatRupiah(activeProduct.buyPrice || 0)}</strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Margin Keuntungan</span>
                  <strong className="stat-val text-success">
                    {formatRupiah(Math.max(0, activeProduct.price - (activeProduct.buyPrice || 0)))}
                  </strong>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Stok Tersedia</span>
                  <strong className="stat-val">{activeProduct.stock} {activeProduct.unit || 'pcs'}</strong>
                </div>
              </div>

              <div className="detail-table-list">
                <div className="detail-item-row">
                  <span className="text-muted">Batas Stok Minimum:</span>
                  <span>{activeProduct.minStock || 5} {activeProduct.unit || 'pcs'}</span>
                </div>
                {Number(activeProduct.wholesalePrice) > 0 && (
                  <div className="detail-item-row" style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', padding: '6px 10px' }}>
                    <span className="text-success font-semibold">🏷️ Skema Grosir Sembako:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300">
                      Min {activeProduct.wholesaleMinQty || 10} {activeProduct.unit || 'pcs'} ({activeProduct.wholesaleUnit || 'Grosir'}) @{formatRupiah(activeProduct.wholesalePrice)}
                    </strong>
                  </div>
                )}
                <div className="detail-item-row">
                  <span className="text-muted">Status Produk:</span>
                  <span>{activeProduct.isArchived ? 'Diarsipkan (Nonaktif)' : 'Aktif Dijual'}</span>
                </div>
                <div className="detail-item-row">
                  <span className="text-muted">Sinkron Google Sheets:</span>
                  <span>{sheetUrl ? 'Terkoneksi' : 'Lokal Saja'}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="admin-btn-secondary" 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(activeProduct);
                }}
              >
                <IconEdit size={16} /> Edit Produk Ini
              </button>
              <button type="button" className="admin-btn-primary" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

