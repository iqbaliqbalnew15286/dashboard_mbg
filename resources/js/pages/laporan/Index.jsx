import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { 
  Filter, RotateCcw, Printer, 
  Loader2, FolderOpen, Calendar, Box, FileText
} from 'lucide-react';

export default function LaporanIndex() {
  const [tglAwal, setTglAwal] = useState('');
  const [tglAkhir, setTglAkhir] = useState('');
  const [kategori, setKategori] = useState('');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Fungsi Filter dioptimasi menggunakan Axios
  const filterLaporan = async () => {
    setLoading(true);
    setHasFiltered(true);
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

  const resetLaporan = () => {
    setTglAwal('');
    setTglAkhir('');
    setKategori('');
    setData([]);
    setHasFiltered(false);
  };

  // Kalkulasi total nominal dari data yang berhasil ditarik
  const totalNominal = useMemo(() => data.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0), [data]);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laporan Transaksi</h2>
          <p className="text-slate-500 text-sm mt-1">Tarik dan cetak laporan riwayat PO berdasarkan periode atau kategori.</p>
        </div>
      </div>

      {/* FILTER CONTROL PANEL */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm print:hidden">
        <div className="flex flex-col xl:flex-row gap-4 items-end">
          
          {/* Range Kalender */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Dari Tanggal</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10" 
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
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10" 
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
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 appearance-none" 
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
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Filter size={16}/>} Tarik Data
            </button>
            <button 
              onClick={resetLaporan} 
              className="px-5 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
              title="Reset Filter"
            >
              <RotateCcw size={16}/>
            </button>
            <button 
              onClick={() => window.print()} 
              disabled={data.length === 0}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:shadow-none"
            >
              <Printer size={16}/> Cetak
            </button>
          </div>
        </div>
      </div>

      {/* TABEL DATA LAPORAN */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-slate-100 print:text-black">
              <tr>
                <th className="px-8 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Tgl Pesan</th>
                <th className="px-6 py-5">Nomor Transaksi PO</th>
                <th className="px-6 py-5 text-center">Kategori</th>
                <th className="px-8 py-5 text-right w-56">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400">
                    <Loader2 size={40} className="mx-auto mb-3 animate-spin text-blue-500" />
                    <p className="font-bold text-slate-600">Menarik data laporan...</p>
                  </td>
                </tr>
              ) : !hasFiltered ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-20 text-blue-500" />
                    <p className="font-bold text-base text-slate-600">Laporan belum ditarik</p>
                    <p className="text-xs mt-1">Silakan atur filter di atas lalu klik tombol Tarik Data.</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20 text-rose-500" />
                    <p className="font-bold text-base text-slate-600">Data laporan tidak ditemukan</p>
                    <p className="text-xs mt-1">Coba sesuaikan kembali periode tanggal atau kategori.</p>
                  </td>
                </tr>
              ) : (
                data.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors align-middle print:text-black">
                    <td className="px-8 py-4 font-bold text-slate-400 text-center print:bg-transparent">{idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 print:text-black">{p.tanggal_pesan || '-'}</td>
                    <td className="px-6 py-4 font-black text-blue-600 print:text-black">#{p.nomor_po || '-'}</td>
                    <td className="px-6 py-4 text-center">
                        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm print:border-none print:p-0 print:bg-transparent print:shadow-none">
                            {p.kategori_biaya || '-'}
                        </span>
                    </td>
                    <td className="px-8 py-4 font-black text-slate-800 text-right bg-slate-50/30 print:bg-transparent print:text-black">
                        {formatRp(p.grand_total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
            {data.length > 0 && (
              <tfoot className="bg-slate-900 border-t border-slate-800 text-white font-black print:bg-slate-200 print:text-black print:border-black">
                <tr className="align-middle">
                  <td colSpan={4} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400 print:text-black">
                    TOTAL KESELURUHAN TRANSAKSI
                  </td>
                  <td className="px-8 py-5 text-right font-black text-lg text-blue-400 print:bg-transparent print:text-black">
                    {formatRp(totalNominal)}
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
          thead th { background-color: #f2f2f2 !important; color: #000 !important; font-weight: bold !important; text-align: center !important; }
          tfoot tr td { background-color: #e6e6e6 !important; color: #000 !important; font-weight: bold !important; }
        }
      `}} />

    </div>
  );
}