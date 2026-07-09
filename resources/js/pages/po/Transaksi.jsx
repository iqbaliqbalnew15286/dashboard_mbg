import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
  ArrowRightLeft, Calendar, Search, 
  Edit2, Trash2, Box, X, Eye, Loader2, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransaksiIndex({ transactions, filters }) {
  // State Filter (Mengambil nilai dari URL jika ada)
  const [search, setSearch] = useState(filters?.search || '');
  const [filterDate, setFilterDate] = useState(filters?.date || '');
  
  // State UI
  const [selectedPo, setSelectedPo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mengambil Array asli dari object paginasi Laravel
  const dataList = transactions?.data || [];

  // ==========================================
  // PENCARIAN SERVER-SIDE (DEBOUNCED)
  // ==========================================
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Hanya kirim request jika nilai pencarian atau tanggal berubah
      if (search !== (filters?.search || '') || filterDate !== (filters?.date || '')) {
        setIsLoading(true);
        router.get('/transaksi', { search, date: filterDate }, {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          onFinish: () => setIsLoading(false)
        });
      }
    }, 500); // Jeda 500ms agar server tidak di-spam saat mengetik

    return () => clearTimeout(delayDebounceFn);
  }, [search, filterDate, filters?.search, filters?.date]);

  const handleReset = () => {
    setSearch('');
    setFilterDate('');
    setIsLoading(true);
    router.get('/transaksi', {}, {
      preserveState: true,
      onFinish: () => setIsLoading(false)
    });
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // Kalkulasi total hanya untuk data yang tampil di halaman aktif saat ini
  const totalHalamanIni = dataList.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      
      {/* HEADER & PENCARIAN (Desain Flat Modern) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
            Rekap Transaksi
          </h2>
          <p className="text-slate-500 text-sm mt-1">Kelola dan pantau seluruh riwayat Purchase Order (PO).</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          {/* Filter Tanggal */}
          <div className="relative group flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-slate-400 group-focus-within:text-blue-500" />
            </div>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-[160px] pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
              title="Filter Tanggal Pesan"
            />
          </div>

          {/* Kolom Pencarian */}
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isLoading ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <Search size={18} className="text-slate-400 group-focus-within:text-blue-500" />}
            </div>
            <input 
              type="text" 
              placeholder="Cari No. PO atau Kategori..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[240px] pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
            />
          </div>

          <button 
            onClick={handleReset}
            className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center shrink-0"
            title="Reset Pencarian"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* TABEL DATA TRANSAKSI */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Tgl Pesan</th>
                <th className="px-6 py-5">Tgl Diberikan</th>
                <th className="px-6 py-5">Nomor PO</th>
                <th className="px-6 py-5 text-center">Kategori</th>
                <th className="px-6 py-5 text-right">Nominal (Rp)</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {dataList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Box size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base text-slate-500">Belum ada data transaksi.</p>
                    <p className="text-xs mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                  </td>
                </tr>
              ) : (
                dataList.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors align-middle">
                    <td className="px-6 py-4 font-bold text-slate-400 text-center">
                      {transactions?.from ? transactions.from + idx : idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">{p.tanggal_pesan || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-500">{p.tanggal_diberikan || '-'}</td>
                    <td className="px-6 py-4 font-black text-blue-600">#{p.nomor_po || '-'}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                            {p.kategori_biaya || '-'}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 text-right bg-slate-50/30">
                        {formatRp(p.grand_total)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setSelectedPo(p)} 
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-sky-500 hover:text-white transition-all"
                          title="Lihat Detail"
                        >
                          <Eye size={15}/>
                        </button>
                        <button 
                          onClick={() => router.get(`/purchase-orders/${p.id}/edit`)} 
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title="Edit Transaksi"
                        >
                          <Edit2 size={15}/>
                        </button>
                        <button 
                          onClick={() => {
                              if(confirm('Hapus transaksi PO ini secara permanen?')) {
                                  router.delete(`/purchase-orders/${p.id}`, { preserveScroll: true });
                              }
                          }} 
                          className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

        {/* COMPONENT PAGINASI */}
        {transactions && transactions.links && dataList.length > 0 && (
            <div className="flex items-center justify-between px-8 py-4 bg-white border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Menampilkan {transactions.from} - {transactions.to} dari {transactions.total}
                </span>
                <div className="flex gap-1">
                    {transactions.links.map((link, k) => (
                        <button
                            key={k}
                            onClick={() => link.url && router.get(link.url, { search, date: filterDate }, { preserveScroll: true, preserveState: true })}
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

      {/* MODAL DETAIL PO */}
      <AnimatePresence>
        {selectedPo && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shrink-0">
                <h5 className="font-black flex items-center gap-3 text-lg tracking-wide">
                  <Box className="text-blue-500" size={24} /> Daftar Bahan Pesanan ({selectedPo.nomor_po})
                </h5>
                <button onClick={() => setSelectedPo(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              {/* Modal Body (Tabel Item) */}
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 w-16">No</th>
                        <th className="px-6 py-4 text-left">Nama Bahan/Transaksi</th>
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
                        selectedPo.details.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-6 py-4 font-black text-slate-800">{item.bahan_baku?.nama_barang || item.kategori_biaya || '-'}</td>
                            <td className="px-6 py-4 text-center font-black text-blue-600 bg-blue-50/30">{Number(item.qty)}</td>
                            <td className="px-6 py-4 text-center font-bold text-slate-500 uppercase text-[10px] tracking-widest">{item.bahan_baku?.satuan || '-'}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRp(item.harga_satuan)}</td>
                            <td className="px-6 py-4 text-right font-black text-emerald-700 bg-emerald-50/20">{formatRp(item.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedPo(null)} 
                  className="px-8 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Tutup Rincian
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}