import React, { useState, useMemo, useEffect } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { 
    Plus, Trash2, Save, ArrowLeft, 
    AlertTriangle, Calculator, Wallet,
    Box, Truck, Receipt, CheckCircle2, Loader2, Layers
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SearchableSelect from '../../Components/SearchableSelect';

export default function RabEdit() {
    const { props } = usePage();
    const { rab, bahan_bakus = [], suppliers = [] } = props;

    const [loading, setLoading] = useState(false);
    const tipeMode = rab.tipe || 'bahan';

    // INITIAL FORM DATA FOR BAHAN
    const [formBahan, setFormBahan] = useState({
        tipe: 'bahan',
        tanggal: rab.tanggal || new Date().toISOString().slice(0, 10),
        nama_menu: rab.nama_menu || '',
        qty_porsi_kecil: rab.qty_porsi_kecil || 0, 
        harga_porsi_kecil: rab.harga_porsi_kecil || 8000,
        qty_porsi_besar: rab.qty_porsi_besar || 0, 
        harga_porsi_besar: rab.harga_porsi_besar || 10000,
        items: rab.details && rab.details.length > 0 ? rab.details.map(d => ({
            id: d.id,
            bahan_baku_id: d.master_bahan_baku_id || '',
            supplier_id: d.supplier_id || '',
            qty: d.qty || '',
            harga_satuan: d.harga_satuan || '',
            subtotal: d.subtotal || 0
        })) : [{ id: Date.now(), bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }]
    });

    // INITIAL FORM DATA FOR OPERASIONAL
    const [formOps, setFormOps] = useState({
        tipe: 'operasional',
        kategori_pengadaan: rab.kategori_pengadaan || 'Operasional',
        tanggal: rab.tanggal || new Date().toISOString().slice(0, 10),
        nama_menu: rab.nama_menu || '',
        total_pagu: rab.total_pagu || '',
        items: rab.details && rab.details.length > 0 ? rab.details.map(d => ({
            id: d.id,
            nama_pengadaan: d.nama_pengadaan || '',
            supplier_id: d.supplier_id || '',
            qty: d.qty || '',
            harga_satuan: d.harga_satuan || '',
            subtotal: d.subtotal || 0
        })) : [{ id: Date.now(), nama_pengadaan: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }]
    });

    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

    // CALCULATIONS
    const totalPaguBahan = useMemo(() => {
        return (Number(formBahan.qty_porsi_kecil) * Number(formBahan.harga_porsi_kecil)) + 
               (Number(formBahan.qty_porsi_besar) * Number(formBahan.harga_porsi_besar));
    }, [formBahan.qty_porsi_kecil, formBahan.harga_porsi_kecil, formBahan.qty_porsi_besar, formBahan.harga_porsi_besar]);

    const totalBelanjaBahan = useMemo(() => {
        return formBahan.items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    }, [formBahan.items]);

    const selisihBahan = totalPaguBahan - totalBelanjaBahan;

    const totalPaguOps = useMemo(() => {
        return Number(formOps.total_pagu) || 0;
    }, [formOps.total_pagu]);

    const totalBelanjaOps = useMemo(() => {
        return formOps.items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    }, [formOps.items]);

    const selisihOps = totalPaguOps - totalBelanjaOps;

    // HANDLERS FOR BAHAN
    const handleBahanMainChange = (e) => setFormBahan({ ...formBahan, [e.target.name]: e.target.value });

    const handleBahanItemChange = (id, field, value) => {
        setFormBahan(prev => {
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

    const addBahanRow = () => {
        setFormBahan(prev => ({ 
            ...prev, 
            items: [...prev.items, { id: Date.now(), bahan_baku_id: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }] 
        }));
    };

    const removeBahanRow = (id) => {
        setFormBahan(prev => ({ 
            ...prev, 
            items: prev.items.filter(item => item.id !== id) 
        }));
    };

    // HANDLERS FOR OPERASIONAL
    const handleOpsMainChange = (e) => setFormOps({ ...formOps, [e.target.name]: e.target.value });

    const handleOpsItemChange = (id, field, value) => {
        setFormOps(prev => {
            const newItems = prev.items.map(item => {
                if (item.id === id) {
                    let updatedItem = { ...item, [field]: value };
                    updatedItem.subtotal = (Number(updatedItem.qty) || 0) * (Number(updatedItem.harga_satuan) || 0);
                    return updatedItem;
                }
                return item;
            });
            return { ...prev, items: newItems };
        });
    };

    const addOpsRow = () => {
        setFormOps(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), nama_pengadaan: '', supplier_id: '', qty: '', harga_satuan: '', subtotal: 0 }]
        }));
    };

    const removeOpsRow = (id) => {
        setFormOps(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    // SUBMIT REVISI RAB
    const submitRevisiRab = (e) => {
        e.preventDefault();

        if (tipeMode === 'operasional') {
            if (formOps.items.some(item => !item.nama_pengadaan || !item.supplier_id || !item.qty)) {
                return toast.error('Lengkapi semua rincian pengadaan, supplier, dan qty!');
            }

            setLoading(true);
            router.put(`/rab/${rab.id}`, { 
                ...formOps, 
                tipe: 'operasional', 
                total_pagu: totalPaguOps, 
                total_belanja: totalBelanjaOps, 
                selisih: selisihOps 
            }, {
                onSuccess: () => toast.success('RAB Operasional & PO berhasil direvisi!'),
                onError: () => {
                    toast.error('Gagal merevisi RAB Operasional.');
                    setLoading(false);
                }
            });
        } else {
            if (formBahan.items.some(item => !item.bahan_baku_id || !item.supplier_id || !item.qty)) {
                return toast.error('Lengkapi semua rincian bahan, supplier, dan qty!');
            }

            setLoading(true);
            router.put(`/rab/${rab.id}`, { 
                ...formBahan, 
                tipe: 'bahan', 
                total_pagu: totalPaguBahan, 
                total_belanja: totalBelanjaBahan, 
                selisih: selisihBahan 
            }, {
                onSuccess: () => toast.success('RAB Bahan Baku & PO berhasil direvisi!'),
                onError: () => {
                    toast.error('Gagal merevisi RAB Bahan Baku.');
                    setLoading(false);
                }
            });
        }
    };

    return (
        <div className="w-full pb-20 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-8">
            <Toaster position="top-right" />

            {/* HEADER FORM */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                            Revisi RAB #{rab.id}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800">
                            {tipeMode === 'operasional' ? 'Revisi RAB Operasional' : 'Revisi RAB Bahan Baku'}
                        </h2>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Revisi RAB akan memperbarui data PO dan seluruh laporan terkait secara otomatis.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Link 
                        href="/rab"
                        className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                        <ArrowLeft size={16} /> Batal / Kembali
                    </Link>
                </div>
            </div>

            <form onSubmit={submitRevisiRab} className="space-y-6">
                
                {tipeMode === 'bahan' ? (
                    /* FORM REVISI RAB BAHAN BAKU */
                    <>
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
                            <div className="lg:col-span-7 space-y-6 z-10">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                        <Calculator size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800">Kalkulasi Anggaran Bahan Baku</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal & Nama Menu <span className="text-rose-500">*</span></label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input type="date" required name="tanggal" value={formBahan.tanggal} onChange={handleBahanMainChange} className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                            <input type="text" required name="nama_menu" placeholder="Contoh: Nasi Kotak Ayam Goreng..." value={formBahan.nama_menu} onChange={handleBahanMainChange} className="w-full sm:w-2/3 bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl group focus-within:border-blue-200 transition-all">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest group-focus-within:text-blue-500">Porsi Kecil</label>
                                        <input type="number" min="0" name="qty_porsi_kecil" value={formBahan.qty_porsi_kecil} onChange={handleBahanMainChange} placeholder="0" className="w-full bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 font-black text-lg text-slate-800 transition-all placeholder:text-slate-300" />
                                    </div>
                                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl group focus-within:border-blue-200 transition-all">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest group-focus-within:text-blue-500">Porsi Besar</label>
                                        <input type="number" min="0" name="qty_porsi_besar" value={formBahan.qty_porsi_besar} onChange={handleBahanMainChange} placeholder="0" className="w-full bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-3 font-black text-lg text-slate-800 transition-all placeholder:text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-500/30 text-white z-10">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
                                <div className="relative z-10">
                                    <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-1">Total Pagu Anggaran Bahan</p>
                                    <h1 className="text-4xl md:text-5xl font-black truncate">{fmt(totalPaguBahan)}</h1>
                                </div>
                                <div className="mt-6 flex items-center gap-2.5 bg-white/10 w-max px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/10 relative z-10">
                                    <CheckCircle2 size={16} className="text-blue-200"/>
                                    <span className="text-xs font-bold text-blue-50 tracking-wide">Dihitung otomatis dari porsi</span>
                                </div>
                            </div>
                        </div>

                        {/* RINCIAN ITEM BAHAN */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-4 px-2">
                                <div>
                                    <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                        <Box size={20} className="text-blue-500"/> Rincian Belanja Bahan Baku
                                    </h2>
                                    <p className="text-slate-500 text-xs mt-1 font-medium">Revisi rincian bahan akan memperbarui PO otomatis.</p>
                                </div>
                                <button type="button" onClick={addBahanRow} className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-blue-600 transition-all shadow-md shrink-0">
                                    <Plus size={16}/> <span className="hidden sm:inline">Tambah Item</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {formBahan.items.map((item, index) => (
                                        <motion.div 
                                            key={item.id || index}
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
                                                <SearchableSelect
                                                    options={bahan_bakus.map(b => ({ value: b.id, label: b.nama_barang, sublabel: b.kode_barang }))}
                                                    value={item.bahan_baku_id}
                                                    onChange={(val) => handleBahanItemChange(item.id, 'bahan_baku_id', val)}
                                                    placeholder="Pilih Bahan..."
                                                    searchPlaceholder="Cari bahan baku..."
                                                />
                                            </div>
                                            
                                            <div className="w-full md:w-[25%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 flex items-center gap-1"><Truck size={10}/> Supplier</label>
                                                <SearchableSelect
                                                    options={suppliers.map(s => ({ value: s.id, label: s.nama_perusahaan }))}
                                                    value={item.supplier_id}
                                                    onChange={(val) => handleBahanItemChange(item.id, 'supplier_id', val)}
                                                    placeholder="Pilih Supplier..."
                                                    searchPlaceholder="Cari supplier..."
                                                />
                                            </div>
                                            
                                            <div className="w-full md:w-[15%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Qty</label>
                                                <input type="number" step="any" min="0.01" required placeholder="0" value={item.qty} onChange={(e) => handleBahanItemChange(item.id, 'qty', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-slate-800 text-center outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                            </div>

                                            <div className="w-full md:w-[20%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Harga Satuan</label>
                                                <input type="number" min="0" required placeholder="0" value={item.harga_satuan} onChange={(e) => handleBahanItemChange(item.id, 'harga_satuan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-right" />
                                            </div>

                                            <div className="w-full md:w-[20%] flex items-end gap-3 justify-between md:justify-end">
                                                <div className="flex-1 md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Subtotal</p>
                                                    <p className="font-black text-slate-800">{fmt(item.subtotal)}</p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeBahanRow(item.id)} 
                                                    disabled={formBahan.items.length === 1} 
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
                    </>
                ) : (
                    /* FORM REVISI RAB OPERASIONAL */
                    <>
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
                            <div className="lg:col-span-7 space-y-6 z-10">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                        <Calculator size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-800">Paramater & Pagu RAB Operasional</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Pengadaan <span className="text-rose-500">*</span></label>
                                        <input type="date" required name="tanggal" value={formOps.tanggal} onChange={handleOpsMainChange} className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Keterangan Pengadaan <span className="text-rose-500">*</span></label>
                                        <select 
                                            name="kategori_pengadaan" 
                                            value={formOps.kategori_pengadaan} 
                                            onChange={handleOpsMainChange} 
                                            className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all cursor-pointer"
                                        >
                                            <option value="Operasional">Operasional</option>
                                            <option value="Insentif Fasilitas">Insentif Fasilitas</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Deskripsi / Judul Pengadaan</label>
                                        <input type="text" name="nama_menu" placeholder="Contoh: Belanja Operasional Dapur..." value={formOps.nama_menu} onChange={handleOpsMainChange} className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-xl p-3.5 font-bold text-sm text-slate-700 transition-all" />
                                    </div>

                                    <div className="sm:col-span-2 bg-amber-50/50 border border-amber-100 p-4 rounded-2xl group focus-within:border-amber-300 transition-all">
                                        <label className="text-[10px] font-black uppercase text-amber-700 block mb-2 tracking-widest">Alokasi Pagu Anggaran Operasional (Rp) <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0" required name="total_pagu" value={formOps.total_pagu} onChange={handleOpsMainChange} placeholder="Masukkan nominal pagu..." className="w-full bg-white border border-slate-200 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-3 font-black text-xl text-slate-800 transition-all placeholder:text-slate-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-amber-500/30 text-white z-10">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
                                <div className="relative z-10">
                                    <p className="text-amber-100 font-bold uppercase tracking-widest text-[10px] mb-1">Pagu Anggaran Operasional</p>
                                    <h1 className="text-4xl md:text-5xl font-black truncate">{fmt(totalPaguOps)}</h1>
                                </div>
                                <div className="mt-6 flex items-center gap-2.5 bg-white/10 w-max px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/10 relative z-10">
                                    <CheckCircle2 size={16} className="text-amber-200"/>
                                    <span className="text-xs font-bold text-amber-50 tracking-wide">Pagu Alokasi Operasional</span>
                                </div>
                            </div>
                        </div>

                        {/* RINCIAN ITEM OPERASIONAL */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-4 px-2">
                                <div>
                                    <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                        <Layers size={20} className="text-amber-500"/> Rincian Belanja Operasional
                                    </h2>
                                    <p className="text-slate-500 text-xs mt-1 font-medium">Pengadaan, Supplier, Qty, Harga Satuan, Subtotal.</p>
                                </div>
                                <button type="button" onClick={addOpsRow} className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 hover:bg-amber-600 transition-all shadow-md shrink-0">
                                    <Plus size={16}/> <span className="hidden sm:inline">Tambah Item</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence>
                                    {formOps.items.map((item, index) => (
                                        <motion.div 
                                            key={item.id || index}
                                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center group hover:border-amber-300 transition-colors relative"
                                        >
                                            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-black text-[10px] border-2 border-white shadow-sm">
                                                {index + 1}
                                            </div>
                                            
                                            <div className="w-full md:w-[30%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Pengadaan / Deskripsi Item</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    placeholder="Contoh: Insentif Staf..." 
                                                    value={item.nama_pengadaan} 
                                                    onChange={(e) => handleOpsItemChange(item.id, 'nama_pengadaan', e.target.value)} 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all" 
                                                />
                                            </div>
                                            
                                            <div className="w-full md:w-[25%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1 flex items-center gap-1"><Truck size={10}/> Supplier</label>
                                                <SearchableSelect
                                                    options={suppliers.map(s => ({ value: s.id, label: s.nama_perusahaan }))}
                                                    value={item.supplier_id}
                                                    onChange={(val) => handleOpsItemChange(item.id, 'supplier_id', val)}
                                                    placeholder="Pilih Supplier..."
                                                    searchPlaceholder="Cari supplier..."
                                                />
                                            </div>
                                            
                                            <div className="w-full md:w-[15%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Qty</label>
                                                <input type="number" step="any" min="0.01" required placeholder="0" value={item.qty} onChange={(e) => handleOpsItemChange(item.id, 'qty', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-sm text-slate-800 text-center outline-none focus:border-amber-500 focus:bg-white transition-all" />
                                            </div>

                                            <div className="w-full md:w-[20%]">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5 ml-1">Harga Satuan</label>
                                                <input type="number" min="0" required placeholder="0" value={item.harga_satuan} onChange={(e) => handleOpsItemChange(item.id, 'harga_satuan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all text-right" />
                                            </div>

                                            <div className="w-full md:w-[20%] flex items-end gap-3 justify-between md:justify-end">
                                                <div className="flex-1 md:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Subtotal</p>
                                                    <p className="font-black text-slate-800">{fmt(item.subtotal)}</p>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeOpsRow(item.id)} 
                                                    disabled={formOps.items.length === 1} 
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
                    </>
                )}

                {/* FOOTER STATUS REVISI ANGGARAN */}
                <div className="sticky bottom-6 z-40 mt-8">
                    {tipeMode === 'operasional' ? (
                        <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-500 backdrop-blur-md ${selisihOps < 0 ? 'bg-amber-50/95 border-amber-300' : 'bg-emerald-50/95 border-emerald-300'}`}>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Receipt size={14}/> Status Revisi Pagu Operasional ({formOps.kategori_pengadaan})</p>
                                <h2 className={`text-2xl md:text-3xl font-black mt-1 ${selisihOps < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {selisihOps < 0 ? 'Defisit: ' : 'Sisa: '} {fmt(Math.abs(selisihOps))}
                                </h2>
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:w-auto bg-amber-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-600/30 shrink-0">
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>} 
                                {loading ? 'Menyimpan Revisi...' : 'Simpan Revisi RAB Operasional'}
                            </button>
                        </div>
                    ) : (
                        <div className={`p-6 md:p-8 rounded-[2rem] border-2 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-500 backdrop-blur-md ${selisihBahan < 0 ? 'bg-amber-50/95 border-amber-300' : 'bg-emerald-50/95 border-emerald-300'}`}>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5"><Receipt size={14}/> Status Revisi Anggaran Bahan Baku</p>
                                <h2 className={`text-2xl md:text-3xl font-black mt-1 ${selisihBahan < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {selisihBahan < 0 ? 'Defisit: ' : 'Sisa: '} {fmt(Math.abs(selisihBahan))}
                                </h2>
                            </div>
                            <button type="submit" disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30 shrink-0">
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>} 
                                {loading ? 'Menyimpan Revisi...' : 'Simpan Revisi RAB Bahan'}
                            </button>
                        </div>
                    )}
                </div>
                
            </form>
        </div>
    );
}
