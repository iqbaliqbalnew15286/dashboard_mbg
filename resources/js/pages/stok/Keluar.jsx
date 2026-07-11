import React, { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { 
  LogOut, Search, RotateCcw, Printer, Plus, 
  Calendar, Loader2, PackageMinus, CheckCircle2, 
  XCircle, Trash2, ShoppingCart, Save, X, AlertCircle, User, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StokKeluarPage() {
  // 1. MENGAMBIL DATA USER & PENGATURAN GLOBAL DARI SESSION
  const { auth, pengaturanGlobal = {} } = usePage().props; 
  const petugasName = auth?.user?.name || 'Sistem Terotomatisasi';

  // 2. Tentukan Default Ceklis untuk Barang Keluar jika database kosong
  const defaultKonfigKeluar = { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true };
  
  // 3. Ekstrak konfigurasi khusus "barang_keluar"
  const konfigCetak = pengaturanGlobal.konfigurasi_cetak?.barang_keluar || defaultKonfigKeluar;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barangTersedia, setBarangTersedia] = useState([]);
  const [tglKeluar, setTglKeluar] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedBarangId, setSelectedBarangId] = useState('');
  const [qtyKeluar, setQtyKeluar] = useState('');
  const [keranjang, setKeranjang] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type) => {
    setNotification({ message, type });
    if (type !== 'loading') setTimeout(() => setNotification(null), 3000);
  };

  const formatAngka = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  // Helper format tanggal lokal
  const formatTanggalLokal = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  const loadRiwayat = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/stok/riwayat-keluar/data', {
        params: {
          tgl_awal: filterAwal || undefined,
          tgl_akhir: filterAkhir || undefined,
          q: search || undefined
        }
      });
      setRows(res.data.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBarangTersedia = async () => {
    try {
      const res = await axios.get('/stok/keluar/barang-tersedia');
      setBarangTersedia(res.data.data || []);
    } catch (e) {
      console.error('Gagal memuat daftar barang', e);
    }
  };

  // FITUR PENCARIAN REAL-TIME & OTOMATIS
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        loadRiwayat();
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterAwal, filterAkhir]);

  const handleResetFilter = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
  };

  // KALKULASI TOTAL KELUAR UNTUK TFOOTER
  const totalQty = useMemo(() => rows.reduce((s, r) => s + (Number(r.qty) || 0), 0), [rows]);

  // DAFTAR PEJABAT PENANDATANGAN
  const listPejabat = [
      { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
      { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
      { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
      { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
      { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
  ];

  const pejabatTampil = listPejabat.filter(p => konfigCetak[p.key]);

  const openModalTambah = () => {
    loadBarangTersedia();
    setIsModalOpen(true);
  };

  const selectedBarangDetail = useMemo(() => {
    if (!selectedBarangId) return null;
    return barangTersedia.find(b => String(b.id) === String(selectedBarangId));
  }, [selectedBarangId, barangTersedia]);

  const tambahKeKeranjang = () => {
    if (!selectedBarangDetail) return showToast('Pilih barang terlebih dahulu!', 'error');
    if (!qtyKeluar || Number(qtyKeluar) <= 0) return showToast('Volume keluar tidak valid!', 'error');
    
    const stokTersedia = parseFloat(selectedBarangDetail.stok);
    const qtyInput = parseFloat(qtyKeluar);

    if (qtyInput > stokTersedia) {
      return showToast(`Volume melebihi sisa stok (${stokTersedia})!`, 'error');
    }

    const existsIndex = keranjang.findIndex(k => String(k.bahan_baku_id) === String(selectedBarangDetail.id));
    
    if (existsIndex >= 0) {
      const newKeranjang = [...keranjang];
      const totalBaru = parseFloat(newKeranjang[existsIndex].qty) + qtyInput;
      
      if (totalBaru > stokTersedia) {
        return showToast('Total akumulasi di keranjang melebihi stok tersedia!', 'error');
      }
      
      newKeranjang[existsIndex].qty = totalBaru;
      setKeranjang(newKeranjang);
    } else {
      setKeranjang([...keranjang, {
        bahan_baku_id: selectedBarangDetail.id,
        nama_barang: selectedBarangDetail.nama,
        satuan: selectedBarangDetail.satuan,
        qty: qtyInput,
        harga: selectedBarangDetail.harga 
      }]);
    }

    setSelectedBarangId('');
    setQtyKeluar('');
  };

  const hapusDariKeranjang = (index) => {
    const newKeranjang = [...keranjang];
    newKeranjang.splice(index, 1);
    setKeranjang(newKeranjang);
  };

  const simpanDataMassal = () => {
    if (!tglKeluar) return showToast('Tanggal keluar harus diisi!', 'error');
    if (keranjang.length === 0) return showToast('Daftar barang masih kosong!', 'error');

    const payload = {
      tgl_keluar: tglKeluar,
      petugas: petugasName,
      items: keranjang
    };

    router.post('/stok/keluar', payload, {
        onBefore: () => {
            setIsSaving(true);
            showToast('Menyimpan data pengeluaran...', 'loading');
        },
        onSuccess: () => {
            showToast('Barang keluar berhasil dicatat!', 'success');
            setIsModalOpen(false);
            setKeranjang([]);
            loadRiwayat(); 
        },
        onError: () => {
            showToast('Gagal menyimpan pengeluaran barang. Periksa koneksi Anda.', 'error');
        },
        onFinish: () => setIsSaving(false)
    });
  };

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6 relative bg-white min-h-screen print:pb-0">
        
        {/* NOTIFIKASI TOAST */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 right-8 z-[99999] px-5 py-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
                notification.type === 'error'   ? 'bg-rose-50/90 border-rose-200 text-rose-600'
              : notification.type === 'loading' ? 'bg-blue-50/90 border-blue-200 text-blue-600'
              :                                   'bg-emerald-50/90 border-emerald-200 text-emerald-600'
              }`}
            >
              {notification.type === 'loading' ? <Loader2 className="animate-spin" size={20} />
                : notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
              <p className="font-bold text-sm">{notification.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* BAGIAN HEADER CETAK (Hanya Muncul Saat Kertas Dicetak) */}
        {/* ======================================================== */}
        <div className="hidden print:block w-full mb-4">
            {pengaturanGlobal.kop_surat && (
                <div className="w-full mb-4 text-center flex justify-center">
                    {pengaturanGlobal.kop_surat.toLowerCase().endsWith('.pdf') ? (
                        <p className="text-xs text-red-500 italic">Preview PDF tidak didukung saat pencetakan, gunakan gambar (JPG/PNG).</p>
                    ) : (
                        <img 
                            src={`/storage/${pengaturanGlobal.kop_surat}`} 
                            alt="Kop Surat" 
                            className="w-full h-auto max-h-[160px] object-contain" 
                        />
                    )}
                </div>
            )}
            
            <div className="text-center mb-6">
                <h3 className="font-bold text-[16px] uppercase tracking-wider underline underline-offset-4">Laporan Pengeluaran Barang</h3>
            </div>

            <div className="flex gap-4 mb-2 text-[12px] font-bold text-slate-800">
                <div className="w-16">Periode</div>
                <div>: {filterAwal ? formatTanggalLokal(filterAwal) : 'Awal'} s/d {filterAkhir ? formatTanggalLokal(filterAkhir) : formatTanggalLokal(new Date().toISOString().split('T')[0])}</div>
            </div>
        </div>
        {/* ======================================================== */}

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden px-4 md:px-0 pt-4 md:pt-0">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Barang Keluar</h2>
                <p className="text-slate-500 text-sm mt-1">Kelola dan catat pengeluaran stok barang dari gudang.</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button 
                  onClick={openModalTambah}
                  className="w-full lg:w-auto bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-rose-600/30 shrink-0"
                >
                  <Plus size={18} /> Input Barang Keluar
                </button>
            </div>
        </div>

        {/* FILTER PANEL (Screen Only) */}
        <div className="bg-white rounded-[2rem] border border-rose-100 p-6 shadow-sm relative overflow-hidden print:hidden mx-4 md:mx-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-400"></div>
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all text-slate-700 cursor-pointer"
                    value={filterAwal}
                    onChange={(e) => setFilterAwal(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Akhir</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all text-slate-700 cursor-pointer"
                    value={filterAkhir}
                    onChange={(e) => setFilterAkhir(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all text-slate-700"
                  placeholder="Cari Barang, Petugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto">
              <button 
                onClick={loadRiwayat} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-rose-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Cari
              </button>
              <button 
                onClick={handleResetFilter} 
                className="p-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Reset Filter"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => window.print()} 
                disabled={rows.length === 0}
                className="flex-1 xl:flex-none p-3.5 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
            
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white md:rounded-[2rem] md:border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto print:border print:border-black print:text-xs">
              
              {/* THEAD UNTUK LAYAR (SCREEN) */}
              <thead className="print:hidden bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 w-16 text-center">No</th>
                  <th className="px-6 py-5 whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-5">Petugas Pengeluar</th>
                  <th className="px-6 py-5">Nama Barang</th>
                  <th className="px-6 py-5 text-center bg-rose-50/50 text-rose-600">Volume Keluar</th>
                  <th className="px-6 py-5 text-center">Satuan</th>
                </tr>
              </thead>

              {/* THEAD KHUSUS UNTUK CETAK (PRINT) - Background Biru Paksa */}
              <thead 
                className="hidden print:table-header-group text-[10px] font-black text-black uppercase tracking-widest border-b border-black"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#b4c6e7' }}
              >
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap border border-black text-center">NO</th>
                  <th className="px-4 py-3 whitespace-nowrap border border-black text-center">TANGGAL KELUAR</th>
                  {/* Petugas disembunyikan saat di print */}
                  <th className="px-4 py-3 border border-black text-center">NAMA BARANG</th>
                  <th className="px-4 py-3 border border-black text-center">VOLUME KELUAR</th>
                  <th className="px-4 py-3 border border-black text-center">SATUAN</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm print:divide-black">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 print:border print:border-black">
                      <Loader2 size={32} className="animate-spin mx-auto mb-3 text-rose-500 print:hidden" />
                      <p className="font-bold">Memuat riwayat barang keluar...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400 print:border print:border-black">
                      <PackageMinus size={40} className="mx-auto mb-4 opacity-30 print:hidden" />
                      <p className="font-bold text-base text-slate-500">Tidak ada pengeluaran barang.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/50 transition-colors align-middle print:text-black print:border print:border-black">
                      <td className="px-6 py-4 text-center font-bold text-slate-400 print:border print:border-black print:text-[11px]">{idx + 1}</td>
                      
                      <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap print:text-black print:border print:border-black print:text-[11px] print:text-center">
                        {formatTanggalLokal(r.tanggal)}
                      </td>
                      
                      <td className="px-6 py-4 font-bold text-slate-500 print:hidden">
                          <span className="flex items-center gap-2">
                              <User size={14} className="text-slate-400"/> {r.petugas || '-'}
                          </span>
                      </td>
                      
                      <td className="px-6 py-4 font-black text-slate-800 print:text-black print:border print:border-black print:text-[11px]">
                        {r.nama_barang || '-'}
                      </td>
                      
                      <td className="px-6 py-4 text-center font-black text-rose-700 bg-rose-50/30 print:bg-transparent print:text-black print:border print:border-black print:text-[12px]">
                        {formatAngka(r.qty)}
                      </td>
                      
                      <td className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest print:border print:border-black print:text-black print:text-[11px]">
                        {r.satuan || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* TFOOT UNTUK LAYAR (SCREEN) */}
              {rows.length > 0 && (
                <tfoot className="print:hidden bg-slate-900 border-t border-slate-800 text-white">
                  <tr className="align-middle">
                    <td colSpan={4} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                      TOTAL VOLUME KELUAR
                    </td>
                    <td className="px-6 py-5 text-center font-black text-lg text-rose-400">
                      {formatAngka(totalQty)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}

              {/* TFOOT KHUSUS UNTUK CETAK (PRINT) */}
              {rows.length > 0 && (
                <tfoot className="hidden print:table-row-group text-black font-black">
                  <tr>
                    {/* Menggabungkan kolom NO, TGL KELUAR, NAMA BARANG = 3 Kolom */}
                    <td colSpan={3} className="px-4 py-3 text-right text-[11px] uppercase tracking-widest border border-black">
                      GRAND TOTAL VOLUME KELUAR
                    </td>
                    {/* Kolom QTY */}
                    <td className="px-4 py-3 text-center text-[12px] border border-black">
                      {formatAngka(totalQty)}
                    </td>
                    {/* Kolom SATUAN */}
                    <td className="border border-black"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER TANDA TANGAN DINAMIS (Hanya Muncul Saat Kertas Dicetak) */}
        {/* ======================================================== */}
        {rows.length > 0 && (
            <div className="hidden print:flex justify-around items-end mt-12 w-full" style={{ pageBreakInside: 'avoid' }}>
                {pejabatTampil.map((pejabat) => (
                    <div key={pejabat.key} className="text-center flex flex-col items-center justify-end w-48">
                        <p className="text-[12px] font-bold uppercase tracking-wider mb-20">
                            {pejabat.jabatan}
                        </p>
                        <div className="text-center">
                            <p className="font-bold text-[12px] uppercase underline underline-offset-4 mb-1">
                                {pejabat.nama || '(..................................)'}
                            </p>
                            {pejabat.nip && (
                                <p className="text-[10px]">NIP. {pejabat.nip}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
        {/* ======================================================== */}

        {/* PRINT CSS */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: portrait; margin: 0 !important; }
            body { 
                margin: 1.5cm; 
                background: white !important; 
            }
            nav, header, footer, aside, .sidebar { display: none !important; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print\\:flex { display: flex !important; }
          }
        `}} />

        {/* MODAL FORM PENGELUARAN */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                
                {/* Modal Header */}
                <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <LogOut className="text-rose-500" size={24} />
                    <h2 className="text-lg font-black tracking-wide">Form Pengeluaran Barang</h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: INPUT */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
                        <h3 className="font-black text-rose-600 uppercase tracking-widest text-xs flex items-center gap-2 border-b border-slate-100 pb-4">
                          <span className="bg-rose-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span> DETAIL & INPUT
                        </h3>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Keluar <span className="text-rose-500">*</span></label>
                          <input 
                            type="date" 
                            className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl p-3 text-sm font-bold outline-none cursor-pointer transition-all" 
                            value={tglKeluar} 
                            onChange={(e) => setTglKeluar(e.target.value)} 
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nama Petugas Pengeluar</label>
                          <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-600 cursor-not-allowed flex items-center gap-3">
                             <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                                 <User size={14} />
                             </div>
                             {petugasName}
                          </div>
                        </div>

                        <div className="pt-5 border-t border-slate-100 space-y-5">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pilih Barang <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <select 
                                className="w-full bg-white border border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl p-3 pr-10 text-sm font-bold outline-none appearance-none cursor-pointer text-slate-700 transition-all"
                                value={selectedBarangId}
                                onChange={(e) => setSelectedBarangId(e.target.value)}
                                >
                                <option value="">-- Pilih Barang --</option>
                                {barangTersedia.map(b => (
                                    <option key={b.id} value={b.id}>{b.nama} (Sisa: {formatAngka(b.stok)})</option>
                                ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Stok Tersedia</label>
                              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-black text-slate-500 text-center">
                                {selectedBarangDetail ? formatAngka(selectedBarangDetail.stok) : '0'}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Satuan</label>
                              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-black text-slate-500 text-center uppercase tracking-wider text-[11px]">
                                {selectedBarangDetail ? selectedBarangDetail.satuan : '-'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-2">Volume Keluar <span className="text-rose-500">*</span></label>
                            <input 
                              type="number" 
                              min="0"
                              step="any"
                              className="w-full bg-rose-50 border border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl p-3 text-center text-xl font-black text-rose-700 outline-none transition-all placeholder:text-rose-300 placeholder:font-semibold" 
                              placeholder="Ketik volume..." 
                              value={qtyKeluar} 
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val !== '' && Number(val) < 0) return; 
                                setQtyKeluar(val);
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && tambahKeKeranjang()}
                            />
                          </div>

                          <button 
                            onClick={tambahKeKeranjang}
                            className="w-full py-4 border-2 border-rose-500 text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Plus size={16} /> Tambah ke Daftar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: CART */}
                    <div className="lg:col-span-7">
                      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center gap-3">
                              <ShoppingCart className="text-blue-600" size={20} />
                              <h3 className="font-black text-slate-800 text-base">Keranjang Pengeluaran</h3>
                          </div>
                          <span className="bg-blue-100 text-blue-700 py-1.5 px-3 rounded-full text-xs font-black">
                            {keranjang.length} Item
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-[350px]">
                          <table className="w-full text-left border-collapse bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
                            <thead className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest">
                              <tr>
                                <th className="px-5 py-4 w-12 text-center">No</th>
                                <th className="px-5 py-4">Nama Barang</th>
                                <th className="px-5 py-4 text-center">Volume</th>
                                <th className="px-5 py-4 text-center">Satuan</th>
                                <th className="px-5 py-4 w-16 text-center">Hapus</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {keranjang.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center py-20 text-slate-400">
                                    <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-30 text-rose-500" />
                                    <p className="font-bold italic text-sm">Belum ada barang yang ditambahkan.</p>
                                    <p className="text-xs mt-1 font-medium">Pilih barang dan klik "Tambah ke Daftar".</p>
                                  </td>
                                </tr>
                              ) : (
                                keranjang.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors align-middle">
                                    <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                    <td className="px-5 py-4 font-black text-slate-700">{item.nama_barang}</td>
                                    <td className="px-5 py-4 text-center font-black text-rose-600 bg-rose-50/30">{formatAngka(item.qty)}</td>
                                    <td className="px-5 py-4 text-center font-bold text-[10px] uppercase tracking-widest text-slate-400">{item.satuan}</td>
                                    <td className="px-5 py-4 text-center">
                                      <button 
                                        onClick={() => hapusDariKeranjang(idx)}
                                        className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="bg-white border-t border-slate-200 p-6 flex justify-between items-center shrink-0">
                  <span className="text-slate-400 text-[11px] font-bold flex items-center gap-2">
                    <AlertCircle size={14} className="text-slate-300" /> Periksa ulang sebelum menyimpan.
                  </span>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="button" 
                      onClick={simpanDataMassal}
                      disabled={isSaving || keranjang.length === 0}
                      className="px-8 py-3.5 bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                      Simpan Pengeluaran
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
  );
}