import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowUpRight, Plus, CalendarDays, FileText, Search, Calendar, RotateCcw, Loader2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';

export default function RabIndex({ 
    operasionals = [], 
    rabs, 
    realisasi_po = 0, 
    realisasi_ops = 0, 
    total_pagu = 0,
    filters = {}
}) {
    // STATE FILTER
    const [search, setSearch] = useState(filters.search || '');
    const [tglAwal, setTglAwal] = useState(filters.tgl_awal || '');
    const [tglAkhir, setTglAkhir] = useState(filters.tgl_akhir || '');
    const [isLoading, setIsLoading] = useState(false);

    // FITUR PENCARIAN & FILTER OTOMATIS (REAL-TIME DEBOUNCE)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setIsLoading(true);
            router.get('/rab', { 
                search: search, 
                tgl_awal: tglAwal, 
                tgl_akhir: tglAkhir 
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['rabs'], // Hanya refresh data rabs agar komponen lain tidak berkedip
                onFinish: () => setIsLoading(false)
            });
        }, 500); // 0.5 Detik Penundaan
        
        return () => clearTimeout(delayDebounceFn);
    }, [search, tglAwal, tglAkhir]);

    const handleReset = () => {
        setSearch('');
        setTglAwal('');
        setTglAkhir('');
    };

    // Helper untuk format Rupiah
    const fmt = (n) => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
    }).format(n || 0);

    // Helper untuk Format Tanggal Lokal (Contoh: 10 Juli 2026)
    const formatTanggalLokal = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const dateOnly = dateStr.split(' ')[0];
            const parts = dateOnly.split('-');
            if (parts.length !== 3) return dateStr;
            const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return `${parseInt(parts[2], 10)} ${bulan[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
        } catch {
            return dateStr;
        }
    };

    // Kalkulasi Realisasi Keseluruhan
    const totalRealisasi = Number(realisasi_po) + Number(realisasi_ops);
    const sisaAnggaran = Number(total_pagu) - totalRealisasi;

    return (
        <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Rancangan Anggaran Belanja (RAB)</h2>
                    <p className="text-slate-500 text-sm mt-1">Monitoring alokasi pagu dana internal secara real-time.</p>
                </div>
                <div className="flex gap-3 w-full lg:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <Link 
                        href="/rab/create"
                        className="w-full lg:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
                    >
                        <Plus size={18} /> Buat RAB Baru
                    </Link>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pagu Anggaran</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{fmt(total_pagu)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Realisasi (PO + Ops)</p>
                        <h3 className="text-2xl font-black text-rose-600 mt-1">{fmt(totalRealisasi)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Dana Alokasi</p>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">{fmt(sisaAnggaran)}</h3>
                    </div>
                </div>
            </div>

            {/* FILTER PANEL UNTUK RAB */}
            <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                <div className="flex flex-col xl:flex-row gap-4 items-end">
                    
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Awal</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                    value={tglAwal}
                                    onChange={(e) => setTglAwal(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tanggal Akhir</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                    value={tglAkhir}
                                    onChange={(e) => setTglAkhir(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian Teks</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                placeholder="Cari nama menu / deskripsi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full xl:w-auto mt-2 xl:mt-0">
                        <button 
                            disabled={true} // Hanya sbg indikator visual karena filter sudah real-time
                            className="flex-1 xl:flex-none p-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 w-32"
                        >
                            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 
                            {isLoading ? 'Mencari' : 'Otomatis'}
                        </button>
                        <button 
                            onClick={handleReset} 
                            className="p-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                            title="Reset Filter"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* SECTION: TABEL RIWAYAT RAB (PAGINATED) */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <FileText className="text-blue-500" size={20} />
                    <h2 className="font-black text-slate-800 text-lg">Riwayat Pengajuan RAB</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 w-40 whitespace-nowrap">Tgl RAB</th>
                                <th className="px-6 py-5 min-w-[200px]">Nama Menu / Deskripsi</th>
                                <th className="px-6 py-5 text-right w-44">Pagu Anggaran</th>
                                <th className="px-6 py-5 text-right w-44 text-blue-600 bg-blue-50/30">Total Belanja</th>
                                <th className="px-8 py-5 text-right w-44">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                                        <Loader2 className="mx-auto h-10 w-10 mb-3 animate-spin text-blue-500" />
                                        <p className="font-bold text-base text-slate-600">Menyaring data RAB...</p>
                                    </td>
                                </tr>
                            ) : (!rabs || !rabs.data || rabs.data.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                                        <FileText className="mx-auto h-12 w-12 mb-3 opacity-20 text-blue-500" />
                                        <p className="font-bold text-base text-slate-600">Data RAB Tidak Ditemukan</p>
                                        <p className="text-xs mt-1">Coba sesuaikan filter rentang tanggal atau teks pencarian.</p>
                                    </td>
                                </tr>
                            ) : (
                                rabs.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Tanggal yang diformat lokal (contoh: 10 Juli 2026) */}
                                        <td className="px-8 py-5 font-bold text-slate-500 whitespace-nowrap">
                                            {formatTanggalLokal(item.tanggal)}
                                        </td>
                                        
                                        {/* Teks Wrap untuk nama menu panjang */}
                                        <td className="px-6 py-5 font-black text-slate-800 break-words max-w-[250px] leading-tight">
                                            {item.nama_menu || '-'}
                                        </td>
                                        
                                        <td className="px-6 py-5 text-right font-bold text-slate-600">{fmt(item.total_pagu)}</td>
                                        <td className="px-6 py-5 text-right font-black text-blue-700 bg-blue-50/10">{fmt(item.total_belanja)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`inline-block px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wider ${item.selisih < 0 ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'}`}>
                                                {fmt(item.selisih)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* PAGINATION RAB */}
                {rabs && rabs.links && rabs.data.length > 0 && (
                    <div className="flex items-center justify-between px-8 py-4 bg-slate-50/50 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Halaman {rabs.current_page} dari {rabs.last_page}
                        </span>
                        <div className="flex gap-1">
                            {rabs.links.map((link, k) => (
                                <button
                                    key={k}
                                    onClick={() => link.url && router.get(link.url, { search, tgl_awal: tglAwal, tgl_akhir: tglAkhir }, { preserveScroll: true, preserveState: true })}
                                    disabled={!link.url || link.active}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        link.active 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : !link.url 
                                            ? 'text-slate-300 cursor-not-allowed' 
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION: TABEL ALOKASI OPERASIONAL */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden mt-6">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <CalendarDays className="text-amber-500" size={20} />
                    <h2 className="font-black text-slate-800 text-lg">Alokasi Operasional & Fasilitas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Kode Transaksi</th>
                                <th className="px-6 py-5">Deskripsi Kegiatan</th>
                                <th className="px-6 py-5 text-center">Satuan</th>
                                <th className="px-6 py-5 text-right">Pagu Batas</th>
                                <th className="px-8 py-5 text-right">Penyerapan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {!operasionals || operasionals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center text-slate-400">
                                        <CalendarDays className="mx-auto h-10 w-10 mb-3 opacity-30" />
                                        <p className="font-bold text-base">Belum tersedia data anggaran operasional.</p>
                                    </td>
                                </tr>
                            ) : (
                                operasionals.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-5 font-black text-blue-600">#{item.kode_transaksi}</td>
                                        <td className="px-6 py-5 font-bold text-slate-800">{item.nama_transaksi}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                                                {item.satuan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-bold text-slate-600">{fmt(item.pagu_awal)}</td>
                                        <td className="px-8 py-5 text-right font-extrabold text-rose-600 bg-rose-50/30">{fmt(item.jumlah_bayar)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}