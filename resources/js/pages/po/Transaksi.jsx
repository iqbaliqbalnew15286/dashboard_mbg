import React, { useState, useEffect, useRef } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { 
  ArrowRightLeft, Calendar, Search, 
  Edit2, Trash2, Box, Eye, Loader2, RotateCcw, X, AlertOctagon,
  Printer, Truck, CheckCircle2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function TransaksiIndex({ transactions, filters, kategori_biayas = [] }) {
  const { pengaturanGlobal = {} } = usePage().props;

  const defaultKategoris = ['Bahan Baku', 'Operasional', 'Insentif Fasilitas'];
  const daftarKategori = kategori_biayas.length > 0
    ? kategori_biayas.map(k => k.nama_kategori)
    : defaultKategoris;

  const [search, setSearch] = useState(filters?.search || '');
  const [tglAwal, setTglAwal] = useState(filters?.tgl_awal || '');
  const [tglAkhir, setTglAkhir] = useState(filters?.tgl_akhir || '');
  const [kategori, setKategori] = useState(filters?.kategori || '');
  
  const isInitialRender = useRef(true);
  const [selectedPo, setSelectedPo] = useState(null);
  const [printPo, setPrintPo] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const dataList = transactions?.data || [];

  // PENCARIAN & FILTER SERVER-SIDE (DEBOUNCE)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsLoading(true);
      router.get('/transaksi', { 
        search: search, 
        tgl_awal: tglAwal,
        tgl_akhir: tglAkhir,
        kategori: kategori
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onFinish: () => setIsLoading(false)
      });
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [search, tglAwal, tglAkhir, kategori]);

  const handleReset = () => {
    setSearch('');
    setTglAwal('');
    setTglAkhir('');
    setKategori('');
    setIsLoading(true);
    router.get('/transaksi', {}, {
      preserveState: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    
    router.delete(`/purchase-orders/${itemToDelete.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Transaksi PO berhasil dihapus permanen!');
        setItemToDelete(null);
      },
      onError: () => {
        toast.error('Gagal menghapus data transaksi.');
        setItemToDelete(null);
      }
    });
  };

  const handlePrintPo = (po) => {
    setPrintPo(po);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const formatTanggal = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('-');
      const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${parseInt(day, 10)} ${bulan[parseInt(month, 10) - 1]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatTanggalLokal = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const dateOnly = dateStr.split(' ')[0];
      const parts = dateOnly.split('-');
      if (parts.length !== 3) return dateStr;
      const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${parseInt(parts[2], 10)} ${bulan[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    } catch {
      return dateStr;
    }
  };

  const totalHalamanIni = dataList.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
  const kotaPengaturan = pengaturanGlobal.kota || 'Bogor';

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6 print:bg-white print:p-0">
      
      <Toaster position="top-right" />

      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
            Rekap Transaksi Purchase Order
          </h2>
          <p className="text-slate-500 text-sm mt-1">Kelola, cetak nota pesanan, dan pantau seluruh riwayat transaksi PO.</p>
        </div>
      </div>

      {/* FILTER PANEL TRANSAKSI (MENGACU PADA SUB MENU LAPORAN) */}
      <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden print:hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-500"></div>
        <div className="flex flex-col xl:flex-row gap-4 items-end">
          
          {/* RANGE TANGGAL */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Dari Tanggal</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 cursor-pointer" 
                  value={tglAwal} 
                  onChange={(e) => setTglAwal(e.target.value)} 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Sampai Tanggal</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 cursor-pointer" 
                  value={tglAkhir} 
                  onChange={(e) => setTglAkhir(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* KATEGORI */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Kategori Biaya</label>
              <div className="relative">
                <Box size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer" 
                  value={kategori} 
                  onChange={(e) => setKategori(e.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {daftarKategori.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian Teks</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari No. PO atau Supplier..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0">
            <button 
              onClick={handleReset}
              className="px-5 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shrink-0"
              title="Reset Filter & Pencarian"
            >
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* TABEL DATA TRANSAKSI */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Tgl Pesan</th>
                <th className="px-6 py-5">Nama Supplier</th>
                <th className="px-6 py-5">Nomor PO</th>
                <th className="px-6 py-5 text-center">Kategori</th>
                <th className="px-6 py-5 text-right">Nominal (Rp)</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Loader2 size={40} className="mx-auto mb-3 animate-spin text-blue-500" />
                    <p className="font-bold text-base text-slate-600">Menyaring data transaksi...</p>
                  </td>
                </tr>
              ) : dataList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Box size={40} className="mx-auto mb-3 opacity-30 text-blue-500" />
                    <p className="font-bold text-base text-slate-500">Tidak ada data transaksi ditemukan.</p>
                    <p className="text-xs mt-1">Pencarian untuk tanggal atau keyword ini kosong.</p>
                  </td>
                </tr>
              ) : (
                dataList.map((p, idx) => {
                  const supplierObj = p.details && p.details[0] ? p.details[0].supplier : null;
                  const supplierName = supplierObj ? supplierObj.nama_perusahaan : (p.details && p.details[0]?.nama_pengadaan || '-');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors align-middle">
                      <td className="px-6 py-4 font-bold text-slate-400 text-center">
                        {transactions?.from ? transactions.from + idx : idx + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{formatTanggal(p.tanggal_pesan)}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                        <Truck size={14} className="text-slate-400 shrink-0" />
                        <span>{supplierName}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-blue-600">#{p.nomor_po || '-'}</td>
                      <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            p.kategori_biaya === 'Bahan Baku'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : p.kategori_biaya === 'Insentif Fasilitas'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                              {p.kategori_biaya || '-'}
                          </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800 text-right bg-slate-50/30">
                          {formatRp(p.grand_total)}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => setSelectedPo(p)} 
                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-sky-500 hover:text-white transition-all shadow-sm"
                            title="Lihat Detail Transaksi & Cetak Nota"
                          >
                            <Eye size={15}/>
                          </button>
                          
                          <Link 
                            href={p.rab_id ? `/rab/${p.rab_id}/edit` : `/purchase-orders/${p.id}/edit`}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                            title="Revisi Transaksi langsung via RAB Pusat"
                          >
                            <Edit2 size={13}/> Edit RAB
                          </Link>

                          <button 
                            onClick={() => setItemToDelete(p)} 
                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Hapus Permanen"
                          >
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            
            {/* TOTAL HALAMAN INI */}
            {dataList.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                    <td colSpan={5} className="px-6 py-5 text-right font-black text-xs uppercase tracking-widest text-slate-500">
                    TOTAL TRANSAKSI (HALAMAN INI)
                    </td>
                    <td className="px-6 py-5 text-right font-black text-lg text-blue-600">
                    {formatRp(totalHalamanIni)}
                    </td>
                    <td></td>
                </tr>
                </tfoot>
            )}
          </table>
        </div>

        {transactions && transactions.links && dataList.length > 0 && (
            <div className="flex items-center justify-between px-8 py-4 bg-white border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Menampilkan {transactions.from} - {transactions.to} dari {transactions.total}
                </span>
                <div className="flex gap-1">
                    {transactions.links.map((link, k) => (
                        <button
                            key={k}
                            onClick={() => link.url && router.get(link.url, { search, tgl_awal: tglAwal, tgl_akhir: tglAkhir, kategori }, { preserveScroll: true, preserveState: true })}
                            disabled={!link.url || link.active}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                link.active 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : !link.url 
                                    ? 'text-slate-300 cursor-not-allowed' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* MODAL DETAIL PO DENGAN FITUR CETAK NOTA PO */}
      <AnimatePresence>
        {selectedPo && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative"
            >
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="font-black text-lg tracking-wide text-white">
                      Rincian Transaksi PO #{selectedPo.nomor_po}
                    </h5>
                    <p className="text-xs text-slate-400 font-medium">
                      Supplier: <strong className="text-white">{selectedPo.details && selectedPo.details[0]?.supplier?.nama_perusahaan || '-'}</strong> • Tanggal: {formatTanggalLokal(selectedPo.tanggal_pesan)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedPo(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50 space-y-4">
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-16">No</th>
                        <th className="px-6 py-4 text-left">Nama Bahan / Transaksi</th>
                        <th className="px-6 py-4 w-[100px]">Qty</th>
                        <th className="px-6 py-4 w-[120px]">Satuan</th>
                        <th className="px-6 py-4 w-[150px] text-right">Harga Satuan</th>
                        <th className="px-6 py-4 w-[160px] text-right">Total Sub</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm align-middle">
                      {(!selectedPo.details || selectedPo.details.length === 0) ? (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">Tidak ada rincian item dalam transaksi ini.</td></tr>
                      ) : (
                        selectedPo.details.map((item, idx) => {
                          const itemNama = item.nama_pengadaan || item.bahan_baku?.nama_barang || '-';
                          const satuan = item.bahan_baku?.satuan || 'KG';

                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="px-6 py-4 font-black text-slate-800">{itemNama}</td>
                              <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/30">{Number(item.qty)}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-500 uppercase text-[10px] tracking-widest">{satuan}</td>
                              <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRp(item.harga_satuan)}</td>
                              <td className="px-6 py-4 text-right font-black text-emerald-700 bg-emerald-50/20">{formatRp(item.subtotal)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex gap-2 w-full sm:w-auto">
                  {selectedPo.rab_id && (
                    <Link
                      href={`/rab/${selectedPo.rab_id}/edit`}
                      className="px-5 py-3 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                    >
                      <Edit2 size={16} /> Edit RAB (Revisi Pusat)
                    </Link>
                  )}
                  <button
                    onClick={() => handlePrintPo(selectedPo)}
                    className="px-6 py-3 bg-slate-900 text-white hover:bg-blue-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md"
                  >
                    <Printer size={16} /> Cetak Nota PO
                  </button>
                </div>
                
                <button 
                  onClick={() => setSelectedPo(null)} 
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col p-6 text-center relative"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={32} />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Hapus Transaksi?</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                Anda yakin ingin menghapus permanen PO <span className="font-bold text-slate-800">#{itemToDelete.nomor_po}</span>? Data tidak dapat dipulihkan.
              </p>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LAYOUT CETAK OFFICIAL NOTA PESANAN */}
      {printPo && (
        <div className="hidden print:block w-full font-['Times_New_Roman',serif] text-black leading-relaxed">
            
            {/* HEADING TITLE */}
            <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider underline underline-offset-4">
                    {printPo.kategori_biaya === 'Bahan Baku' 
                        ? 'NOTA PESANAN BAHAN BAKU PANGAN'
                        : printPo.kategori_biaya === 'Insentif Fasilitas'
                        ? 'NOTA PESANAN INSENTIF FASILITAS'
                        : 'NOTA PESANAN OPERASIONAL'
                    }
                </h2>
                <p className="text-sm font-bold mt-1">
                    PO {printPo.nomor_po}
                </p>
            </div>

            {/* PARAGRAF PERNYATAAN */}
            <p className="text-sm text-justify mb-6 indent-8">
                Pada hari ini, tanggal <strong className="font-bold">{formatTanggalLokal(printPo.tanggal_pesan)}</strong>, telah diajukan pencairan anggaran untuk kebutuhan operasional/pengadaan barang berdasarkan Purchase Order (PO) sistem nomor <strong className="font-bold">{printPo.nomor_po}</strong>. Dokumen ini menjadi bukti sah pengajuan dan validasi pencairan dana dari Manajemen Keuangan. Detail pengajuan adalah sebagai berikut:
            </p>

            {/* TABEL OFFICIAL NOTA PESANAN */}
            <div className="w-full mb-6 border border-slate-300 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 border-b border-slate-300 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="py-3 px-4 text-center border-r border-slate-200 w-12">NO</th>
                            <th className="py-3 px-4 text-left border-r border-slate-200">NAMA BAHAN/TRANSAKSI</th>
                            <th className="py-3 px-4 text-center border-r border-slate-200 w-20">QTY</th>
                            <th className="py-3 px-4 text-center border-r border-slate-200 w-24">SATUAN</th>
                            <th className="py-3 px-4 text-right border-r border-slate-200 w-36">HARGA SATUAN</th>
                            <th className="py-3 px-4 text-right w-40">TOTAL SUB</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {printPo.details && printPo.details.map((d, idx) => {
                            const itemNama = d.nama_pengadaan || d.bahan_baku?.nama_barang || '-';
                            const satuan = d.bahan_baku?.satuan || 'KG';
                            return (
                                <tr key={d.id || idx} className="align-middle">
                                    <td className="py-3 px-4 text-center font-bold border-r border-slate-200 text-slate-500">{idx + 1}</td>
                                    <td className="py-3 px-4 font-bold border-r border-slate-200 text-slate-900">{itemNama}</td>
                                    <td className="py-3 px-4 text-center font-black border-r border-slate-200 text-blue-600">{d.qty}</td>
                                    <td className="py-3 px-4 text-center font-bold border-r border-slate-200 text-slate-500 uppercase">{satuan}</td>
                                    <td className="py-3 px-4 text-right font-bold border-r border-slate-200 text-slate-700">{formatRp(d.harga_satuan)}</td>
                                    <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRp(d.subtotal)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* GRAND TOTAL SUMMARY */}
            <div className="flex justify-end items-center gap-8 mb-12 text-sm font-bold pr-4">
                <span className="text-slate-800">Total</span>
                <span className="text-base font-black text-slate-900">{formatRp(printPo.grand_total)}</span>
            </div>

            {/* SECTION TANDA TANGAN */}
            <div className="mt-12 text-sm">
                <p className="mb-10 text-left font-bold">
                    {kotaPengaturan}, {formatTanggalLokal(printPo.tanggal_pesan)}
                </p>

                <div className="grid grid-cols-3 text-center font-bold uppercase gap-4" style={{ pageBreakInside: 'avoid' }}>
                    <div>
                        <p className="mb-20 tracking-wider">PENGAWAS KEUANGAN</p>
                        <p className="underline font-black">{pengaturanGlobal.pengawas_nama || '(..................................)'}</p>
                        {pengaturanGlobal.pengawas_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.pengawas_nip}</p>}
                    </div>
                    <div>
                        <p className="mb-20 tracking-wider">KEPALA SPPG</p>
                        <p className="underline font-black">{pengaturanGlobal.sppg_nama || '(..................................)'}</p>
                        {pengaturanGlobal.sppg_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.sppg_nip}</p>}
                    </div>
                    <div>
                        <p className="mb-20 tracking-wider">ASISTEN LAPANGAN</p>
                        <p className="underline font-black">{pengaturanGlobal.asisten_nama || '(..................................)'}</p>
                        {pengaturanGlobal.asisten_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.asisten_nip}</p>}
                    </div>
                </div>
            </div>

        </div>
      )}

      {/* INJECT PRINT LAYOUT STYLE */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: portrait; margin: 1.5cm; }
          body { 
              background: white !important; 
              color: black !important;
          }
          nav, header, footer, aside, .sidebar, .print\\:hidden { 
              display: none !important; 
          }
          .print\\:block { 
              display: block !important; 
          }
        }
      `}} />

    </div>
  );
}