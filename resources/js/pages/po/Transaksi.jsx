import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
  ArrowRightLeft, Calendar, Search, 
  Edit2, Trash2, Box, X, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransaksiIndex() {
  const { props } = usePage();
  const pos = props.transactions || props.pos || [];

  // State Filter
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // State Modal Detail
  const [selectedPo, setSelectedPo] = useState(null);

  // Logika Filter Data
  const filteredPos = useMemo(() => {
    return pos.filter(p => {
      const matchSearch = (p.nomor_po || '').toLowerCase().includes(search.toLowerCase()) || 
                          (p.kategori_biaya || '').toLowerCase().includes(search.toLowerCase());
      const matchDate = filterDate ? p.tanggal_pesan === filterDate : true;
      return matchSearch && matchDate;
    });
  }, [pos, search, filterDate]);

  // Kalkulasi Total dari data yang terfilter
  const totalValue = useMemo(() => {
    return filteredPos.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0);
  }, [filteredPos]);

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <ArrowRightLeft className="text-blue-600" size={28} /> Rekap Transaksi
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Filter Tanggal */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-slate-400 group-focus-within:text-blue-500" />
            </div>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-[170px] pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              title="Filter berdasarkan Tanggal Pesan"
            />
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-500" />
            </div>
            <input 
              type="text" 
              placeholder="Cari PO, Kategori..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[250px] pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest align-middle text-center">
              <tr>
                <th className="px-4 py-4 w-[50px]">No</th>
                <th className="px-4 py-4 w-[110px]">Tgl Pesan</th>
                <th className="px-4 py-4 w-[110px]">Tgl Diberikan</th>
                <th className="px-4 py-4 w-[180px] text-left">Nomor PO</th>
                <th className="px-4 py-4 w-[130px]">Kategori</th>
                <th className="px-4 py-4 w-[150px] text-right">Nominal (Rp)</th>
                <th className="px-4 py-4 w-[180px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm align-middle">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Box size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">Belum ada data transaksi tersimpan</p>
                  </td>
                </tr>
              ) : (
                filteredPos.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors text-center">
                    <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{p.tanggal_pesan || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-500">{p.tanggal_diberikan || '-'}</td>
                    <td className="px-4 py-3 font-black text-slate-800 text-left">{p.nomor_po || '-'}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{p.kategori_biaya || '-'}</td>
                    <td className="px-4 py-3 font-black text-slate-800 text-right">{formatRp(p.grand_total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setSelectedPo(p)} 
                          className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-600 hover:text-white transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16}/>
                        </button>
                        <button 
                          onClick={() => router.get(`/purchase-orders/${p.id}/edit`)} 
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          onClick={() => confirm('Hapus transaksi ini?') && router.delete(`/purchase-orders/${p.id}`)} 
                          className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="px-4 py-4 text-right font-black text-xs text-slate-500 uppercase tracking-widest">
                  TOTAL TRANSAKSI
                </td>
                <td className="px-4 py-4 text-right font-black text-blue-600 text-lg">
                  {formatRp(totalValue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL DETAIL PO */}
      <AnimatePresence>
        {selectedPo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="bg-sky-500 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <h5 className="font-black flex items-center gap-2 text-lg">
                  <Box size={20} /> Daftar Bahan Pesanan ({selectedPo.nomor_po})
                </h5>
                <button onClick={() => setSelectedPo(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
                      <tr>
                        <th className="px-4 py-3 w-[50px]">No</th>
                        <th className="px-4 py-3 text-left">Nama Bahan/Transaksi</th>
                        <th className="px-4 py-3 w-[80px]">Qty</th>
                        <th className="px-4 py-3 w-[100px]">Satuan</th>
                        <th className="px-4 py-3 w-[130px] text-right">Harga/Biaya</th>
                        <th className="px-4 py-3 w-[130px] text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm align-middle">
                      {(!selectedPo.details || selectedPo.details.length === 0) ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-bold">Tidak ada detail item</td></tr>
                      ) : (
                        selectedPo.details.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-slate-700">{item.bahan_baku?.nama_barang || '-'}</td>
                            <td className="px-4 py-3 text-center font-black text-slate-800">{Number(item.qty)}</td>
                            <td className="px-4 py-3 text-center font-bold text-slate-500">{item.bahan_baku?.satuan || '-'}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatRp(item.harga_satuan)}</td>
                            <td className="px-4 py-3 text-right font-black text-slate-900">{formatRp(item.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedPo(null)} 
                  className="px-6 py-2.5 bg-slate-500 text-white font-bold text-sm rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}