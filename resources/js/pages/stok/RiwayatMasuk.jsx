import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { 
  History, Search, RotateCcw, Printer, 
  Calendar, Loader2, PackageSearch, CheckCircle2 
} from 'lucide-react';
import axios from 'axios';

export default function RiwayatMasuk() {
  // 1. Ambil pengaturan global dari Inertia
  const { pengaturanGlobal = {} } = usePage().props;
  
  // 2. Tentukan Default Ceklis jika database masih benar-benar kosong
  const defaultKonfigRiwayat = { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true };
  
  // 3. Ekstrak konfigurasi. Jika di DB kosong, gunakan default di atas.
  const konfigCetak = pengaturanGlobal.konfigurasi_cetak?.riwayat_masuk || defaultKonfigRiwayat;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterAwal, setFilterAwal] = useState('');
  const [filterAkhir, setFilterAkhir] = useState('');
  const [search, setSearch] = useState('');

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
  const formatAngka = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

  // Helper untuk mengubah format tanggal
  const formatTanggalLokal = (dateStr) => {
    if (!dateStr) return '-';
    const dateOnly = dateStr.split(' ')[0];
    const parts = dateOnly.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  };

  // Menggunakan Axios untuk menarik data
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

  // PENCARIAN REAL-TIME
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        loadData();
    }, 500); 
    
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterAwal, filterAkhir]);

  const handleReset = () => {
    setFilterAwal('');
    setFilterAkhir('');
    setSearch('');
  };

  // Kalkulasi Total
  const totalQty = useMemo(() => rows.reduce((s, r) => s + (Number(r.qty_terima) || 0), 0), [rows]);
  const totalHarga = useMemo(() => rows.reduce((s, r) => s + (Number(r.total_harga) || 0), 0), [rows]);

  // Daftar 5 Pejabat Penandatangan
  const listPejabat = [
      { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
      { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
      { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
      { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
      { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
  ];

  // Filter hanya pejabat yang dicentang (truthy)
  const pejabatTampil = listPejabat.filter(p => konfigCetak[p.key]);

  return (
      <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6 relative bg-white min-h-screen print:pb-0">
        
        {/* ======================================================== */}
        {/* BAGIAN HEADER CETAK (Hanya Muncul Saat Kertas Dicetak) */}
        {/* ======================================================== */}
        <div className="hidden print:block w-full mb-4">
            {/* Kop Surat Gambar - Tanpa Garis Bawah Tambahan */}
            {pengaturanGlobal.kop_surat && (
                <div className="w-full mb-4 text-center flex justify-center">
                    {pengaturanGlobal.kop_surat.toLowerCase().endsWith('.pdf') ? (
                        <p className="text-xs text-red-500 italic">Preview PDF tidak didukung saat pencetakan, mohon gunakan file gambar (JPG/PNG) untuk Kop Surat.</p>
                    ) : (
                        <img 
                            src={`/storage/${pengaturanGlobal.kop_surat}`} 
                            alt="Kop Surat" 
                            className="w-full h-auto max-h-[160px] object-contain" 
                        />
                    )}
                </div>
            )}
            
            {/* Judul Laporan */}
            <div className="text-center mb-6">
                <h3 className="font-bold text-[16px] uppercase tracking-wider underline underline-offset-4">Laporan Riwayat Barang Masuk</h3>
            </div>

            {/* Periode Laporan (Rata Kiri) */}
            <div className="flex gap-4 mb-2 text-[12px] font-bold text-slate-800">
                <div className="w-16">Periode</div>
                <div>: {filterAwal ? formatTanggalLokal(filterAwal) : 'Awal'} s/d {filterAkhir ? formatTanggalLokal(filterAkhir) : formatTanggalLokal(new Date().toISOString().split('T')[0])}</div>
            </div>
        </div>
        {/* ======================================================== */}


        {/* HEADER (UI Layar) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden px-4 md:px-0 pt-4 md:pt-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Riwayat Barang Masuk</h2>
            <p className="text-slate-500 text-sm mt-1">Laporan historis penerimaan stok barang dan logistik dari supplier.</p>
          </div>
        </div>

        {/* FILTER PANEL (UI Layar) */}
        <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden print:hidden mx-4 md:mx-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer"
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer"
                    value={filterAkhir}
                    onChange={(e) => setFilterAkhir(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                  placeholder="Ketik PO, Barang, Petugas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full xl:w-auto">
              <button 
                onClick={loadData} 
                disabled={loading}
                className="flex-1 xl:flex-none p-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-600/20"
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
                disabled={rows.length === 0}
                className="flex-1 xl:flex-none p-3.5 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:shadow-none"
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
              
              {/* THEAD UNTUK LAYAR (SCREEN) - 10 Kolom */}
              <thead className="print:hidden bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-4 py-4 whitespace-nowrap text-center">NO</th>
                  <th className="px-4 py-4 whitespace-nowrap text-center">TGL TERIMA</th>
                  <th className="px-4 py-4 text-center">NO PO</th>
                  <th className="px-4 py-4 text-center">NAMA BARANG</th>
                  <th className="px-4 py-4 text-center">SUPPLIER</th>
                  <th className="px-4 py-4 text-center bg-blue-50/50 text-blue-600">QTY</th>
                  <th className="px-4 py-4 text-center">SATUAN</th>
                  <th className="px-4 py-4 text-center">HARGA BELI</th>
                  <th className="px-4 py-4 text-center bg-emerald-50/50 text-emerald-600">TOTAL HARGA</th>
                  <th className="px-4 py-4">PETUGAS</th>
                </tr>
              </thead>

              {/* THEAD KHUSUS UNTUK CETAK (PRINT) - 8 Kolom, Background Biru Paksa */}
              <thead 
                className="hidden print:table-header-group text-[10px] font-black text-black uppercase tracking-widest border-b border-black"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#b4c6e7' }}
              >
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap border border-black text-center">NO</th>
                  <th className="px-4 py-3 whitespace-nowrap border border-black text-center">TGL TERIMA</th>
                  {/* NO PO Disembunyikan di Print */}
                  <th className="px-4 py-3 border border-black text-center">NAMA BARANG</th>
                  <th className="px-4 py-3 border border-black text-center">SUPPLIER</th>
                  <th className="px-4 py-3 border border-black text-center">QTY</th>
                  <th className="px-4 py-3 border border-black text-center">SATUAN</th>
                  <th className="px-4 py-3 border border-black text-center">HARGA BELI</th>
                  <th className="px-4 py-3 border border-black text-center">TOTAL HARGA</th>
                  {/* PETUGAS Disembunyikan di Print */}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 text-sm print:divide-black">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-24 text-center text-slate-400 print:border print:border-black">
                      <Loader2 size={40} className="animate-spin mx-auto mb-3 text-blue-500 print:hidden" />
                      <p className="font-bold text-slate-600">Memuat data riwayat...</p>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-24 text-center text-slate-400 print:border print:border-black">
                      <PackageSearch size={48} className="mx-auto mb-4 opacity-20 text-blue-500 print:hidden" />
                      <p className="font-bold text-base text-slate-600">Tidak ada riwayat barang masuk.</p>
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors align-middle print:text-black print:border print:border-black">
                      <td className="px-4 py-3 text-center print:border print:border-black print:text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-500 whitespace-nowrap text-[13px] print:text-black print:border print:border-black print:text-[11px]">
                        {formatTanggalLokal(r.tgl_terima)}
                      </td>
                      
                      {/* Sel NO PO (Sembunyi saat cetak) */}
                      <td className="px-4 py-3 font-black text-blue-600 break-words max-w-[140px] text-[13px] print:hidden">
                        {r.no_po || '-'}
                      </td>
                      
                      <td className="px-4 py-3 font-black text-slate-800 break-words max-w-[160px] leading-tight print:text-black print:font-bold print:border print:border-black print:text-[11px]">
                        {r.nama_barang || '-'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-500 break-words max-w-[120px] text-[13px] print:text-black print:border print:border-black print:text-[11px]">
                        {r.nama_supplier || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-blue-700 bg-blue-50/30 print:bg-transparent print:text-black text-[15px] print:border print:border-black print:text-[12px]">
                        {formatAngka(r.qty_terima)}
                      </td>
                      <td className="px-4 py-3 text-center print:border print:border-black">
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg print:border-none print:p-0 print:bg-transparent print:text-black print:text-[11px]">
                              {r.satuan || '-'}
                          </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-600 whitespace-nowrap text-[13px] print:text-black print:border print:border-black print:text-[11px]">
                        {formatRp(r.harga_beli)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 bg-emerald-50/30 whitespace-nowrap text-[14px] print:bg-transparent print:text-black print:border print:border-black print:text-[11px]">
                        {formatRp(r.total_harga)}
                      </td>
                      
                      {/* Sel PETUGAS (Sembunyi saat cetak) */}
                      <td className="px-4 py-3 font-bold text-slate-500 flex items-center gap-1.5 whitespace-nowrap text-[13px] print:hidden">
                        <CheckCircle2 size={14} className="text-blue-500 shrink-0" /> 
                        <span className="truncate max-w-[100px]">{r.petugas || '-'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              
              {/* TFOOT UNTUK LAYAR (SCREEN) */}
              {rows.length > 0 && (
                <tfoot className="print:hidden bg-slate-900 border-t border-slate-800 text-white">
                  <tr className="align-middle">
                    <td colSpan={5} className="px-4 py-4 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                      GRAND TOTAL
                    </td>
                    <td className="px-4 py-4 text-center font-black text-lg text-blue-400">
                      {formatAngka(totalQty)}
                    </td>
                    <td colSpan={2}></td>
                    <td className="px-4 py-4 text-right font-black text-lg text-emerald-400">
                      {formatRp(totalHarga)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}

              {/* TFOOT KHUSUS UNTUK CETAK (PRINT) - Sangat presisi tanpa menabrak kolom hide */}
              {rows.length > 0 && (
                <tfoot className="hidden print:table-row-group text-black font-black">
                  <tr>
                    {/* Menggabungkan kolom NO, TGL TERIMA, NAMA BARANG, SUPPLIER = 4 Kolom */}
                    <td colSpan={4} className="px-4 py-3 text-right text-[11px] uppercase tracking-widest border border-black">
                      GRAND TOTAL
                    </td>
                    {/* Kolom QTY = 1 Kolom */}
                    <td className="px-4 py-3 text-center text-[12px] border border-black">
                      {formatAngka(totalQty)}
                    </td>
                    {/* Kolom SATUAN & HARGA BELI = 2 Kolom */}
                    <td colSpan={2} className="border border-black"></td>
                    {/* Kolom TOTAL HARGA = 1 Kolom */}
                    <td className="px-4 py-3 text-right text-[12px] border border-black">
                      {formatRp(totalHarga)}
                    </td>
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

        {/* CSS Khusus untuk Cetak (Print) */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            /* Trik Margin 0 untuk MENGHILANGKAN Teks URL, Tanggal, dan Nomor Halaman dari Browser secara total */
            @page { size: landscape; margin: 0 !important; }
            
            /* Mengembalikan jarak margin fisik menggunakan padding/margin body agar konten rapi */
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