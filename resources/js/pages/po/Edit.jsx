import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { FileEdit, Save, X, Plus, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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
    <div className="space-y-6 pb-10 font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <FileEdit className="text-amber-500" size={28}/> Edit Purchase Order
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Perbarui data PO #{po.nomor_po}</p>
        </div>
        <button onClick={() => router.visit('/transaksi')} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 flex items-center gap-2">
          <X size={16} /> Batal Edit
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Kategori Biaya *</label>
            <select required value={form.kategori_biaya} onChange={(e) => setForm(p => ({ ...p, kategori_biaya: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500">
              <option value="" disabled>Pilih Kategori...</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Operasional">Operasional</option>
              <option value="Insentif Fasilitas">Insentif Fasilitas</option>
            </select>
            {errors.kategori_biaya && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.kategori_biaya}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nomor PO *</label>
            <input required value={form.nomor_po} onChange={(e) => setForm(p => ({ ...p, nomor_po: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500" />
            {errors.nomor_po && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.nomor_po}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tgl Pesan *</label>
              <input type="date" required value={form.tanggal_pesan} onChange={(e) => setForm(p => ({ ...p, tanggal_pesan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tgl Diberikan</label>
              <input type="date" value={form.tanggal_diberikan} onChange={(e) => setForm(p => ({ ...p, tanggal_diberikan: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800">Item PO</h2>
            <button type="button" onClick={addRow} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2"><Plus size={16} /> Tambah Item</button>
          </div>
          <div className="overflow-x-auto p-4 md:p-8">
            <table className="w-full min-w-[900px] text-left border-separate border-spacing-y-2">
              <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                <tr>
                  <th className="px-2 pb-2">Bahan / Barang</th>
                  <th className="px-2 pb-2 w-[220px]">Supplier</th>
                  <th className="px-2 pb-2 w-[100px]">Qty</th>
                  <th className="px-2 pb-2 w-[180px]">Harga Satuan</th>
                  <th className="px-2 pb-2 w-[200px] text-right">Total</th>
                  <th className="px-2 pb-2 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={idx} className="align-middle">
                    <td className="px-2 py-2">
                      <select required value={item.bahan_baku_id} onChange={(e) => handleItemChange(idx, 'bahan_baku_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-500">
                        <option value="">Pilih...</option>
                        {bahan_bakus.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select required value={item.supplier_id} onChange={(e) => handleItemChange(idx, 'supplier_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-500">
                        <option value="">Pilih...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" required min="0.01" step="any" value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-center outline-none focus:border-blue-500" />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" required min="0" value={item.harga_satuan} onChange={(e) => handleItemChange(idx, 'harga_satuan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-500" />
                    </td>
                    <td className="px-2 py-2 text-right font-black text-slate-800 bg-slate-50 rounded-xl border border-slate-100 pr-4">
                      {formatRp(item.subtotal)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button type="button" onClick={() => removeRow(idx)} disabled={form.items.length === 1} className="p-3 border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white disabled:opacity-30">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm gap-4">
          <div className="w-full md:w-auto bg-slate-900 text-white rounded-[1.25rem] px-8 py-5 flex items-center justify-between md:justify-start gap-8 shadow-md">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRAND TOTAL</div>
            <div className="text-2xl font-black text-amber-400">{formatRp(form.grand_total)}</div>
          </div>
          <button type="submit" disabled={loading || form.items.length === 0} className="w-full md:w-auto px-8 py-4 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
            <Save size={16}/> {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
          </button>
        </div>
      </form>
    </div>
  );
}