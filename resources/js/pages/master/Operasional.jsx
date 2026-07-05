import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Plus, Edit2, Trash2, X, Database, Search,
    Wallet, ChevronDown, Loader2, CheckCircle2,
    XCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OperasionalPage({ operasionals = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [showSatuanMenu, setShowSatuanMenu] = useState(false);
    const [customSatuan, setCustomSatuan] = useState('');
    const satuanRef = useRef(null);
    const [notification, setNotification] = useState(null);

    const daftarSatuan = ['BULAN', 'HARI', 'MINGGU', 'TAHUN', 'KALI', 'ORANG', 'UNIT', 'PAKET', 'LITER', 'KWH'];

    // STATE FORM INERTIA - Pastikan nama field sama persis dengan database
    const { data, setData, post, put, delete: destroy, reset, clearErrors, processing, errors } = useForm({
        kode_transaksi: '',
        nama_transaksi: '',
        satuan: '',
        pagu_awal: '',
        jumlah_bayar: ''
    });

    const stats = useMemo(() => {
        return {
            total_transaksi: operasionals.length,
            total_pagu: operasionals.reduce((sum, item) => sum + Number(item.pagu_awal || 0), 0),
            total_bayar: operasionals.reduce((sum, item) => sum + Number(item.jumlah_bayar || 0), 0)
        };
    }, [operasionals]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (satuanRef.current && !satuanRef.current.contains(event.target)) {
                setShowSatuanMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const showToast = (message, type) => {
        setNotification({ message, type });
        if (type !== 'loading') setTimeout(() => setNotification(null), 3000);
    };

    const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
    const formatRibuan = (val) => val ? new Intl.NumberFormat('id-ID').format(val) : '';
    
    const handleCurrencyChange = (field, value) => {
        const rawValue = value.replace(/\D/g, ''); 
        setData(field, rawValue);
    };

    const filteredData = useMemo(() => {
        if (!searchQuery) return operasionals;
        const lowerQuery = searchQuery.toLowerCase();
        return operasionals.filter(item =>
            (item.nama_transaksi || '').toLowerCase().includes(lowerQuery) ||
            (item.kode_transaksi || '').toLowerCase().includes(lowerQuery)
        );
    }, [operasionals, searchQuery]);

    const openModal = (item = null) => {
        clearErrors();
        setShowSatuanMenu(false);
        setCustomSatuan('');

        if (item) {
            setEditingItem(item);
            setData({
                kode_transaksi: item.kode_transaksi || '',
                nama_transaksi: item.nama_transaksi || '',
                satuan: item.satuan || '-',
                pagu_awal: item.pagu_awal || '',
                jumlah_bayar: item.jumlah_bayar || ''
            });
        } else {
            setEditingItem(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validasi ekstra di sisi Frontend agar lebih aman
        if (!data.nama_transaksi) return showToast('Nama Transaksi wajib diisi!', 'error');
        if (!data.pagu_awal) return showToast('Pagu Awal wajib diisi!', 'error');
        if (!data.satuan) return showToast('Satuan wajib dipilih!', 'error');

        showToast('Menyimpan...', 'loading');

        const options = {
            onSuccess: () => { 
                setIsModalOpen(false); 
                showToast(editingItem ? 'Data diperbarui!' : 'Data ditambahkan!', 'success'); 
                reset(); 
            },
            onError: (err) => {
                showToast('Gagal menyimpan, periksa inputan Anda!', 'error');
            }
        };

        if (editingItem) {
            put(`/master/operasional/${editingItem.id}`, options);
        } else {
            post('/master/operasional', options);
        }
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        showToast('Menghapus...', 'loading');
        destroy(`/master/operasional/${itemToDelete.id}`, {
            onSuccess: () => {
                showToast('Data dihapus!', 'success');
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            }
        });
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Master Operasional</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola data kategori biaya operasional dan insentif.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text" placeholder="Cari kode atau nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold outline-none w-full lg:w-72 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-md shrink-0"
                    >
                        <Plus size={18} /> Tambah
                    </button>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-5 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Kategori</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.total_transaksi}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-5 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Pagu Awal</p>
                        <h3 className="text-xl font-black text-slate-800">{formatRp(stats.total_pagu)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-5 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Realisasi</p>
                        <h3 className="text-xl font-black text-slate-800">{formatRp(stats.total_bayar)}</h3>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-8 py-5 w-16">No</th>
                                <th className="px-6 py-5">Kode Transaksi</th>
                                <th className="px-6 py-5">Deskripsi Biaya</th>
                                <th className="px-6 py-5 text-center">Satuan</th>
                                <th className="px-6 py-5 text-right">Pagu Awal</th>
                                <th className="px-6 py-5 text-right">Jml Bayar</th>
                                <th className="px-8 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center text-slate-400">
                                        <Database className="mx-auto h-10 w-10 opacity-20 mb-3" />
                                        <p className="font-bold text-base">Tidak ada data operasional ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5 font-bold text-slate-400">{index + 1}</td>
                                        <td className="px-6 py-5 font-black text-blue-600">#{item.kode_transaksi}</td>
                                        <td className="px-6 py-5 font-bold text-slate-800">{item.nama_transaksi}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">{item.satuan}</span>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-700 text-right">{formatRp(item.pagu_awal)}</td>
                                        <td className="px-6 py-5 font-black text-slate-800 text-right bg-slate-50/50">{formatRp(item.jumlah_bayar)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(item)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={15} /></button>
                                                <button onClick={() => { setItemToDelete(item); setIsDeleteModalOpen(true); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM (TUNGGAL - Sudah Bebas Duplikat) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">
                                        {editingItem ? 'Edit Operasional' : 'Input Biaya Baru'}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Lengkapi informasi di bawah ini.</p>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Kode Transaksi</label>
                                        <input
                                            type="text" placeholder="Kosongkan = Auto" value={data.kode_transaksi} onChange={e => setData('kode_transaksi', e.target.value)}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 font-bold text-sm transition-all ${errors.kode_transaksi ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'}`}
                                        />
                                        {errors.kode_transaksi && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.kode_transaksi}</span>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nama Transaksi <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text" placeholder="Contoh: Listrik Bulanan" value={data.nama_transaksi} onChange={e => setData('nama_transaksi', e.target.value)}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 font-bold text-sm transition-all ${errors.nama_transaksi ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'}`} 
                                            required
                                        />
                                        {errors.nama_transaksi && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.nama_transaksi}</span>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Pagu Awal <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
                                            <input
                                                type="text" placeholder="0" 
                                                value={formatRibuan(data.pagu_awal)} 
                                                onChange={e => handleCurrencyChange('pagu_awal', e.target.value)} 
                                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 font-black text-slate-700 text-sm transition-all ${errors.pagu_awal ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'}`} 
                                                required
                                            />
                                        </div>
                                        {errors.pagu_awal && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.pagu_awal}</span>}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Jumlah Bayar</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
                                            <input
                                                type="text" placeholder="0" 
                                                value={formatRibuan(data.jumlah_bayar)} 
                                                onChange={e => handleCurrencyChange('jumlah_bayar', e.target.value)} 
                                                className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 font-black text-slate-700 text-sm transition-all ${errors.jumlah_bayar ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'}`}
                                            />
                                        </div>
                                        {errors.jumlah_bayar && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.jumlah_bayar}</span>}
                                    </div>
                                </div>

                                <div className="relative" ref={satuanRef}>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Satuan (Frekuensi / Acuan) <span className="text-rose-500">*</span></label>
                                    <div
                                        onClick={() => setShowSatuanMenu(!showSatuanMenu)}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl flex justify-between items-center cursor-pointer transition-all text-sm ${showSatuanMenu ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'}`}
                                    >
                                        <span className={data.satuan ? 'font-bold text-blue-700' : 'text-slate-400 font-bold'}>{data.satuan || 'Pilih satuan...'}</span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${showSatuanMenu ? 'rotate-180' : ''}`} />
                                    </div>
                                    {errors.satuan && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.satuan}</span>}

                                    <AnimatePresence>
                                        {showSatuanMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                                className="absolute z-50 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-4"
                                            >
                                                <div className="grid grid-cols-4 gap-1.5 mb-3">
                                                    {daftarSatuan.map(s => (
                                                        <button
                                                            type="button" key={s} onClick={() => { setData('satuan', s); setShowSatuanMenu(false); }}
                                                            className={`py-2 border rounded-lg text-[11px] font-black transition-colors ${data.satuan === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="border-t border-slate-100 pt-3">
                                                    <p className="text-[10px] font-black text-slate-400 mb-2 tracking-widest uppercase">Lainnya</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text" placeholder="Ketik satuan..." value={customSatuan} onChange={e => setCustomSatuan(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && customSatuan.trim()) {
                                                                    e.preventDefault();
                                                                    setData('satuan', customSatuan.toUpperCase()); setShowSatuanMenu(false); setCustomSatuan('');
                                                                }
                                                            }}
                                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (customSatuan.trim()) { setData('satuan', customSatuan.toUpperCase()); setShowSatuanMenu(false); setCustomSatuan(''); }
                                                            }}
                                                            className="bg-slate-900 text-white px-4 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                                                        >
                                                            OK
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
                                    <button type="submit" disabled={processing} className="w-2/3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-70 flex items-center justify-center gap-2">
                                        {processing ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : 'Simpan Data'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL HAPUS (TUNGGAL) */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2">Yakin Hapus?</h3>
                            <p className="text-sm text-slate-500 mb-7">Data <span className="font-bold text-slate-700">"{itemToDelete?.nama_transaksi}"</span> akan dihapus permanen.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
                                <button onClick={handleDelete} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-colors">Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}