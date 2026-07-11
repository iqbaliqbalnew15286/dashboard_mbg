import React, { useState, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { 
    Plus, Trash2, Save, ArrowLeft, 
    AlertTriangle, Calculator, FileText, Wallet,
    Box, Truck, Receipt, CheckCircle2, Loader2 // FIX: Loader2 sudah diimpor di sini
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function RabCreate() {
    const { props } = usePage();
    const { bahan_bakus = [], suppliers = [] } = props;

    const [loading, setLoading] = useState(false);

    // STATE UTAMA FORM
    const [form, setForm] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        nama_menu: '',
        qty_porsi_kecil: '', 
        harga_porsi_kecil: 8000,
        qty_porsi_besar: '', 
        harga_porsi_besar: 10000,
        items: [{ id: Date.now(), bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }]
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

    const handleItemChange = (id, field, value) => {
        setForm(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    let updatedItem = { ...item, [field]: value };
                    
                    if (field === 'bahan_baku_id') {
                        const b = bahan_bakus.find(b => b.id.toString() === value.toString());
                        if (b) updatedItem.harga_satuan = b.harga_beli_awal || 0;
                    }
                    
                    updatedItem.subtotal = (Number(updatedItem.qty) || 0) * (Number(updatedItem.harga_satuan) || 0);
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const addRow = () => {
        setForm(prev => ({ 
            ...prev, 
            items: [...prev.items, { id: Date.now(), bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }] 
        }));
    };

    const removeRow = (id) => {
        setForm(prev => ({ 
            ...prev, 
            items: prev.items.filter(item => item.id !== id) 
        }));
    };

    const submitRab = (e) => {
        e.preventDefault();
        
        if (form.items.some(item => !item.bahan_baku_id || !item.supplier_id || !item.qty)) {
            return toast.error('Lengkapi semua rincian bahan, supplier, dan qty!');
        }

        setLoading(true);
        router.post('/rab', { ...form, total_pagu: totalPagu, total_belanja: totalBelanja, selisih: selisih }, {
            onSuccess: () => toast.success('RAB & PO berhasil dibuat!'),
            onError: () => {
                toast.error('Gagal menyimpan, periksa input Anda. Coba refresh halaman jika error 403.');
                setLoading(false);
            }
        });
    };

    return (
        <div className="w-full pb-20 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-8">
            <Toaster position="top-right" />

            {/* HEADER FORM */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Buat RAB Baru</h2>
                    <p className="text-slate-500 text-sm mt-1">PO akan otomatis di-generate per supplier.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Link 
                        href="/rab"
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                </div>
            </div>

            <form onSubmit={submitRab} className="space-y-6">
                
                {/* PARAMETER PAGU */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
                    <div className="lg:col-span-7 space-y-6 z-10">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Calculator size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-800">Kalkulasi Anggaran</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="sm:col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal & Menu <span className="text-rose-500">*</span></label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input type="date" required name="tanggal" value={form.tanggal} onChange={handleMainChange} className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                    <input type="text" required name="nama_menu" placeholder="Contoh: Nasi Kotak..." value={form.nama_menu} onChange={handleMainChange} className="w-full sm:w-2/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                </div>
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl group focus-within:border-blue-200 transition-all">
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest group-focus-within:text-blue-500">Porsi Kecil</label>
                                <input type="number" min="0" name="qty_porsi_kecil" value={form.qty_porsi_kecil} onChange={handleMainChange} placeholder="0" className="w-full bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 font-black text-lg text-slate-800 transition-all placeholder:text-slate-300" />
                            </div>
                            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl group focus-within:border-blue-200 transition-all">
                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest group-focus-within:text-blue-500">Porsi Besar</label>
                                <input type="number" min="0" name="qty_porsi_besar" value={form.qty_porsi_besar} onChange={handleMainChange} placeholder="0" className="w-full bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 font-black text-lg text-slate-800 transition-all placeholder:text-slate-300" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-500/30 text-white z-10">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
                        
                        <div className="relative z-10">
                            <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-1">Total Pagu Anggaran</p>
                            <h1 className="text-4xl md:text-5xl font-black truncate">{fmt(totalPagu)}</h1>
                        </div>

                        <div className="mt-6 flex items-center gap-2.5 bg-white/10 w-max px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/10 relative z-10">
                            <CheckCircle2 size={16} className="text-blue-200"/>
                            <span className="text-xs font-bold text-blue-50 tracking-wide">Dihitung otomatis dari porsi</span>
                        </div>
                    </div>
                </div>

                {/* RINCIAN ITEM */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <div>
                            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <Box size={20} className="text-blue-500"/> Rincian Belanja
                            </h2>
                            <p className="text-slate-500 text-xs mt-1 font-medium">Data PO dipisah per supplier otomatis.</p>
                        </div>
                        <button type="button" onClick={addRow} className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-md shrink-0">
                            <Plus size={16}/> <span className="hidden sm:inline">Tambah Item</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence>
                            {form.items.map((item, index) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center group hover:border-blue-300 transition-colors relative"
                                >
                                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-[10px] border-2 border-white shadow-sm">
                                        {index + 1}
                                    </div>
                                    
                                    <div className="w-full md:w-[30%]">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Bahan Baku</label>
                                        <select required value={item.bahan_baku_id} onChange={(e) => handleItemChange(item.id, 'bahan_baku_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
                                            <option value="">Pilih Bahan...</option>
                                            {bahan_bakus.map(b => <option key={b.id} value={b.id}>{b.nama_barang}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="w-full md:w-[25%]">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 flex items-center gap-1"><Truck size={10}/> Supplier</label>
                                        <select required value={item.supplier_id} onChange={(e) => handleItemChange(item.id, 'supplier_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
                                            <option value="">Pilih Supplier...</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="w-full md:w-[15%] flex gap-3">
                                        <div className="w-full">
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Qty</label>
                                            <input type="number" step="any" min="0.01" required placeholder="0" value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-slate-800 text-center outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-[25%] flex gap-3">
                                        <div className="w-full">
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Harga Satuan</label>
                                            <input type="number" min="0" required placeholder="0" value={item.harga_satuan} onChange={(e) => handleItemChange(item.id, 'harga_satuan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-right" />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-[25%] flex items-end gap-3 justify-between md:justify-end">
                                        <div className="flex-1 md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Subtotal</p>
                                            <p className="font-black text-slate-800">{fmt(item.subtotal)}</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeRow(item.id)} 
                                            disabled={form.items.length === 1} 
                                            className="p-3.5 bg-white border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-rose-500 disabled:hover:border-slate-200 transition-all shadow-sm"
                                            title="Hapus Item"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* FOOTER STATUS ANGGARAN - Sticky Bottom */}
                <div className="sticky bottom-6 z-40 mt-8">
                    <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-500 backdrop-blur-md ${selisih < 0 ? 'bg-amber-50/95 border-amber-300' : 'bg-emerald-50/95 border-emerald-300'}`}>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Receipt size={14}/> Status Anggaran</p>
                            <h2 className={`text-2xl md:text-3xl font-black mt-1 ${selisih < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {selisih < 0 ? 'Defisit: ' : 'Sisa: '} {fmt(Math.abs(selisih))}
                            </h2>
                            {selisih < 0 && (
                                <p className="text-amber-700 text-xs font-bold mt-2 flex items-center gap-1.5 bg-amber-200/50 px-3 py-2 rounded-lg w-max">
                                    <AlertTriangle size={14}/> Melebihi batas pagu!
                                </p>
                            )}
                        </div>
                        <button type="submit" disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30 shrink-0">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>} 
                            {loading ? 'Memproses...' : 'Simpan & Buat PO'}
                        </button>
                    </div>
                </div>
                
            </form>
        </div>
    );
}