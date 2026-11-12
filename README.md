# 🛒 Aplikasi Kasir Pintar (POS) - React & Google Sheets

Aplikasi Kasir (Point of Sale / POS) modern berbasis **React + Vite** dengan database **Google Sheets** menggunakan **Google Apps Script**.

---

## ✨ Fitur Utama
1. **Layar Kasir (POS) Interaktif**:
   - Pencarian produk instan & filter kategori (Makanan, Minuman, Snack, dll.).
   - Kartu produk dengan visualisasi gambar, status stok real-time, dan indikator habis.
   - Keranjang belanja dinamis (tambah, kurangi kuantitas, hapus item).
   - Perhitungan otomatis Subtotal, Diskon (%/Rp), dan Pajak (PPN).
   - Opsi pembayaran lengkap: **Tunai (Cash)**, **QRIS**, **Transfer Bank**, **Debit**.
   - Input uang tunai dengan tombol nominal cepat (*Uang Pas, 10k, 20k, 50k, 100k*) dan perhitungan otomatis kembalian.
2. **Cetak Struk Pembayaran (Thermal Receipt Ready)**:
   - Desain struk kasir rapi (58mm / 80mm).
   - Dukungan cetak langsung via tombol **Cetak Struk** (`Ctrl+P` / Thermal Printer) tanpa elemen web yang mengganggu.
3. **Database Google Sheets**:
   - Data produk & riwayat transaksi otomatis tersimpan di Google Sheets.
   - Stok produk otomatis berkurang di Google Sheet setiap transaksi berhasil.
   - Tombol uji koneksi dan sinkronisasi 2 arah.
4. **Kelola Produk & Inventaris**:
   - Tambah produk baru, edit harga/stok, dan hapus produk.
   - Sinkronisasi otomatis ke Google Sheets.
5. **Riwayat Penjualan & Statistik**:
   - Kartu ringkasan Omset, Jumlah Transaksi, dan Rata-rata Belanja.
   - Filter transaksi berdasarkan metode pembayaran & pencarian no invoice.
   - Cetak ulang struk belanja kapan saja.
6. **Mode Offline & Fallback**:
   - Jika belum menghubungkan Google Sheet, aplikasi otomatis berjalan dalam **Mode Demo (Lokal)** menggunakan `localStorage`.

---

## 🚀 Cara Menjalankan Aplikasi React

1. Pastikan dependensi sudah terpasang:
   ```bash
   npm install
   ```

2. Jalankan server pengembang (development server):
   ```bash
   npm run dev
   ```

3. Buka browser di alamat: `http://localhost:5173`

---

## 📑 Panduan Setup Google Sheets (5 Menit)

Aplikasi ini menggunakan **Google Apps Script** resmi tanpa perlu akun Google Cloud berbayar atau API Key rumit:

### Langkah 1: Buat Spreadsheet Baru
1. Buka [https://sheets.new](https://sheets.new) di browser Anda.
2. Beri nama file, misalnya: `Database Kasir POS`.

### Langkah 2: Buka Apps Script
1. Di menu atas Google Sheets, klik **Ekstensi (Extensions)** &rarr; **Apps Script**.

### Langkah 3: Tempelkan Kode Script
1. Hapus semua kode default di file `Code.gs`.
2. Buka file [`public/google-apps-script.js`](public/google-apps-script.js) di repositori ini, salin seluruh isinya, dan tempelkan ke editor Apps Script.
3. Klik tombol **Simpan (Save / icon disket)**.

### Langkah 4: Deploy sebagai Aplikasi Web
1. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas &rarr; pilih **Penerapan baru (New deployment)**.
2. Pada jenis penerapan (ikon gerigi), pilih **Aplikasi web (Web app)**.
3. Konfigurasi:
   - **Deskripsi**: `API Kasir POS`
   - **Jalankan sebagai**: `Saya (Me)`
   - **Siapa yang memiliki akses**: `Siapa saja (Anyone)` *(Sangat penting agar React dapat mengirim & membaca data!)*
4. Klik **Terapkan (Deploy)** dan izinkan akses (*Review permissions*) jika diminta.

### Langkah 5: Hubungkan ke Aplikasi Kasir React
1. Salin **URL Aplikasi Web (Web App URL)** yang berakhiran `/exec`.
2. Buka aplikasi React Kasir di browser Anda, masuk ke tab **Google Sheet & Setup**.
3. Tempelkan URL tersebut ke kolom yang disediakan, lalu klik **Simpan URL** dan **Uji Koneksi**.
4. Selesai! Transaksi dan produk Anda kini otomatis tersimpan di Google Sheets.
# kasirku
