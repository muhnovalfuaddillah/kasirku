import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PosView from './components/PosView';
import ReceiptModal from './components/ReceiptModal';
import AdminPinModal from './components/AdminPinModal';
import StoreSettingsModal from './components/StoreSettingsModal';

// 13 Admin Dashboard Modules
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/admin/DashboardHome';
import UserManagement from './components/admin/UserManagement';
import RolePermissionManagement from './components/admin/RolePermissionManagement';
import DataManagement from './components/admin/DataManagement';
import CategoryManagement from './components/admin/CategoryManagement';
import ReportsManagement from './components/admin/ReportsManagement';
import NotificationsView from './components/admin/NotificationsView';
import ActivityLogView from './components/admin/ActivityLogView';
import AppSettingsView from './components/admin/AppSettingsView';
import GoogleSheetsHub from './components/admin/GoogleSheetsHub';
import SecurityView from './components/admin/SecurityView';
import BackupRestoreView from './components/admin/BackupRestoreView';
import AdminProfileView from './components/admin/AdminProfileView';

import { storageService } from './services/storageService';
import { googleSheetsService } from './services/googleSheetsService';
import { generateInvoiceId } from './utils/formatters';
import { playBeep, playSuccessSound } from './utils/audio';
import { IconCheckCircle, IconAlert, IconX } from './components/Icons';

