import React, { useRef, useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import { Save, AlertTriangle, FileText, Info, FileSpreadsheet, FileOutput, FilePlus, FileSignature, CheckSquare } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// KOMPONEN DIPISAH KE LUAR AGAR TIDAK KEHILANGAN FOKUS SAAT MENGETIK
const CardPejabat = ({ title, keyJabatan, data, setData, activeTab, toggleCeklis }) => {
    // Ambil status ceklis dari state konfigurasi dengan pengaman (opsional chaining)
    const isChecked = data.konfigurasi_cetak[activeTab]?.[keyJabatan] || false;

    // Helper untuk update data form
    const handleChange = (e) => {
        setData(e.target.name, e.target.value);
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
            isChecked ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70'
        }`}>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{title}</label>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isChecked} 
                            onChange={() => toggleCeklis(keyJabatan)} 
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="space-y-3">
                    {/* INPUT JABATAN (BISA DIEDIT) */}
                    <input 
                        type="text" 
                        name={`${keyJabatan}_jabatan`}
                        value={data[`${keyJabatan}_jabatan`]}
                        onChange={handleChange}
                        disabled={!isChecked}
                        placeholder={`Jabatan (${title})`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-600 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all disabled:text-slate-400 disabled:bg-slate-100" 
                    />
                    
                    {/* INPUT NAMA LENGKAP */}
                    <input 
                        type="text" 
                        name={`${keyJabatan}_nama`}
                        value={data[`${keyJabatan}_nama`]}
                        onChange={handleChange}
                        disabled={!isChecked}
                        placeholder="Nama Lengkap Pejabat"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                    />

                    {/* INPUT NIP (BISA DIEDIT) */}
                    <input 
                        type="text" 
                        name={`${keyJabatan}_nip`}
                        value={data[`${keyJabatan}_nip`]}
                        onChange={handleChange}
                        disabled={!isChecked}
                        placeholder="NIP / -"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all disabled:text-slate-400 disabled:bg-slate-100" 
                    />
                </div>
            </div>
        </div>
    );
};

export default function PengaturanIndex() {
    const { props } = usePage();
    const { pengaturan = {} } = props;

    // Struktur Default
    const defaultKonfigurasi = {
        riwayat_masuk: { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true },
        barang_keluar: { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true },
        rekap_stok: { yayasan: false, pengawas: false, sppg: false, asisten: true, penerima: true },
        laporan: { yayasan: true, pengawas: true, sppg: true, asisten: false, penerima: false },
        berita_acara: { yayasan: false, pengawas: true, sppg: true, asisten: true, penerima: true }
    };

    // PERBAIKAN: Menghindari error JSON kosong dari Laravel yang dikonversi jadi array []
    let parsedKonfig = pengaturan.konfigurasi_cetak;
    if (!parsedKonfig || Array.isArray(parsedKonfig) || Object.keys(parsedKonfig).length === 0) {
        parsedKonfig = defaultKonfigurasi;
    } else {
        // Gabungkan dengan default agar struktur tab selalu komplit
        parsedKonfig = { ...defaultKonfigurasi, ...parsedKonfig };
    }

    // State Inertia lengkap dengan Jabatan, Nama, NIP untuk 5 Pejabat
    const { data, setData, post, processing, errors } = useForm({
        kop_surat_file: null,
        
        yayasan_jabatan: pengaturan.yayasan_jabatan || 'Kepala Yayasan / PIC',
        yayasan_nama: pengaturan.yayasan_nama || '',
        yayasan_nip: pengaturan.yayasan_nip || '',
        
        pengawas_jabatan: pengaturan.pengawas_jabatan || 'Pengawas Keuangan',
        pengawas_nama: pengaturan.pengawas_nama || '',
        pengawas_nip: pengaturan.pengawas_nip || '',
        
        sppg_jabatan: pengaturan.sppg_jabatan || 'Kepala SPPG',
        sppg_nama: pengaturan.sppg_nama || '',
        sppg_nip: pengaturan.sppg_nip || '',
        
        asisten_jabatan: pengaturan.asisten_jabatan || 'Asisten Lapangan',
        asisten_nama: pengaturan.asisten_nama || '',
        asisten_nip: pengaturan.asisten_nip || '',
        
        penerima_jabatan: pengaturan.penerima_jabatan || 'Penerima Barang',
        penerima_nama: pengaturan.penerima_nama || '',
        penerima_nip: pengaturan.penerima_nip || '',
        
        konfigurasi_cetak: parsedKonfig,
    });

    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('rekap_stok');

    // PERBAIKAN: Fungsi toggleCeklis dibuat kebal error (Safe Toggle)
    const toggleCeklis = (jabatan) => {
        // Ambil konfigurasi tab saat ini, jika undefined gunakan {}
        const currentTabConfig = data.konfigurasi_cetak[activeTab] || {};
        
        setData('konfigurasi_cetak', {
            ...data.konfigurasi_cetak,
            [activeTab]: {
                ...currentTabConfig,
                [jabatan]: !currentTabConfig[jabatan]
            }
        });
    };

    const submitPengaturan = (e) => {
        e.preventDefault();
        post('/pengaturan', {
            preserveScroll: true,
            onSuccess: () => toast.success('Pengaturan sistem berhasil diperbarui!'),
            onError: () => toast.error('Gagal menyimpan, periksa kembali form Anda.'),
        });
    };

    const handleBackupReset = () => {
        if (confirm('PERINGATAN! Tindakan ini akan menghapus semua riwayat transaksi. Lanjutkan?')) {
            router.post('/pengaturan/backup-reset', {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('Sistem berhasil di-reset ke titik nol.'),
                onError: () => toast.error('Gagal melakukan reset sistem.')
            });
        }
    };

    // Array Menu Tab
    const tabs = [
        { id: 'riwayat_masuk', label: 'Riwayat Masuk', icon: <FilePlus size={16} /> },
        { id: 'barang_keluar', label: 'Barang Keluar', icon: <FileOutput size={16} /> },
        { id: 'rekap_stok', label: 'Rekap Stok', icon: <FileSpreadsheet size={16} /> },
        { id: 'laporan', label: 'Lap. Transaksi', icon: <FileText size={16} /> },
        { id: 'berita_acara', label: 'Berita Acara', icon: <FileSignature size={16} /> },
    ];

    return (
        <div className="w-full pb-20 font-['Plus_Jakarta_Sans',sans-serif] space-y-8">
            <Toaster position="top-right" />

            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Kelola format cetakan dan penandatangan secara spesifik untuk setiap dokumen.</p>
            </div>

            <form onSubmit={submitPengaturan} className="space-y-8">
                
                {/* BAGIAN 1: KOP SURAT */}
                <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
                    <div className="bg-blue-600 px-8 py-5 flex items-center gap-3">
                        <FileText size={20} className="text-white" />
                        <h3 className="font-black text-white text-base tracking-wide">Format Cetakan Header (Kop Surat)</h3>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div>
                            <label className="text-sm font-black text-slate-800 block mb-3">Upload Kop Surat / Logo (Berlaku untuk semua cetakan)</label>
                            
                            <input 
                                type="file" ref={fileInputRef} accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => setData('kop_surat_file', e.target.files[0])}
                                className="w-full md:w-1/2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 file:mr-4 file:py-3 file:px-6 file:border-0 file:border-r file:border-slate-200 file:text-sm file:font-black file:bg-slate-50 file:text-blue-600 hover:file:bg-blue-50 outline-none cursor-pointer"
                            />
                            
                            <div className="text-slate-500 text-[12px] mt-3 flex items-start gap-2 max-w-2xl font-medium">
                                <Info size={14} className="text-blue-500 mt-0.5" />
                                <p>Sistem akan mengkonversi dan menyimpan file (JPG/PNG/PDF) secara otomatis.</p>
                            </div>
                        </div>

                        {pengaturan.kop_surat && (
                            <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400 tracking-widest mb-6 uppercase bg-white px-4 py-1.5 rounded-full shadow-sm">Preview Kop Surat</span>
                                <div className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-center">
                                    {pengaturan.kop_surat.toLowerCase().endsWith('.pdf') ? (
                                        <div className="w-full relative overflow-hidden h-[200px] md:h-[250px]"><iframe src={`/storage/${pengaturan.kop_surat}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="absolute top-0 left-0 w-full h-[1000px] border-0 pointer-events-none" scrolling="no"/></div>
                                    ) : (
                                        <img src={`/storage/${pengaturan.kop_surat}`} alt="Kop Surat" className="w-full h-auto max-h-[250px] object-contain" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BAGIAN 2: KONFIGURASI TANDA TANGAN DINAMIS DENGAN TAB */}
                <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 mt-8">
                    <div className="bg-slate-800 px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckSquare size={20} className="text-white" />
                            <h3 className="font-black text-white text-base tracking-wide">Konfigurasi Tanda Tangan per Dokumen</h3>
                        </div>
                    </div>
                    
                    {/* Menu Navigasi Tab */}
                    <div className="bg-slate-50 border-b border-slate-200 px-4 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3 rounded-t-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-white text-blue-600 border-t-2 border-l border-r border-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 border-transparent border-t-2 border-l border-r'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 bg-slate-50/50">
                        <div className="mb-6">
                            <h4 className="text-lg font-black text-slate-800">Settingan untuk Dokumen: <span className="text-blue-600 capitalize">{activeTab.replace('_', ' ')}</span></h4>
                            <p className="text-xs text-slate-500 font-medium mt-1">Nyalakan *toggle* pada pejabat yang ingin ditampilkan di bagian bawah dokumen <b className="uppercase">{activeTab.replace('_', ' ')}</b>.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CardPejabat title="Kepala Yayasan / PIC" keyJabatan="yayasan" data={data} setData={setData} activeTab={activeTab} toggleCeklis={toggleCeklis} />
                            <CardPejabat title="Pengawas Keuangan" keyJabatan="pengawas" data={data} setData={setData} activeTab={activeTab} toggleCeklis={toggleCeklis} />
                            <CardPejabat title="Kepala SPPG" keyJabatan="sppg" data={data} setData={setData} activeTab={activeTab} toggleCeklis={toggleCeklis} />
                            <CardPejabat title="Asisten Lapangan" keyJabatan="asisten" data={data} setData={setData} activeTab={activeTab} toggleCeklis={toggleCeklis} />
                            <CardPejabat title="Penerima Barang" keyJabatan="penerima" data={data} setData={setData} activeTab={activeTab} toggleCeklis={toggleCeklis} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={processing} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-3">
                        <Save size={18} /> Simpan Seluruh Konfigurasi
                    </button>
                </div>
            </form>

            {/* DANGER ZONE - BACKUP & RESET */}
            <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6 mt-12 shadow-sm">
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-white text-rose-500 rounded-2xl shrink-0 shadow-sm border border-rose-100"><AlertTriangle size={28}/></div>
                    <div>
                        <h3 className="font-black text-rose-700 text-lg tracking-tight">Zona Berbahaya: Reset Data Sistem</h3>
                        <p className="text-rose-600/80 text-sm mt-1 font-medium leading-relaxed max-w-2xl">
                            Tindakan ini akan mengosongkan seluruh tabel transaksi (PO, Penerimaan Barang, Rekap Stok). Pastikan Anda telah melakukan backup database ke format SQL sebelum mengeksekusi perintah ini.
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleBackupReset}
                    type="button"
                    className="px-8 py-4 bg-white text-rose-600 font-black text-xs uppercase tracking-widest rounded-xl border border-rose-200 hover:bg-rose-600 hover:text-white transition-all shrink-0 shadow-sm w-full md:w-auto"
                >
                    Jalankan Backup & Reset
                </button>
            </div>

        </div>
    );
}