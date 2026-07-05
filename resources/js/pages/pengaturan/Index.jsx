import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    Settings, Printer, Image as ImageIcon, Save, 
    AlertTriangle, Trash2, DatabaseBackup, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function PengaturanIndex({ pengaturan }) {
    const [previewKop, setPreviewKop] = useState(pengaturan?.kop_surat ? `/storage/${pengaturan.kop_surat}` : null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        // File Logo
        kop_surat_file: null,
        
        // Pengawas
        pengawas_jabatan: pengaturan?.pengawas_jabatan || '',
        pengawas_nama: pengaturan?.pengawas_nama || '',
        pengawas_nip: pengaturan?.pengawas_nip || '',
        
        // SPPG
        sppg_jabatan: pengaturan?.sppg_jabatan || '',
        sppg_nama: pengaturan?.sppg_nama || '',
        sppg_nip: pengaturan?.sppg_nip || '',
        
        // Asisten
        asisten_jabatan: pengaturan?.asisten_jabatan || '',
        asisten_nama: pengaturan?.asisten_nama || '',
        asisten_nip: pengaturan?.asisten_nip || '',
        
        // Penerima
        penerima_jabatan: pengaturan?.penerima_jabatan || '',
        penerima_nama: pengaturan?.penerima_nama || '',
        penerima_nip: pengaturan?.penerima_nip || '',
    });

    // Handle Upload Preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('kop_surat_file', file);
            setPreviewKop(URL.createObjectURL(file));
        }
    };

    // Simpan Pengaturan
    const submitPengaturan = (e) => {
        e.preventDefault();
        post('/pengaturan', {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan berhasil disimpan!'),
            onError: () => toast.error('Gagal menyimpan pengaturan.'),
        });
    };

    // Reset Data Transaksi
    const { post: postReset, processing: resetProcessing } = useForm();
    const handleResetData = () => {
        postReset('/pengaturan/reset-uji', {
            onSuccess: () => {
                toast.success('Data transaksi berhasil direset ke 0!');
                setIsResetModalOpen(false);
            }
        });
    };

    const PejabatCard = ({ title, fieldPrefix }) => (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-blue-300 transition-colors">
            <h6 className="text-center font-black text-[11px] text-slate-500 uppercase tracking-widest mb-4">
                Tanda Tangan {title}
            </h6>
            <div className="space-y-3">
                <input 
                    type="text" placeholder="Jabatan..." 
                    value={data[`${fieldPrefix}_jabatan`]} 
                    onChange={e => setData(`${fieldPrefix}_jabatan`, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" 
                />
                <input 
                    type="text" placeholder="Nama Lengkap" 
                    value={data[`${fieldPrefix}_nama`]} 
                    onChange={e => setData(`${fieldPrefix}_nama`, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" 
                />
                <input 
                    type="text" placeholder="NIP / -" 
                    value={data[`${fieldPrefix}_nip`]} 
                    onChange={e => setData(`${fieldPrefix}_nip`, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" 
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
            <Toaster position="top-right" />

            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Settings size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-slate-500 text-sm font-medium">Konfigurasi cetakan laporan dan manajemen data utama.</p>
                </div>
            </div>

            {/* FORM FORMAT CETAKAN */}
            <form onSubmit={submitPengaturan} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Printer className="text-blue-500" size={20} />
                    <h2 className="font-black text-slate-800 text-lg">Format Cetakan & Penandatangan</h2>
                </div>
                
                <div className="p-8 space-y-8">
                    {/* Upload Kop Surat */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">Kop Surat / Logo Organisasi</label>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-1/2">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon className="text-slate-400 mb-2" size={28} />
                                        <p className="text-sm font-bold text-slate-600">Klik untuk upload logo (.JPG / .PNG)</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} />
                                </label>
                                <p className="text-xs font-medium text-slate-500 mt-3 flex items-start gap-1">
                                    <span className="text-blue-500 font-black">Info:</span> Logo akan otomatis disesuaikan untuk dokumen PDF dan Cetak.
                                </p>
                            </div>
                            
                            <div className="w-full md:w-1/2">
                                {previewKop ? (
                                    <div className="p-4 border border-slate-200 rounded-2xl bg-white text-center shadow-sm">
                                        <span className="d-block text-slate-400 text-[10px] uppercase font-black tracking-widest mb-3 block">Preview Cetakan Logo</span>
                                        <img src={previewKop} alt="Preview Kop" className="mx-auto max-h-24 object-contain rounded-lg" />
                                    </div>
                                ) : (
                                    <div className="h-32 border border-slate-100 bg-slate-50/50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-sm">
                                        Belum ada logo tersimpan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Pejabat Penandatangan */}
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-4 tracking-widest">Pejabat Penandatangan Laporan / Nota</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <PejabatCard title="Pengawas Keuangan" fieldPrefix="pengawas" />
                            <PejabatCard title="Kepala SPPG" fieldPrefix="sppg" />
                            <PejabatCard title="Asisten Lapangan" fieldPrefix="asisten" />
                            <PejabatCard title="Penerima Barang" fieldPrefix="penerima" />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button type="submit" disabled={processing} className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-70 shadow-lg">
                        {processing ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />} 
                        {processing ? 'Menyimpan...' : 'Simpan Format Cetakan'}
                    </button>
                </div>
            </form>

            {/* ZONA BERBAHAYA (DATABASE) */}
            <div className="bg-rose-50 rounded-[2rem] border-2 border-rose-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-rose-200 bg-rose-500 flex items-center gap-3 text-white">
                    <AlertTriangle size={20} />
                    <h2 className="font-black text-lg">Manajemen Database (Zona Berbahaya)</h2>
                </div>
                <div className="p-8">
                    <p className="text-rose-700 font-bold mb-6 text-sm">
                        Peringatan: Tindakan di bawah ini akan menghapus data transaksi dari sistem secara permanen. Pastikan Anda tahu apa yang Anda lakukan.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-center flex flex-col justify-between">
                            <div>
                                <Trash2 className="mx-auto text-rose-300 mb-4" size={40} />
                                <h5 className="font-black text-rose-600 mb-2">Bersihkan Data Uji</h5>
                                <p className="text-sm text-slate-500 font-medium mb-6">Menghapus seluruh transaksi (PO, Mutasi Stok, RAB) tanpa membuat backup. Gunakan fitur ini hanya sebelum aplikasi diserahkan ke klien.</p>
                            </div>
                            <button onClick={() => setIsResetModalOpen(true)} className="w-full py-3 bg-white border-2 border-rose-200 text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex items-center justify-center gap-2">
                                <Trash2 size={16}/> Hapus Data Transaksi
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-center flex flex-col justify-between">
                            <div>
                                <DatabaseBackup className="mx-auto text-rose-300 mb-4" size={40} />
                                <h5 className="font-black text-rose-600 mb-2">Backup & Tutup Buku</h5>
                                <p className="text-sm text-slate-500 font-medium mb-6">Fitur ini akan segera hadir. Akan menggandakan file dan mereset transaksi bulanan Anda secara otomatis.</p>
                            </div>
                            <button disabled className="w-full py-3 bg-rose-100 text-rose-400 font-black text-xs uppercase tracking-widest rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                <DatabaseBackup size={16}/> Segera Hadir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL KONFIRMASI RESET */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-8 w-full max-w-md text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-rose-100">
                                <AlertTriangle size={36} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Peringatan Keras!</h3>
                            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
                                Anda akan <strong className="text-rose-600">MENGHAPUS PERMANEN</strong> seluruh data Transaksi (PO, RAB, Stok). Master data (Bahan, Supplier, Operasional) tetap aman. Lanjutkan?
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsResetModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
                                <button onClick={handleResetData} disabled={resetProcessing} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {resetProcessing ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Reset Data!'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}