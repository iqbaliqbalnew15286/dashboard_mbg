import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Edit2, Trash2, X, AlertTriangle, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const User = ({ users = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '', email: '', password: '', role: 'kasir'
    });

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
                toast.success(editingUser ? 'User diperbarui!' : 'User ditambahkan!');
            },
        };
        editingUser ? put(`/user/${editingUser.id}`, options) : post('/user', options);
    };

    const confirmDelete = (user) => { setUserToDelete(user); setIsDeleteModalOpen(true); };

    const handleDelete = () => {
        destroy(`/user/${userToDelete.id}`, {
            onSuccess: () => { setIsDeleteModalOpen(false); toast.success('User dihapus!'); }
        });
    };

    const formatLastSeen = (dateString) => {
        if (!dateString) return <span className="text-slate-400 italic">Belum pernah login</span>;
        return new Date(dateString).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Toaster position="top-right" />
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Akses</h3>
                        <p className="text-sm text-slate-500 font-medium">Kelola akun admin dan kasir.</p>
                    </div>
                    <button onClick={() => openModal()} className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-blue-700 text-sm flex items-center gap-2">
                        <UserPlus size={16} /> Tambah User
                    </button>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="py-4 px-6">Pengguna</th>
                                <th className="py-4 px-6">Role</th>
                                <th className="py-4 px-6">Terakhir Aktif</th>
                                <th className="py-4 px-6 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-6 font-bold text-slate-800">{u.name} <br/> <span className="text-xs font-normal text-slate-400">{u.email}</span></td>
                                    <td className="py-4 px-6"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{u.role}</span></td>
                                    <td className="py-4 px-6 text-xs text-slate-500 flex items-center gap-2"><Clock size={12}/>{formatLastSeen(u.last_seen)}</td>
                                    <td className="py-4 px-6 text-center">
                                        <button onClick={() => openModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                                        <button onClick={() => confirmDelete(u)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Modal & Delete logic di sini... (sesuaikan dengan kode Anda sebelumnya) */}
        </>
    );
};

User.layout = (page) => <AdminLayout children={page} />;
export default User;