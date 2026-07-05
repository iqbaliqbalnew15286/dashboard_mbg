import React from 'react';
import { Wallet, TrendingUp, ArrowUpRight, Plus, CalendarDays, FileText, Eye } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Toaster } from 'react-hot-toast';

export default function RabIndex({ 
    operasionals = [], 
    rabs = [], // Data history RAB yang dikirim dari controller
    realisasi_po = 0, 
    realisasi_ops = 0, 
    total_pagu = 0 
}) {
    // Helper untuk format Rupiah
    const fmt = (n) => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0 
    }).format(n || 0);

    // Kalkulasi Realisasi Keseluruhan
    const totalRealisasi = Number(realisasi_po) + Number(realisasi_ops);
    const sisaAnggaran = Number(total_pagu) - totalRealisasi;

    return (
        <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
            <Toaster position="top-right" />

            {/* HEADER BANNER */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 md:p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30">
                            Financial Statement
                        </span>
                        <h1 className="text-3xl font-black mt-3 tracking-tight">Rancangan Anggaran Belanja (RAB)</h1>
                        <p className="text-slate-400 text-sm font-medium mt-1">Monitoring alokasi pagu dana internal secara real-time.</p>
                    </div>
                    <Link 
                        href="/rab/create"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
                    >
                        <Plus size={18} /> Buat RAB Baru
                    </Link>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pagu Anggaran</p>
                        <h3 className="text-xl font-black text-slate-900 mt-0.5">{fmt(total_pagu)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Realisasi (PO + Ops)</p>
                        <h3 className="text-xl font-black text-rose-600 mt-0.5">{fmt(totalRealisasi)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Dana Alokasi</p>
                        <h3 className="text-xl font-black text-emerald-600 mt-0.5">{fmt(sisaAnggaran)}</h3>
                    </div>
                </div>
            </div>

            {/* SECTION: TABEL RIWAYAT RAB (INI YANG DITAMBAHKAN) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <FileText className="text-emerald-500" size={20} />
                    <h2 className="font-black text-slate-800 text-lg">Riwayat Pengajuan RAB</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4">Tgl RAB</th>
                                <th className="px-6 py-4">Nama Menu / Deskripsi</th>
                                <th className="px-6 py-4 text-right">Pagu Anggaran</th>
                                <th className="px-6 py-4 text-right">Total Belanja</th>
                                <th className="px-6 py-4 text-right">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {rabs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        Belum ada riwayat pembuatan RAB.
                                    </td>
                                </tr>
                            ) : (
                                rabs.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-4 font-bold text-slate-600">{item.tanggal}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{item.nama_menu || '-'}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{fmt(item.total_pagu)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{fmt(item.total_belanja)}</td>
                                        <td className={`px-6 py-4 text-right font-extrabold ${item.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {fmt(item.selisih)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION: TABEL ALOKASI OPERASIONAL */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <CalendarDays className="text-blue-500" size={20} />
                    <h2 className="font-black text-slate-800 text-lg">Alokasi Operasional & Fasilitas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4">Kode Transaksi</th>
                                <th className="px-6 py-4">Deskripsi Kegiatan</th>
                                <th className="px-6 py-4">Satuan</th>
                                <th className="px-6 py-4 text-right">Pagu Batas</th>
                                <th className="px-8 py-4 text-right">Penyerapan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {operasionals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                                        Belum tersedia data anggaran operasional.
                                    </td>
                                </tr>
                            ) : (
                                operasionals.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-8 py-4 font-bold text-slate-600">#{item.kode_transaksi}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{item.nama_transaksi}</td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">{item.satuan}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{fmt(item.pagu_awal)}</td>
                                        <td className="px-8 py-4 text-right font-extrabold text-rose-600">{fmt(item.jumlah_bayar)}</td>
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