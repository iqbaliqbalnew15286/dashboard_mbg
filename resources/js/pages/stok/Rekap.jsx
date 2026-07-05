import React, { useEffect, useMemo, useState } from 'react';
import { 
  Boxes, Search, RotateCcw, Printer, Calendar, 
  Loader2, PackageSearch, Eye, EyeOff, TrendingUp,
  ArrowUpRight, ArrowDownRight, DollarSign
} from 'lucide-react';
// Sesuaikan import AdminLayout dengan path di project Anda
import AdminLayout from '../../layouts/AdminLayout';

export default function StokRekapPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Filter
  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false);

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
    params.set('hide_empty', hideEmpty ? 'true' : 'false');
    return params.toString();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      // Endpoint disesuaikan dengan route backend mbg Anda
      const res = await fetch(`/stok/rekap-stok/data${qs ? `?${qs}` : ''}`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
      });
      if (!res.ok) throw new Error('Gagal memuat rekap stok');
      
      const json = await res.json();
      setRows(json.data || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Triger reload otomatis ketika toggle sembunyikan data kosong di-klik
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideEmpty]);

  const handleResetFilter = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
    setHideEmpty(false);
    setTimeout(() => loadData(), 100);
  };

  // ==========================================
  // KALKULASI TOTAL FOOTER & STATISTIK CARD
  // ==========================================
  const stats = useMemo(() => {
    return rows.reduce((acc, r) => {
      acc.saldoAwal += Number(r.saldo_awal) || 0;
      acc.masuk += Number(r.masuk) || 0;
      acc.keluar += Number(r.keluar) || 0;
      acc.saldoAkhir += Number(r.saldo_akhir) || 0;
      acc.totalNilaiRp += Number(r.jumlah_rp) || 0;
      return acc;
    }, { saldoAwal: 0, masuk: 0, keluar: 0, saldoAkhir: 0, totalNilaiRp: 0 });
  }, [rows]);

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
        
        {/* HEADER */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Boxes size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Rekapitulasi Stok Gudang</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Laporan mutasi rekap persediaan barang mencakup saldo awal, barang masuk, keluar, dan nilai aset kuantitas.</p>
          </div>
        </div>

        {/* SUMMARY CARDS STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Mutasi Masuk</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">{formatAngka(stats.masuk)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ArrowUpRight size={20} /></div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Mutasi Keluar</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">{formatAngka(stats.keluar)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><ArrowDownRight size={20} /></div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Saldo Akhir Fisik</span>
              <span className="text-xl font-black text-slate-800 mt-1 block">{formatAngka(stats.saldoAkhir)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={20} /></div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Estimasi Nilai Aset</span>
              <span className="text-xl font-black text-emerald-600 mt-1 block">{formatRp(stats.totalNilaiRp)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign size={20} /></div>
          </div>
        </div>

        {/* FILTER CONTROL PANEL */}
        <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden print:hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Range Kalender */}
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Periode Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                    value={filterAwal}
                    onChange={(e) => setFilterAwal(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Periode Akhir</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                    value={filterAkhir}
                    onChange={(e) => setFilterAkhir(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Keyword Search */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian Barang</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all"
                  placeholder="Cari Kode Barang atau Nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                />
              </div>
            </div>

            {/* Switch Toggle State Sembunyikan Data Kosong */}
            <div className="w-full xl:w-auto">
              <button
                type="button"
                onClick={() => setHideEmpty(!hideEmpty)}
                className={`w-full xl:w-auto px-4 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  hideEmpty 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-inner' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {hideEmpty ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="text-nowrap">Sembunyikan Kosong</span>
              </button>
            </div>

            {/* Actions Button */}
            <div className="flex gap-2 w-full xl:w-auto">
              <button 
                onClick={loadData} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-600/20"
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
                className="flex-1 xl:flex-none p-3.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Printer size={16} /> Cetak
              </button>
            </div>
            
          </div>
        </div>

        {/* REKAP TABLE BOX */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 w-28 text-center">Kode</th>
                  <th className="px-6 py-5 min-w-[200px]">Nama Barang</th>
                  <th className="px-5 py-5 text-center bg-slate-800">Saldo Awal</th>
                  <th className="px-5 py-5 text-center bg-emerald-950 text-emerald-400">Masuk</th>
                  <th className="px-5 py-5 text-center bg-rose-950 text-rose-400">Keluar</th>
                  <th className="px-5 py-5 text-center bg-amber-950 text-amber-400">Saldo Akhir</th>
                  <th className="px-6 py-5 text-right w-44">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400">
                      <Loader2 size={32} className="animate-spin mx-auto mb-3 text-blue-500" />
                      <p className="font-bold text-slate-600">Mengkalkulasi mutasi rekap stok gudang...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400">
                      <PackageSearch size={44} className="mx-auto mb-4 opacity-30 text-blue-600" />
                      <p className="font-bold text-base text-slate-600">Tidak ada data rekap stok.</p>
                      <p className="text-xs mt-1 text-slate-400">Silakan ubah jangkauan filter tanggal atau segarkan halaman.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors align-middle">
                      <td className="px-6 py-4 text-center font-black text-xs text-slate-400 whitespace-nowrap bg-slate-50/40">{r.kode || '-'}</td>
                      <td className="px-6 py-4 font-black text-slate-800">{r.nama || '-'}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-600 bg-slate-50/20">{formatAngka(r.saldo_awal)}</td>
                      <td className="px-5 py-4 text-center font-black text-emerald-600 bg-emerald-50/10">{formatAngka(r.masuk)}</td>
                      <td className="px-5 py-4 text-center font-black text-rose-600 bg-rose-50/10">{formatAngka(r.keluar)}</td>
                      <td className="px-5 py-4 text-center font-black text-amber-700 bg-amber-50/30">{formatAngka(r.saldo_akhir)}</td>
                      <td className="px-6 py-4 text-right font-black text-slate-700 bg-slate-50/40">{formatRp(r.jumlah_rp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* REKAP TOTAL FOOTER */}
              {rows.length > 0 && (
                <tfoot className="bg-slate-900 border-t border-slate-800 text-white font-black">
                  <tr className="align-middle">
                    <td colSpan={2} className="px-6 py-5 text-right font-black text-xs uppercase tracking-widest text-slate-400">
                      TOTAL REKAPITULASI
                    </td>
                    <td className="px-5 py-5 text-center text-slate-300 font-bold bg-slate-800/50">
                      {formatAngka(stats.saldoAwal)}
                    </td>
                    <td className="px-5 py-5 text-center text-emerald-400 bg-emerald-950/40">
                      {formatAngka(stats.masuk)}
                    </td>
                    <td className="px-5 py-5 text-center text-rose-400 bg-rose-950/40">
                      {formatAngka(stats.keluar)}
                    </td>
                    <td className="px-5 py-5 text-center text-amber-400 bg-amber-950/40">
                      {formatAngka(stats.saldoAkhir)}
                    </td>
                    <td className="px-6 py-5 text-right text-emerald-400 bg-slate-800/30">
                      {formatRp(stats.totalNilaiRp)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* INJECT PRINT LAYOUT STYLE MANUAL UNTUK PREVIEW CETAK */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .container-fluid, .container-fluid * { visibility: visible; }
            .container-fluid { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; margin: 0 !important; }
            button, .lucide, .print\\:hidden { display: none !important; }
            .bg-white { box-shadow: none !important; border: none !important; }
            table { border: 1px solid #000 !important; width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #000 !important; padding: 10px 6px !important; color: #000 !important; background: transparent !important; }
            thead th { background-color: #9bc2e6 !important; color: #000 !important; font-weight: bold !important; text-align: center !important; }
            tfoot tr td { background-color: #f2f2f2 !important; color: #000 !important; font-weight: bold !important; }
          }
        `}} />

      </div>
    
  );
}