export default function App() {
  // Role: 'kasir' (khusus pemesanan POS) | 'admin' (mengatur segalanya 13 modul)
  const [currentRole, setCurrentRole] = useState('kasir');
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState(() => storageService.getAdminPin());

  // Navigation tab states
  const [currentKasirTab, setCurrentKasirTab] = useState('pos'); // Tab di Kasir view
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard'); // Tab di Admin view

  // Core Data State
  const [products, setProducts] = useState(() => storageService.getProducts());
  const [transactions, setTransactions] = useState(() => storageService.getTransactions());
  const [storeConfig, setStoreConfig] = useState(() => storageService.getSettings());
  const [sheetUrl, setSheetUrl] = useState(() => storageService.getSheetUrl());

  // Enterprise Admin Data State
  const [users, setUsers] = useState(() => storageService.getUsers());
  const [roles, setRoles] = useState(() => storageService.getRoles());
  const [categories, setCategories] = useState(() => storageService.getCategories());
  const [notifications, setNotifications] = useState(() => storageService.getNotifications());
  const [activityLogs, setActivityLogs] = useState(() => storageService.getActivityLogs());
  const [appConfig, setAppConfig] = useState(() => storageService.getAppConfig());
  const [backupHistory, setBackupHistory] = useState(() => storageService.getBackupHistory());
  const [darkMode, setDarkMode] = useState(() => !!storageService.getAppConfig()?.darkMode);

  // Current Logged In Admin Profile
  const [currentUser, setCurrentUser] = useState(() => {
    const list = storageService.getUsers();
    return list.find(u => u.role === 'Admin') || list[0];
  });

  // Cart & Processing
  const [cart, setCart] = useState([]);
  const [isSheetConnected, setIsSheetConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Store Settings Modal (Pengaturan Nama Toko & Logo)
  const [showStoreSettingsModal, setShowStoreSettingsModal] = useState(false);

  // Perbarui Judul Tab Browser sesuai Nama Toko
  useEffect(() => {
    if (storeConfig?.name) {
      document.title = `${storeConfig.name} - Kasir POS`;
    }
  }, [storeConfig?.name]);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Uji koneksi saat pertama kali load jika sheetUrl sudah ada & sinkronkan otomatis
  useEffect(() => {
    if (sheetUrl) {
      googleSheetsService.testConnection(sheetUrl).then((res) => {
        setIsSheetConnected(res.success);
        if (res.success) {
          // Ambil produk langsung dari Google Sheets jika ada
          googleSheetsService.fetchProducts(sheetUrl).then(fetched => {
            if (fetched && Array.isArray(fetched)) {
              setProducts(fetched);
              storageService.saveProducts(fetched);
            }
          }).catch(console.error);

          // Ambil riwayat transaksi langsung dari Google Sheets jika ada
          googleSheetsService.fetchTransactions(sheetUrl).then(fetchedTrx => {
            if (fetchedTrx && Array.isArray(fetchedTrx)) {
              setTransactions(fetchedTrx);
              storageService.setAllTransactions(fetchedTrx);
            }
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [sheetUrl]);

  // Activity Logging Helper
  const logActivity = (action, module, detail) => {
    const updated = storageService.logActivity(
      action,
      module,
      detail,
      currentUser?.name || 'Budi Santoso',
      currentUser?.role || 'Admin'
    );
    setActivityLogs(updated);
  };

  // Cart Handlers
  const handleAddToCart = (product, qtyToAdd = 1) => {
    playBeep();
    const addCount = Math.max(1, Number(qtyToAdd) || 1);
    const existing = cart.find(item => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + addCount > product.stock) {
      showToast(`Stok ${product.name} tidak mencukupi (Tersisa: ${product.stock}, diminta: ${currentQty + addCount})`, 'error');
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + addCount }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: addCount }]);
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && newQuantity > prod.stock) {
      showToast(`Maksimal stok tercapai untuk ${prod.name}`, 'warning');
      return;
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout Transaksi Kasir
  const handleCheckout = async (orderData) => {
    setIsProcessing(true);
    const invoiceId = generateInvoiceId();
    const now = new Date().toISOString();

    const fullTransaction = {
      ...orderData,
      invoiceId,
      date: now,
      cashierName: currentUser?.name || 'Kasir 1'
    };

    // 1. Potong stok produk di state & storage
    const updatedProducts = products.map(prod => {
      const cartItem = orderData.items.find(i => i.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.qty)
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    storageService.saveProducts(updatedProducts);

    // 2. Simpan transaksi di state & storage
    const updatedTransactions = storageService.saveTransaction(fullTransaction);
    setTransactions(updatedTransactions);

    // 3. Catat ke Activity Log
    logActivity(
      'CREATE_TRANSACTION',
      'Kasir POS',
      `Transaksi ${invoiceId} senilai Rp ${orderData.total.toLocaleString('id-ID')} (${orderData.paymentMethod.toUpperCase()})`
    );

    // 4. Kirim ke Google Sheets jika terhubung
    if (sheetUrl) {
      try {
        const result = await googleSheetsService.saveTransaction(sheetUrl, fullTransaction);
        if (result && result.success) {
          showToast(`Transaksi ${invoiceId} berhasil dicatat di Google Sheet!`, 'success');
        } else {
          showToast(`Tersimpan lokal. Status Sheet: ${result.message || 'Cek koneksi'}`, 'warning');
        }
      } catch (err) {
        console.error('Google Sheet save error:', err);
        showToast(`Tersimpan lokal. Sheet offline: ${err.message}`, 'warning');
      }
    } else {
      showToast(`Transaksi ${invoiceId} berhasil disimpan secara lokal!`, 'success');
    }

    // 5. Buka struk modal & audio
    playSuccessSound();
    setIsProcessing(false);
    setActiveReceipt(fullTransaction);
    setCart([]);
  };

  // Master Data Handlers
  const handleAddProduct = async (product) => {
    const updated = [product, ...products];
    setProducts(updated);
    storageService.saveProducts(updated);
    showToast(`Produk "${product.name}" berhasil ditambahkan!`, 'success');

    if (sheetUrl) {
      try {
        const res = await googleSheetsService.addProduct(sheetUrl, product);
        if (res && res.success !== false) {
          showToast(`Produk "${product.name}" otomatis tersimpan di Google Sheet!`, 'success');
        } else {
          showToast(`Disimpan lokal. Respon Sheet: ${res.message || 'Gagal'}`, 'warning');
        }
      } catch (e) {
        showToast(`Disimpan lokal, respon Sheet: ${e.message}`, 'warning');
      }
    }
  };

  const handleUpdateProduct = async (product) => {
    const updated = products.map(p => p.id === product.id ? product : p);
    setProducts(updated);
    storageService.saveProducts(updated);
    showToast(`Produk "${product.name}" berhasil diperbarui!`, 'success');

    if (sheetUrl) {
      try {
        const res = await googleSheetsService.updateProduct(sheetUrl, product);
        if (res && res.success !== false) {
          showToast(`Perubahan "${product.name}" otomatis tersimpan di Google Sheet!`, 'success');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    const prodToDelete = products.find(p => p.id === id);
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    storageService.saveProducts(updated);
    showToast(`Produk "${prodToDelete?.name || id}" telah dihapus.`, 'info');

    if (sheetUrl) {
      try {
        const res = await googleSheetsService.deleteProduct(sheetUrl, id);
        if (res && res.success !== false) {
          showToast(`Produk otomatis terhapus dari Google Sheet!`, 'info');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBulkDeleteProducts = async (ids) => {
    const updated = products.filter(p => !ids.includes(p.id));
    setProducts(updated);
    storageService.saveProducts(updated);
    showToast(`${ids.length} produk berhasil dihapus!`, 'info');

    if (sheetUrl) {
      for (const id of ids) {
        try {
          await googleSheetsService.deleteProduct(sheetUrl, id);
        } catch (e) {
          console.error(e);
        }
      }
      showToast(`${ids.length} produk otomatis terhapus dari Google Sheet!`, 'info');
    }
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    setProducts([]);
    setTransactions([]);
    setCart([]);
    setCategories([]);
    setNotifications([]);
    setActivityLogs([]);
    setBackupHistory([]);
    showToast('Seluruh data demo/lokal aplikasi telah dikosongkan. Aplikasi siap digunakan secara bersih!', 'success');
  };

  // Sinkronisasi dari Google Sheets
  const handleSyncProducts = async () => {
    if (!sheetUrl) return;
    setIsSyncing(true);
    try {
      const fetched = await googleSheetsService.fetchProducts(sheetUrl);
      if (fetched && fetched.length > 0) {
        setProducts(fetched);
        storageService.saveProducts(fetched);
        showToast(`Berhasil menyinkronkan ${fetched.length} produk dari Google Sheet!`, 'success');
        logActivity('SYNC_PRODUCTS', 'Google Sheets', `Menyinkronkan ${fetched.length} produk dari spreadsheet`);
      } else {
        showToast('Sheet Produk masih kosong.', 'info');
      }
    } catch (err) {
      showToast(`Gagal sinkron produk: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncTransactions = async () => {
    if (!sheetUrl) return;
    setIsSyncing(true);
    try {
      const fetched = await googleSheetsService.fetchTransactions(sheetUrl);
      if (fetched) {
        setTransactions(fetched);
        storageService.setAllTransactions(fetched);
        showToast(`Berhasil menyinkronkan ${fetched.length} transaksi dari Google Sheet!`, 'success');
        logActivity('SYNC_TRANSACTIONS', 'Google Sheets', `Menyinkronkan ${fetched.length} transaksi dari spreadsheet`);
      }
    } catch (err) {
      showToast(`Gagal sinkron transaksi: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Uji Koneksi Sheets
  const handleTestConnection = async (url) => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await googleSheetsService.testConnection(url);
      setTestStatus(res);
      setIsSheetConnected(res.success);
    } catch (e) {
      setTestStatus({ success: false, message: e.message });
      setIsSheetConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSheetUrl = (url) => {
    setSheetUrl(url);
    storageService.saveSheetUrl(url);
    if (url) {
      handleTestConnection(url);
    } else {
      setIsSheetConnected(false);
      setTestStatus(null);
    }
  };

  // Enterprise Data Handlers
  const handleSaveUsers = (newUsers) => {
    setUsers(newUsers);
    storageService.saveUsers(newUsers);
  };

  const handleSaveRoles = (newRoles) => {
    setRoles(newRoles);
    storageService.saveRoles(newRoles);
  };

  const handleSaveCategories = (newCategories) => {
    setCategories(newCategories);
    storageService.saveCategories(newCategories);
  };

  const handleSaveNotifications = (newNotifs) => {
    setNotifications(newNotifs);
    storageService.saveNotifications(newNotifs);
  };

  const handleClearLogs = () => {
    setActivityLogs([]);
    storageService.saveActivityLogs([]);
  };

  const handleSaveAppConfig = (newConfig) => {
    setAppConfig(newConfig);
    storageService.saveAppConfig(newConfig);
    if (newConfig.darkMode !== undefined) {
      setDarkMode(newConfig.darkMode);
    }
  };

  const handleCreateBackup = (notes) => {
    const entry = storageService.createFullBackup(notes);
    setBackupHistory(storageService.getBackupHistory());
    return entry;
  };

  const handleRestoreBackup = (backupObject) => {
    const res = storageService.restoreBackup(backupObject);
    if (res.success) {
      setProducts(storageService.getProducts());
      setTransactions(storageService.getTransactions());
      setCategories(storageService.getCategories());
      setUsers(storageService.getUsers());
      setRoles(storageService.getRoles());
      setStoreConfig(storageService.getSettings());
      setAppConfig(storageService.getAppConfig());
      setSheetUrl(storageService.getSheetUrl());
    }
    return res;
  };

  const handleDeleteBackup = (id) => {
    const updated = backupHistory.filter(b => b.id !== id);
    setBackupHistory(updated);
    storageService.saveBackupHistory(updated);
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    handleSaveAppConfig({ ...appConfig, darkMode: newMode });
  };

  // Role Switching
  const handleAdminLoginSuccess = () => {
    setCurrentRole('admin');
    setActiveAdminTab('dashboard');
    setShowPinModal(false);
    logActivity('LOGIN', 'Autentikasi', 'Login berhasil ke Admin Dashboard via PIN');
    showToast('Selamat Datang di Panel Admin Lengkap!', 'success');
  };

  const handleSwitchToKasir = () => {
    setCurrentRole('kasir');
    setCurrentKasirTab('pos');
    showToast('Beralih ke Layar Kasir POS (Khusus Pemesanan)', 'info');
  };

  const handleLogoutAdmin = () => {
    logActivity('LOGOUT', 'Autentikasi', 'Keluar dari Panel Admin');
    handleSwitchToKasir();
  };

  return (
    <div className={`pos-app-root ${darkMode ? 'dark-theme' : ''}`}>
      {/* Toast Notification Floating */}
      {toast && (
        <div className={`toast-container toast-${toast.type}`}>
          {toast.type === 'success' && <IconCheckCircle size={20} />}
          {toast.type === 'error' && <IconAlert size={20} />}
          {toast.type === 'warning' && <IconAlert size={20} />}
          {toast.type === 'info' && <IconCheckCircle size={20} />}
          <span className="toast-text">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="toast-close">
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* =========================================================================
          MODE 1: LAYAR KASIR POS (KHUSUS PEMESANAN CEPAT & TRANSAKSI PELANGGAN)
          ========================================================================= */}
      {currentRole === 'kasir' && (
        <>
          <Header 
            currentRole={currentRole}
            onOpenAdminLogin={() => setShowPinModal(true)}
            onSwitchToKasir={handleSwitchToKasir}
            currentTab={currentKasirTab}
            setCurrentTab={setCurrentKasirTab}
            storeConfig={storeConfig}
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            isSheetConnected={isSheetConnected}
            sheetUrl={sheetUrl}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onOpenStoreSettings={() => setShowStoreSettingsModal(true)}
          />

          <main className="pos-main-content">
            <PosView 
              products={products}
              cart={cart}
              addToCart={handleAddToCart}
              updateQuantity={handleUpdateQuantity}
              removeFromCart={handleRemoveFromCart}
              clearCart={handleClearCart}
              onCheckout={handleCheckout}
              storeConfig={storeConfig}
              isProcessing={isProcessing}
              onOpenAdminLogin={() => setShowPinModal(true)}
              isSheetConnected={isSheetConnected}
            />
          </main>
        </>
      )}

      {/* =========================================================================
          MODE 2: ENTERPRISE ADMIN DASHBOARD (13 FITUR LENGKAP PENGELOLA SISTEM)
          ========================================================================= */}
      {currentRole === 'admin' && (
        <AdminLayout
          activeTab={activeAdminTab}
          setActiveTab={setActiveAdminTab}
          onSwitchToKasir={handleSwitchToKasir}
          storeConfig={storeConfig}
          appConfig={appConfig}
          onToggleDarkMode={handleToggleDarkMode}
          darkMode={darkMode}
          unreadNotifCount={notifications.filter(n => !n.read).length}
          isSheetConnected={isSheetConnected}
          currentUser={currentUser}
        >
          {/* 1. Dashboard Utama */}
          {activeAdminTab === 'dashboard' && (
            <DashboardHome 
              products={products}
              transactions={transactions}
              users={users}
              categories={categories}
              notifications={notifications}
              activityLogs={activityLogs}
              appConfig={appConfig}
              sheetUrl={sheetUrl}
              isSheetConnected={isSheetConnected}
              onNavigate={(tab) => setActiveAdminTab(tab)}
              onSwitchToKasir={handleSwitchToKasir}
            />
          )}

          {/* 2. Manajemen Pengguna */}
          {activeAdminTab === 'users' && (
            <UserManagement 
              users={users}
              roles={roles}
              onSaveUsers={handleSaveUsers}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 3. Manajemen Role dan Hak Akses */}
          {activeAdminTab === 'roles' && (
            <RolePermissionManagement 
              roles={roles}
              onSaveRoles={handleSaveRoles}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 4. Manajemen Data (Master Produk) */}
          {activeAdminTab === 'products' && (
            <DataManagement 
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onBulkDeleteProducts={handleBulkDeleteProducts}
              onSyncProducts={handleSyncProducts}
              isSyncing={isSyncing}
              sheetUrl={sheetUrl}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 5. Manajemen Kategori */}
          {activeAdminTab === 'categories' && (
            <CategoryManagement 
              categories={categories}
              products={products}
              onSaveCategories={handleSaveCategories}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 6. Manajemen Laporan */}
          {activeAdminTab === 'reports' && (
            <ReportsManagement 
              transactions={transactions}
              products={products}
              categories={categories}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 7. Notifikasi */}
          {activeAdminTab === 'notifications' && (
            <NotificationsView 
              notifications={notifications}
              onSaveNotifications={handleSaveNotifications}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 8. Riwayat Aktivitas (Activity Log) */}
          {activeAdminTab === 'activityLogs' && (
            <ActivityLogView 
              activityLogs={activityLogs}
              onClearLogs={handleClearLogs}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 9. Pengaturan Aplikasi */}
          {activeAdminTab === 'settings' && (
            <AppSettingsView 
              appConfig={appConfig}
              onSaveAppConfig={handleSaveAppConfig}
              storeConfig={storeConfig}
              onSaveStoreConfig={(newStore) => {
                setStoreConfig(newStore);
                storageService.saveSettings(newStore);
              }}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 10. Integrasi Google Sheets */}
          {activeAdminTab === 'googleSheets' && (
            <GoogleSheetsHub 
              sheetUrl={sheetUrl}
              onSaveSheetUrl={handleSaveSheetUrl}
              onTestConnection={handleTestConnection}
              testStatus={testStatus}
              isTesting={isTesting}
              onSyncProducts={handleSyncProducts}
              onSyncTransactions={handleSyncTransactions}
              isSyncing={isSyncing}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 11. Keamanan Sistem */}
          {activeAdminTab === 'security' && (
            <SecurityView 
              adminPin={adminPin}
              onSaveAdminPin={(newPin) => {
                setAdminPin(newPin);
                storageService.saveAdminPin(newPin);
              }}
              appConfig={appConfig}
              onSaveAppConfig={handleSaveAppConfig}
              onLogActivity={logActivity}
              onShowToast={showToast}
              onLogoutAdmin={handleLogoutAdmin}
            />
          )}

          {/* 12. Backup dan Restore */}
          {activeAdminTab === 'backup' && (
            <BackupRestoreView 
              backupHistory={backupHistory}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
              onClearAllData={handleClearAllData}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {/* 13. Profil Admin */}
          {activeAdminTab === 'profile' && (
            <AdminProfileView 
              currentUser={currentUser}
              onUpdateProfile={(updated) => {
                setCurrentUser(updated);
                const updatedList = users.map(u => u.id === updated.id ? updated : u);
                handleSaveUsers(updatedList);
              }}
              adminPin={adminPin}
              onSaveAdminPin={(newPin) => {
                setAdminPin(newPin);
                storageService.saveAdminPin(newPin);
              }}
              onLogout={handleLogoutAdmin}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}
        </AdminLayout>
      )}

      {/* Modal Cetak Struk Belanja */}
      {activeReceipt && (
        <ReceiptModal 
          transaction={activeReceipt}
          storeConfig={storeConfig}
          onClose={() => setActiveReceipt(null)}
          onNewTransaction={() => {
            setActiveReceipt(null);
            setCurrentKasirTab('pos');
          }}
        />
      )}

      {/* Modal PIN Akses Admin */}
      <AdminPinModal 
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        currentPin={adminPin}
      />

      {/* Modal Pengaturan Cepat Nama & Logo Toko */}
      {showStoreSettingsModal && (
        <StoreSettingsModal 
          storeConfig={storeConfig}
          onSaveStoreConfig={(newStore) => {
            setStoreConfig(newStore);
            storageService.saveSettings(newStore);
            handleSaveAppConfig({ 
              ...appConfig, 
              appName: newStore.name, 
              name: newStore.name, 
              logo: newStore.logo,
              address: newStore.address,
              phone: newStore.phone
            });
          }}
          onClose={() => setShowStoreSettingsModal(false)}
          onShowToast={showToast}
          onLogActivity={logActivity}
        />
      )}
    </div>
  );
}
