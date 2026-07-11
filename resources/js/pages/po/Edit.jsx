import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { FileEdit, Save, X, Plus, Trash2, ArrowLeft, Loader2, Box, Calendar } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// PERBAIKAN: Menggunakan ../../ untuk naik 2 tingkat folder dari pages/po/
import AdminLayout from '../../layouts/AdminLayout'; 

export default function PoEdit() {
  const { props } = usePage();
  const { po, bahan_bakus = [], suppliers = [] } = props;

  // Inisialisasi state form dengan data existing dari props.po
  const [form, setForm] = useState({
    kategori_biaya: po.kategori_biaya || '',
    nomor_po: po.nomor_po || '',
    tanggal_pesan: po.tanggal_pesan || '',
    tanggal_diberikan: po.tanggal_diberikan || '',
    grand_total: po.grand_total || 0,
    items: po.details && po.details.length > 0 
      ? po.details.map(d => ({
          bahan_baku_id: d.master_bahan_baku_id,
          supplier_id: d.supplier_id,
          qty: d.qty,
          harga_satuan: d.harga_satuan,
          subtotal: d.subtotal
        }))
      : [{ bahan_baku_id: '', supplier_id: '', qty: 1, harga_satuan: 0, subtotal: 0 }],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  const calcGrandTotal = (items) => items.reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);

  const handleItemChange = (idx, field, value) => {
    setForm((prev) => {
      const newItems = prev.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [field]: value };
        
        // Auto-fill harga jika memilih bahan baku
        if (field === 'bahan_baku_id') {
           const selectedBahan = bahan_bakus.find(b => b.id.toString() === value.toString());
           if (selectedBahan) next.harga_satuan = selectedBahan.harga_beli_awal || 0;
        }

        next.subtotal = (Number(next.qty) || 0) * (Number(next.harga_satuan) || 0);
        return next;
      });
      return { ...prev, items: newItems, grand_total: calcGrandTotal(newItems) };
    });
  };

  const addRow = () => setForm(p => ({ ...p, items: [...p.items, { bahan_baku_id: '', supplier_id: '', qty: 1, harga_satuan: 0, subtotal: 0 }] }));
  
  const removeRow = (idx) => {
    setForm(p => {
      const items = p.items.filter((_, i) => i !== idx);
      const normalized = items.length ? items : [{ bahan_baku_id: '', supplier_id: '', qty: 1, harga_satuan: 0, subtotal: 0 }];
      return { ...p, items: normalized, grand_total: calcGrandTotal(normalized) };
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    // Menggunakan metode PUT untuk update data
    router.put(`/purchase-orders/${po.id}`, form, {
      onError: (errs) => { 
        setErrors(errs || {}); 
        toast.error('Gagal memperbarui, periksa kembali input Anda.'); 
      },
      onFinish: () => setLoading(false)
    });
  };

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6">
      <Toaster position="top-right" />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FileEdit className="text-blue-600" size={28}/> 
              Edit Purchase Order
            </h2>
            <p className="text-slate-500 text-sm mt-1">Perbarui data atau item untuk PO <span className="font-black text-blue-600">#{po.nomor_po}</span></p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button 
              type="button"
              onClick={() => router.visit('/transaksi')} 
              className="w-full lg:w-auto bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <ArrowLeft size={16} /> Batal Edit
            </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {/* METADATA PO PANEL */}
        <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <h3 className="font-black text-blue-600 uppercase tracking-widest text-xs mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span> INFORMASI UMUM PO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Kategori Biaya <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Box size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select required value={form.kategori_biaya} onChange={(e) => setForm(p => ({ ...p, kategori_biaya: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Pilih Kategori...</option>
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Insentif Fasilitas">Insentif Fasilitas</option>
                </select>
              </div>
              {errors.kategori_biaya && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.kategori_biaya}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Nomor PO <span className="text-rose-500">*</span></label>
              <input required value={form.nomor_po} onChange={(e) => setForm(p => ({ ...p, nomor_po: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none transition-all" placeholder="Contoh: PO-MBG-123..." />
              {errors.nomor_po && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.nomor_po}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Pesan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" required value={form.tanggal_pesan} onChange={(e) => setForm(p => ({ ...p, tanggal_pesan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Diberikan (Opsional)</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="date" value={form.tanggal_diberikan} onChange={(e) => setForm(p => ({ ...p, tanggal_diberikan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS PANEL */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-6 md:px-8 md:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 bg-slate-50/50 gap-4">
            <h3 className="font-black text-rose-600 uppercase tracking-widest text-xs flex items-center gap-2 m-0">
              <span className="bg-rose-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span> DAFTAR ITEM PO
            </h3>
            <button 
              type="button" 
              onClick={addRow} 
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
            >
              <Plus size={14} /> Tambah Baris Baru
            </button>
          </div>

          <div className="overflow-x-auto p-4 md:p-6 bg-white min-h-[300px]">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead className="bg-slate-900 text-[10px] uppercase font-black text-white tracking-widest rounded-xl">
                <tr>
                  <th className="px-4 py-4 rounded-tl-xl w-[25%]">Bahan / Barang</th>
                  <th className="px-4 py-4 w-[25%]">Supplier</th>
                  <th className="px-4 py-4 w-[15%] text-center">Volume (Qty)</th>
                  <th className="px-4 py-4 w-[15%] text-right">Harga Satuan</th>
                  <th className="px-4 py-4 w-[15%] text-right">Subtotal</th>
                  <th className="px-4 py-4 rounded-tr-xl w-14 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {form.items.map((item, idx) => (
                  <tr key={idx} className="align-middle hover:bg-slate-50/50 transition-colors">
                    
                    {/* Bahan Baku */}
                    <td className="px-2 py-3">
                      <select required value={item.bahan_baku_id} onChange={(e) => handleItemChange(idx, 'bahan_baku_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none transition-all cursor-pointer">
                        <option value="">Pilih Barang...</option>
                        {bahan_bakus.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                      </select>
                    </td>

                    {/* Supplier */}
                    <td className="px-2 py-3">
                      <select required value={item.supplier_id} onChange={(e) => handleItemChange(idx, 'supplier_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none transition-all cursor-pointer">
                        <option value="">Pilih Supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}
                      </select>
                    </td>

                    {/* Qty */}
                    <td className="px-2 py-3">
                      <input 
                        type="number" required min="0.01" step="any" placeholder="0"
                        value={item.qty} 
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3 font-black text-sm text-slate-700 text-center outline-none transition-all" 
                      />
                    </td>

                    {/* Harga Satuan */}
                    <td className="px-2 py-3">
                      <input 
                        type="number" required min="0" placeholder="0"
                        value={item.harga_satuan} 
                        onChange={(e) => handleItemChange(idx, 'harga_satuan', e.target.value)} 
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3 font-bold text-sm text-slate-700 text-right outline-none transition-all" 
                      />
                    </td>

                    {/* Subtotal (Read Only UI) */}
                    <td className="px-2 py-3 text-right">
                      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3 font-black text-sm text-slate-800 text-right min-w-[120px]">
                        {formatRp(item.subtotal)}
                      </div>
                    </td>

                    {/* Tombol Hapus (DIPERJELAS) */}
                    <td className="px-2 py-3 text-center">
                      <button 
                        type="button" 
                        onClick={() => removeRow(idx)} 
                        disabled={form.items.length === 1} 
                        title="Hapus Baris"
                        className="p-2.5 mx-auto bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-rose-100 disabled:hover:text-rose-600 flex items-center justify-center shadow-sm"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER ACTION PANEL */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="w-full md:w-auto bg-slate-900 border border-slate-800 rounded-2xl px-8 py-5 flex items-center justify-between md:justify-start gap-8 shadow-md">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRAND TOTAL</div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">{formatRp(form.grand_total)}</div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || form.items.length === 0} 
            className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>} 
            {loading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN PO'}
          </button>
        </div>

      </form>
    </div>
  );
}

// Tambahkan layout persisten
PoEdit.layout = page => <AdminLayout children={page} />;