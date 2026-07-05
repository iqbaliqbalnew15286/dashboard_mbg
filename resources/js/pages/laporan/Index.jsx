import React, { useMemo, useState, useEffect } from 'react';
import { FileText, Filter, RotateCcw, Printer, Loader2, FolderOpen } from 'lucide-react';

export default function LaporanIndex() {
  const [tglAwal, setTglAwal] = useState('');
  const [tglAkhir, setTglAkhir] = useState('');
  const [kategori, setKategori] = useState('');
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(false);

  const getCsrfToken = () => {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute('content') : '';
  };

  const filterLaporan = async () => {
    setLoading(true);
    setHasFiltered(true);
    try {
      const res = await fetch('/laporan/transaksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          tgl_awal: tglAwal || null, 
          tgl_akhir: tglAkhir || null, 
          kategori: kategori || null 
        }),
      });
      const json = await res.json();
      setData(json.data || []);
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

  const totalNominal = useMemo(() => data.reduce((sum, p) => sum + (Number(p.grand_total) || 0), 0), [data]);
  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
      
      {/* HEADER */}
      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
        <FileText className="text-blue-600" size={28} /> Laporan Transaksi
      </h3>
      
      {/* FILTER CARD */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200/60 p-6 shadow-sm print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">Dari Tanggal:</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-blue-500 transition-all" 
              value={tglAwal} 
              onChange={(e) => setTglAwal(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">Sampai Tanggal:</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-blue-500 transition-all" 
              value={tglAkhir} 
              onChange={(e) => setTglAkhir(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">Pilih Kategori:</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold text-sm outline-none focus:border-blue-500 transition-all" 
              value={kategori} 
              onChange={(e) => setKategori(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Operasional">Operasional</option>
              <option value="Insentif Fasilitas">Insentif Fasilitas</option>
            </select>
          </div>
          
          <div className="flex gap-2 h-[42px]">
            <button 
              onClick={filterLaporan} 
              disabled={loading} 
              className="px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin"/> : <Filter size={16}/>} Filter
            </button>
            <button 
              onClick={resetLaporan} 
              className="px-4 bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center"
              title="Reset Filter"
            >
              <RotateCcw size={16}/>
            </button>
            <button 
              onClick={() => window.print()} 
              disabled={data.length === 0}
              className="px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={16}/> Cetak
            </button>
          </div>

        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest align-middle">
              <tr>
                <th className="px-6 py-4 w-[60px] text-center border-x border-slate-800">No</th>
                <th className="px-6 py-4 border-r border-slate-800">Tgl Pesan</th>
                <th className="px-6 py-4 border-r border-slate-800">Nomor PO</th>
                <th className="px-6 py-4 border-r border-slate-800">Kategori</th>
                <th className="px-6 py-4 text-right border-r border-slate-800">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm align-middle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Loader2 size={40} className="mx-auto mb-3 animate-spin text-blue-500" />
                    <p className="font-bold text-base text-slate-600">Menarik data laporan...</p>
                  </td>
                </tr>
              ) : !hasFiltered ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-base text-slate-600">Laporan belum difilter</p>
                    <p className="text-xs mt-1">Silakan atur filter di atas lalu klik tombol Filter untuk menampilkan data.</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-30 text-rose-500" />
                    <p className="font-bold text-base text-slate-600">Data laporan tidak ditemukan</p>
                  </td>
                </tr>
              ) : (
                data.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-400 text-center border-x border-slate-100">{idx + 1}</td>
                    <td className="px-6 py-3 font-bold text-slate-600 border-r border-slate-100">{p.tanggal_pesan || '-'}</td>
                    <td className="px-6 py-3 font-black text-slate-800 border-r border-slate-100">{p.nomor_po || '-'}</td>
                    <td className="px-6 py-3 font-bold text-slate-600 border-r border-slate-100">{p.kategori_biaya || '-'}</td>
                    <td className="px-6 py-3 font-black text-slate-900 text-right border-r border-slate-100">{formatRp(p.grand_total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            
            {data.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-black text-xs text-slate-600 uppercase tracking-widest border-l border-slate-100">
                    TOTAL TRANSAKSI
                  </td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 text-lg border-x border-slate-100">
                    {formatRp(totalNominal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* STYLING KHUSUS CETAK PRINTER */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .fixed, .fixed * { visibility: visible; }
          table, table * { visibility: visible; }
          table { position: absolute; left: 0; top: 0; width: 100%; border-collapse: collapse !important; border: 1px solid #000 !important; }
          th, td { border: 1px solid #000 !important; padding: 12px 8px !important; color: #000 !important; }
          thead th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          tfoot td { background-color: #e6e6e6 !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}} />

    </div>
  );
}