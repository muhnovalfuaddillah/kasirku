import React, { useState, useRef, useEffect } from 'react';
import { 
  IconPlus, 
  IconMinus, 
  IconTrash, 
  IconCart, 
  IconCash, 
  IconQrCode, 
  IconCreditCard,
  IconCheckCircle
} from './Icons';
import { formatRupiah, formatThousands, parseThousands, terbilangRupiah } from '../utils/formatters';

export default function CartPanel({
  cart,
  updateQuantity,
  removeFromCart,
  clearCart,
  onCheckout,
  storeConfig,
  isProcessing
}) {
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashGiven, setCashGiven] = useState('');
  const cashInputRef = useRef(null);

  // Helper fungsi untuk mengecek & menghitung harga grosir toko sembako
  const isWholesaleActive = (item) => {
    const wholesalePrice = Number(item.wholesalePrice) || 0;
    const minQty = Number(item.wholesaleMinQty) || 2;
    return wholesalePrice > 0 && item.quantity >= minQty;
  };

  const getItemEffectivePrice = (item) => {
    return isWholesaleActive(item) ? Number(item.wholesalePrice) : Number(item.price);
  };

  // Perhitungan Subtotal (otomatis menerapkan harga grosir jika jumlah memenuhi syarat)
  const subtotal = cart.reduce((acc, item) => acc + getItemEffectivePrice(item) * item.quantity, 0);

  // Total penghematan dari harga grosir
  const totalWholesaleSavings = cart.reduce((acc, item) => {
    if (isWholesaleActive(item)) {
      return acc + (Number(item.price) - Number(item.wholesalePrice)) * item.quantity;
    }
    return acc;
  }, 0);

  const discountAmount = Math.round((subtotal * (discountPercent || 0)) / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyTax ? Math.round(taxableAmount * (storeConfig.taxRate || 10) / 100) : 0;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);

  // Perhitungan Kembalian dengan pemisah ribuan titik (.)
  const numericCash = parseThousands(cashGiven);
  const change = paymentMethod === 'Tunai' ? numericCash - grandTotal : 0;
  const isCashSufficient = paymentMethod !== 'Tunai' || numericCash >= grandTotal;

  const handleCashChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setCashGiven('');
    } else {
      setCashGiven(Number(digits).toLocaleString('id-ID'));
    }
  };

  const handleQuickCash = (amount) => {
    if (amount === 'pas') {
      setCashGiven(grandTotal > 0 ? grandTotal.toLocaleString('id-ID') : '');
    } else {
      setCashGiven(Number(amount).toLocaleString('id-ID'));
    }
  };

  // Keyboard Shortcuts Kasir POS (F2, F4, F8, F9, F10)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Fokus input uang bayar
      if (e.key === 'F2') {
        e.preventDefault();
        if (paymentMethod !== 'Tunai') setPaymentMethod('Tunai');
        setTimeout(() => {
          cashInputRef.current?.focus();
          cashInputRef.current?.select();
        }, 50);
        return;
      }

      // F4: Uang Pas
      if (e.key === 'F4') {
        e.preventDefault();
        if (grandTotal > 0) {
          if (paymentMethod !== 'Tunai') setPaymentMethod('Tunai');
          setCashGiven(grandTotal.toLocaleString('id-ID'));
        }
        return;
      }

      // F8: Ganti metode pembayaran
      if (e.key === 'F8') {
        e.preventDefault();
        const methods = ['Tunai', 'QRIS', 'Transfer', 'Debit'];
        const nextIdx = (methods.indexOf(paymentMethod) + 1) % methods.length;
        setPaymentMethod(methods[nextIdx]);
        return;
      }

      // F9: Reset Keranjang
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && window.confirm('Kosongkan semua pesanan di keranjang?')) {
          clearCart();
        }
        return;
      }

      // F10: Selesai Bayar & Cetak Struk
      if (e.key === 'F10') {
        e.preventDefault();
        handleSubmit(e);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paymentMethod, grandTotal, cart, isCashSufficient, isProcessing, cashGiven]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!isCashSufficient) {
      alert('Uang yang dibayarkan kurang dari total belanja.');
      return;
    }

    onCheckout({
      customer: customerName.trim() || 'Umum',
      notes: notes.trim(),
      items: cart.map(item => {
        const wholesaleApplied = isWholesaleActive(item);
        const effectivePrice = getItemEffectivePrice(item);
        return {
          id: item.id,
          name: item.name + (wholesaleApplied ? ` (Grosir ≥${item.wholesaleMinQty})` : ''),
          price: effectivePrice,
          regularPrice: item.price,
          isWholesale: wholesaleApplied,
          unit: item.unit || 'pcs',
          qty: item.quantity,
          total: effectivePrice * item.quantity
        };
      }),
      subtotal,
      wholesaleSavings: totalWholesaleSavings,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'Tunai' ? numericCash : grandTotal,
      change: paymentMethod === 'Tunai' ? Math.max(0, change) : 0,
      cashier: storeConfig.cashierName || 'Kasir 1'
    });

    // Reset local input setelah checkout
    setCustomerName('');
    setNotes('');
    setCashGiven('');
    setDiscountPercent(0);
  };

  if (cart.length === 0) {
    return (
      <div className="cart-panel empty-cart-container">
        <div className="empty-cart-state">
          <div className="empty-cart-icon">
            <IconCart size={48} />
          </div>
          <h3>Keranjang Masih Kosong</h3>
          <p>Pilih produk atau scan barcode di katalog sebelah kiri untuk mulai transaksi kasir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-panel">
      {/* Header Cart */}
      <div className="cart-header">
        <div className="cart-header-title">
          <IconCart size={20} />
          <h3>Pesanan Kasir</h3>
          <span className="cart-total-badge">{cart.reduce((a, b) => a + b.quantity, 0)} item</span>
        </div>
        <button 
          type="button" 
          onClick={clearCart} 
          className="btn-clear-cart"
          title="Kosongkan Semua"
        >
          <IconTrash size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* Input Pelanggan */}
      <div className="cart-customer-section">
        <div className="cart-customer-input">
          <input 
            type="text" 
            placeholder="Nama Pelanggan (opsional)..." 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input-customer"
          />
          {customerName && (
            <button 
              type="button" 
              onClick={() => setCustomerName('')} 
              className="btn-clear-customer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Daftar Item di Keranjang (Scrollable secara mandiri jika produk banyak) */}
      <div className="cart-items-list">
        {cart.map((item) => {
          const wholesaleApplied = isWholesaleActive(item);
          const effectivePrice = getItemEffectivePrice(item);
          const itemSubtotal = effectivePrice * item.quantity;
          const neededForWholesale = Number(item.wholesalePrice) > 0 && item.quantity < (Number(item.wholesaleMinQty) || 10)
            ? (Number(item.wholesaleMinQty) || 10) - item.quantity
            : 0;

          return (
            <div key={item.id} className={`cart-item-row ${wholesaleApplied ? 'wholesale-row-active' : ''}`}>
              <div className="cart-item-info">
                <div className="cart-item-name">
                  {item.name}
                  {wholesaleApplied && (
                    <span className="cart-badge-grosir">🏷️ Grosir</span>
                  )}
                </div>
                <div className="cart-item-price-unit">
                  {wholesaleApplied ? (
                    <div className="price-wholesale-flex">
                      <span className="price-struck">{formatRupiah(item.price)}</span>
                      <strong className="text-emerald-600">{formatRupiah(effectivePrice)}/{item.unit || 'pcs'}</strong>
                    </div>
                  ) : (
                    <span>{formatRupiah(item.price)}/{item.unit || 'pcs'}</span>
                  )}
                </div>
                {neededForWholesale > 0 && Number(item.wholesalePrice) > 0 && (
                  <button 
                    type="button" 
                    className="cart-wholesale-tip-btn" 
                    onClick={() => updateQuantity(item.id, Number(item.wholesaleMinQty))}
                    title={`Klik untuk otomatis ubah jumlah ke ${item.wholesaleMinQty} ${item.unit || 'pcs'} (Harga Grosir)`}
                  >
                    💡 Beli {neededForWholesale} lagi dapat grosir @{formatRupiah(item.wholesalePrice)}! <u>(Set {item.wholesaleMinQty})</u>
                  </button>
                )}
              </div>

              <div className="cart-item-actions">
                <div className="qty-controls">
                  <button 
                    type="button" 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="qty-btn"
                  >
                    <IconMinus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 1) {
                        updateQuantity(item.id, Math.min(val, item.stock));
                      }
                    }}
                    className="qty-input-direct"
                    title="Ketik jumlah langsung (misal: 10, 20, 40)"
                  />
                  <button 
                    type="button" 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="qty-btn"
                    disabled={item.quantity >= item.stock}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  {formatRupiah(itemSubtotal)}
                </div>

                <button 
                  type="button" 
                  onClick={() => removeFromCart(item.id)}
                  className="cart-item-remove"
                  title="Hapus"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bagian Pembayaran Tetap di Bawah (Tidak ikut tergulung saat produk banyak) */}
      <div className="cart-checkout-footer">
        {/* Ringkasan Biaya & Diskon */}
        <div className="cart-summary-section">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>

        {totalWholesaleSavings > 0 && (
          <div className="summary-row wholesale-savings-row">
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">🏷️ Hemat Harga Grosir</span>
            <strong className="text-emerald-600 dark:text-emerald-400">-{formatRupiah(totalWholesaleSavings)}</strong>
          </div>
        )}

        <div className="summary-row summary-interactive">
          <div className="discount-label">
            <span>Diskon:</span>
            <div className="discount-inputs">
              {[0, 5, 10, 15, 20, 25, 50].map(pct => (
                <button 
                  key={pct}
                  type="button" 
                  className={`discount-chip ${discountPercent === pct ? 'active' : ''}`}
                  onClick={() => setDiscountPercent(pct)}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          {discountAmount > 0 && <span className="text-discount">-{formatRupiah(discountAmount)}</span>}
        </div>

        <div className="summary-row summary-interactive">
          <label className="checkbox-tax-label">
            <input 
              type="checkbox" 
              checked={applyTax} 
              onChange={(e) => setApplyTax(e.target.checked)} 
            />
            <span>PPN ({storeConfig.taxRate || 10}%)</span>
          </label>
          <span>{applyTax ? formatRupiah(taxAmount) : 'Rp 0'}</span>
        </div>

        <div className="summary-row grand-total-row">
          <span>Total Akhir</span>
          <span className="grand-total-amount">{formatRupiah(grandTotal)}</span>
        </div>
      </div>

      {/* Metode Pembayaran */}
      <div className="payment-method-section">
        <div className="section-label">Metode Pembayaran</div>
        <div className="payment-options-grid">
          {[
            { id: 'Tunai', icon: IconCash, label: 'Tunai' },
            { id: 'QRIS', icon: IconQrCode, label: 'QRIS' },
            { id: 'Transfer', icon: IconCreditCard, label: 'Transfer' },
            { id: 'Debit', icon: IconCreditCard, label: 'Debit' }
          ].map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                className={`payment-option-btn ${paymentMethod === m.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(m.id)}
              >
                <Icon size={18} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagian Uang Tunai & Kembalian */}
      {paymentMethod === 'Tunai' && (
        <div className="cash-input-section">
          <div className="cash-input-row">
            <div className="cash-label-row">
              <label htmlFor="input-cash-field" className="font-semibold text-main">Uang Diterima:</label>
              <kbd className="shortcut-pill-small" title="Shortcut F2 untuk fokus ke input uang">F2</kbd>
            </div>
            <div className="cash-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input 
                id="input-cash-field"
                ref={cashInputRef}
                type="text" 
                inputMode="numeric"
                placeholder="0" 
                value={cashGiven}
                onChange={handleCashChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                className="input-cash"
              />
              {cashGiven && (
                <button 
                  type="button" 
                  onClick={() => setCashGiven('')}
                  className="btn-clear-cash"
                  title="Hapus nominal"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Konfirmasi Terbilang Otomatis (Mencegah Salah Input Nol) */}
          {numericCash > 0 && (
            <div className="cash-terbilang-banner">
              <span className="terbilang-prefix">Terbilang:</span>
              <strong className="terbilang-content">{terbilangRupiah(numericCash)}</strong>
            </div>
          )}

          {/* Quick Cash Buttons */}
          <div className="quick-cash-row">
            <button 
              type="button" 
              onClick={() => handleQuickCash('pas')} 
              className="quick-cash-btn pas"
              title="Shortcut [F4]"
            >
              Uang Pas [F4]
            </button>
            {[10000, 20000, 50000, 100000, 200000, 500000].map(amt => (
              <button 
                key={amt} 
                type="button" 
                onClick={() => handleQuickCash(amt)} 
                className="quick-cash-btn"
              >
                {amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>

          {/* Kembalian */}
          {numericCash > 0 && (
            <div className={`change-display-box ${isCashSufficient ? 'change-valid' : 'change-short'}`}>
              <span>{isCashSufficient ? 'Kembalian:' : 'Uang Kurang:'}</span>
              <strong>{formatRupiah(Math.abs(change))}</strong>
            </div>
          )}
        </div>
      )}

      {/* Tombol Eksekusi Bayar */}
      <button 
        type="button" 
        onClick={handleSubmit} 
        disabled={isProcessing || !isCashSufficient}
        className="btn-checkout"
        title="Shortcut [F10] atau tekan Enter saat di kolom uang"
      >
        {isProcessing ? (
          <span className="spinner-text">Menyimpan ke Google Sheet...</span>
        ) : (
          <>
            <IconCheckCircle size={20} />
            <span>Bayar & Simpan ({formatRupiah(grandTotal)}) <kbd className="shortcut-kbd-checkout">F10</kbd></span>
          </>
        )}
      </button>
      </div>
    </div>
  );
}

