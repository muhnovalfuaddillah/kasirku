import React, { useRef, useState } from 'react';
import { 
  IconPrinter, 
  IconCheckCircle, 
  IconX, 
  IconCopy, 
  IconCheck, 
  IconShare 
} from './Icons';
import { formatRupiah, formatDateTime } from '../utils/formatters';

export default function ReceiptModal({ transaction, storeConfig, onClose, onNewTransaction }) {
  const receiptRef = useRef();
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = () => {
    const lines = [];
    lines.push(`🧾 *BUKTI PEMBAYARAN*`);
    lines.push(`*${storeConfig.name || 'Kasir Pintar POS'}*`);
    if (storeConfig.slogan) lines.push(`_${storeConfig.slogan}_`);
    if (storeConfig.address) lines.push(storeConfig.address);
    if (storeConfig.phone) lines.push(`Telp: ${storeConfig.phone}`);
    lines.push(`--------------------------------`);
    lines.push(`No: ${transaction.invoiceId}`);
    lines.push(`Waktu: ${formatDateTime(transaction.date)}`);
    lines.push(`Kasir: ${transaction.cashier || transaction.cashierName || 'Kasir 1'}`);
    lines.push(`Pelanggan: ${transaction.customer || 'Umum'}`);
    lines.push(`--------------------------------`);
    (transaction.items || []).forEach(item => {
      lines.push(`${item.name}`);
      lines.push(`  ${item.qty} x ${formatRupiah(item.price)} = ${formatRupiah(item.price * item.qty)}`);
    });
    lines.push(`--------------------------------`);
    lines.push(`Subtotal: ${formatRupiah(transaction.subtotal)}`);
    if (transaction.wholesaleSavings > 0) lines.push(`Hemat Grosir: -${formatRupiah(transaction.wholesaleSavings)}`);
    if (transaction.discount > 0) lines.push(`Diskon: -${formatRupiah(transaction.discount)}`);
    if (transaction.tax > 0) lines.push(`PPN: ${formatRupiah(transaction.tax)}`);
    lines.push(`*TOTAL: ${formatRupiah(transaction.total)}*`);
    lines.push(`Metode: ${transaction.paymentMethod}`);
    if (transaction.paymentMethod === 'Tunai') {
      lines.push(`Bayar: ${formatRupiah(transaction.amountPaid)}`);
      lines.push(`Kembalian: ${formatRupiah(transaction.change || 0)}`);
    }
    lines.push(`--------------------------------`);
    lines.push(storeConfig.receiptFooter || 'Terima kasih atas kunjungan Anda!');
    return lines.join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="modal-overlay">
      <div className="receipt-modal-container">
        {/* Header Modal (Tidak tercetak) */}
        <div className="receipt-modal-header no-print">
          <div className="receipt-success-badge">
            <IconCheckCircle size={20} className="icon-success" />
            <span>Transaksi Sukses!</span>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Tutup">
            <IconX size={20} />
          </button>
        </div>

        {/* Isi Struk (Tercetak di Kertas Kasir) */}
        <div className="receipt-paper" ref={receiptRef}>
          <div className="receipt-store-header">
            {storeConfig.logo && (
              <div className="receipt-logo-container">
                <img 
                  src={storeConfig.logo} 
                  alt={storeConfig.name || 'Logo Toko'} 
                  className="receipt-logo-img" 
                />
              </div>
            )}
            <h2 className="receipt-store-name">{storeConfig.name || 'Kasir POS'}</h2>
            {storeConfig.slogan && <p className="receipt-store-slogan">{storeConfig.slogan}</p>}
            {storeConfig.address && <p className="receipt-store-sub">{storeConfig.address}</p>}
            {storeConfig.phone && <p className="receipt-store-sub">Telp: {storeConfig.phone}</p>}
          </div>

          <div className="receipt-divider-dashed"></div>

          <div className="receipt-meta-grid">
            <div className="meta-line">
              <span>No. Struk</span>
              <span className="font-mono">{transaction.invoiceId}</span>
            </div>
            <div className="meta-line">
              <span>Tanggal</span>
              <span>{formatDateTime(transaction.date)}</span>
            </div>
            <div className="meta-line">
              <span>Kasir</span>
              <span>{transaction.cashier || transaction.cashierName || 'Kasir 1'}</span>
            </div>
            <div className="meta-line">
              <span>Pelanggan</span>
              <span>{transaction.customer || 'Umum'}</span>
            </div>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Tabel Item */}
          <div className="receipt-items-table">
            {((transaction.items && transaction.items.length > 0) ? transaction.items : []).map((item, idx) => (
              <div key={idx} className="receipt-item-block">
                <div className="receipt-item-name">{item.name}</div>
                <div className="receipt-item-details">
                  <span>{item.qty} x {formatRupiah(item.price)}</span>
                  <span className="receipt-item-total">{formatRupiah(item.price * item.qty)}</span>
                </div>
              </div>
            ))}
            {(!transaction.items || transaction.items.length === 0) && transaction.itemsDetail && (
              <div className="receipt-item-block">
                <div className="receipt-item-name" style={{ whiteSpace: 'pre-wrap', fontSize: '0.825rem' }}>{transaction.itemsDetail}</div>
              </div>
            )}
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Ringkasan Biaya */}
          <div className="receipt-summary-block">
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>{formatRupiah(transaction.subtotal)}</span>
            </div>
            {transaction.wholesaleSavings > 0 && (
              <div className="summary-line" style={{ color: '#059669', fontWeight: 600 }}>
                <span>Hemat Grosir:</span>
                <span>-{formatRupiah(transaction.wholesaleSavings)}</span>
              </div>
            )}
            {transaction.discount > 0 && (
              <div className="summary-line">
                <span>Diskon:</span>
                <span>-{formatRupiah(transaction.discount)}</span>
              </div>
            )}
            {transaction.tax > 0 && (
              <div className="summary-line">
                <span>PPN:</span>
                <span>{formatRupiah(transaction.tax)}</span>
              </div>
            )}
            <div className="summary-line receipt-total-bold">
              <span>TOTAL:</span>
              <span>{formatRupiah(transaction.total)}</span>
            </div>
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Rincian Bayar */}
          <div className="receipt-payment-block">
            <div className="summary-line">
              <span>Metode:</span>
              <span>{transaction.paymentMethod}</span>
            </div>
            {transaction.paymentMethod === 'Tunai' && (
              <>
                <div className="summary-line">
                  <span>Tunai Diterima:</span>
                  <span>{formatRupiah(transaction.amountPaid)}</span>
                </div>
                <div className="summary-line">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(transaction.change || 0)}</span>
                </div>
              </>
            )}
          </div>

          <div className="receipt-divider-dashed"></div>

          {/* Barcode Mock Visual */}
          <div className="receipt-barcode-visual">
            <div className="barcode-bars"></div>
            <span className="barcode-number">{transaction.invoiceId}</span>
          </div>

          {/* Catatan / Footer Struk */}
          <div className="receipt-footer-text">
            <p>{storeConfig.receiptFooter || 'Terima kasih atas kunjungan Anda!'}</p>
            <p className="powered-by">Sistem Kasir POS & Google Sheets</p>
          </div>
        </div>

        {/* Tombol Aksi Lengkap (Tidak tercetak) */}
        <div className="receipt-actions-footer no-print">
          <div className="receipt-sub-actions">
            <button 
              type="button" 
              onClick={handleShareWhatsApp}
              className="btn-action-wa"
              title="Kirim Struk ke WhatsApp"
            >
              <IconShare size={16} />
              <span>Kirim WhatsApp</span>
            </button>

            <button 
              type="button" 
              onClick={handleCopyText}
              className="btn-action-copy"
              title="Salin Ringkasan Struk"
            >
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>

          <div className="receipt-primary-actions">
            <button 
              type="button" 
              onClick={handlePrint}
              className="btn-print-receipt"
            >
              <IconPrinter size={18} />
              <span>Cetak Struk (Print)</span>
            </button>

            <button 
              type="button" 
              onClick={onNewTransaction || onClose}
              className="btn-finish-receipt"
            >
              <IconCheckCircle size={18} />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

