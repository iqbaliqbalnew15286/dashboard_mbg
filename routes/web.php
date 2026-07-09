<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\RabController;
use App\Http\Controllers\BeritaAcaraController;
use App\Http\Controllers\MasterBahanBakuController;
use App\Http\Controllers\MasterOperasionalController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\PengaturanController;
use Illuminate\Support\Facades\Route;

// Redirect root ke dashboard
Route::get('/', fn() => redirect('/dashboard'));

// ==========================================
// AUTENTIKASI
// ==========================================
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.post');
});

// ==========================================
// AREA TERPROTEKSI (SISTEM MBG INTERNAL)
// ==========================================
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    
    // Dashboard Utama
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Modul RAB
    Route::resource('rab', RabController::class);

    // Modul Purchase Order (PO) & Rekap Transaksi
    Route::resource('purchase-orders', PurchaseOrderController::class);
    Route::get('/transaksi', [PurchaseOrderController::class, 'transaksi'])->name('transaksi.index');

    // Modul Berita Acara
    Route::resource('berita-acara', BeritaAcaraController::class);

    // Modul Laporan Umum
    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan.index');
    Route::post('/laporan/transaksi', [LaporanController::class, 'transaksi'])->name('laporan.transaksi');

    // ==========================================
    // MASTER DATA
    // ==========================================
    Route::prefix('master')->name('master.')->group(function () {
        Route::resource('bahan-baku', MasterBahanBakuController::class);
        Route::resource('operasional', MasterOperasionalController::class);
        Route::resource('supplier', SupplierController::class);
    });

    // ==========================================
    // MODUL STOK GUDANG TERPADU
    // ==========================================
    Route::prefix('stok')->name('stok.')->group(function () {
        
        // 1. Barang Masuk (Terima)
        Route::get('/terima', fn() => inertia('stok/Terima'))->name('terima');
        Route::get('/terima/po-pending', [StockController::class, 'poPendingForTerima']);
        Route::get('/terima/po/{nomor_po}', [PurchaseOrderController::class, 'searchPoForTerima']); // API Tarik PO
        Route::post('/terima', [StockController::class, 'simpanTerima']);

        // 2. Riwayat Masuk
        Route::get('/riwayat-masuk', fn() => inertia('stok/RiwayatMasuk'))->name('riwayat-masuk');
        Route::get('/riwayat-masuk/data', [StockController::class, 'riwayatMasukData'])->name('riwayat-masuk.data');

        // 3. Barang Keluar
        Route::get('/keluar', fn() => inertia('stok/Keluar'))->name('keluar');
        Route::get('/keluar/barang-tersedia', [StockController::class, 'listBarangTersedia']);
        Route::post('/keluar', [StockController::class, 'simpanKeluar']);
        Route::get('/riwayat-keluar/data', [StockController::class, 'riwayatKeluarData'])->name('riwayat-keluar.data');

        // 4. Rekapitulasi Stok
        Route::get('/rekap', fn() => inertia('stok/Rekap'))->name('rekap');
        Route::get('/rekap-stok/data', [StockController::class, 'rekapStokData'])->name('rekap.data');
    });

    // ==========================================
    // PENGATURAN SISTEM & MANAJEMEN AKSES
    // ==========================================
    Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('pengaturan.index');
    Route::post('/pengaturan', [PengaturanController::class, 'store'])->name('pengaturan.store');
    
    // Zona Berbahaya (Hapus Data & Backup)
    Route::post('/pengaturan/reset-uji', [PengaturanController::class, 'resetDataUji'])->name('pengaturan.reset');
    Route::post('/pengaturan/backup-reset', [PengaturanController::class, 'backupDanReset'])->name('pengaturan.backup_reset'); // <-- Rute yang ditambahkan

    // Manajemen Akses Admin (RBAC: Superadmin & Admin)
    Route::resource('user', UserController::class);
});