export const formatRupiah = (number) => {
  if (isNaN(number) || number === null || number === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(number);
};

export const formatDateTime = (date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
};

export const generateInvoiceId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}${day}-${random}`;
};

export const formatThousands = (value) => {
  if (!value && value !== 0) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
};

export const parseThousands = (value) => {
  if (!value && value !== 0) return 0;
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
};

export const terbilangRupiah = (number) => {
  const n = parseInt(number, 10);
  if (isNaN(n) || n <= 0) return '';
  
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  
  const konversi = (angka) => {
    if (angka < 12) return satuan[angka];
    if (angka < 20) return konversi(angka - 10) + ' belas';
    if (angka < 100) return konversi(Math.floor(angka / 10)) + ' puluh ' + konversi(angka % 10);
    if (angka < 200) return 'seratus ' + konversi(angka - 100);
    if (angka < 1000) return konversi(Math.floor(angka / 100)) + ' ratus ' + konversi(angka % 100);
    if (angka < 2000) return 'seribu ' + konversi(angka - 1000);
    if (angka < 1000000) return konversi(Math.floor(angka / 1000)) + ' ribu ' + konversi(angka % 1000);
    if (angka < 1000000000) return konversi(Math.floor(angka / 1000000)) + ' juta ' + konversi(angka % 1000000);
    if (angka < 1000000000000) return konversi(Math.floor(angka / 1000000000)) + ' milyar ' + konversi(angka % 1000000000);
    return '';
  };

  const hasil = konversi(n).replace(/\s+/g, ' ').trim();
  return hasil ? hasil.charAt(0).toUpperCase() + hasil.slice(1) + ' rupiah' : '';
};

export const processLogoImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP)'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat data gambar'));
      img.onload = () => {
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};


