import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { 
  LogOut, Search, RotateCcw, Printer, Plus, 
  Calendar, Loader2, PackageMinus, CheckCircle2, 
  XCircle, Trash2, ShoppingCart, Save, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StokKeluarPage() {
  // State Riwayat Utama
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');

  // State Modal & Form Input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [barangTersedia, setBarangTersedia] = useState([]);
  const [tglKeluar, setTglKeluar] = useState(new Date().toISOString().split('T')[0]);
  const [petugas, setPetugas] = useState('');
  
  // State Input Sementara
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

  // ==========================================
  // FETCH DATA RIWAYAT (Dioptimasi dengan Axios)
  // ==========================================
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

  // ==========================================
  // FETCH DATA BARANG UNTUK MODAL
  // ==========================================
  const loadBarangTersedia = async () => {
    try {
      const res = await axios.get('/stok/keluar/barang-tersedia');
      setBarangTersedia(res.data.data || []);
    } catch (e) {
      console.error('Gagal memuat daftar barang', e);
    }
  };

  useEffect(() => {
    loadRiwayat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetFilter = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
    setTimeout(() => {
        setLoading(true);
        axios.get('/stok/riwayat-keluar/data')
            .then(res => setRows(res.data.data || []))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, 50);
  };

  const openModalTambah = () => {
    loadBarangTersedia();
    setIsModalOpen(true);
  };

  // ==========================================
  // LOGIKA KERANJANG (SISI KLIEN)
  // ==========================================
  const selectedBarangDetail = useMemo(() => {
    if (!selectedBarangId) return null;
    return barangTersedia.find(b => String(b.id) === String(selectedBarangId));
  }, [selectedBarangId, barangTersedia]);

  const tambahKeKeranjang = () => {
    if (!selectedBarangDetail) return showToast('Pilih barang terlebih dahulu!', 'error');
    if (!qtyKeluar || Number(qtyKeluar) <= 0) return showToast('Volume keluar tidak valid!', 'error');
    if (Number(qtyKeluar) > Number(selectedBarangDetail.stok)) {
      return showToast('Volume melebihi stok yang tersedia!', 'error');
    }

    const existsIndex = keranjang.findIndex(k => String(k.bahan_baku_id) === String(selectedBarangDetail.id));
    
    if (existsIndex >= 0) {
      const newKeranjang = [...keranjang];
      const totalBaru = Number(newKeranjang[existsIndex].qty) + Number(qtyKeluar);
      
      if (totalBaru > Number(selectedBarangDetail.stok)) {
        return showToast('Total akumulasi di keranjang melebihi stok!', 'error');
      }
      
      newKeranjang[existsIndex].qty = totalBaru;
      setKeranjang(newKeranjang);
    } else {
      setKeranjang([...keranjang, {
        bahan_baku_id: selectedBarangDetail.id,
        nama_barang: selectedBarangDetail.nama,
        satuan: selectedBarangDetail.satuan,
        qty: Number(qtyKeluar),
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

  // ==========================================
  // SIMPAN KE BACKEND (Dioptimasi dengan Inertia Router)
  // ==========================================
  const simpanDataMassal = () => {
    if (!tglKeluar) return showToast('Tanggal keluar harus diisi!', 'error');
    if (!petugas.trim()) return showToast('Nama petugas harus diisi!', 'error');
    if (keranjang.length === 0) return showToast('Daftar barang masih kosong!', 'error');

    const payload = {
      tgl_keluar: tglKeluar,
      petugas: petugas,
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
            setPetugas('');
            loadRiwayat(); 
        },
        onError: () => {
            showToast('Gagal menyimpan pengeluaran barang. Periksa inputan Anda.', 'error');
        },
        onFinish: () => setIsSaving(false)
    });
  };

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
        
        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-8 right-8 z-[200] px-5 py-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
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

        {/* HEADER - Disesuaikan dengan desain yang seragam dan simpel */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Barang Keluar</h2>
                <p className="text-slate-500 text-sm mt-1">Kelola dan catat pengeluaran stok barang dari gudang.</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button 
                  onClick={openModalTambah}
                  className="w-full lg:w-auto bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
                >
                  <Plus size={18} /> Input Barang Keluar
                </button>
            </div>
        </div>

        {/* FILTER & PENCARIAN */}
        <div className="bg-white rounded-[2rem] border border-rose-100 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Filter Tanggal */}
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                    value={filterAkhir}
                    onChange={(e) => setFilterAkhir(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Pencarian Teks */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                  placeholder="Cari Barang, Petugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadRiwayat()}
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 w-full xl:w-auto">
              <button 
                onClick={loadRiwayat} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-rose-600/20"
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
                className="flex-1 xl:flex-none p-3.5 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
            
          </div>
        </div>

        {/* TABEL RIWAYAT */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 w-16 text-center">No</th>
                  <th className="px-6 py-5 whitespace-nowrap">Tanggal</th>
                  <th className="px-6 py-5">Petugas</th>
                  <th className="px-6 py-5">Nama Barang</th>
                  <th className="px-6 py-5 text-center bg-rose-50/50 text-rose-600">Volume</th>
                  <th className="px-6 py-5 text-center">Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-3 text-rose-500" />
                      <p className="font-bold">Memuat riwayat barang keluar...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-400">
                      <PackageMinus size={40} className="mx-auto mb-4 opacity-30" />
                      <p className="font-bold text-base text-slate-500">Tidak ada pengeluaran barang.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/50 transition-colors align-middle">
                      <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">{r.tanggal || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-500">{r.petugas || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">{r.nama_barang || '-'}</td>
                      <td className="px-6 py-4 text-center font-black text-rose-700 bg-rose-50/30">{formatAngka(r.qty)}</td>
                      <td className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">{r.satuan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CSS Khusus untuk Cetak (Print) */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .container-fluid, .container-fluid * { visibility: visible; }
            .container-fluid { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
            button, .lucide { display: none !important; }
            .bg-white { box-shadow: none !important; border: none !important; }
            table { border: 1px solid #e2e8f0; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px !important; }
            thead th { background-color: #f8fafc !important; color: #000 !important; }
          }
        `}} />

        {/* MODAL INPUT BARANG KELUAR */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
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

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* BAGIAN KIRI: FORM INPUT */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                        <h3 className="font-black text-rose-600 uppercase tracking-widest text-xs mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <span className="bg-rose-100 w-6 h-6 rounded-full flex items-center justify-center">1</span> Detail & Input
                        </h3>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Keluar <span className="text-rose-500">*</span></label>
                          <input 
                            type="date" 
                            className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl p-3 text-sm font-bold outline-none" 
                            value={tglKeluar} 
                            onChange={(e) => setTglKeluar(e.target.value)} 
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nama Petugas <span className="text-rose-500">*</span></label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl p-3 text-sm font-bold outline-none" 
                            placeholder="Contoh: Aslap / Chef..." 
                            value={petugas} 
                            onChange={(e) => setPetugas(e.target.value)} 
                          />
                        </div>

                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pilih Barang <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full bg-white border border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 rounded-xl p-3 text-sm font-bold outline-none"
                              value={selectedBarangId}
                              onChange={(e) => setSelectedBarangId(e.target.value)}
                            >
                              <option value="">-- Pilih Barang --</option>
                              {barangTersedia.map(b => (
                                <option key={b.id} value={b.id}>{b.nama} (Stok: {formatAngka(b.stok)} {b.satuan})</option>
                              ))}
                            </select>
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
                              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-black text-slate-500 text-center">
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
                              className="w-full bg-rose-50/50 border border-rose-300 focus:border-rose-500 rounded-xl p-3 text-center text-lg font-black text-rose-700 outline-none" 
                              placeholder="0" 
                              value={qtyKeluar} 
                              onChange={(e) => setQtyKeluar(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && tambahKeKeranjang()}
                            />
                          </div>

                          <button 
                            onClick={tambahKeKeranjang}
                            className="w-full py-3.5 border-2 border-rose-600 text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Tambah ke Daftar
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* BAGIAN KANAN: KERANJANG DAFTAR BARANG */}
                    <div className="lg:col-span-8">
                      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm h-full flex flex-col overflow-hidden">
                        
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                          <ShoppingCart className="text-indigo-500" size={24} />
                          <h3 className="font-black text-slate-800 text-lg">Daftar Barang Sementara</h3>
                          <span className="ml-auto bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full text-xs font-black">
                            {keranjang.length} Item
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                          <table className="w-full text-left border-collapse bg-white rounded-2xl shadow-sm overflow-hidden">
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
                                  <td colSpan="5" className="text-center py-16 text-slate-400">
                                    <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-30" />
                                    <p className="font-bold italic">Belum ada barang ditambahkan.</p>
                                  </td>
                                </tr>
                              ) : (
                                keranjang.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
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

                {/* Modal Footer */}
                <div className="bg-white border-t border-slate-200 p-6 flex justify-between items-center shrink-0">
                  <span className="text-slate-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} /> Data belum masuk ke sistem sebelum disimpan.
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
                      className="px-8 py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
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