import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Edit2, Trash2, X, Shield, Search, Users, Wifi, Clock, ShieldCheck, AlertTriangle, Eye, EyeOff, Camera, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AdminLayout from '../layouts/AdminLayout';

const UserIndex = ({ users = [], stats }) => {
    const { auth } = usePage().props;
    const currentUser = auth?.user || {};
    
    // Pengecekan role yang kebal terhadap huruf besar/kecil dari database
    const isSuperAdmin = String(currentUser.role).toLowerCase() === 'superadmin';

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    
    // State untuk fitur lihat/sembunyikan password
    const [showPassword, setShowPassword] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);

    // Inertia Form Setup
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '', email: '', password: '', role: 'admin', avatar: null
    });

    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // FITUR POLLING (REAL-TIME TANPA REFRESH HALAMAN)
    useEffect(() => {
        const pollInterval = setInterval(() => {
            router.reload({
                only: ['users', 'stats'], 
                preserveState: true,      
                preserveScroll: true,     
            });
        }, 10000);
        return () => clearInterval(pollInterval);
    }, []);

    const isOnline = (lastSeen) => {
        if (!lastSeen) return false;
        const diffInMinutes = (new Date() - new Date(lastSeen)) / 1000 / 60;
        return diffInMinutes <= 5;
    };

    const formatLastLogin = (dateString) => {
        if (!dateString) return <span className="text-[11px] font-bold text-slate-400 italic bg-slate-100 px-3 py-1 rounded-md">Belum pernah login</span>;
        
        const date = new Date(dateString);
        const tgl = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const waktu = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.'); 
        
        return (
            <div className="flex items-start gap-2 text-slate-500">
                <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-slate-700">{tgl}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">PUKUL {waktu} WIB</p>
                </div>
            </div>
        );
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
        setShowPassword(false);
        setPreviewUrl(null);
        
        if (user) {
            setEditingUser(user);
            setData({ name: user.name, email: user.email, role: user.role, password: '', avatar: null });
            if (user.avatar) setPreviewUrl(`/${user.avatar}`);
        } else {
            setEditingUser(null);
            setData({ name: '', email: '', password: '', role: 'admin', avatar: null });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            reset();
            setPreviewUrl(null);
            setShowPassword(false);
        }, 200);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('avatar', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                closeModal();
                toast.success(editingUser ? 'Profil pengguna berhasil diperbarui!' : 'Admin baru berhasil ditambahkan!');
            },
            onError: (err) => {
                if (err.message) toast.error(err.message);
                else toast.error('Gagal menyimpan, periksa kembali form input Anda.');
            }
        };

        if (editingUser) {
            post(`/user/${editingUser.id}?_method=PUT`, options);
        } else {
            post('/user', options);
        }
    };

    const confirmDelete = (user) => { 
        if (!isSuperAdmin) return toast.error('Hanya Super Admin yang berhak menghapus data!');
        setUserToDelete(user); 
        setIsDeleteModalOpen(true); 
    };

    const handleDelete = () => {
        destroy(`/user/${userToDelete.id}`, {
            onSuccess: () => { setIsDeleteModalOpen(false); toast.success('Akses pengguna berhasil dicabut!'); },
            onError: (err) => { setIsDeleteModalOpen(false); toast.error(err.message || 'Gagal menghapus pengguna'); }
        });
    };

    return (
        <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6">
            <Toaster position="top-right" />

            {/* HERO BANNER - PROFIL SESI AKTIF */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5 w-full">
                    {/* Lingkaran Avatar Current User */}
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black uppercase shrink-0 shadow-lg shadow-blue-600/20 overflow-hidden border border-slate-100">
                        {currentUser.avatar ? (
                            <img src={`/${currentUser.avatar}`} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                            currentUser.name?.charAt(0) || 'U'
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Sesi Anda Saat Ini
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                isSuperAdmin ? 'bg-blue-50/50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                                {isSuperAdmin ? <ShieldCheck size={14}/> : <Shield size={14}/>} 
                                Login Sebagai {currentUser.role}
                            </span>
                        </div>
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="shrink-0 w-full md:w-auto">
                        <button onClick={() => openModal()} className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-blue-600/30 flex items-center justify-center gap-2">
                            <UserPlus size={16} /> Buat Akun Baru
                        </button>
                    </div>
                )}
            </div>

            {/* HEADER & SEARCH BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1 mt-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Akses Sistem</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1">Kelola daftar administrator dan pantau aktivitas login.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" placeholder="Cari nama atau email admin..." 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none transition-all shadow-sm text-slate-700"
                    />
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Pengguna</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_akun || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100"><Users size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Super Admin</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_superadmin || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100"><Shield size={20} /></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Sedang Online</span>
                        <h3 className="text-3xl font-black text-slate-800 mt-1">{stats?.total_online || 0}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100"><Wifi size={20} /></div>
                </div>
            </div>

            {/* TABLE USERS */}
            <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden relative mt-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="py-5 px-6 w-16 text-center">No</th>
                                <th className="py-5 px-6">Informasi Pengguna</th>
                                <th className="py-5 px-6">Hak Akses</th>
                                <th className="py-5 px-6">Aktivitas Terakhir</th>
                                <th className="py-5 px-8 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users size={32} className="mb-3 text-slate-300" />
                                            <p className="font-black text-base text-slate-600">Tidak ada pengguna ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const online = isOnline(u.last_seen);
                                    const isMe = currentUser.id === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group align-middle">
                                            <td className="py-5 px-6 text-center font-black text-slate-400">{idx + 1}</td>
                                            
                                            {/* Info Pengguna */}
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div 
                                                        onClick={() => u.avatar && setViewingImage(`/${u.avatar}`)}
                                                        className={`w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm uppercase shrink-0 border border-slate-200 overflow-hidden ${u.avatar ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                                    >
                                                        {u.avatar ? (
                                                            <img src={`/${u.avatar}`} alt={u.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 flex items-center gap-2 text-[14px]">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-[12px] font-medium text-slate-500 mt-0.5">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-5 px-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                                                    String(u.role).toLowerCase() === 'superadmin' ? 'bg-amber-50/50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                                                }`}>
                                                    {String(u.role).toLowerCase() === 'superadmin' ? <ShieldCheck size={14}/> : <Shield size={14}/>} 
                                                    {u.role}
                                                </span>
                                            </td>

                                            <td className="py-5 px-6">
                                                {online ? (
                                                    <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sedang Online</span>
                                                    </div>
                                                ) : (
                                                    formatLastLogin(u.last_seen)
                                                )}
                                            </td>

                                            <td className="py-5 px-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(isSuperAdmin || isMe) && (
                                                        <button onClick={() => openModal(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Pengguna">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {(isSuperAdmin && !isMe) && (
                                                        <button onClick={() => confirmDelete(u)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Hapus Pengguna">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}

                                                    {(!isSuperAdmin && !isMe) && (
                                                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest cursor-not-allowed select-none">
                                                            Terkunci
                                                        </span>
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

            {/* MODAL FORM TAMBAH/EDIT (DESAIN UI/UX TERBARU) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col">
                            
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                        {editingUser ? <Edit2 size={20} /> : <UserPlus size={20} />}
                                    </div>
                                    <h3 className="font-black text-xl text-slate-800 tracking-tight">{editingUser ? 'Edit Admin' : 'Buat Admin Baru'}</h3>
                                </div>
                                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto" encType="multipart/form-data">
                                
                                {/* AVATAR UPLOAD */}
                                <div className="flex flex-col items-center justify-center mb-2">
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors group overflow-hidden shadow-sm"
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Foto Profil (Opsional)</p>
                                    {errors.avatar && <span className="text-rose-500 text-xs font-bold mt-1 block">{errors.avatar}</span>}
                                </div>

                                <div>
                                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Nama Lengkap</label>
                                    <input type="text" required autoComplete="off" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-semibold" placeholder="Masukkan nama..." />
                                    {errors.name && <span className="text-rose-500 text-xs font-bold mt-1.5 ml-1 block">{errors.name}</span>}
                                </div>
                                
                                <div>
                                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Email Address</label>
                                    <input type="email" required autoComplete="new-email" name="new_email_field" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-semibold" placeholder="email@contoh.com" />
                                    {errors.email && <span className="text-rose-500 text-xs font-bold mt-1.5 ml-1 block">{errors.email}</span>}
                                </div>
                                
                                <div>
                                    <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest flex items-center gap-1">
                                        Kata Sandi {editingUser && <span className="text-slate-400 font-bold lowercase tracking-normal">(Opsional)</span>}
                                    </label>
                                    <div className="relative text-slate-400 focus-within:text-blue-600 transition-colors">
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            required={!editingUser} 
                                            autoComplete="new-password"
                                            name="new_password_field"
                                            value={data.password} 
                                            onChange={e => setData('password', e.target.value)} 
                                            className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 pr-12 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-semibold" 
                                            placeholder="••••••••" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 focus:text-blue-600 transition-colors outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <span className="text-rose-500 text-xs font-bold mt-1.5 ml-1 block">{errors.password}</span>}
                                </div>

                                {isSuperAdmin && (
                                    <div>
                                        <label className="text-[11px] font-black uppercase text-slate-500 block mb-2 tracking-widest">Level Hak Akses</label>
                                        <div className="relative">
                                            <select required value={data.role} onChange={e => setData('role', e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer">
                                                <option value="admin">Administrator Biasa (Default)</option>
                                                <option value="superadmin">Super Admin (Akses Penuh)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <Shield size={16} />
                                            </div>
                                        </div>
                                        {errors.role && <span className="text-rose-500 text-xs font-bold mt-1.5 ml-1 block">{errors.role}</span>}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 mt-2">
                                    <button type="button" onClick={closeModal} className="px-6 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors w-full sm:w-auto">Batal</button>
                                    <button type="submit" disabled={processing} className="px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-600/30 disabled:opacity-70 disabled:hover:shadow-none w-full sm:w-auto flex items-center gap-2 justify-center">
                                        {processing && <Loader2 size={16} className="animate-spin" />} 
                                        {processing ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL KONFIRMASI HAPUS */}
            <AnimatePresence>
                {isDeleteModalOpen && isSuperAdmin && (
                    <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-sm text-center shadow-2xl border border-slate-200 relative">
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-rose-100">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Cabut Akses Admin?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                Akun <span className="font-black text-slate-800">"{userToDelete?.name}"</span> akan dihapus permanen. Pengguna ini tidak akan bisa login ke sistem lagi.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button type="button" onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                                <button type="button" onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 shadow-md hover:shadow-rose-600/30 transition-all flex justify-center items-center gap-2">
                                    <AlertTriangle size={16} /> Ya, Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL LIHAT FOTO FULL SCREEN */}
            <AnimatePresence>
                {viewingImage && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setViewingImage(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-3xl max-h-[85vh] p-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setViewingImage(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-white text-slate-800 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors shadow-xl z-10">
                                <X size={20} />
                            </button>
                            <img src={viewingImage} alt="Foto Profil" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border-4 border-white/20" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

UserIndex.layout = page => <AdminLayout children={page} />;
export default UserIndex;