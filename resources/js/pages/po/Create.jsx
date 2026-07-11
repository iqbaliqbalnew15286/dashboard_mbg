import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RotateCcw, Search, Save, X, Printer, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Jika Anda menggunakan AdminLayout, uncomment baris di bawah dan bungkus return dengan <AdminLayout>
// import AdminLayout from '../../layouts/AdminLayout';

export default function PoCreate() {
  const { props } = usePage();
  const bahanBakus = props.bahan_bakus || [];
  const suppliers = props.suppliers || [];

  // Cetak Blueprint Nilai Form Awal (QTY & Harga dikosongkan agar tidak ada angka 0/1 tersangkut)
  const getInitialForm = () => ({
    kategori_biaya: '',
    nomor_po: '',
    tanggal_pesan: new Date().toISOString().slice(0, 10),
    tanggal_diberikan: '',
    grand_total: 0,
    items: [{ bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }],
  });

  const [form, setForm] = useState(getInitialForm());
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // FUNGSI RESET FORM TOTAL (MODERN UI)
  const executeReset = () => {
    setForm(getInitialForm());
    setErrors({});
    setShowResetConfirm(false);
    toast.success('Form berhasil dikosongkan!');
  };

  const calcGrandTotal = (items) => items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);

  const handleItemChange = (idx, field, value) => {
    setForm((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: value };
        
        // Auto-fill harga satuan ketika barang dipilih
        if (field === 'bahan_baku_id') {
           const selectedBahan = bahanBakus.find(b => b.id.toString() === value.toString());
           if (selectedBahan) next.harga_satuan = selectedBahan.harga_beli_awal || '';
        }

        next.subtotal = (Number(next.qty) || 0) * (Number(next.harga_satuan) || 0);
        return next;
      });
      return { ...prev, items: newItems, grand_total: calcGrandTotal(newItems) };
    });
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }],
    }));
  };

  const removeRow = (idx) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      const normalized = items.length ? items : [{ bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }];
      return { ...prev, items: normalized, grand_total: calcGrandTotal(normalized) };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    router.post('/purchase-orders', form, {
      onError: (errs) => { 
        setErrors(errs || {}); 
        toast.error('Silakan periksa kembali isian kolom input yang berwarna merah.'); 
      },
      onFinish: () => setLoading(false)
    });
  };

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
      <Toaster position="top-right" />
      
      {/* HEADER FORM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Input Purchase Order (PO)</h2>
          <p className="text-slate-500 text-sm mt-1">Dokumentasi pembuatan dan pengajuan berkas manifest PO internal.</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button 
            type="button" 
            onClick={() => setShowResetConfirm(true)} 
            className="w-full lg:w-auto bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Reset Form
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* IDENTITAS BERKAS */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Kategori Biaya <span className="text-rose-500">*</span></label>
            <select 
              required 
              value={form.kategori_biaya} 
              onChange={(e) => setForm(p => ({ ...p, kategori_biaya: e.target.value }))} 
              className={`w-full bg-slate-50 border ${errors.kategori_biaya ? 'border-rose-500' : 'border-slate-200'} rounded-2xl p-4 font-bold text-sm text-slate-800 focus:border-blue-500 transition-all outline-none`}
            >
              <option value="" disabled>Pilih Kategori...</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Operasional">Operasional</option>
              <option value="Insentif Fasilitas">Insentif Fasilitas</option>
            </select>
            {errors.kategori_biaya && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.kategori_biaya}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nomor Nota PO</label>
            <input 
              value={form.nomor_po} 
              onChange={(e) => setForm(p => ({ ...p, nomor_po: e.target.value }))} 
              className={`w-full bg-slate-50 border ${errors.nomor_po ? 'border-rose-500' : 'border-slate-200'} rounded-2xl p-4 font-bold text-sm text-slate-800 focus:border-blue-500 transition-all outline-none`} 
              placeholder="Kosongkan untuk otomatis" 
            />
            {errors.nomor_po && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.nomor_po}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tgl Pesan <span className="text-rose-500">*</span></label>
              <input 
                type="date" 
                required 
                value={form.tanggal_pesan} 
                onChange={(e) => setForm(p => ({ ...p, tanggal_pesan: e.target.value }))} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-800 outline-none focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tgl Diberikan <span className="text-rose-500">*</span></label>
              <input 
                type="date" 
                required 
                value={form.tanggal_diberikan} 
                onChange={(e) => setForm(p => ({ ...p, tanggal_diberikan: e.target.value }))} 
                className={`w-full bg-slate-50 border ${errors.tanggal_diberikan ? 'border-rose-500' : 'border-slate-200'} rounded-2xl p-4 font-bold text-sm text-slate-800 outline-none focus:border-blue-500`} 
              />
              {errors.tanggal_diberikan && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.tanggal_diberikan}</p>}
            </div>
          </div>
        </div>

        {/* TABEL ITEM DETAIL */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center border-b border-slate-100 gap-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">Daftar Item Bahan / Barang</h2>
            <button 
              type="button" 
              onClick={addRow} 
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Plus size={16} /> Tambah Baris
            </button>
          </div>

          <div className="overflow-x-auto p-4 md:p-8">
            <table className="w-full min-w-[900px] text-left border-separate border-spacing-y-2">
              <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-2 pb-2 w-10 text-center">No</th>
                  <th className="px-2 pb-2">Bahan / Nama Barang</th>
                  <th className="px-2 pb-2 w-[220px]">Supplier</th>
                  <th className="px-2 pb-2 w-[100px]">Qty</th>
                  <th className="px-2 pb-2 w-[100px]">Satuan</th>
                  <th className="px-2 pb-2 w-[180px]">Harga Satuan</th>
                  <th className="px-2 pb-2 w-[200px] text-right">Total</th>
                  <th className="px-2 pb-2 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => {
                  const bBaku = bahanBakus.find(b => b.id.toString() === item.bahan_baku_id.toString());
                  return (
                    <tr key={idx} className="align-middle group">
                      <td className="px-2 py-2 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-2 py-2">
                        <select 
                          required 
                          value={item.bahan_baku_id} 
                          onChange={(e) => handleItemChange(idx, 'bahan_baku_id', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="">Pilih Barang...</option>
                          {bahanBakus.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select 
                          required 
                          value={item.supplier_id} 
                          onChange={(e) => handleItemChange(idx, 'supplier_id', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="">Pilih Supplier...</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          required 
                          min="0" 
                          step="any" 
                          placeholder="0"
                          value={item.qty} 
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-center text-blue-700 outline-none focus:border-blue-500" 
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                         <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-3 rounded-xl border border-slate-100 block shadow-sm">
                           {bBaku ? bBaku.satuan : '-'}
                         </span>
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" 
                          required 
                          min="0" 
                          placeholder="0"
                          value={item.harga_satuan} 
                          onChange={(e) => handleItemChange(idx, 'harga_satuan', e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none focus:border-blue-500" 
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-black text-slate-800 bg-slate-50 rounded-xl border border-slate-100 pr-4">
                        {formatRp(item.subtotal)}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => removeRow(idx)} 
                          disabled={form.items.length === 1} 
                          className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white disabled:opacity-30 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM AKSI FORM */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm gap-4">
          <div className="w-full md:w-auto bg-slate-900 text-white rounded-[1.25rem] px-8 py-5 flex items-center justify-between md:justify-start gap-8 shadow-md">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRAND TOTAL</div>
            <div className="text-2xl font-black text-blue-400">{formatRp(form.grand_total)}</div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              type="button" 
              onClick={() => setShowPreview(true)} 
              className="flex-1 md:flex-none px-6 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Search size={16}/> Preview Nota
            </button>
            <button 
              type="submit" 
              disabled={loading || form.items.length === 0} 
              className="flex-1 md:flex-none px-8 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? <RotateCcw size={16} className="animate-spin"/> : <Save size={16}/>} 
              {loading ? 'MENYIMPAN...' : 'SIMPAN PO'}
            </button>
          </div>
        </div>
      </form>

      {/* MODAL RESET KONFIRMASI MODERN (Diperbaiki CSS-nya) */}
      <AnimatePresence>
          {showResetConfirm && (
              <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95 }} 
                      className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl relative"
                  >
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-2">Reset Form PO?</h3>
                      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                          Seluruh data yang telah Anda ketik akan dihapus dan dikembalikan seperti semula.
                      </p>
                      <div className="flex gap-3">
                          <button 
                            onClick={() => setShowResetConfirm(false)} 
                            className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                          >
                              Batal
                          </button>
                          <button 
                            onClick={executeReset} 
                            className="flex-1 py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
                          >
                              Ya, Kosongkan
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* MODAL NOTA PREVIEW (Diperbaiki CSS-nya) */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative"
            >
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <span className="font-black flex items-center gap-2 tracking-wide"><Search size={18}/> PREVIEW NOTA PESANAN</span>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
                <div className="bg-white p-10 border border-slate-200 shadow-sm mx-auto min-h-[450px] font-sans text-slate-800 rounded-xl relative">
                  
                  {/* Watermark Status */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.03] pointer-events-none text-8xl font-black uppercase">
                    DRAFT
                  </div>

                  <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900">PURCHASE ORDER (PO)</h1>
                    <p className="font-black text-blue-600 mt-2 text-lg">{form.nomor_po || '(Dihasilkan Otomatis)'}</p>
                    {form.kategori_biaya && <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-full mt-3">{form.kategori_biaya}</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 mb-8 font-bold text-xs text-slate-600 uppercase tracking-wider gap-4">
                    <div>
                      <p className="text-slate-400">Tanggal Pesan</p>
                      <p className="text-sm text-slate-800 mt-1">{form.tanggal_pesan || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Tanggal Diberikan</p>
                      <p className="text-sm text-slate-800 mt-1">{form.tanggal_diberikan || '-'}</p>
                    </div>
                  </div>
                  
                  <table className="w-full text-left mb-8">
                    <thead>
                      <tr className="border-b-2 border-t-2 border-slate-800 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="py-3 px-2">Komponen Deskripsi Barang</th>
                        <th className="py-3 px-2 text-center w-24">Kuantitas</th>
                        <th className="py-3 px-2 text-right w-36">Harga</th>
                        <th className="py-3 px-2 text-right w-40">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold">
                      {form.items.map((it, i) => {
                        const bahan = bahanBakus.find(b => b.id.toString() === it.bahan_baku_id.toString());
                        return (
                          <tr key={i}>
                            <td className="py-4 px-2 text-slate-800">{bahan ? bahan.nama_barang : '-'}</td>
                            <td className="py-4 px-2 text-center text-slate-500">{it.qty} {bahan ? bahan.satuan : ''}</td>
                            <td className="py-4 px-2 text-right text-slate-500">{formatRp(it.harga_satuan)}</td>
                            <td className="py-4 px-2 text-right font-black text-slate-900">{formatRp(it.subtotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div className="flex justify-end pt-4">
                    <div className="w-80 bg-slate-50 p-5 rounded-2xl flex justify-between items-center border border-slate-200">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">TOTAL AKHIR</span>
                      <span className="text-xl font-black text-slate-900">{formatRp(form.grand_total)}</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button onClick={() => setShowPreview(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50">Tutup Preview</button>
                <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md"><Printer size={16}/> Cetak Dokumen</button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .fixed, .fixed * { visibility: visible; }
          .fixed { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
          button { display: none !important; }
        }
      `}} />
    </div>
  );
}