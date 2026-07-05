import React, { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Edit, Trash2, X, Database } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Supplier() {
  const { props } = usePage();
  const suppliers = props.suppliers || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [form, setForm] = useState({ id: null, nama_perusahaan: '', nama: '', kontak: '', alamat: '' });
  const [loading, setLoading] = useState(false);

  const openModal = (supplier = null) => {
    if (supplier) {
      setForm(supplier);
      setIsEditMode(true);
    } else {
      setForm({ id: null, nama_perusahaan: '', nama: '', kontak: '', alamat: '' });
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({ id: null, nama_perusahaan: '', nama: '', kontak: '', alamat: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (isEditMode) {
      router.put(`/master/supplier/${form.id}`, form, {
        onSuccess: () => {
          toast.success('Supplier berhasil diperbarui');
          closeModal();
        },
        onError: () => toast.error('Gagal memperbarui data'),
        onFinish: () => setLoading(false),
      });
    } else {
      router.post('/master/supplier', form, {
        onSuccess: () => {
          toast.success('Supplier baru berhasil ditambahkan');
          closeModal();
        },
        onError: () => toast.error('Gagal menambahkan data, periksa kembali form Anda.'),
        onFinish: () => setLoading(false),
      });
    }
  };

  const handleDelete = (id) => {
    if (confirm('Yakin ingin menghapus supplier ini?')) {
      router.delete(`/master/supplier/${id}`, {
        onSuccess: () => toast.success('Supplier berhasil dihapus'),
      });
    }
  };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] space-y-6 pb-10">
      <Toaster position="top-right" />
      
      {/* HEADER BANNER - Sesuai dengan desain image_182d1d.png */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 md:p-10 shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <Database size={32} /> Master Supplier
          </h1>
          <p className="text-blue-100 font-medium mt-2">
            Kelola database mitra, pemasok, dan supplier untuk kebutuhan Purchase Order.
          </p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-md flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 w-16 text-center">No</th>
                <th className="px-6 py-5">Nama Perusahaan / Toko</th>
                <th className="px-6 py-5">PIC / Penanggung Jawab</th>
                <th className="px-6 py-5">Kontak</th>
                <th className="px-6 py-5">Alamat</th>
                <th className="px-6 py-5 w-28 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400">
                    <Truck size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-base">Belum ada data supplier.</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((sup, idx) => (
                  <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                    <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-4 font-black text-slate-800">{sup.nama_perusahaan}</td>
                    <td className="px-6 py-4 text-slate-600">{sup.nama || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-500">{sup.kontak || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={sup.alamat}>{sup.alamat || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openModal(sup)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(sup.id)} className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Truck className="text-blue-500" /> {isEditMode ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </h3>
                <button onClick={closeModal} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={18}/></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nama Perusahaan / Toko <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required 
                    value={form.nama_perusahaan} 
                    onChange={e => setForm({...form, nama_perusahaan: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                    placeholder="Contoh: PT. Sumber Makmur"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">PIC / Penanggung Jawab</label>
                  <input 
                    type="text" 
                    value={form.nama} 
                    onChange={e => setForm({...form, nama: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                    placeholder="Nama kontak person..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nomor Kontak / Telepon</label>
                  <input 
                    type="text" 
                    value={form.kontak} 
                    onChange={e => setForm({...form, kontak: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all" 
                    placeholder="Contoh: 0812-3456-7890"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Alamat Lengkap</label>
                  <textarea 
                    rows="3"
                    value={form.alamat} 
                    onChange={e => setForm({...form, alamat: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 transition-all resize-none" 
                    placeholder="Alamat lengkap toko / pabrik..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={closeModal} className="px-6 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                  <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}