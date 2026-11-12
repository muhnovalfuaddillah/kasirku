import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IconSearch, IconPlus, IconPackage, IconCart, IconBarcode, IconCamera } from './Icons';
import { formatRupiah } from '../utils/formatters';
import { playBeep } from '../utils/audio';
import CartPanel from './CartPanel';
import CameraBarcodeScanner from './CameraBarcodeScanner';

export default function PosView({
  products,
  cart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  onCheckout,
  storeConfig,
  isProcessing,
  onOpenAdminLogin,
  isSheetConnected
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'
  const [scanAlert, setScanAlert] = useState(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus ke input pencarian / barcode saat pertama kali halaman kasir dibuka
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Pemrosesan Pemindaian Barcode & Pencarian Nama via Enter Langsung Masuk Keranjang
  const processBarcodeScan = (rawInput) => {
    if (!rawInput) return;
    let code = rawInput.trim();
    let multiplier = 1;

    // Dukungan kuantitas: misal "8991001*12" atau "12*8991001" atau "indomie*5" atau "5*indomie"
    if (code.includes('*')) {
      const parts = code.split('*');
      if (!isNaN(parts[0]) && isNaN(parts[1])) {
        multiplier = Math.max(1, parseInt(parts[0], 10) || 1);
        code = parts[1].trim();
      } else if (isNaN(parts[0]) && !isNaN(parts[1])) {
        code = parts[0].trim();
        multiplier = Math.max(1, parseInt(parts[1], 10) || 1);
      } else {
        code = parts[0].trim();
        multiplier = Math.max(1, parseInt(parts[1], 10) || 1);
      }
    }

    const searchKey = code.toLowerCase();

    // 1. Prioritas 1: Cocokkan persis (Barcode, ID produk, atau Nama lengkap)
    let matchedProduct = products.find(p => 
      (p.barcode && p.barcode.toLowerCase() === searchKey) ||
      (p.id && p.id.toLowerCase() === searchKey) ||
      (p.name && p.name.toLowerCase() === searchKey)
    );

    // 2. Prioritas 2: Pencarian sebagian nama (Partial Name Match)
    // Memungkinkan kasir ketik "beras", "indomie", "minyak", lalu tekan Enter untuk langsung masuk keranjang
    if (!matchedProduct) {
      // Cari produk yang namanya mengandung kata pencarian (utamakan kategori yang sedang dipilih)
      const matchesInCategory = products.filter(p => {
        const inCat = selectedCategory === 'Semua' || p.category === selectedCategory;
        const inName = p.name && p.name.toLowerCase().includes(searchKey);
        const inBarcode = p.barcode && p.barcode.toLowerCase().includes(searchKey);
        return inCat && (inName || inBarcode);
      });

      if (matchesInCategory.length > 0) {
        // Utamakan produk yang stoknya masih ada
        matchedProduct = matchesInCategory.find(p => p.stock > 0) || matchesInCategory[0];
      } else {
        // Jika tidak ada di kategori aktif, cari di seluruh daftar produk
        const allMatches = products.filter(p => 
          (p.name && p.name.toLowerCase().includes(searchKey)) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchKey)) ||
          (p.category && p.category.toLowerCase().includes(searchKey))
        );
        if (allMatches.length > 0) {
          matchedProduct = allMatches.find(p => p.stock > 0) || allMatches[0];
        }
      }
    }

    if (matchedProduct) {
      if (matchedProduct.stock <= 0) {
        setScanAlert({
          type: 'warning',
          message: `⚠️ Stok "${matchedProduct.name}" habis!`
        });
        setTimeout(() => setScanAlert(null), 3500);
        return;
      }

      addToCart(matchedProduct, multiplier);
      playBeep();
      setScanAlert({
        type: 'success',
        message: `✓ [BEEP] ${matchedProduct.name} ${multiplier > 1 ? `(${multiplier} ${matchedProduct.unit || 'pcs'})` : '(+1)'} masuk keranjang!`
      });
      setTimeout(() => setScanAlert(null), 3000);
      setSearchQuery('');
    } else {
      setScanAlert({
        type: 'error',
        message: `❌ Produk atau barcode "${code}" tidak ditemukan!`
      });
      setTimeout(() => setScanAlert(null), 3500);
    }
  };

  // Interceptor Pemindai Barcode Fisik Global (USB / Wireless 2.4G / Bluetooth)
  // Memungkinkan kasir memindai barcode kapan saja tanpa harus mengklik kolom pencarian terlebih dahulu!
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      // Shortcut F1 untuk fokus kolom cari
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Abaikan tombol fungsi F2-F12 atau shortcut browser (Ctrl/Alt/Meta)
      if (e.key.startsWith('F') && e.key.length > 1) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.id === 'input-cash-field' ||
        activeEl.classList.contains('input-customer') ||
        activeEl.classList.contains('qty-input-direct') ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      // Jika kursor berada di kolom pencarian, biarkan handleSearchKeyDown yang menangani saat Enter
      if (activeEl === searchInputRef.current) return;
      // Jika kasir sedang mengetik di input khusus (misal nama pelanggan atau uang diterima), jangan tangkap
      if (isInput) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      // Barcode scanner mengirim rentetan tombol sangat cepat (< 50ms)
      // Jika jeda > 250ms, kemungkinan ketukan manusia biasa, reset buffer
      if (timeDiff > 250) {
        barcodeBuffer = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.trim().length >= 2) {
          e.preventDefault();
          processBarcodeScan(barcodeBuffer.trim());
          barcodeBuffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products]);

  // Hitung ringkasan cart untuk floating bar mobile
  const cartTotalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Ekstrak kategori unik & hitung jumlah produk per kategori
  const { categories, categoryCounts } = useMemo(() => {
    const counts = { 'Semua': products.length };
    const set = new Set(['Semua']);
    products.forEach(p => {
      if (p.category) {
        set.add(p.category);
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return { categories: Array.from(set), categoryCounts: counts };
  }, [products]);

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  };

  const getCategoryClass = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('makan') || c.includes('food')) return 'fallback-theme-orange';
    if (c.includes('minum') || c.includes('kopi') || c.includes('coffee') || c.includes('drink')) return 'fallback-theme-blue';
    if (c.includes('snack') || c.includes('cemil')) return 'fallback-theme-amber';
    if (c.includes('roti') || c.includes('dessert') || c.includes('kue')) return 'fallback-theme-pink';
    return 'fallback-theme-slate';
  };

  // Filter produk
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = (p.name && p.name.toLowerCase().includes(q)) ||
                          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
                          (p.id && p.id.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handler Enter pada kolom pencarian / scan barcode
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      processBarcodeScan(searchQuery);
    }
  };

  return (
    <div className="pos-layout-wrapper">
      {/* Tab Switcher Khusus Layar Tablet / HP (<= 1024px) */}
      <div className="mobile-pos-switcher">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setMobileTab('catalog')}
        >
          <IconPackage size={18} />
          <span>Katalog Produk</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => setMobileTab('cart')}
        >
          <div className="nav-icon-wrapper">
            <IconCart size={18} />
            {cartTotalQty > 0 && <span className="cart-badge">{cartTotalQty}</span>}
          </div>
          <span>Keranjang Kasir {cartTotalQty > 0 ? `(${formatRupiah(cartTotalPrice)})` : ''}</span>
        </button>
      </div>

      <div className="pos-layout">
        {/* Kolom Kiri: Katalog Produk & Scan Barcode */}
        <div className={`pos-catalog-column ${mobileTab !== 'catalog' ? 'mobile-hidden' : ''}`}>
          {/* Search & Kategori Bar */}
          <div className="catalog-toolbar">
            <div className="search-bar-top-row">
              <div className="search-input-wrapper">
                <IconSearch size={18} className="search-icon" />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode / cari nama produk [F1] (Enter)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')} 
                    className="btn-clear-search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="btn-camera-scan-trigger"
                title="Buka Kamera HP / Laptop / Webcam untuk Scan Barcode"
              >
                <IconCamera size={16} />
                <span>Scan Kamera</span>
              </button>
            </div>

            {/* Notifikasi Pop-up Visual Saat Barcode Discan */}
            {scanAlert && (
              <div className={`scan-alert-floating-banner alert-${scanAlert.type}`}>
                <IconBarcode size={18} />
                <span>{scanAlert.message}</span>
              </div>
            )}

            <div className="category-scroll-container">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <span>{cat}</span>
                  <span className="cat-pill-count">{categoryCounts[cat] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Produk */}
          {products.length === 0 ? (
            <div className="no-products-found clean-slate-empty">
              <div className="empty-icon-halo">
                <IconPackage size={52} />
              </div>
              <h3 className="empty-title">Katalog Produk Masih Bersih & Kosong</h3>
              <p className="empty-desc">
                Data demo telah dibersihkan. Anda dapat menambahkan produk pertama Anda secara mandiri di <strong>Panel Admin</strong>, atau data produk di <strong>Google Sheets</strong> Anda akan tersinkron otomatis ke sini.
              </p>
              {onOpenAdminLogin && (
                <button 
                  type="button" 
                  onClick={onOpenAdminLogin}
                  className="btn-open-admin-add"
                >
                  <IconPlus size={18} /> Masuk Admin & Tambah Produk
                </button>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-found">
              <IconPackage size={48} />
              <p>Tidak ada produk yang cocok dengan pencarian.</p>
              {(searchQuery || selectedCategory !== 'Semua') && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
                  className="btn-reset-filters"
                >
                  Tampilkan Semua Produk
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => {
                const inCart = cart.find(item => item.id === product.id);
                const isOutOfStock = product.stock <= 0;
                const cartQty = inCart ? inCart.quantity : 0;
                const remainingStock = Math.max(0, product.stock - cartQty);
                const imgSrc = product.image || product.imageUrl;
                const initials = getInitials(product.name);
                const fallbackClass = getCategoryClass(product.category);

                return (
                  <div 
                    key={product.id} 
                    className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => !isOutOfStock && remainingStock > 0 && addToCart(product)}
                  >
                    <div className="product-image-container">
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={product.name} 
                          className="product-image"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`product-image-fallback ${fallbackClass}`} 
                        style={{ display: imgSrc ? 'none' : 'flex' }}
                      >
                        <span className="fallback-initials">{initials}</span>
                        <span className="fallback-cat-name">{product.category || 'POS'}</span>
                      </div>

                      <span className="product-category-tag">{product.category || 'Umum'}</span>
                      
                      {cartQty > 0 && (
                        <span className={`product-in-cart-pill ${Number(product.wholesalePrice) > 0 && cartQty >= (Number(product.wholesaleMinQty) || 10) ? 'wholesale-active' : ''}`}>
                          ✓ {cartQty} di keranjang {Number(product.wholesalePrice) > 0 && cartQty >= (Number(product.wholesaleMinQty) || 10) ? '• Grosir' : ''}
                        </span>
                      )}
                    </div>

                    <div className="product-details">
                      <h4 className="product-title">{product.name}</h4>
                      <div className="product-price-row">
                        <span className="product-price">
                          {formatRupiah(product.price)}
                          <span className="unit-label" style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 400 }}>/{product.unit || 'pcs'}</span>
                        </span>
                        <span className={`product-stock-tag ${remainingStock <= 5 ? 'stock-low' : ''}`}>
                          {product.stock <= 0 ? 'Habis' : `Stok: ${remainingStock}`}
                        </span>
                      </div>

                      {Number(product.wholesalePrice) > 0 && (
                        <div className="product-wholesale-badge-pos" title={`Beli min ${product.wholesaleMinQty || 10} ${product.unit || 'pcs'} otomatis dapat harga grosir!`}>
                          <span className="wholesale-tag-badge">🏷️ Grosir:</span>
                          <span className="wholesale-tag-text">
                            ≥{product.wholesaleMinQty || 10} {product.unit || 'pcs'} @{formatRupiah(product.wholesalePrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button 
                      type="button"
                      className="btn-add-card"
                      disabled={isOutOfStock || remainingStock <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                    >
                      <IconPlus size={16} />
                      <span>{remainingStock <= 0 ? 'Habis' : 'Tambah'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Action Bar untuk Mobile/Tablet saat ada item di cart */}
          {cartTotalQty > 0 && mobileTab === 'catalog' && (
            <div className="mobile-floating-cart-bar" onClick={() => setMobileTab('cart')}>
              <div className="floating-cart-info">
                <div className="floating-cart-badge">
                  <IconCart size={18} />
                  <span>{cartTotalQty} Item</span>
                </div>
                <div className="floating-cart-price">
                  {formatRupiah(cartTotalPrice)}
                </div>
              </div>
              <button type="button" className="btn-floating-pay">
                <span>Lihat Keranjang & Bayar ➔</span>
              </button>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Keranjang Kasir (Full Height & Panel Bayar Terkunci di Bawah) */}
        <div className={`pos-cart-column ${mobileTab !== 'cart' ? 'mobile-hidden' : ''}`}>
          {mobileTab === 'cart' && (
            <button 
              type="button" 
              onClick={() => setMobileTab('catalog')}
              className="btn-back-to-catalog"
            >
              ← Kembali Pilih Produk Lain
            </button>
          )}

          <CartPanel 
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            onCheckout={onCheckout}
            storeConfig={storeConfig}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Modal Kamera Scanner Barcode (HP / Laptop Webcam) */}
      <CameraBarcodeScanner 
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={processBarcodeScan}
      />
    </div>
  );
}
