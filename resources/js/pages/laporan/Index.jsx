import React, { useMemo, useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { 
  Filter, RotateCcw, Printer, 
  Loader2, Calendar, Box, FileText
} from 'lucide-react';

export default function LaporanIndex() {
  // 1. Ambil pengaturan global dari Inertia
  const { pengaturanGlobal = {} } = usePage().props;
  
  // 2. Default Ceklis untuk Laporan Transaksi
  const defaultKonfigLaporan = { yayasan: true, pengawas: true, sppg: true, asisten: false, penerima: false };
  
  // 3. Ekstrak konfigurasi khusus tab "laporan" secara dinamis
  const konfigCetak = pengaturanGlobal.konfigurasi_cetak?.laporan || defaultKonfigLaporan;

  const [tglAwal, setTglAwal] = useState('');
  const [tglAkhir, setTglAkhir] = useState('');
  const [kategori, setKategori] = useState('');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // FUNGSI TARIK DATA (Axios)
  // ==========================================
  const filterLaporan = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/laporan/transaksi', {
        tgl_awal: tglAwal || null, 
        tgl_akhir: tglAkhir || null, 
        kategori: kategori || null 
      });
      setData(res.data.data || []);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PENCARIAN REAL-TIME OTOMATIS (Debounce)
  // ==========================================
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        filterLaporan();
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tglAwal, tglAkhir, kategori]);

  const resetLaporan = () => {
    setTglAwal('');
    setTglAkhir('');
    setKategori('');
  };

  const handlePrint = () => {
      window.print();
  };

  // Kalkulasi total nominal dari data yang berhasil ditarik
  const totalNominal = useMemo(() => data.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0), [data]);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // Helper Format Tanggal Lokal
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

  // ==========================================
  // DAFTAR PEJABAT PENANDATANGAN DINAMIS (FULL FLEKSIBEL)
  // ==========================================
  const listPejabat = [
      { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
      { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
      { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
      { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
      { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
  ];

  // HANYA menampilkan pejabat yang di-ceklis (true) di tabel pengaturan
  const pejabatTampil = listPejabat.filter(p => konfigCetak[p.key]);

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6 bg-white min-h-screen print:pb-0">
      
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
              <h3 className="font-bold text-[16px] uppercase tracking-wider underline underline-offset-4">Laporan Transaksi Purchase Order</h3>
          </div>

          <div className="flex gap-4 mb-1 text-[12px] font-bold text-slate-800">
              <div className="w-16">Periode</div>
              <div>: {tglAwal ? formatTanggalLokal(tglAwal) : 'Awal'} s/d {tglAkhir ? formatTanggalLokal(tglAkhir) : formatTanggalLokal(new Date().toISOString().split('T')[0])}</div>
          </div>
          {kategori && (
            <div className="flex gap-4 mb-2 text-[12px] font-bold text-slate-800">
                <div className="w-16">Kategori</div>
                <div>: {kategori}</div>
            </div>
          )}
      </div>
      {/* ======================================================== */}

      {/* HEADER (UI Layar) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden px-4 md:px-0 pt-4 md:pt-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Transaksi</h2>
          <p className="text-slate-500 text-sm mt-1">Tarik dan cetak laporan riwayat PO berdasarkan periode atau kategori.</p>
        </div>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden print:hidden mx-4 md:mx-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div className="flex flex-col xl:flex-row gap-4 items-end">
          
          {/* Range Kalender */}
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

          {/* Kategori */}
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Kategori Biaya</label>
            <div className="relative">
              <Box size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 appearance-none cursor-pointer" 
                value={kategori} 
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Operasional">Operasional</option>
                <option value="Insentif Fasilitas">Insentif Fasilitas</option>
              </select>
            </div>
          </div>

          {/* Actions Button */}
          <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto mt-4 xl:mt-0">
            <button 
              onClick={filterLaporan} 
              disabled={loading} 
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-600/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Filter size={16}/>} Filter Data
            </button>
            <button 
              onClick={resetLaporan} 
              className="px-5 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
              title="Reset Filter & Tarik Ulang Semua Data"
            >
              <RotateCcw size={16}/>
            </button>
            <button 
              onClick={handlePrint} 
              disabled={data.length === 0}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Printer size={16}/> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* TABEL DATA LAPORAN */}
      <div className="bg-white md:rounded-[2rem] md:border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none mt-4">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse table-auto print:border print:border-black print:text-xs">
            
            {/* THEAD UNTUK LAYAR (SCREEN) */}
            <thead className="print:hidden bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5 whitespace-nowrap">Tgl Pesan</th>
                <th className="px-6 py-5">Nomor Transaksi PO</th>
                <th className="px-6 py-5 text-center">Kategori</th>
                <th className="px-6 py-5 text-right w-56">Nominal (Rp)</th>
              </tr>
            </thead>

            {/* THEAD KHUSUS UNTUK CETAK (PRINT) */}
            <thead 
              className="hidden print:table-header-group text-[10px] font-black text-black uppercase tracking-widest border-b border-black"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#b4c6e7' }}
            >
              <tr>
                <th className="px-4 py-3 border border-black text-center">NO</th>
                <th className="px-4 py-3 border border-black text-center">TGL PESAN</th>
                <th className="px-4 py-3 border border-black text-center">NOMOR TRANSAKSI PO</th>
                <th className="px-4 py-3 border border-black text-center">KATEGORI</th>
                <th className="px-4 py-3 border border-black text-center">NOMINAL (Rp)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-sm print:divide-black">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 print:border print:border-black">
                    <Loader2 size={40} className="mx-auto mb-3 animate-spin text-blue-500 print:hidden" />
                    <p className="font-bold text-slate-600">Menarik data laporan...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400 print:border print:border-black">
                    <FileText size={48} className="mx-auto mb-4 opacity-20 text-rose-500 print:hidden" />
                    <p className="font-bold text-base text-slate-600">Data laporan tidak ditemukan</p>
                    <p className="text-xs mt-1 print:hidden">Coba sesuaikan kembali periode tanggal atau kategori.</p>
                  </td>
                </tr>
              ) : (
                data.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors align-middle print:text-black print:border print:border-black">
                    <td className="px-6 py-4 font-bold text-slate-400 text-center print:border print:border-black print:text-black print:text-[11px]">{idx + 1}</td>
                    
                    <td className="px-6 py-4 font-bold text-slate-600 whitespace-nowrap print:border print:border-black print:text-black print:text-[11px] print:text-center">
                      {formatTanggalLokal(p.tanggal_pesan)}
                    </td>
                    
                    <td className="px-6 py-4 font-black text-blue-600 break-words print:border print:border-black print:text-black print:text-[11px]">
                      #{p.nomor_po || '-'}
                    </td>
                    
                    <td className="px-6 py-4 text-center print:border print:border-black print:text-black print:text-[11px]">
                        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm print:border-none print:p-0 print:shadow-none whitespace-nowrap">
                            {p.kategori_biaya || '-'}
                        </span>
                    </td>
                    
                    <td className="px-6 py-4 font-black text-slate-800 text-right bg-slate-50/30 print:border print:border-black print:bg-transparent print:text-black whitespace-nowrap print:text-[12px]">
                        {formatRp(p.grand_total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {/* FOOTER TOTAL (SCREEN) */}
            {data.length > 0 && (
              <tfoot className="print:hidden bg-slate-900 border-t border-slate-800 text-white font-black">
                <tr className="align-middle">
                  <td colSpan={4} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                    TOTAL KESELURUHAN TRANSAKSI
                  </td>
                  <td className="px-6 py-5 text-right font-black text-lg text-blue-400 whitespace-nowrap">
                    {formatRp(totalNominal)}
                  </td>
                </tr>
              </tfoot>
            )}

            {/* FOOTER TOTAL (PRINT) */}
            {data.length > 0 && (
              <tfoot className="hidden print:table-row-group text-black font-black">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-[11px] uppercase tracking-widest border border-black">
                    TOTAL KESELURUHAN TRANSAKSI
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] border border-black">
                    {formatRp(totalNominal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FOOTER TANDA TANGAN DINAMIS (FLEXIBEL 1, 2, 3, 4, atau 5)*/}
      {/* ======================================================== */}
      {data.length > 0 && (
          // Menggunakan flex-wrap dan gap-y-12 agar kalau ttd banyak, otomatis turun jadi 2 baris rapi
          <div className="hidden print:flex flex-wrap justify-around items-end mt-12 w-full gap-y-12" style={{ pageBreakInside: 'avoid' }}>
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

      {/* INJECT PRINT LAYOUT STYLE */}
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

    </div>
  );
}