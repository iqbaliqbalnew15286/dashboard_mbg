import React, { useEffect, useMemo, useState } from 'react';
import { 
  History, Search, RotateCcw, Printer, 
  Calendar, Loader2, PackageSearch, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Sesuaikan import AdminLayout dengan path di project Anda
import AdminLayout from '../../layouts/AdminLayout'; 

export default function StokRiwayatMasukPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');

  const csrfToken = () => {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute('content') : '';
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
  const formatAngka = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filterAwal) params.set('tgl_awal', filterAwal);
    if (filterAkhir) params.set('tgl_akhir', filterAkhir);
    if (search) params.set('q', search);
    return params.toString();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      // Pastikan endpoint ini sesuai dengan Route di web.php Anda
      const res = await fetch(`/stok/riwayat-masuk/data${qs ? `?${qs}` : ''}`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
      });
      if (!res.ok) throw new Error('Gagal mengambil data');
      
      const json = await res.json();
      setRows(json.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
    setTimeout(() => loadData(), 100);
  };

  // Kalkulasi Total
  const totalQty = useMemo(() => rows.reduce((s, r) => s + (Number(r.qty_terima) || 0), 0), [rows]);
  const totalHarga = useMemo(() => rows.reduce((s, r) => s + (Number(r.total_harga) || 0), 0), [rows]);

  return (
    
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
        
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <History size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Riwayat Barang Masuk</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Laporan historis penerimaan stok barang dan logistik dari *supplier*.</p>
          </div>
        </div>

        {/* FILTER & PENCARIAN */}
        <div className="bg-white rounded-[2rem] border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Filter Tanggal */}
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                  placeholder="Cari PO, Barang, Petugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex gap-2 w-full xl:w-auto">
              <button 
                onClick={loadData} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-indigo-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Cari
              </button>
              <button 
                onClick={handleReset} 
                className="p-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Reset Filter"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex-1 xl:flex-none p-3.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
            
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Tgl Terima</th>
                  <th className="px-6 py-5 whitespace-nowrap">No PO</th>
                  <th className="px-6 py-5 min-w-[150px]">Nama Barang</th>
                  <th className="px-6 py-5">Supplier</th>
                  <th className="px-6 py-5 text-center bg-indigo-50/50 text-indigo-600">Qty</th>
                  <th className="px-6 py-5 text-center">Satuan</th>
                  <th className="px-6 py-5 text-right">Harga Beli</th>
                  <th className="px-6 py-5 text-right bg-emerald-50/50 text-emerald-600">Total Harga</th>
                  <th className="px-6 py-5">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-3 text-indigo-500" />
                      <p className="font-bold">Memuat data riwayat...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center text-slate-400">
                      <PackageSearch size={40} className="mx-auto mb-4 opacity-30" />
                      <p className="font-bold text-base text-slate-500">Tidak ada riwayat barang masuk.</p>
                      <p className="text-xs mt-1">Coba sesuaikan filter pencarian atau tanggal.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/50 transition-colors align-middle">
                      <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">{r.tgl_terima || '-'}</td>
                      <td className="px-6 py-4 font-black text-indigo-600 whitespace-nowrap">#{r.no_po || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">{r.nama_barang || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-500">{r.nama_supplier || '-'}</td>
                      <td className="px-6 py-4 text-center font-black text-indigo-700 bg-indigo-50/30">{formatAngka(r.qty_terima)}</td>
                      <td className="px-6 py-4 text-center font-black text-[10px] text-slate-400 uppercase tracking-widest">{r.satuan || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRp(r.harga_beli)}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-700 bg-emerald-50/30">{formatRp(r.total_harga)}</td>
                      <td className="px-6 py-4 font-bold text-slate-500 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" /> {r.petugas || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* FOOTER TOTAL */}
              {rows.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200 print:bg-transparent">
                  <tr>
                    <td colSpan={4} className="px-6 py-5 text-right font-black text-xs uppercase tracking-widest text-slate-500">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="px-6 py-5 text-center font-black text-base text-indigo-700">
                      {formatAngka(totalQty)}
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-6 py-5 text-right font-black text-base text-emerald-600">
                      {formatRp(totalHarga)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
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

      </div>
  );
}