import React, { useEffect, useMemo, useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { 
  Boxes, Search, RotateCcw, Printer, Calendar, 
  Loader2, PackageSearch, Eye, EyeOff, TrendingUp,
  ArrowUpRight, ArrowDownRight, DollarSign, ArrowDown, ArrowUp, AlertCircle
} from 'lucide-react';

export default function StokRekapPage() {
  // 1. Ambil pengaturan global dari Inertia
  const { pengaturanGlobal = {} } = usePage().props;
  
  // 2. Default Ceklis untuk Rekap Stok
  const defaultKonfigRekap = { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true };
  
  // 3. Ekstrak konfigurasi khusus tab "rekap_stok"
  const konfigCetak = pengaturanGlobal.konfigurasi_cetak?.rekap_stok || defaultKonfigRekap;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // State Filter
  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);

  // Ref untuk fitur Scroll to Bottom/Top
  const tableRef = useRef(null);

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
  const formatAngka = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  // Helper format tanggal lokal
  const formatTanggalLokal = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  // ==========================================
  // FETCH DATA REKAP (Dari Backend)
  // ==========================================
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/stok/rekap-stok/data', {
        params: {
          tgl_awal: filterAwal || undefined,
          tgl_akhir: filterAkhir || undefined,
          q: search || undefined,
          hide_empty: hideEmpty ? 'true' : 'false'
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

  // PENCARIAN REAL-TIME OTOMATIS
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 500); 
    
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterAwal, filterAkhir, hideEmpty]);

  const handleResetFilter = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
    setHideEmpty(true);
  };

  // ==========================================
  // LOGIKA FRONTEND KETAT UNTUK FILTER BARANG 0
  // ==========================================
  const displayRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    
    return rows.filter(r => {
        const hasMutasi = Number(r.masuk) > 0 || Number(r.keluar) > 0;
        const hasSaldoAkhir = Number(r.saldo_akhir) > 0;
        const hasSaldoAwal = Number(r.saldo_awal) > 0;
        
        if (hideEmpty) {
            if (filterAwal || filterAkhir) {
                return hasMutasi;
            }
            return hasMutasi || hasSaldoAkhir || hasSaldoAwal;
        }
        
        return true; 
    });
  }, [rows, hideEmpty, filterAwal, filterAkhir]);

  // ==========================================
  // KALKULASI TOTAL FOOTER & STATISTIK CARD
  // ==========================================
  const stats = useMemo(() => {
    return displayRows.reduce((acc, r) => {
      acc.saldoAwal += Number(r.saldo_awal) || 0;
      acc.masuk += Number(r.masuk) || 0;
      acc.keluar += Number(r.keluar) || 0;
      acc.saldoAkhir += Number(r.saldo_akhir) || 0;
      acc.totalNilaiRp += Number(r.jumlah_rp) || 0;
      return acc;
    }, { saldoAwal: 0, masuk: 0, keluar: 0, saldoAkhir: 0, totalNilaiRp: 0 });
  }, [displayRows]);

  // DAFTAR PEJABAT PENANDATANGAN
  const listPejabat = [
      { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
      { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
      { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
      { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
      { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
  ];

  const pejabatTampil = listPejabat.filter(p => konfigCetak[p.key]);

  // Scroll Actions
  const scrollToTop = () => tableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () => tableRef.current?.scrollTo({ top: tableRef.current.scrollHeight, behavior: 'smooth' });

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6 relative bg-white min-h-screen print:pb-0">
        
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
                <h3 className="font-bold text-[16px] uppercase tracking-wider underline underline-offset-4">Laporan Rekapitulasi Stok Gudang</h3>
            </div>

            <div className="flex gap-4 mb-2 text-[12px] font-bold text-slate-800">
                <div className="w-16">Periode</div>
                <div>: {filterAwal ? formatTanggalLokal(filterAwal) : 'Awal'} s/d {filterAkhir ? formatTanggalLokal(filterAkhir) : formatTanggalLokal(new Date().toISOString().split('T')[0])}</div>
            </div>
        </div>
        {/* ======================================================== */}


        {/* HEADER (UI Layar) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden px-4 md:px-0 pt-4 md:pt-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Rekapitulasi Stok Gudang</h1>
            <p className="text-slate-500 text-sm mt-1">Laporan mutasi persediaan mencakup saldo, barang masuk, keluar, dan nilai aset.</p>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button 
              onClick={() => window.print()} 
              disabled={displayRows.length === 0}
              className="w-full lg:w-auto px-6 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
            >
              <Printer size={16} /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden mx-4 md:mx-0">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Mutasi Masuk</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{formatAngka(stats.masuk)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><ArrowUpRight size={24} /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Mutasi Keluar</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{formatAngka(stats.keluar)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100"><ArrowDownRight size={24} /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Saldo Fisik</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{formatAngka(stats.saldoAkhir)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><TrendingUp size={24} /></div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Total Nilai Aset</span>
              <span className="text-xl font-black text-blue-600 mt-1 block">{formatRp(stats.totalNilaiRp)}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><DollarSign size={24} /></div>
          </div>
        </div>

        {/* FILTER CONTROL PANEL */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm relative overflow-hidden print:hidden mx-4 md:mx-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* Range Kalender */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Periode Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                    value={filterAwal}
                    onChange={(e) => setFilterAwal(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Periode Akhir</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
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
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Ketik Kode atau Nama Barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Actions Button */}
            <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0">
              
              <button
                type="button"
                onClick={() => setHideEmpty(!hideEmpty)}
                className={`p-3.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  hideEmpty 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
                title={hideEmpty ? "Tampilkan Semua Barang" : "Sembunyikan Barang Kosong"}
              >
                {hideEmpty ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:block">{hideEmpty ? 'Hanya Yg Ada Transaksi' : 'Tampilkan Semua Stok'}</span>
              </button>
              
              <button 
                onClick={loadData} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Cari
              </button>
              
              <button 
                onClick={handleResetFilter} 
                className="p-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-100 hover:text-rose-600 transition-colors flex items-center justify-center"
                title="Reset Filter"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            
          </div>
        </div>

        {/* REKAP TABLE BOX */}
        <div className="relative bg-white md:rounded-[2rem] md:border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none mt-4">
          
          <div ref={tableRef} className="overflow-x-auto overflow-y-auto max-h-[65vh] scroll-smooth print:max-h-none print:overflow-visible">
            <table className="w-full text-left border-collapse table-auto relative min-w-[800px] print:border print:border-black print:min-w-0">
              
              {/* THEAD UNTUK LAYAR (SCREEN) */}
              <thead className="print:hidden bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="px-6 py-5 w-28 text-center border-b border-slate-100">Kode</th>
                  <th className="px-6 py-5 border-b border-slate-100">Nama Barang</th>
                  <th className="px-5 py-5 text-center border-b border-slate-100">Saldo Awal</th>
                  <th className="px-5 py-5 text-center text-emerald-600 border-b border-slate-100">Masuk</th>
                  <th className="px-5 py-5 text-center text-rose-600 border-b border-slate-100">Keluar</th>
                  <th className="px-5 py-5 text-center text-amber-600 border-b border-slate-100">Saldo Akhir</th>
                  <th className="px-6 py-5 text-right w-44 border-b border-slate-100">Jumlah (Rp)</th>
                </tr>
              </thead>

              {/* THEAD KHUSUS UNTUK CETAK (PRINT) - Background Biru Paksa */}
              <thead 
                className="hidden print:table-header-group text-[10px] font-black text-black uppercase tracking-widest border-b border-black"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#b4c6e7' }}
              >
                <tr>
                  <th className="px-4 py-3 border border-black text-center">KODE</th>
                  <th className="px-4 py-3 border border-black text-center">NAMA BARANG</th>
                  <th className="px-4 py-3 border border-black text-center">SALDO AWAL</th>
                  <th className="px-4 py-3 border border-black text-center">MASUK</th>
                  <th className="px-4 py-3 border border-black text-center">KELUAR</th>
                  <th className="px-4 py-3 border border-black text-center">SALDO AKHIR</th>
                  <th className="px-4 py-3 border border-black text-center">JUMLAH (Rp)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 text-sm print:divide-black">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400 print:border print:border-black">
                      <Loader2 size={32} className="animate-spin mx-auto mb-3 text-blue-500 print:hidden" />
                      <p className="font-bold text-slate-600">Mengkalkulasi mutasi rekap stok gudang...</p>
                    </td>
                  </tr>
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-24 text-center text-slate-400 print:border print:border-black">
                      <PackageSearch size={44} className="mx-auto mb-4 opacity-30 text-blue-600 print:hidden" />
                      <p className="font-bold text-base text-slate-600">Tidak ada data rekap stok.</p>
                      <p className="text-xs mt-1 text-slate-400 print:hidden">Coba ubah filter tanggal atau matikan fitur "Sembunyikan Barang Kosong".</p>
                    </td>
                  </tr>
                ) : (
                  displayRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors align-middle print:text-black print:border print:border-black">
                      <td className="px-6 py-4 text-center font-bold text-slate-400 whitespace-nowrap print:border print:border-black print:text-black print:text-[11px]">{r.kode || '-'}</td>
                      
                      <td className="px-6 py-4 font-black text-slate-800 break-words max-w-[250px] leading-tight print:text-black print:border print:border-black print:text-[11px]">
                        {r.nama || '-'}
                      </td>
                      
                      <td className="px-5 py-4 text-center font-bold text-slate-600 print:border print:border-black print:text-black print:text-[11px]">{formatAngka(r.saldo_awal)}</td>
                      <td className="px-5 py-4 text-center font-black text-emerald-600 bg-emerald-50/30 print:bg-transparent print:border print:border-black print:text-black print:text-[12px]">{formatAngka(r.masuk)}</td>
                      <td className="px-5 py-4 text-center font-black text-rose-600 bg-rose-50/30 print:bg-transparent print:border print:border-black print:text-black print:text-[12px]">{formatAngka(r.keluar)}</td>
                      <td className="px-5 py-4 text-center font-black text-amber-700 bg-amber-50/30 print:bg-transparent print:border print:border-black print:text-black print:text-[12px]">{formatAngka(r.saldo_akhir)}</td>
                      <td className="px-6 py-4 text-right font-black text-blue-700 bg-blue-50/10 print:bg-transparent print:border print:border-black print:text-black print:text-[11px]">{formatRp(r.jumlah_rp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* REKAP TOTAL FOOTER (SCREEN) */}
              {displayRows.length > 0 && (
                <tfoot className="print:hidden bg-slate-50 sticky bottom-0 z-20 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
                  <tr className="align-middle">
                    <td colSpan={2} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400 border-t border-slate-200">
                      TOTAL REKAPITULASI
                    </td>
                    <td className="px-5 py-5 text-center text-slate-500 font-bold border-t border-slate-200">
                      {formatAngka(stats.saldoAwal)}
                    </td>
                    <td className="px-5 py-5 text-center font-black text-emerald-600 border-t border-slate-200">
                      {formatAngka(stats.masuk)}
                    </td>
                    <td className="px-5 py-5 text-center font-black text-rose-600 border-t border-slate-200">
                      {formatAngka(stats.keluar)}
                    </td>
                    <td className="px-5 py-5 text-center font-black text-amber-600 border-t border-slate-200">
                      {formatAngka(stats.saldoAkhir)}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-blue-700 border-t border-slate-200">
                      {formatRp(stats.totalNilaiRp)}
                    </td>
                  </tr>
                </tfoot>
              )}

              {/* TFOOT KHUSUS UNTUK CETAK (PRINT) */}
              {displayRows.length > 0 && (
                <tfoot className="hidden print:table-row-group text-black font-black">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-[11px] uppercase tracking-widest border border-black">
                      TOTAL REKAPITULASI
                    </td>
                    <td className="px-4 py-3 text-center text-[12px] border border-black">{formatAngka(stats.saldoAwal)}</td>
                    <td className="px-4 py-3 text-center text-[12px] border border-black">{formatAngka(stats.masuk)}</td>
                    <td className="px-4 py-3 text-center text-[12px] border border-black">{formatAngka(stats.keluar)}</td>
                    <td className="px-4 py-3 text-center text-[12px] border border-black">{formatAngka(stats.saldoAkhir)}</td>
                    <td className="px-4 py-3 text-right text-[11px] border border-black">{formatRp(stats.totalNilaiRp)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER TANDA TANGAN DINAMIS (Hanya Muncul Saat Kertas Dicetak) */}
        {/* ======================================================== */}
        {displayRows.length > 0 && (
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

        {/* FLOATING BUTTONS SCROLL TO TOP/BOTTOM */}
        {displayRows.length > 10 && (
          <div className="fixed right-8 bottom-8 flex flex-col gap-3 z-50 print:hidden pointer-events-none">
            <button 
              onClick={scrollToTop} 
              className="pointer-events-auto p-3 bg-slate-900/90 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300 border border-white/20"
              title="Gulir ke Atas"
            >
              <ArrowUp size={20}/>
            </button>
            <button 
              onClick={scrollToBottom} 
              className="pointer-events-auto p-3 bg-slate-900/90 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md hover:bg-blue-600 hover:translate-y-1 transition-all duration-300 border border-white/20"
              title="Gulir ke Bawah"
            >
              <ArrowDown size={20}/>
            </button>
          </div>
        )}

        {/* INJECT PRINT LAYOUT STYLE */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { size: landscape; margin: 0 !important; }
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

      </div>
  );
}