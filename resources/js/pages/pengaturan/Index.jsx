import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    Settings, Printer, Image as ImageIcon, Save, 
    AlertTriangle, Trash2, DatabaseBackup, Loader2, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function PengaturanIndex({ pengaturan }) {
    // State untuk Preview Gambar
    const [previewKop, setPreviewKop] = useState(pengaturan?.kop_surat ? `/storage/${pengaturan.kop_surat}` : null);
    
    // State untuk Modal Konfirmasi
    const [modalAction, setModalAction] = useState(null); // 'uji' atau 'backup'

    // Form Handler via Inertia
    const { data, setData, post, processing, errors } = useForm({
        // File Logo
        kop_surat_file: null,
        
        // TTD 1: Pengawas
        pengawas_jabatan: pengaturan?.pengawas_jabatan || '',
        pengawas_nama: pengaturan?.pengawas_nama || '',
        pengawas_nip: pengaturan?.pengawas_nip || '',
        
        // TTD 2: Kepala SPPG
        sppg_jabatan: pengaturan?.sppg_jabatan || '',
        sppg_nama: pengaturan?.sppg_nama || '',
        sppg_nip: pengaturan?.sppg_nip || '',
        
        // TTD 3: Asisten Lapangan
        asisten_jabatan: pengaturan?.asisten_jabatan || '',
        asisten_nama: pengaturan?.asisten_nama || '',
        asisten_nip: pengaturan?.asisten_nip || '',
        
        // TTD 4: Penerima Barang
        penerima_jabatan: pengaturan?.penerima_jabatan || '',
        penerima_nama: pengaturan?.penerima_nama || '',
        penerima_nip: pengaturan?.penerima_nip || '',
    });

    // Handle Upload Preview (Konversi sementara ke ObjectURL untuk preview cepat)
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi ukuran atau tipe bisa ditambahkan di sini jika diperlukan
            setData('kop_surat_file', file);
            setPreviewKop(URL.createObjectURL(file));
        }
    };

    // Eksekusi Simpan Pengaturan
    const submitPengaturan = (e) => {
        e.preventDefault();
        // Inertia otomatis mengubah payload menjadi FormData karena ada file (kop_surat_file)
        post('/pengaturan', {
            preserveScroll: true,
            onSuccess: () => toast.success('Format cetakan dan penandatangan berhasil disimpan!'),
            onError: () => toast.error('Gagal menyimpan pengaturan. Periksa form Anda.'),
        });
    };

    // Eksekusi Hapus Data Uji
    const { post: postUji, processing: ujiProcessing } = useForm();
    const handleResetUji = () => {
        postUji('/pengaturan/reset-uji', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Data PO dan Transaksi berhasil dikosongkan!');
                setModalAction(null);
            }
        });
    };

    // Eksekusi Backup & Tutup Buku
    const { post: postBackup, processing: backupProcessing } = useForm();
    const handleBackupReset = () => {
        postBackup('/pengaturan/backup-reset', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Backup berhasil dan data telah direset!');
                setModalAction(null);
            }
        });
    };

    // Komponen Reusable untuk Kartu Tanda Tangan
    const PejabatCard = ({ title, fieldPrefix }) => (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-blue-400 transition-colors h-full flex flex-col">
            <h6 className="text-center font-black text-xs text-slate-500 uppercase tracking-wide mb-4 h-8 flex items-center justify-center">
                Tanda Tangan {title}
            </h6>
            <div className="space-y-3 mt-auto">
                <input 
                    type="text" placeholder="Jabatan..." 
                    value={data[`${fieldPrefix}_jabatan`]} 
                    onChange={e => setData(`${fieldPrefix}_jabatan`, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
                <input 
                    type="text" placeholder="Nama Lengkap" 
                    value={data[`${fieldPrefix}_nama`]} 
                    onChange={e => setData(`${fieldPrefix}_nama`, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
                <input 
                    type="text" placeholder="NIP / -" 
                    value={data[`${fieldPrefix}_nip`]} 
                    onChange={e => setData(`${fieldPrefix}_nip`, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
            </div>
        </div>
    );

    return (
        <div className="container mx-auto space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-12">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <Settings size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-slate-500 text-sm font-medium">Konfigurasi cetakan laporan dan manajemen database.</p>
                </div>
            </div>

            {/* KARTU 1: FORMAT CETAKAN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-blue-600 flex items-center gap-2 text-white">
                    <Printer size={20} />
                    <h2 className="font-bold text-base">Format Cetakan & Penandatangan</h2>
                </div>
                
                <form onSubmit={submitPengaturan}>
                    <div className="p-6 space-y-8">
                        {/* Area Upload Kop Surat */}
                        <div className="pb-6 border-b border-slate-200">
                            <label className="text-sm font-bold text-slate-800 block mb-3">Kop Surat / Logo Organisasi</label>
                            
                            <input 
                                type="file" 
                                id="upload_kop" 
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-200 rounded-lg cursor-pointer bg-slate-50 mb-2" 
                                accept="image/png, image/jpeg, image/jpg" 
                                onChange={handleImageChange} 
                            />
                            
                            <div className="text-xs text-blue-600 font-medium mb-4 flex items-center gap-1.5 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                                <ImageIcon size={14} />
                                <span><strong>Sistem Otomatis:</strong> Pilih file .JPG atau .PNG. Sistem akan memproses dan menyimpannya untuk header laporan.</span>
                            </div>

                            {previewKop && (
                                <div className="text-center p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl">
                                    <span className="block text-slate-400 text-xs font-bold mb-3 tracking-widest">PREVIEW KOP SURAT</span>
                                    <img src={previewKop} alt="Preview Kop" className="mx-auto max-h-36 object-contain rounded" />
                                </div>
                            )}
                        </div>

                        {/* Area Pejabat */}
                        <div>
                            <h6 className="font-bold text-slate-800 mb-4 text-sm">Pejabat Penandatangan Laporan / Nota</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                <PejabatCard title="Pengawas Keuangan" fieldPrefix="pengawas" />
                                <PejabatCard title="Kepala SPPG" fieldPrefix="sppg" />
                                <PejabatCard title="Asisten Lapangan" fieldPrefix="asisten" />
                                <PejabatCard title="Penerima Barang" fieldPrefix="penerima" />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={processing} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-70 shadow-sm"
                        >
                            {processing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                            {processing ? 'Menyimpan...' : 'Simpan Format Cetakan'}
                        </button>
                    </div>
                </form>
            </div>

            {/* KARTU 2: ZONA BERBAHAYA */}
            <div className="bg-white rounded-2xl border-2 border-red-500 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-red-600 flex items-center gap-2 text-white">
                    <AlertTriangle size={20} />
                    <h2 className="font-bold text-base">Manajemen Database (Zona Berbahaya)</h2>
                </div>
                
                <div className="p-6 bg-red-50/30">
                    <p className="text-red-700 font-bold mb-6 text-sm bg-red-100/50 p-3 rounded-lg border border-red-200">
                        Peringatan: Tindakan di bawah ini akan menghapus data transaksi dari sistem secara permanen. Pastikan Anda tahu apa yang Anda lakukan.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tombol Reset Uji */}
                        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm text-center flex flex-col h-full">
                            <div className="flex-grow">
                                <Trash2 className="mx-auto text-red-400 mb-3 opacity-80" size={48} strokeWidth={1.5} />
                                <h5 className="font-bold text-red-600 mb-2 text-lg">Bersihkan Data Uji</h5>
                                <p className="text-sm text-slate-500 mb-6">Menghapus seluruh transaksi PO (Header & Detail) tanpa membuat backup. Gunakan fitur ini <strong>hanya sebelum aplikasi diserahkan</strong> ke klien.</p>
                            </div>
                            <button 
                                onClick={() => setModalAction('uji')} 
                                className="w-full py-2.5 bg-white border-2 border-red-500 text-red-600 font-bold text-sm rounded-lg hover:bg-red-50 hover:border-red-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18}/> Hapus Data Transaksi
                            </button>
                        </div>

                        {/* Tombol Tutup Buku */}
                        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm text-center flex flex-col h-full">
                            <div className="flex-grow">
                                <DatabaseBackup className="mx-auto text-red-400 mb-3 opacity-80" size={48} strokeWidth={1.5} />
                                <h5 className="font-bold text-red-600 mb-2 text-lg">Backup & Tutup Buku (Reset)</h5>
                                <p className="text-sm text-slate-500 mb-6">Sistem akan <strong>menyimpan riwayat</strong> transaksi dan menghapus semua data operasional aktif. Master Data tetap dipertahankan.</p>
                            </div>
                            <button 
                                onClick={() => setModalAction('backup')}
                                className="w-full py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <DatabaseBackup size={18}/> Jalankan Backup & Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL GLOBAL UNTUK DANGER ACTIONS */}
            <AnimatePresence>
                {modalAction && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md text-center shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Tindakan</h3>
                            
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                                {modalAction === 'uji' 
                                    ? <span className="font-medium">Anda akan <strong className="text-red-600">MENGHAPUS PERMANEN</strong> seluruh data Transaksi (PO, dsb). Lanjutkan hapus data uji?</span>
                                    : <span className="font-medium">Sistem akan melakukan <strong>Backup</strong> dan <strong className="text-red-600">MERESET</strong> data aktif bulan ini. Lanjutkan Tutup Buku?</span>
                                }
                            </p>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setModalAction(null)} 
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={modalAction === 'uji' ? handleResetUji : handleBackupReset} 
                                    disabled={ujiProcessing || backupProcessing} 
                                    className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {(ujiProcessing || backupProcessing) ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Lanjutkan!'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}