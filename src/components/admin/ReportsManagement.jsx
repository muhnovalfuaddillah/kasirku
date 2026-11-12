import React, { useState, useMemo } from 'react';
import { 
  IconBarChart, 
  IconPieChart, 
  IconCalendar, 
  IconDownload, 
  IconPrinter, 
  IconFilter, 
  IconSearch, 
  IconFileText, 
  IconClock,
  IconCheckCircle
} from '../Icons';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

export default function ReportsManagement({
  transactions,
  products,
  categories,
  onLogActivity,
  onShowToast
}) {
  const [periodType, setPeriodType] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Filter transaksi berdasarkan periode dan filter lain
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    return transactions.filter(trx => {
      const trxDate = new Date(trx.date);

      // Filter Rentang Tanggal
      if (periodType === 'daily') {
        const isToday = trxDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (periodType === 'weekly') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (trxDate < oneWeekAgo) return false;
      } else if (periodType === 'monthly') {
        const isThisMonth = trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
        if (!isThisMonth) return false;
      } else if (periodType === 'yearly') {
        const isThisYear = trxDate.getFullYear() === now.getFullYear();
        if (!isThisYear) return false;
      } else if (periodType === 'custom') {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (trxDate < start || trxDate > end) return false;
      }

      // Filter Metode Pembayaran
      if (selectedPaymentMethod !== 'ALL' && trx.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Filter Kategori (cek apakah ada item yang kategorinya sesuai)
      if (selectedCategory !== 'ALL') {
        const hasCategory = trx.items?.some(item => {
          const prod = products.find(p => p.id === item.id);
          return prod?.category === selectedCategory;
        });
        if (!hasCategory) return false;
      }

      return true;
    });
  }, [transactions, products, periodType, startDate, endDate, selectedPaymentMethod, selectedCategory]);

  // Kalkulasi Metrik Laporan
  const totalOmset = filteredTransactions.reduce((acc, t) => acc + (t.total || 0), 0);
  const totalTrx = filteredTransactions.length;
  const avgOrderValue = totalTrx > 0 ? Math.round(totalOmset / totalTrx) : 0;
  
  // Total item terjual & estimasi margin keuntungan
  let totalItemsSold = 0;
  let totalEstimatedProfit = 0;
  const productSalesMap = {};

  filteredTransactions.forEach(trx => {
    (trx.items || []).forEach(item => {
      const qty = item.qty || item.quantity || 1;
      totalItemsSold += qty;

      if (!productSalesMap[item.name]) {
        productSalesMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.name].qty += qty;
      productSalesMap[item.name].revenue += (item.price || 0) * qty;

      // Cari harga modal produk untuk hitung laba bersih
      const prod = products.find(p => p.id === item.id);
      const buyPrice = prod?.buyPrice || 0;
      const profitPerItem = Math.max(0, (item.price || 0) - buyPrice);
      totalEstimatedProfit += profitPerItem * qty;
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Grouping omset per hari untuk grafik batang (7 interval)
  const chartDays = useMemo(() => {
    const daysMap = {};
    const dList = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      daysMap[key] = 0;
      dList.push({ label: key, date: d });
    }

    filteredTransactions.forEach(trx => {
      const d = new Date(trx.date);
      const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      if (daysMap[key] !== undefined) {
        daysMap[key] += trx.total || 0;
      }
    });

    return dList.map(item => ({
      label: item.label,
      total: daysMap[item.label] || 0
    }));
  }, [filteredTransactions]);

  const maxChartVal = Math.max(...chartDays.map(d => d.total), 100000);

  // Cetak Laporan
  const handlePrint = () => {
    window.print();
    onLogActivity?.('PRINT_REPORT', 'Manajemen Laporan', `Mencetak laporan periode ${periodType}`);
  };

  // Unduh CSV Laporan
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      onShowToast?.('Tidak ada data transaksi untuk diekspor pada filter ini', 'warning');
      return;
    }

    const headers = ['Invoice ID', 'Tanggal', 'Kasir', 'Metode Pembayaran', 'Item Terjual', 'Subtotal', 'Pajak', 'Diskon', 'Total Belanja'];
    const rows = filteredTransactions.map(t => {
      const itemsStr = (t.items || []).map(i => `${i.name} (${i.qty}x)`).join('; ');
      return [
        `"${t.invoiceId}"`,
        `"${formatDateTime(t.date)}"`,
        `"${t.cashierName || 'Kasir'}"`,
        `"${t.paymentMethod}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        t.subtotal || 0,
        t.tax || 0,
        t.discount || 0,
        t.total || 0
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Penjualan_${periodType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onLogActivity?.('EXPORT_REPORT', 'Manajemen Laporan', `Mengunduh CSV laporan penjualan periode ${periodType}`);
    onShowToast?.('Laporan penjualan berhasil diunduh ke CSV!', 'success');
  };

  return (
    <div className="admin-module-container printable-report-area">
      {/* Header Halaman */}
      <div className="admin-page-header no-print">
        <div>
          <h2 className="admin-page-title">
            <IconBarChart size={24} className="text-primary" />
            Manajemen Laporan & Statistik Penjualan
          </h2>
          <p className="admin-page-subtitle">
            Rekap omset harian/mingguan/bulanan, laba kotor, produk terlaris, filter kasir & metode pembayaran
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            type="button" 
            className="admin-btn-secondary"
            onClick={handleExportCSV}
          >
            <IconDownload size={18} />
            Unduh CSV / Excel
          </button>
          <button 
            type="button" 
            className="admin-btn-primary"
            onClick={handlePrint}
          >
            <IconPrinter size={18} />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Bar Periode */}
      <div className="admin-toolbar-card no-print">
        <div className="report-filter-grid">
          {/* Tombol Tab Periode */}
          <div className="period-pill-group">
            <button 
              type="button" 
              className={`btn-period-pill ${periodType === 'daily' ? 'active' : ''}`}
              onClick={() => setPeriodType('daily')}
            >
              Hari Ini
            </button>
            <button 
              type="button" 
              className={`btn-period-pill ${periodType === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriodType('weekly')}
            >
              7 Hari Terakhir
            </button>
            <button 
              type="button" 
              className={`btn-period-pill ${periodType === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriodType('monthly')}
            >
              Bulan Ini
            </button>
            <button 
              type="button" 
              className={`btn-period-pill ${periodType === 'yearly' ? 'active' : ''}`}
              onClick={() => setPeriodType('yearly')}
            >
              Tahun Ini
            </button>
            <button 
              type="button" 
              className={`btn-period-pill ${periodType === 'custom' ? 'active' : ''}`}
              onClick={() => setPeriodType('custom')}
            >
              Rentang Tanggal
            </button>
          </div>

          {/* Custom Date Picker (jika custom) */}
          {periodType === 'custom' && (
            <div className="custom-date-range">
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="admin-input-date"
              />
              <span className="text-muted">s/d</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="admin-input-date"
              />
            </div>
          )}

          {/* Filter Tambahan */}
          <div className="report-secondary-filters">
            <select 
              value={selectedPaymentMethod} 
              onChange={e => setSelectedPaymentMethod(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="qris">QRIS Digital</option>
              <option value="card">Kartu Debit / Kredit</option>
            </select>

            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="admin-select"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="admin-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Omset Penjualan</span>
            <div className="stat-icon-pill bg-blue-100 text-primary">
              <IconBarChart size={20} />
            </div>
          </div>
          <div className="stat-number text-primary">{formatRupiah(totalOmset)}</div>
          <div className="stat-footnote">Dari {totalTrx} transaksi berhasil</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-title">Estimasi Margin Laba</span>
            <div className="stat-icon-pill bg-emerald-100 text-emerald-600">
              <IconCheckCircle size={20} />
            </div>
          </div>
          <div className="stat-number text-emerald-600">{formatRupiah(totalEstimatedProfit)}</div>
          <div className="stat-footnote">Harga Jual dikurangi Modal</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Item Terjual</span>
            <div className="stat-icon-pill bg-amber-100 text-amber-600">
              <IconFileText size={20} />
            </div>
          </div>
          <div className="stat-number">{totalItemsSold} pcs</div>
          <div className="stat-footnote">Jumlah seluruh kuantitas pesanan</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-card-header">
            <span className="stat-title">Rata-Rata Transaksi (AOV)</span>
            <div className="stat-icon-pill bg-purple-100 text-purple-600">
              <IconPieChart size={20} />
            </div>
          </div>
          <div className="stat-number">{formatRupiah(avgOrderValue)}</div>
          <div className="stat-footnote">Nilai rata-rata per struk belanja</div>
        </div>
      </div>

      {/* Grid: Grafik Penjualan di Kiri, Produk Terlaris di Kanan */}
      <div className="report-charts-grid">
        {/* Grafik Penjualan */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="section-title">Tren Omset Penjualan</h3>
            <span className="text-xs text-muted">Aktivitas Periode Berjalan</span>
          </div>

          <div className="chart-bars-container">
            {chartDays.map((d, idx) => {
              const heightPct = Math.min(100, Math.round((d.total / maxChartVal) * 100));
              return (
                <div key={idx} className="chart-bar-col">
                  <span className="bar-val-text">{d.total > 0 ? (d.total >= 1000000 ? `${(d.total/1000000).toFixed(1)}jt` : `${Math.round(d.total/1000)}k`) : '0'}</span>
                  <div className="bar-track">
                    <div 
                      className="bar-fill" 
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      title={`${d.label}: ${formatRupiah(d.total)}`}
                    />
                  </div>
                  <span className="bar-label-text">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Produk Terlaris */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="section-title">Top 5 Produk Terlaris</h3>
            <span className="text-xs text-muted">Berdasarkan Jumlah Terjual</span>
          </div>

          <div className="top-products-list">
            {topSellingProducts.length === 0 ? (
              <div className="empty-state-sm">
                <p>Belum ada data penjualan pada filter ini.</p>
              </div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={idx} className="top-product-row">
                  <div className="top-rank-badge">{idx + 1}</div>
                  <div className="top-product-details">
                    <div className="font-semibold text-main">{p.name}</div>
                    <div className="text-xs text-muted">Omset: {formatRupiah(p.revenue)}</div>
                  </div>
                  <div className="top-qty-pill">
                    <strong>{p.qty}</strong> pcs
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabel Rincian Transaksi */}
      <div className="admin-table-card mt-4">
        <div className="admin-card-header">
          <h3 className="section-title">Rekapitulasi Data Transaksi</h3>
          <span className="text-muted text-sm">{filteredTransactions.length} transaksi tercatat</span>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Waktu Transaksi</th>
                <th>Kasir</th>
                <th>Metode Bayar</th>
                <th>Item Pesanan</th>
                <th>Total Belanja</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-cell">
                    <p>Tidak ada transaksi yang cocok dengan filter tanggal ini.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 20).map(trx => (
                  <tr key={trx.invoiceId}>
                    <td><code className="sku-badge">{trx.invoiceId}</code></td>
                    <td>{formatDateTime(trx.date)}</td>
                    <td>{trx.cashierName || 'Kasir 1'}</td>
                    <td>
                      <span className="badge-category uppercase">{trx.paymentMethod}</span>
                    </td>
                    <td>
                      <div className="text-xs text-muted truncate max-w-xs">
                        {(trx.items || []).map(i => `${i.name} (${i.qty}x)`).join(', ')}
                      </div>
                    </td>
                    <td><strong className="text-primary">{formatRupiah(trx.total)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

