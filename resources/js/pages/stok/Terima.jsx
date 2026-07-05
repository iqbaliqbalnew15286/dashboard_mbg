import React, { useState, useMemo } from 'react';
import { 
  Truck, Search, RotateCcw, CheckSquare, 
  Loader2, CheckCircle2, XCircle, AlertCircle, ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StokTerimaPage() {
  const [noPoInput, setNoPoInput] = useState('');
  const [selectedPo, setSelectedPo] = useState(null);
  const [tglTerima, setTglTerima] = useState(new Date().toISOString().split('T')[0]); // Default hari ini
  const [petugas, setPetugas] = useState('');
  const [rows, setRows] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type) => {
    setNotification({ message, type });
    if (type !== 'loading') setTimeout(() => setNotification(null), 3000);
  };

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // Kalkulasi total tagihan aktual berdasarkan Qty Terima
  const totalTagihanAktual = useMemo(() => {
    return rows.reduce((total, item) => total + ((Number(item.qty_terima) || 0) * (Number(item.harga_satuan) || 0)), 0);
  }, [rows]);

  const cariPO = async () => {
    if (!noPoInput.trim()) return showToast('Masukkan nomor PO terlebih dahulu!', 'error');
    
    setIsLoading(true);
    showToast('Mencari data PO...', 'loading');
    
    try {
      // Sesuaikan URL endpoint ini dengan route backend Anda
      const res = await fetch(`/stok/terima/po/${encodeURIComponent(noPoInput)}`, {
        headers: { 'Accept': 'application/json' },
      });
      
      if (!res.ok) throw new Error('Data PO tidak ditemukan atau berstatus selesai.');
      
      const json = await res.json();
      setSelectedPo(json.po || null);
      setRows(json.items || []);
      setNotification(null);
    } catch (err) {
      setSelectedPo(null);
      setRows([]);
      showToast(err.message || 'Gagal menarik data PO', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const simpanBarang = async () => {
    if (!tglTerima) return showToast('Tanggal terima harus diisi!', 'error');
    if (!petugas.trim()) return showToast('Nama petugas penerima harus diisi!', 'error');
    
    const hasDiterima = rows.some(r => Number(r.qty_terima) > 0);
    if (!hasDiterima) return showToast('Minimal ada 1 barang dengan Qty Terima lebih dari 0!', 'error');

    setIsSaving(true);
    showToast('Menyimpan data penerimaan...', 'loading');

    try {
      const payload = {
        no_po: selectedPo.no_po,
        tgl_terima: tglTerima,
        petugas: petugas,
        items: rows.filter(r => Number(r.qty_terima) > 0).map(r => ({
          bahan_baku_id: r.bahan_baku_id,
          supplier_id: r.supplier_id,
          qty_terima: Number(r.qty_terima),
          harga_satuan: Number(r.harga_satuan)
        }))
      };

      // Sesuaikan URL endpoint ini dengan route POST backend Anda
      const res = await fetch('/stok/terima', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Tambahkan token CSRF jika Anda menggunakan sistem session Laravel murni di luar Inertia
          // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Gagal menyimpan data penerimaan.');

      showToast('Barang berhasil dimasukkan ke stok gudang!', 'success');
      
      // Reset form
      setSelectedPo(null);
      setRows([]);
      setNoPoInput('');
      setPetugas('');
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedPo(null);
    setRows([]);
    setNoPoInput('');
    setPetugas('');
    setTglTerima(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6">
      
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-8 right-8 z-[200] px-5 py-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              notification.type === 'error'   ? 'bg-rose-50/90 border-rose-200 text-rose-600'
            : notification.type === 'loading' ? 'bg-blue-50/90 border-blue-200 text-blue-600'
            :                                   'bg-emerald-50/90 border-emerald-200 text-emerald-600'
            }`}
          >
            {notification.type === 'loading' ? <Loader2 className="animate-spin" size={20} />
              : notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
            <p className="font-bold text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <Truck size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Penerimaan Barang (Stok Masuk)</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pemeriksaan dan validasi kuantitas fisik sebelum masuk ke penyimpanan gudang.</p>
        </div>
      </div>

      {/* SEARCH AREA */}
      <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Ketik Nomor PO <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm transition-all outline-none" 
              placeholder="Contoh: PO/2026/07/001..." 
              value={noPoInput} 
              onChange={(e) => setNoPoInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && cariPO()}
            />
          </div>
          <button 
            onClick={cariPO} 
            disabled={isLoading}
            className="p-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-600/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16}/>} Tarik Data PO
          </button>
          <button 
            onClick={handleReset} 
            className="p-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={16}/> Reset
          </button>
        </div>
      </div>

      {/* DETAIL PENERIMAAN AREA */}
      {selectedPo && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[1.5rem] shadow-sm">
              <span className="text-[10px] font-black uppercase text-blue-400 block tracking-widest mb-1">Tgl Pesan (Dari PO)</span>
              <span className="font-black text-blue-900 text-lg">{selectedPo.tgl_pesan || '-'}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-[1.5rem] shadow-sm">
              <span className="text-[10px] font-black uppercase text-amber-500 block tracking-widest mb-2">Tanggal Terima Fisik</span>
              <input 
                type="date" 
                className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-sm font-bold text-amber-900 outline-none focus:border-amber-400" 
                value={tglTerima} 
                onChange={(e) => setTglTerima(e.target.value)} 
              />
            </div>
            <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-[1.5rem] shadow-sm">
              <span className="text-[10px] font-black uppercase text-emerald-500 block tracking-widest mb-2">Petugas Penerima</span>
              <input 
                type="text" 
                className="w-full bg-white border border-emerald-200 rounded-xl p-2.5 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-400" 
                placeholder="Nama Anda..." 
                value={petugas} 
                onChange={(e) => setPetugas(e.target.value)} 
              />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center gap-3">
              <ClipboardCheck size={20} className="text-emerald-400" />
              <h3 className="font-black">Ceklis Barang Datang</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 w-12 text-center">No</th>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-4 py-4 text-center">Qty Pesan</th>
                    <th className="px-4 py-4 text-center bg-amber-50 text-amber-600">Qty Terima</th>
                    <th className="px-4 py-4 text-center">Satuan</th>
                    <th className="px-6 py-4 text-right">Harga Satuan</th>
                    <th className="px-6 py-4 text-right">Total Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-slate-400 font-bold">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        Tidak ada detail barang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    rows.map((it, idx) => {
                      const qtyPesan = Number(it.qty_pesan) || 0;
                      const qtyTerima = Number(it.qty_terima) || 0;
                      const harga = Number(it.harga_satuan) || 0;
                      const totalBaris = qtyTerima * harga;

                      return (
                        <tr key={idx} className="align-middle hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-6 py-4 font-black text-slate-800">{it.nama_bahan || 'Barang PO'}</td>
                          <td className="px-6 py-4 font-bold text-slate-500">{it.nama_supplier || '-'}</td>
                          <td className="px-4 py-4 text-center font-bold text-slate-600">{qtyPesan}</td>
                          <td className="px-4 py-4 text-center bg-amber-50/30">
                            <input 
                              type="number" 
                              min="0"
                              className="w-20 bg-white border border-amber-200 focus:border-amber-500 rounded-lg p-2 font-black text-center text-sm mx-auto outline-none transition-all" 
                              value={it.qty_terima} 
                              onChange={(e) => {
                                let val = Number(e.target.value) || 0;
                                if (val < 0) val = 0;
                                setRows(prev => prev.map((p, i) => i === idx ? { ...p, qty_terima: val } : p));
                              }} 
                            />
                          </td>
                          <td className="px-4 py-4 text-center font-black text-xs text-slate-500 bg-slate-50/50 uppercase tracking-widest">{it.satuan || '-'}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRp(harga)}</td>
                          <td className="px-6 py-4 text-right font-black text-slate-800 bg-slate-50/50">{formatRp(totalBaris)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan="7" className="px-6 py-5 text-right font-black text-xs uppercase tracking-widest text-slate-500">TOTAL TAGIHAN AKTUAL</td>
                    <td className="px-6 py-5 text-right font-black text-lg text-emerald-600">{formatRp(totalTagihanAktual)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button 
                onClick={simpanBarang} 
                disabled={isSaving || rows.length === 0}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-3"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <CheckSquare size={20}/>} 
                SIMPAN BARANG MASUK
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}