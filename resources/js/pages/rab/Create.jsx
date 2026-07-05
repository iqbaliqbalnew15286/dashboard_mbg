import React, { useState, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { 
    Plus, Trash2, Save, ArrowLeft, 
    AlertTriangle, Calculator, FileText, Wallet 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RabCreate() {
    const { props } = usePage();
    const { bahan_bakus = [], suppliers = [] } = props;

    const [loading, setLoading] = useState(false);

    // STATE UTAMA FORM
    const [form, setForm] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        nama_menu: '',
        qty_porsi_kecil: 0,
        harga_porsi_kecil: 8000,
        qty_porsi_besar: 0,
        harga_porsi_besar: 10000,
        items: [{ bahan_baku_id: '', supplier_id: '', qty: 1, harga_satuan: 0, subtotal: 0 }]
    });

    // FORMATTER & CALCULATOR
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

    const totalPagu = useMemo(() => {
        return (Number(form.qty_porsi_kecil) * Number(form.harga_porsi_kecil)) + 
               (Number(form.qty_porsi_besar) * Number(form.harga_porsi_besar));
    }, [form.qty_porsi_kecil, form.harga_porsi_kecil, form.qty_porsi_besar, form.harga_porsi_besar]);

    const totalBelanja = useMemo(() => {
        return form.items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    }, [form.items]);

    const selisih = totalPagu - totalBelanja;

    // HANDLERS
    const handleMainChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleItemChange = (idx, field, value) => {
        const newItems = [...form.items];
        newItems[idx][field] = value;
        
        // Auto-fill harga jika bahan baku dipilih
        if (field === 'bahan_baku_id') {
            const b = bahan_bakus.find(b => b.id.toString() === value.toString());
            if (b) newItems[idx].harga_satuan = b.harga_beli_awal || 0;
        }
        
        newItems[idx].subtotal = Number(newItems[idx].qty) * Number(newItems[idx].harga_satuan);
        setForm({ ...form, items: newItems });
    };

    const addRow = () => setForm({ ...form, items: [...form.items, { bahan_baku_id: '', supplier_id: '', qty: 1, harga_satuan: 0, subtotal: 0 }] });
    const removeRow = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

    const submitRab = (e) => {
        e.preventDefault();
        setLoading(true);
        router.post('/rab', { ...form, total_pagu: totalPagu, total_belanja: totalBelanja, selisih: selisih }, {
            onSuccess: () => toast.success('RAB & PO Berhasil Diterbitkan!'),
            onError: () => {
                toast.error('Gagal menyimpan, periksa kembali input Anda.');
                setLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-20">
            <Toaster position="top-right" />

            <form onSubmit={submitRab} className="space-y-6">
                {/* HEADER FORM */}
                <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <FileText className="text-emerald-500" size={28}/> Input Kebutuhan RAB Baru
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Sistem akan otomatis menerbitkan PO per Supplier dari data ini.</p>
                    </div>
                    <Link 
                        href="/rab"
                        className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                </div>

                {/* PARAMETER PAGU */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Calculator size={20} className="text-blue-500"/> Parameter Kalkulasi Pagu
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Tanggal & Menu <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2 mt-2">
                                    <input type="date" required name="tanggal" value={form.tanggal} onChange={handleMainChange} className="w-1/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 rounded-xl p-3 font-bold text-sm transition-all" />
                                    <input type="text" required name="nama_menu" placeholder="Cth: Nasi Kotak..." value={form.nama_menu} onChange={handleMainChange} className="w-2/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 rounded-xl p-3 font-bold text-sm transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Qty Porsi Kecil (PM Kecil)</label>
                                <input type="number" min="0" required name="qty_porsi_kecil" value={form.qty_porsi_kecil} onChange={handleMainChange} className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 rounded-xl p-3 font-black text-sm text-center transition-all" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Qty Porsi Besar (PM Besar)</label>
                                <input type="number" min="0" required name="qty_porsi_besar" value={form.qty_porsi_besar} onChange={handleMainChange} className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 rounded-xl p-3 font-black text-sm text-center transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[1.5rem] p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-md">
                        <div className="absolute -right-10 -bottom-10 opacity-10"><Wallet size={180} /></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-emerald-400 font-black uppercase tracking-widest text-xs">Akumulasi Pagu Belanja</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black truncate">{fmt(totalPagu)}</h1>
                            <p className="text-slate-400 text-xs mt-3 font-medium">Batas maksimal anggaran dari perhitungan porsi hari ini.</p>
                        </div>
                    </div>
                </div>

                {/* TABEL INPUT ITEM */}
                <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h2 className="font-black text-slate-800 text-lg">Rincian Belanja per Supplier</h2>
                        <button type="button" onClick={addRow} className="px-5 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-sm">
                            <Plus size={16}/> Tambah Item
                        </button>
                    </div>
                    <div className="overflow-x-auto p-4 md:p-8">
                        <table className="w-full min-w-[900px] text-left border-separate border-spacing-y-2">
                            <thead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                <tr>
                                    <th className="px-2 pb-2">Bahan Baku (Master)</th>
                                    <th className="px-2 pb-2 w-[220px]">Ditujukan Ke Supplier</th>
                                    <th className="px-2 pb-2 w-[100px] text-center">Qty</th>
                                    <th className="px-2 pb-2 w-[180px]">Harga Satuan</th>
                                    <th className="px-2 pb-2 w-[200px] text-right">Subtotal</th>
                                    <th className="px-2 pb-2 w-14"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.map((item, idx) => (
                                    <tr key={idx} className="align-middle">
                                        <td className="px-2 py-2">
                                            <select required value={item.bahan_baku_id} onChange={(e) => handleItemChange(idx, 'bahan_baku_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-emerald-500 transition-all">
                                                <option value="">Pilih Bahan...</option>
                                                {bahan_bakus.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <select required value={item.supplier_id} onChange={(e) => handleItemChange(idx, 'supplier_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-emerald-500 transition-all">
                                                <option value="">Pilih Supplier...</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" step="any" min="0.01" required value={item.qty} onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-center outline-none focus:border-emerald-500 transition-all" />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input type="number" min="0" required value={item.harga_satuan} onChange={(e) => handleItemChange(idx, 'harga_satuan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-emerald-500 transition-all text-right" />
                                        </td>
                                        <td className="px-2 py-2 text-right font-black text-slate-800 bg-slate-50 rounded-xl border border-slate-100 pr-4">
                                            {fmt(item.subtotal)}
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button type="button" onClick={() => removeRow(idx)} disabled={form.items.length === 1} className="p-3 border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white disabled:opacity-30 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER ANALISIS SELISIH */}
                <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-colors duration-500 ${selisih < 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Analisis Selisih RAB</p>
                        <h2 className={`text-2xl md:text-3xl font-black mt-1 ${selisih < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {selisih < 0 ? 'Defisit / Minus: ' : 'Surplus / Sisa: '} {fmt(Math.abs(selisih))}
                        </h2>
                        {selisih < 0 && (
                            <p className="text-amber-700 text-xs font-bold mt-2 flex items-center gap-1.5 bg-amber-200/50 px-3 py-1.5 rounded-lg w-max">
                                <AlertTriangle size={14}/> Peringatan: Total belanja telah melampaui Pagu Batas!
                            </p>
                        )}
                    </div>
                    <button type="submit" disabled={loading} className="w-full md:w-auto bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl">
                        <Save size={18}/> {loading ? 'Memproses Sistem...' : 'Simpan RAB & Generate PO'}
                    </button>
                </div>
            </form>
        </div>
    );
}