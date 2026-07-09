import React, { useState, useMemo } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Edit2, Trash2, X, Shield, Search, Users, Wifi } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../layouts/AdminLayout';

const UserIndex = ({ users = [], stats }) => {
    const { auth } = usePage().props;
    const currentUser = auth?.user || {};
    const isSuperAdmin = currentUser.role === 'superadmin';

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '', email: '', password: '', role: 'admin'
    });

    const isOnline = (lastSeen) => {
        if (!lastSeen) return false;
        const diffInMinutes = (new Date() - new Date(lastSeen)) / 1000 / 60;
        return diffInMinutes <= 5;
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const openModal = (user = null) => {
        clearErrors();
        if (user) {
            setEditingUser(user);
            setData({ name: user.name, email: user.email, role: user.role, password: '' });
        } else {
            setEditingUser(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => reset(), 200);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeModal();
                toast.success(editingUser ? 'Profil berhasil diperbarui!' : 'Admin baru ditambahkan!');
            },
            onError: (err) => {
                if (err.message) toast.error(err.message);
                else toast.error('Terdapat kesalahan pada input form Anda.');
            }
        };
        editingUser ? put(`/user/${editingUser.id}`, options) : post('/user', options);
    };

    const confirmDelete = (user) => { 
        if (!isSuperAdmin) return toast.error('Hanya Super Admin yang berhak menghapus data!');
        setUserToDelete(user); 
        setIsDeleteModalOpen(true); 
    };

    const handleDelete = () => {
        destroy(`/user/${userToDelete.id}`, {
            onSuccess: () => { setIsDeleteModalOpen(false); toast.success('User dihapus!'); },
            onError: (err) => { setIsDeleteModalOpen(false); toast.error(err.message || 'Gagal menghapus user'); }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
            <Toaster position="top-right" />

            {/* HERO BANNER (Profil Sesi Aktif) */}
            <div className="bg-[#1a2332] rounded-[2rem] p-8 shadow-lg relative overflow-hidden flex items-center justify-between">
                <Shield className="absolute -right-6 -bottom-6 text-white/5 w-64 h-64 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-slate-700 border-4 border-slate-600 flex items-center justify-center text-white text-3xl font-black uppercase shrink-0">
                        {currentUser.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-black text-white tracking-tight">{currentUser.name}</h2>
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${
                                isSuperAdmin ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                            }`}>
                                {currentUser.role}
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-3">{currentUser.email}</p>
                        <span className="flex items-center gap-1.5 bg-slate-800/80 w-max px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 border border-slate-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Your Session
                        </span>
                    </div>
                </div>
            </div>

            {/* HEADER & SEARCH */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Akses Sistem</h3>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" placeholder="Cari nama admin..." 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-10 pr-4 text-sm font-bold outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Akun</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_akun || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-100"><Users size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Super Admin</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_superadmin || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100"><Shield size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Sedang Online</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_online || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100"><Wifi size={20} /></div>
                </div>
            </div>

            {/* TABLE USERS */}
            <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden relative">
                {isSuperAdmin && (
                    <div className="p-4 border-b border-slate-100 flex justify-end bg-slate-50/50">
                        <button onClick={() => openModal()} className="bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl hover:bg-slate-900 transition-colors shadow-md flex items-center gap-2">
                            <UserPlus size={16} /> Tambah Admin Baru
                        </button>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="py-5 px-6 w-16 text-center">No</th>
                                <th className="py-5 px-6">Informasi Pengguna</th>
                                <th className="py-5 px-6">Hak Akses (Role)</th>
                                <th className="py-5 px-6">Tanggal Dibuat</th>
                                <th className="py-5 px-6">Status Aktivitas</th>
                                <th className="py-5 px-6 text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <p className="font-bold">Tidak ada pengguna ditemukan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const online = isOnline(u.last_seen);
                                    const isMe = currentUser.id === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-5 px-6 text-center font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm uppercase shrink-0">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 flex items-center gap-2">
                                                            {u.name} {isMe && <span className="bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded">ANDA</span>}
                                                        </p>
                                                        <p className="text-xs font-medium text-slate-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                                    u.role === 'superadmin' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'
                                                }`}>
                                                    {u.role === 'superadmin' ? '👑 Super Admin' : '👤 Admin'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-xs font-bold text-slate-500">{formatDate(u.created_at)}</td>
                                            <td className="py-5 px-6">
                                                {online ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-black">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                                                    </span>
                                                ) : u.last_seen ? (
                                                    <span className="text-slate-400 text-xs font-medium italic">Terakhir: {formatDate(u.last_seen)}</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium italic">Belum pernah login</span>
                                                )}
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className="flex justify-center gap-2">
                                                    {/* Edit button: Muncul jika User ini adalah SuperAdmin ATAU baris ini adalah miliknya sendiri */}
                                                    {(isSuperAdmin || isMe) && (
                                                        <button onClick={() => openModal(u)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Profil">
                                                            <Edit2 size={16}/>
                                                        </button>
                                                    )}
                                                    
                                                    {/* Trash button: Muncul HANYA jika User ini SuperAdmin DAN bukan baris miliknya sendiri */}
                                                    {(isSuperAdmin && !isMe) && (
                                                        <button onClick={() => confirmDelete(u)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus Akun">
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    )}
                                                    
                                                    {/* Teks bantu untuk Admin biasa saat melihat profil admin lain */}
                                                    {(!isSuperAdmin && !isMe) && (
                                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest cursor-not-allowed">Restricted</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL FORM TAMBAH/EDIT */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
                            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-black text-lg tracking-wide">{editingUser ? 'Edit Profil Admin' : 'Tambah Admin Baru'}</h3>
                                <button onClick={closeModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={18}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nama Lengkap</label>
                                    <input type="text" required value={data.name} onChange={e => setData('name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" placeholder="Nama admin..." />
                                    {errors.name && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.name}</span>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Email Login</label>
                                    <input type="email" required value={data.email} onChange={e => setData('email', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" placeholder="email@contoh.com" />
                                    {errors.email && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.email}</span>}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Kata Sandi {editingUser && '(Kosongkan jika tidak diubah)'}</label>
                                    <input type="password" required={!editingUser} value={data.password} onChange={e => setData('password', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" placeholder="Minimal 6 karakter" />
                                    {errors.password && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.password}</span>}
                                </div>

                                {/* Opsi Role hanya ditampilkan untuk Super Admin */}
                                {isSuperAdmin && (
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Hak Akses</label>
                                        <select required value={data.role} onChange={e => setData('role', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all appearance-none">
                                            <option value="admin">Admin Biasa</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                        {errors.role && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.role}</span>}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={closeModal} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                                    <button type="submit" disabled={processing} className="px-6 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors shadow-md disabled:opacity-50">
                                        {processing ? 'Menyimpan...' : 'Simpan Akun'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL HAPUS */}
            <AnimatePresence>
                {isDeleteModalOpen && isSuperAdmin && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl">
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5"><Trash2 size={32} /></div>
                            <h3 className="text-lg font-black text-slate-800 mb-2">Hapus Akses Pengguna?</h3>
                            <p className="text-sm text-slate-500 mb-7">Akun <span className="font-bold text-slate-700">"{userToDelete?.name}"</span> akan dihapus permanen dan tidak dapat login lagi.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                                <button onClick={handleDelete} className="flex-1 py-3.5 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors">Ya, Hapus</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

UserIndex.layout = page => <AdminLayout children={page} />;
export default UserIndex;