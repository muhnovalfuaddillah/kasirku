/**
 * Service untuk komunikasi langsung antara React POS dan Google Sheets via Apps Script Web App.
 */

function parseItemsDetail(itemsDetail = '') {
  if (!itemsDetail || typeof itemsDetail !== 'string') return [];
  return itemsDetail.split(';').map(part => {
    const trimmed = part.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(.*?)\s*\((\d+)x\s*@(\d+)\)/);
    if (match) {
      return {
        id: `PRD-${match[1].trim()}`,
        name: match[1].trim(),
        qty: parseInt(match[2], 10),
        price: parseFloat(match[3])
      };
    }
    return { name: trimmed, qty: 1, price: 0 };
  }).filter(Boolean);
}

export const googleSheetsService = {
  /**
   * Validasi dan bersihkan URL Web App Google Apps Script
   */
  validateUrl: (url) => {
    const clean = (url || '').trim().replace(/^["']|["']$/g, '').trim();
    if (!clean) {
      throw new Error('URL Google Sheets belum diisi di menu Pengaturan.');
    }
    if (clean.includes('docs.google.com/spreadsheets')) {
      throw new Error('URL yang dimasukkan adalah link Spreadsheet Google Sheets biasa, BUKAN link Web App! Buka Ekstensi -> Apps Script -> Deploy (Terapkan) -> Aplikasi Web -> Salin URL berakhiran /exec.');
    }
    if (clean.includes('/edit')) {
      throw new Error('URL yang dimasukkan adalah link halaman Editor Script (/edit). Anda harus klik tombol biru "Terapkan" (Deploy) -> Penerapan Baru -> Aplikasi Web -> Salin URL berakhiran /exec.');
    }
    if (clean.includes('/dev')) {
      throw new Error('URL berakhiran /dev hanya untuk mode tes internal. Buat Penerapan Baru (New deployment) dan salin URL yang berakhiran /exec.');
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      throw new Error('Format URL tidak valid (harus dimulai dengan https://).');
    }
    return clean;
  },

  /**
   * Tes koneksi ke Google Apps Script Web App
   */
  testConnection: async (webAppUrl) => {
    try {
      const clean = googleSheetsService.validateUrl(webAppUrl);
      const url = new URL(clean);
      url.searchParams.set('action', 'ping');

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: data.success !== false,
        message: data.message || 'Koneksi ke Google Sheets berhasil!',
        data
      };
    } catch (error) {
      console.error('Test connection error:', error);
      return {
        success: false,
        message: error.message.includes('URL yang dimasukkan') 
          ? error.message 
          : `Gagal terhubung (${error.message}). Pastikan Akses di Apps Script diset "Siapa saja (Anyone)" dan uji buka link ini langsung di tab baru browser Anda.`
      };
    }
  },

  /**
   * Mengambil daftar produk dari Google Sheets
   */
  fetchProducts: async (webAppUrl) => {
    const clean = googleSheetsService.validateUrl(webAppUrl);
    const url = new URL(clean);
    url.searchParams.set('action', 'getProducts');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(p => ({
          ...p,
          image: p.imageUrl || p.image || '',
          hasWholesale: !!(p.hasWholesale || (Number(p.wholesalePrice) > 0 && Number(p.wholesaleMinQty) > 0)),
          wholesalePrice: Number(p.wholesalePrice) || 0,
          wholesaleMinQty: Number(p.wholesaleMinQty) || 0,
          wholesaleUnit: p.wholesaleUnit || 'dus',
          unit: p.unit || 'pcs'
        }));
      }
      throw new Error(result.message || 'Format data produk dari Google Sheets tidak valid.');
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Koneksi diblokir oleh Google (Failed to fetch). Pastikan saat Deploy di Apps Script, "Akses" dipilih "Siapa saja" (Anyone), bukan "Hanya saya".');
      }
      throw err;
    }
  },

  /**
   * Mengambil riwayat transaksi dari Google Sheets
   */
  fetchTransactions: async (webAppUrl) => {
    const clean = googleSheetsService.validateUrl(webAppUrl);
    const url = new URL(clean);
    url.searchParams.set('action', 'getTransactions');

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data.map(trx => ({
          ...trx,
          items: (Array.isArray(trx.items) && trx.items.length > 0)
            ? trx.items
            : parseItemsDetail(trx.itemsDetail),
          cashierName: trx.cashierName || trx.cashier || 'Kasir 1'
        }));
      }
      throw new Error(result.message || 'Format data transaksi tidak valid.');
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        throw new Error('Koneksi ditolak Google (Failed to fetch). Pastikan "Akses" di Apps Script adalah "Siapa saja" (Anyone) dan buka URL tersebut di tab baru browser untuk memastikannya.');
      }
      throw err;
    }
  },

  /**
   * Menyimpan transaksi baru ke Google Sheets & otomatis memotong stok
   */
  saveTransaction: async (webAppUrl, transactionData) => {
    if (!webAppUrl || !webAppUrl.trim()) {
      return { success: false, offline: true, message: 'Google Sheets URL kosong, transaksi disimpan lokal.' };
    }

    const clean = googleSheetsService.validateUrl(webAppUrl);
    const payload = {
      action: 'createTransaction',
      ...transactionData
    };

    try {
      // Menggunakan Content-Type text/plain agar browser tidak mengirim CORS OPTIONS preflight
      const response = await fetch(clean, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving transaction to Google Sheets:', error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Gagal simpan ke Google Sheet (Failed to fetch). Periksa izin akses "Siapa saja (Anyone)" di Apps Script.');
      }
      throw error;
    }
  },

  /**
   * Menambahkan produk baru ke Google Sheets
   */
  addProduct: async (webAppUrl, product) => {
    const clean = googleSheetsService.validateUrl(webAppUrl);
    const payload = {
      action: 'addProduct',
      product: {
        ...product,
        imageUrl: product.imageUrl || product.image || '',
        wholesalePrice: Number(product.wholesalePrice) || 0,
        wholesaleMinQty: Number(product.wholesaleMinQty) || 0,
        hasWholesale: !!product.hasWholesale,
        wholesaleUnit: product.wholesaleUnit || 'dus',
        unit: product.unit || 'pcs'
      }
    };

    const response = await fetch(clean, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    return await response.json();
  },

  /**
   * Memperbarui produk di Google Sheets
   */
  updateProduct: async (webAppUrl, product) => {
    const clean = googleSheetsService.validateUrl(webAppUrl);
    const payload = {
      action: 'updateProduct',
      product: {
        ...product,
        imageUrl: product.imageUrl || product.image || '',
        wholesalePrice: Number(product.wholesalePrice) || 0,
        wholesaleMinQty: Number(product.wholesaleMinQty) || 0,
        hasWholesale: !!product.hasWholesale,
        wholesaleUnit: product.wholesaleUnit || 'dus',
        unit: product.unit || 'pcs'
      }
    };

    const response = await fetch(clean, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    return await response.json();
  },

  /**
   * Menghapus produk di Google Sheets
   */
  deleteProduct: async (webAppUrl, id) => {
    const clean = googleSheetsService.validateUrl(webAppUrl);
    const payload = {
      action: 'deleteProduct',
      id
    };

    const response = await fetch(clean, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    return await response.json();
  }
};
