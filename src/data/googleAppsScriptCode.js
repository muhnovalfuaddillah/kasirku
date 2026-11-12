export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - BACKEND KASIR / POS REACT
 * =========================================================================
 * 
 * PENTING: JIKA SCRIPT TIDAK OTOMATIS MENDETEKSI SPREADSHEET ANDA,
 * MASUKKAN LINK GOOGLE SHEETS ANDA DI BAWAH INI:
 */
const SPREADSHEET_URL_OR_ID = ""; 
// Contoh: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"

function getSpreadsheet() {
  if (typeof SPREADSHEET_URL_OR_ID !== 'undefined' && SPREADSHEET_URL_OR_ID && SPREADSHEET_URL_OR_ID.trim()) {
    const val = SPREADSHEET_URL_OR_ID.trim();
    if (val.includes("docs.google.com/spreadsheets/d/")) {
      const match = val.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        return SpreadsheetApp.openById(match[1]);
      }
    }
    try {
      return SpreadsheetApp.openById(val);
    } catch (e) {
      // fallback jika gagal openById
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupSheetsIfMissing(ss) {
  if (!ss) return;

  // 1. Setup Sheet Produk
  let productSheet = ss.getSheetByName("Produk");
  if (!productSheet) {
    productSheet = ss.insertSheet("Produk");
    productSheet.appendRow(["ID", "Nama Produk", "Kategori", "Harga", "Stok", "Barcode", "Gambar", "Harga Grosir", "Min Grosir", "Satuan"]);
    productSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#e2e8f0");
  }

  // 2. Setup Sheet Transaksi
  let trxSheet = ss.getSheetByName("Transaksi");
  if (!trxSheet) {
    trxSheet = ss.insertSheet("Transaksi");
    trxSheet.appendRow([
      "Invoice", 
      "Tanggal", 
      "Pelanggan", 
      "Detail Item", 
      "Subtotal", 
      "Diskon", 
      "Pajak", 
      "Total Akhir", 
      "Metode Bayar", 
      "Bayar", 
      "Kembalian", 
      "Kasir", 
      "Catatan"
    ]);
    trxSheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#e2e8f0");
  }

  SpreadsheetApp.flush();
}

function doGet(e) {
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      return createJsonResponse({
        success: false,
        message: "Spreadsheet tidak terdeteksi! Masukkan link Google Sheets Anda di variabel SPREADSHEET_URL_OR_ID di baris paling atas script."
      });
    }

    setupSheetsIfMissing(ss);

    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";

    if (action === "ping") {
      return createJsonResponse({
        success: true,
        message: "Koneksi Google Sheets Apps Script Berhasil Terhubung ke: " + ss.getName(),
        sheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    // Aksi Tes Tulis Langsung ke Sheet Transaksi
    if (action === "testWrite") {
      let trxSheet = ss.getSheetByName("Transaksi");
      if (!trxSheet) {
        trxSheet = ss.insertSheet("Transaksi");
      }

      const testInvoice = "INV-TEST-" + Math.floor(1000 + Math.random() * 9000);
      trxSheet.appendRow([
        testInvoice,
        Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
        "Pelanggan Uji Coba",
        "Nasi Goreng Spesial (1x @25000) = 25000",
        25000,
        0,
        0,
        25000,
        "Tunai",
        50000,
        25000,
        "Kasir 1",
        "Tes Tulis Berhasil"
      ]);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: "BERHASIL! 1 baris transaksi uji coba (" + testInvoice + ") telah berhasil ditulis ke file: '" + ss.getName() + "' pada tab 'Transaksi'!"
      });
    }

    if (action === "getProducts") {
      const sheet = ss.getSheetByName("Produk");
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return createJsonResponse({ success: true, data: [] });
      }

      const products = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] || row[1]) {
          products.push({
            id: String(row[0] || ""),
            name: String(row[1] || ""),
            category: String(row[2] || "Umum"),
            price: Number(row[3] || 0),
            stock: Number(row[4] || 0),
            barcode: String(row[5] || ""),
            imageUrl: String(row[6] || ""),
            wholesalePrice: Number(row[7] || 0),
            wholesaleMinQty: Number(row[8] || 0),
            hasWholesale: Number(row[7] || 0) > 0,
            unit: String(row[9] || "pcs")
          });
        }
      }

      return createJsonResponse({ success: true, data: products });
    }

    if (action === "getTransactions") {
      const sheet = ss.getSheetByName("Transaksi");
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return createJsonResponse({ success: true, data: [] });
      }

      const transactions = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) {
          transactions.push({
            invoiceId: String(row[0]),
            date: String(row[1]),
            customer: String(row[2] || "Umum"),
            itemsDetail: String(row[3] || ""),
            subtotal: Number(row[4] || 0),
            discount: Number(row[5] || 0),
            tax: Number(row[6] || 0),
            total: Number(row[7] || 0),
            paymentMethod: String(row[8] || "Tunai"),
            amountPaid: Number(row[9] || 0),
            change: Number(row[10] || 0),
            cashier: String(row[11] || "Kasir"),
            notes: String(row[12] || "")
          });
        }
      }

      return createJsonResponse({ success: true, data: transactions.reverse() });
    }

    return createJsonResponse({ success: false, message: "Aksi tidak dikenali: " + action });

  } catch (err) {
    return createJsonResponse({
      success: false,
      message: "Terjadi error pada doGet: " + err.toString()
    });
  }
}

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    if (!ss) {
      return createJsonResponse({
        success: false,
        message: "Spreadsheet tidak terdeteksi! Masukkan link Google Sheets Anda di variabel SPREADSHEET_URL_OR_ID di baris paling atas script."
      });
    }

    setupSheetsIfMissing(ss);

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;

    // 1. Simpan Transaksi Baru & Kurangi Stok
    if (action === "createTransaction") {
      let trxSheet = ss.getSheetByName("Transaksi");
      if (!trxSheet) {
        trxSheet = ss.insertSheet("Transaksi");
        trxSheet.appendRow(["Invoice", "Tanggal", "Pelanggan", "Detail Item", "Subtotal", "Diskon", "Pajak", "Total Akhir", "Metode Bayar", "Bayar", "Kembalian", "Kasir", "Catatan"]);
      }

      const productSheet = ss.getSheetByName("Produk");

      const itemsDetail = (payload.items || []).map(function(item) {
        return item.name + " (" + item.qty + "x @" + item.price + ") = " + (item.qty * item.price);
      }).join("; ");

      trxSheet.appendRow([
        String(payload.invoiceId || ("INV-" + new Date().getTime())),
        String(payload.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss")),
        String(payload.customer || "Umum"),
        String(itemsDetail),
        Number(payload.subtotal || 0),
        Number(payload.discount || 0),
        Number(payload.tax || 0),
        Number(payload.total || 0),
        String(payload.paymentMethod || "Tunai"),
        Number(payload.amountPaid || payload.total || 0),
        Number(payload.change || 0),
        String(payload.cashier || "Kasir 1"),
        String(payload.notes || "")
      ]);

      // Kurangi stok di sheet Produk jika ada item yang terjual
      if (productSheet && payload.items && payload.items.length > 0) {
        const prodData = productSheet.getDataRange().getValues();
        for (let j = 0; j < payload.items.length; j++) {
          const cartItem = payload.items[j];
          for (let i = 1; i < prodData.length; i++) {
            if (String(prodData[i][0]) === String(cartItem.id)) {
              const currentStock = Number(prodData[i][4] || 0);
              const newStock = Math.max(0, currentStock - Number(cartItem.qty || 1));
              productSheet.getRange(i + 1, 5).setValue(newStock);
              break;
            }
          }
        }
      }

      // Pastikan data langsung tersimpan ke Google Sheets tanpa tertunda
      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: "Transaksi berhasil disimpan ke Google Sheet & stok diperbarui!",
        invoiceId: payload.invoiceId
      });
    }

    // 2. Tambah Produk Baru
    if (action === "addProduct") {
      let productSheet = ss.getSheetByName("Produk");
      if (!productSheet) {
        productSheet = ss.insertSheet("Produk");
      }
      const p = payload.product || {};
      productSheet.appendRow([
        String(p.id || ("PRD-" + new Date().getTime())),
        String(p.name || ""),
        String(p.category || "Umum"),
        Number(p.price || 0),
        Number(p.stock || 0),
        String(p.barcode || ""),
        String(p.imageUrl || ""),
        Number(p.wholesalePrice || 0),
        Number(p.wholesaleMinQty || 0),
        String(p.unit || "pcs")
      ]);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        message: "Produk berhasil ditambahkan ke Google Sheet!",
        product: p
      });
    }

    // 3. Update Produk
    if (action === "updateProduct") {
      const productSheet = ss.getSheetByName("Produk");
      const p = payload.product || {};
      const data = productSheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(p.id)) {
          productSheet.getRange(i + 1, 2).setValue(p.name);
          productSheet.getRange(i + 1, 3).setValue(p.category);
          productSheet.getRange(i + 1, 4).setValue(p.price);
          productSheet.getRange(i + 1, 5).setValue(p.stock);
          productSheet.getRange(i + 1, 6).setValue(p.barcode);
          productSheet.getRange(i + 1, 7).setValue(p.imageUrl);
          productSheet.getRange(i + 1, 8).setValue(Number(p.wholesalePrice || 0));
          productSheet.getRange(i + 1, 9).setValue(Number(p.wholesaleMinQty || 0));
          productSheet.getRange(i + 1, 10).setValue(String(p.unit || "pcs"));
          found = true;
          break;
        }
      }

      SpreadsheetApp.flush();

      if (found) {
        return createJsonResponse({ success: true, message: "Produk berhasil diperbarui!" });
      } else {
        return createJsonResponse({ success: false, message: "Produk dengan ID tersebut tidak ditemukan." });
      }
    }

    // 4. Hapus Produk
    if (action === "deleteProduct") {
      const productSheet = ss.getSheetByName("Produk");
      const id = payload.id;
      const data = productSheet.getDataRange().getValues();
      let deleted = false;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          productSheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: deleted,
        message: deleted ? "Produk berhasil dihapus dari Google Sheet!" : "Produk tidak ditemukan."
      });
    }

    return createJsonResponse({ success: false, message: "Aksi POST tidak dikenali." });

  } catch (error) {
    return createJsonResponse({
      success: false,
      message: "Terjadi error pada doPost: " + error.toString()
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
