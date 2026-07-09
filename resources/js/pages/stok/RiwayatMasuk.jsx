import React, { useEffect, useMemo, useState } from 'react';
import { 
  History, Search, RotateCcw, Printer, 
  Calendar, Loader2, PackageSearch, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

export default function RiwayatMasuk() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
  const formatAngka = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  // Menggunakan Axios agar lebih ringan, parameter otomatis di-build, dan CSRF otomatis tertangani
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/stok/riwayat-masuk/data', {
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
    
    // Memberikan sedikit jeda agar state React ter-update sebelum memanggil ulang API
    setTimeout(() => {
      setLoading(true);
      axios.get('/stok/riwayat-masuk/data')
        .then(res => setRows(res.data.data || []))
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 50);
  };

  // Kalkulasi Total (Dieksekusi ulang hanya jika variabel rows berubah)
  const totalQty = useMemo(() => rows.reduce((s, r) => s + (Number(r.qty_terima) || 0), 0), [rows]);
  const totalHarga = useMemo(() => rows.reduce((s, r) => s + (Number(r.total_harga) || 0), 0), [rows]);

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Riwayat Barang Masuk</h2>
            <p className="text-slate-500 text-sm mt-1">Laporan historis penerimaan stok barang dan logistik dari supplier.</p>
          </div>
        </div>

        {/* FILTER & PENCARIAN */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm print:hidden">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Filter Tanggal */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                    value={filterAwal}
                    onChange={(e) => setFilterAwal(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Akhir</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
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
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                  placeholder="Cari PO, Barang, Petugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto mt-4 xl:mt-0">
              <button 
                onClick={loadData} 
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Cari
              </button>
              <button 
                onClick={handleReset} 
                className="px-5 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                title="Reset Filter"
              >
                <RotateCcw size={16} />
              </button>
              <button 
                onClick={() => window.print()} 
                disabled={rows.length === 0}
                className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:shadow-none"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
            
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-slate-100 print:text-black">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Tgl Terima</th>
                  <th className="px-6 py-5 whitespace-nowrap">No PO</th>
                  <th className="px-6 py-5 min-w-[150px]">Nama Barang</th>
                  <th className="px-6 py-5">Supplier</th>
                  <th className="px-6 py-5 text-center bg-blue-50/50 text-blue-600 print:bg-transparent print:text-black">Qty</th>
                  <th className="px-6 py-5 text-center">Satuan</th>
                  <th className="px-6 py-5 text-right">Harga Beli</th>
                  <th className="px-6 py-5 text-right bg-emerald-50/50 text-emerald-600 print:bg-transparent print:text-black">Total Harga</th>
                  <th className="px-6 py-5">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-24 text-center text-slate-400">
                      <Loader2 size={40} className="animate-spin mx-auto mb-3 text-blue-500" />
                      <p className="font-bold text-slate-600">Memuat data riwayat...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-24 text-center text-slate-400">
                      <PackageSearch size={48} className="mx-auto mb-4 opacity-20 text-blue-500" />
                      <p className="font-bold text-base text-slate-600">Tidak ada riwayat barang masuk.</p>
                      <p className="text-xs mt-1">Coba sesuaikan filter pencarian atau tanggal.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors align-middle print:text-black">
                      <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap print:text-black">{r.tgl_terima || '-'}</td>
                      <td className="px-6 py-4 font-black text-blue-600 whitespace-nowrap print:text-black">#{r.no_po || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">{r.nama_barang || '-'}</td>
                      <td className="px-6 py-4 font-bold text-slate-500 print:text-black">{r.nama_supplier || '-'}</td>
                      <td className="px-6 py-4 text-center font-black text-blue-700 bg-blue-50/30 print:bg-transparent print:text-black">{formatAngka(r.qty_terima)}</td>
                      <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg print:border-none print:p-0 print:bg-transparent">
                              {r.satuan || '-'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-600 print:text-black">{formatRp(r.harga_beli)}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-700 bg-emerald-50/30 print:bg-transparent print:text-black">{formatRp(r.total_harga)}</td>
                      <td className="px-6 py-4 font-bold text-slate-500 flex items-center gap-2 print:text-black">
                        <CheckCircle2 size={14} className="text-blue-500 print:hidden" /> {r.petugas || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* FOOTER TOTAL */}
              {rows.length > 0 && (
                <tfoot className="bg-slate-900 border-t border-slate-800 text-white print:bg-slate-200 print:text-black print:border-black">
                  <tr className="align-middle">
                    <td colSpan={4} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400 print:text-black">
                      TOTAL KESELURUHAN
                    </td>
                    <td className="px-6 py-5 text-center font-black text-base text-blue-400 print:bg-transparent print:text-black">
                      {formatAngka(totalQty)}
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-6 py-5 text-right font-black text-base text-emerald-400 print:bg-transparent print:text-black">
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
            .container-fluid { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; }
            button, .lucide, .print\\:hidden { display: none !important; }
            .bg-white { box-shadow: none !important; border: none !important; }
            table { border: 1px solid #000 !important; width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #000 !important; padding: 10px 6px !important; color: #000 !important; background: transparent !important; }
            thead th { background-color: #f2f2f2 !important; color: #000 !important; font-weight: bold !important; text-align: center !important; }
            tfoot tr td { background-color: #e6e6e6 !important; color: #000 !important; font-weight: bold !important; }
          }
        `}} />

      </div>
  );
}