import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, Plus, Edit2, Trash2, X, Search, 
    Building2, Loader2, CheckCircle2, XCircle, AlertTriangle 
} from 'lucide-react';

export default function Supplier({ suppliers, filters, stats = { total_supplier: 0 } }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [notification, setNotification] = useState(null);

    // Form Handle via Inertia
    const { data, setData, post, put, delete: destroy, reset, clearErrors, processing, errors } = useForm({
        nama_perusahaan: '',
        nama: '',
        kontak: '',
        alamat: ''
    });

    // Pencarian Server-Side Otomatis (Debounced)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                router.get('/master/supplier', { search: searchQuery }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true
                });
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, filters?.search]);

    // Toast Notification Custom
    const showToast = (message, type) => {
        setNotification({ message, type });
        if (type !== 'loading') setTimeout(() => setNotification(null), 3000);
    };

    const openModal = (item = null) => {
        clearErrors();
        if (item) {
            setEditingItem(item);
            setData({
                nama_perusahaan: item.nama_perusahaan || '',
                nama: item.nama || '',
                kontak: item.kontak || '',
                alamat: item.alamat || ''
            });
        } else {
            setEditingItem(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!data.nama_perusahaan) return showToast('Nama Perusahaan wajib diisi!', 'error');
        showToast('Menyimpan...', 'loading');

        const options = {
            onSuccess: () => { 
                setIsModalOpen(false); 
                showToast(editingItem ? 'Supplier diperbarui!' : 'Supplier ditambahkan!', 'success'); 
                reset(); 
            },
            onError: () => showToast('Gagal menyimpan, periksa kembali inputan Anda.', 'error')
        };

        if (editingItem) {
            put(`/master/supplier/${editingItem.id}`, options);
        } else {
            post('/master/supplier', options);
        }
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        showToast('Menghapus...', 'loading');
        destroy(`/master/supplier/${itemToDelete.id}`, {
            onSuccess: () => {
                showToast('Supplier berhasil dihapus!', 'success');
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            }
        });
    };

    // Fallback jika controller belum menggunakan paginate()
    const dataList = suppliers?.data || (Array.isArray(suppliers) ? suppliers : []);

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

            {/* HEADER & SEARCH BAR */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Master Supplier</h2>
                    <p className="text-slate-500 text-sm mt-1">Kelola database mitra, pemasok, dan supplier untuk kebutuhan PO.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text" placeholder="Cari nama perusahaan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-5 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total Mitra Aktif</p>
                        <h3 className="text-2xl font-black text-slate-800">{stats.total_supplier || dataList.length}</h3>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-8 py-5 w-16 text-center">No</th>
                                <th className="px-6 py-5">Nama Perusahaan / Toko</th>
                                <th className="px-6 py-5">PIC / Penanggung Jawab</th>
                                <th className="px-6 py-5">Kontak</th>
                                <th className="px-6 py-5">Alamat Lengkap</th>
                                <th className="px-8 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {dataList.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400">
                                        <Truck className="mx-auto h-12 w-12 opacity-20 mb-3" />
                                        <p className="font-bold text-base">Belum ada data supplier</p>
                                    </td>
                                </tr>
                            ) : (
                                dataList.map((sup, index) => (
                                    <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5 text-center font-bold text-slate-400">
                                            {suppliers?.from ? suppliers.from + index : index + 1}
                                        </td>
                                        <td className="px-6 py-5 font-black text-slate-800">{sup.nama_perusahaan}</td>
                                        <td className="px-6 py-5 font-bold text-slate-600">{sup.nama || '-'}</td>
                                        <td className="px-6 py-5 font-bold text-blue-600">{sup.kontak || '-'}</td>
                                        <td className="px-6 py-5 text-slate-500 font-medium max-w-[200px] truncate" title={sup.alamat}>{sup.alamat || '-'}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openModal(sup)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 size={15} /></button>
                                                <button onClick={() => { setItemToDelete(sup); setIsDeleteModalOpen(true); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {suppliers && suppliers.links && dataList.length > 0 && (
                    <div className="flex items-center justify-between px-8 py-4 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Menampilkan {suppliers.from} - {suppliers.to} dari {suppliers.total}
                        </span>
                        <div className="flex gap-1">
                            {suppliers.links.map((link, k) => (
                                <button
                                    key={k}
                                    onClick={() => link.url && router.get(link.url, { search: searchQuery }, { preserveScroll: true })}
                                    disabled={!link.url || link.active}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        link.active ? 'bg-blue-600 text-white shadow-md' : !link.url ? 'text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL FORM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <Truck className="text-blue-500" /> {editingItem ? 'Edit Supplier' : 'Tambah Supplier'}
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">Lengkapi informasi mitra/pemasok di bawah ini.</p>
                                </div>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nama Perusahaan / Toko <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text" placeholder="Contoh: PT. Sumber Makmur" value={data.nama_perusahaan} onChange={e => setData('nama_perusahaan', e.target.value)}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 font-bold text-sm transition-all ${errors.nama_perusahaan ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/10'}`}
                                        required
                                    />
                                    {errors.nama_perusahaan && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.nama_perusahaan}</span>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nama PIC</label>
                                        <input
                                            type="text" placeholder="Nama kontak person..." value={data.nama} onChange={e => setData('nama', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nomor Kontak</label>
                                        <input
                                            type="text" placeholder="Contoh: 0812-..." value={data.kontak} onChange={e => setData('kontak', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Alamat Lengkap</label>
                                    <textarea
                                        rows="3" placeholder="Alamat lengkap pabrik / toko..." value={data.alamat} onChange={e => setData('alamat', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-sm transition-all resize-none"
                                    />
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

            {/* MODAL HAPUS */}
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
                            <p className="text-sm text-slate-500 mb-7">Supplier <span className="font-bold text-slate-700">"{itemToDelete?.nama_perusahaan}"</span> akan dihapus permanen.</p>
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