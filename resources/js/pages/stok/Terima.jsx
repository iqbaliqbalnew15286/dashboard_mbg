import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { 
  Truck, Search, RotateCcw, CheckSquare, 
  Loader2, CheckCircle2, XCircle, AlertCircle, ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StokTerimaPage() {
  const [noPoInput, setNoPoInput] = useState('');
  const [selectedPo, setSelectedPo] = useState(null);
  const [tglTerima, setTglTerima] = useState(new Date().toISOString().split('T')[0]);
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

  const totalTagihanAktual = useMemo(() => {
    return rows.reduce((total, item) => total + ((Number(item.qty_terima) || 0) * (Number(item.harga_satuan) || 0)), 0);
  }, [rows]);

  // Tarik Data menggunakan Axios (Sangat Ringan & CSRF Protected)
  const cariPO = async () => {
    if (!noPoInput.trim()) return showToast('Masukkan nomor PO terlebih dahulu!', 'error');
    
    setIsLoading(true);
    showToast('Mencari data PO...', 'loading');
    
    try {
      const response = await axios.get(`/stok/terima/po/${encodeURIComponent(noPoInput)}`);
      
      setSelectedPo(response.data.po || null);
      setRows(response.data.items || []);
      setNotification(null);
    } catch (err) {
      setSelectedPo(null);
      setRows([]);
      showToast(err.response?.data?.message || 'Gagal menarik data PO', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Simpan Data menggunakan Router Inertia
  const simpanBarang = () => {
    if (!tglTerima) return showToast('Tanggal terima harus diisi!', 'error');
    if (!petugas.trim()) return showToast('Nama petugas penerima harus diisi!', 'error');
    
    const validItems = rows.filter(r => Number(r.qty_terima) > 0).map(r => ({
      bahan_baku_id: r.bahan_baku_id,
      supplier_id: r.supplier_id,
      qty_terima: Number(r.qty_terima),
      harga_satuan: Number(r.harga_satuan)
    }));

    if (validItems.length === 0) return showToast('Minimal ada 1 barang dengan Qty Terima lebih dari 0!', 'error');

    const payload = {
      no_po: selectedPo.no_po,
      tgl_terima: tglTerima,
      petugas: petugas,
      items: validItems
    };

    router.post('/stok/terima', payload, {
      onBefore: () => {
        setIsSaving(true);
        showToast('Menyimpan data penerimaan...', 'loading');
      },
      onSuccess: () => {
        showToast('Barang berhasil dimasukkan ke stok gudang!', 'success');
        handleReset();
      },
      onError: () => {
        showToast('Terjadi kesalahan validasi data.', 'error');
      },
      onFinish: () => setIsSaving(false)
    });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Penerimaan Barang (Stok Masuk)</h2>
          <p className="text-slate-500 text-sm mt-1">Pemeriksaan dan validasi kuantitas fisik sebelum masuk ke penyimpanan gudang.</p>
        </div>
      </div>

      {/* PENCARIAN PO PANEL */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Ketik Nomor PO <span className="text-rose-500">*</span></label>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3.5 pl-11 pr-4 font-bold text-sm text-slate-700 transition-all outline-none" 
              placeholder="Contoh: PO-MBG-2026..." 
              value={noPoInput} 
              onChange={(e) => setNoPoInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && cariPO()}
            />
          </div>
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button 
            onClick={cariPO} 
            disabled={isLoading}
            className="flex-1 md:flex-none px-6 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-600/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16}/>} Tarik Data PO
          </button>
          <button 
            onClick={handleReset} 
            className="px-5 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={16}/> Reset
          </button>
        </div>
      </div>

      {/* DATA PO & PENERIMAAN */}
      {selectedPo && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-1">Tgl Pesan (Dari PO)</span>
              <span className="font-black text-blue-600 text-lg">{selectedPo.tgl_pesan || '-'}</span>
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-2">Tanggal Terima Fisik</span>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                value={tglTerima} 
                onChange={(e) => setTglTerima(e.target.value)} 
              />
            </div>
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest mb-2">Petugas Penerima</span>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                placeholder="Nama Anda..." 
                value={petugas} 
                onChange={(e) => setPetugas(e.target.value)} 
              />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <ClipboardCheck size={20} className="text-blue-500" />
              <h3 className="font-black text-slate-800 text-lg">Ceklis Barang Datang</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 w-16 text-center">No</th>
                    <th className="px-6 py-5">Nama Barang</th>
                    <th className="px-6 py-5">Supplier</th>
                    <th className="px-4 py-5 text-center">Qty Pesan</th>
                    <th className="px-4 py-5 text-center bg-blue-50/50 text-blue-600">Qty Terima</th>
                    <th className="px-4 py-5 text-center">Satuan</th>
                    <th className="px-6 py-5 text-right">Harga Satuan</th>
                    <th className="px-8 py-5 text-right">Total Aktual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16 text-slate-400 font-bold">
                        <AlertCircle className="mx-auto h-10 w-10 mb-3 opacity-30 text-blue-500" />
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
                        <tr key={idx} className="align-middle hover:bg-slate-50/80 transition-colors">
                          <td className="px-8 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-6 py-4 font-black text-blue-600">{it.nama_bahan || 'Barang PO'}</td>
                          <td className="px-6 py-4 font-bold text-slate-600">{it.nama_supplier || '-'}</td>
                          <td className="px-4 py-4 text-center font-bold text-slate-500">{qtyPesan}</td>
                          <td className="px-4 py-4 text-center bg-blue-50/30">
                            <input 
                              type="number" 
                              min="0"
                              className="w-20 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg p-2 font-black text-center text-sm mx-auto outline-none transition-all shadow-sm" 
                              value={it.qty_terima} 
                              onChange={(e) => {
                                let val = Number(e.target.value) || 0;
                                if (val < 0) val = 0;
                                setRows(prev => prev.map((p, i) => i === idx ? { ...p, qty_terima: val } : p));
                              }} 
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                              <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg">
                                  {it.satuan || '-'}
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-600">{formatRp(harga)}</td>
                          <td className="px-8 py-4 text-right font-black text-slate-800 bg-slate-50/50">{formatRp(totalBaris)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot className="bg-slate-900 border-t border-slate-800 text-white">
                    <tr>
                      <td colSpan="7" className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">TOTAL TAGIHAN AKTUAL</td>
                      <td className="px-8 py-5 text-right font-black text-lg text-blue-400">{formatRp(totalTagihanAktual)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button 
                onClick={simpanBarang} 
                disabled={isSaving || rows.length === 0}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-3"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckSquare size={18}/>} 
                SIMPAN BARANG MASUK
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}