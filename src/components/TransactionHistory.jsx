import React, { useState } from 'react';
import { 
  IconSearch, 
  IconPrinter, 
  IconRefresh, 
  IconHistory, 
  IconCreditCard, 
  IconCash,
  IconQrCode
} from './Icons';
import { formatRupiah, formatDateTime } from '../utils/formatters';

export default function TransactionHistory({
  transactions,
  onViewReceipt,
  onSyncTransactions,
  isSyncing,
  sheetUrl
}) {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Semua');

  // Metrik Statistik
  const totalOmset = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalCount = transactions.length;
  const avgOrder = totalCount > 0 ? Math.round(totalOmset / totalCount) : 0;

  // Filter
  const filtered = transactions.filter(t => {
    const matchMethod = filterMethod === 'Semua' || t.paymentMethod === filterMethod;
    const q = search.toLowerCase();
    const matchSearch = (t.invoiceId && t.invoiceId.toLowerCase().includes(q)) ||
                        (t.customer && t.customer.toLowerCase().includes(q)) ||
                        (t.itemsDetail && t.itemsDetail.toLowerCase().includes(q));
    return matchMethod && matchSearch;
  });

  // Ekspor Transaksi ke File CSV (Excel Ready)
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('Belum ada transaksi untuk diekspor.');
      return;
    }

    const headers = ['No. Invoice', 'Tanggal', 'Pelanggan', 'Rincian Item', 'Subtotal', 'Diskon', 'Pajak', 'Total Akhir', 'Metode Bayar', 'Kasir', 'Catatan'];
    
    const rows = transactions.map(t => [
      `"${t.invoiceId || ''}"`,
      `"${t.date || ''}"`,
      `"${(t.customer || 'Umum').replace(/"/g, '""')}"`,
      `"${(t.itemsDetail || (t.items || []).map(i => `${i.name} (${i.qty}x)`).join('; ')).replace(/"/g, '""')}"`,
      t.subtotal || 0,
      t.discount || 0,
      t.tax || 0,
      t.total || 0,
      `"${t.paymentMethod || 'Tunai'}"`,
      `"${t.cashier || 'Kasir 1'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Transaksi_Kasir_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div>
          <h2>Riwayat Penjualan & Transaksi</h2>
          <p className="subtitle-text">Catatan transaksi kasir yang tersimpan di Google Sheet & memori lokal.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={exportToCSV}
            className="btn-sync-sheet"
            title="Download laporan transaksi dalam format Excel CSV"
          >
            <span>📥 Unduh CSV / Excel</span>
          </button>

          {sheetUrl && (
            <button 
              type="button" 
              onClick={onSyncTransactions} 
              disabled={isSyncing}
              className="btn-sync-sheet"
            >
              <IconRefresh size={16} className={isSyncing ? 'spin-icon' : ''} />
              <span>{isSyncing ? 'Mengambil Data...' : 'Segarkan dari Google Sheet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Statistik */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Penjualan (Omset)</div>
          <div className="stat-value text-primary">{formatRupiah(totalOmset)}</div>
          <div className="stat-sub">Dari seluruh transaksi tercatat</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Jumlah Transaksi</div>
          <div className="stat-value">{totalCount} Struk</div>
          <div className="stat-sub">Transaksi berhasil diproses</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Rata-rata Nilai Belanja</div>
          <div className="stat-value">{formatRupiah(avgOrder)}</div>
          <div className="stat-sub">Per transaksi pelanggan</div>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="history-toolbar">
        <div className="search-input-wrapper">
          <IconSearch size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari no invoice, pelanggan, atau nama produk..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="payment-filter-group">
          {['Semua', 'Tunai', 'QRIS', 'Transfer', 'Debit'].map(method => (
            <button
              key={method}
              type="button"
              className={`filter-btn ${filterMethod === method ? 'active' : ''}`}
              onClick={() => setFilterMethod(method)}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No. Invoice</th>
              <th>Waktu Transaksi</th>
              <th>Pelanggan</th>
              <th>Rincian Item</th>
              <th>Metode</th>
              <th>Total Belanja</th>
              <th>Kasir</th>
              <th style={{ textAlign: 'center' }}>Struk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  <IconHistory size={36} />
                  <p>Belum ada transaksi yang tercatat.</p>
                </td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.invoiceId}>
                  <td className="font-mono text-bold text-primary">{t.invoiceId}</td>
                  <td className="text-muted text-sm">{formatDateTime(t.date)}</td>
                  <td className="font-semibold">{t.customer || 'Umum'}</td>
                  <td className="text-sm items-cell" title={t.itemsDetail}>
                    {t.itemsDetail ? (
                      <span className="items-preview-text">{t.itemsDetail}</span>
                    ) : (
                      <span>{(t.items || []).map(i => `${i.name} (${i.qty}x)`).join(', ')}</span>
                    )}
                  </td>
                  <td>
                    <span className="badge-payment">{t.paymentMethod}</span>
                  </td>
                  <td className="font-bold text-success">{formatRupiah(t.total)}</td>
                  <td className="text-muted">{t.cashier || 'Kasir 1'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      onClick={() => onViewReceipt(t)}
                      className="btn-view-receipt"
                      title="Lihat / Cetak Ulang Struk"
                    >
                      <IconPrinter size={16} />
                      <span>Struk</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

