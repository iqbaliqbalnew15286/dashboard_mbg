import React, { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { 
    TrendingUp, ShieldAlert, Calendar, ShoppingCart, 
    Truck, Boxes, Activity, ArrowRight, Wallet, Plus 
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePage, Link } from '@inertiajs/react';

// 1. Komponen Animasi Angka (Ringan & Halus)
const AnimatedCounter = ({ value, prefix = "", suffix = "" }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => `${prefix}${Math.round(latest).toLocaleString("id-ID")}${suffix}`);
    useEffect(() => {
        const controls = animate(count, value || 0, { duration: 1.2, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);
    return <motion.span>{rounded}</motion.span>;
};

// 2. Custom Tooltip Chart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-4 py-3 rounded-2xl shadow-xl border border-slate-100 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
                <p className="text-slate-400 font-bold mb-1">{label}</p>
                <p className="text-base font-black text-blue-600">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function Dashboard({ stats, trends, recentPos, criticalItems }) {
    const safeCriticalItems = Array.isArray(criticalItems) ? criticalItems : [];

    const { auth } = usePage().props;
    const user = auth?.user || { name: 'Admin', role: 'Administrator' };
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => { setMounted(true); }, []);

    const todayFormatted = new Intl.DateTimeFormat('id-ID', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    }).format(new Date());

    const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="space-y-6 pb-10 font-['Plus_Jakarta_Sans',sans-serif] w-full"
        >
            {/* TOP HEADER */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistem MBG Terhubung
                        <span className="text-slate-300 mx-1">•</span>
                        <span className="text-slate-400 flex items-center gap-1.5"><Calendar size={12}/> {todayFormatted}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                        Selamat Datang, {user.name}!
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Pantau arus kas operasional, status PO, dan ketersediaan stok bahan baku gudang hari ini.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                    <Link href="/laporan" className="flex-1 md:flex-none px-5 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Laporan
                    </Link>
                    <Link href="/purchase-orders/create" className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2">
                        <Plus size={16} /> Buat PO Baru
                    </Link>
                </div>
            </div>

            {/* BENTO GRID STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total Pengeluaran</span>
                        <h3 className="text-xl md:text-2xl font-black text-blue-600 mt-1 block">
                            <AnimatedCounter value={stats?.total_pengeluaran || 0} prefix="Rp " />
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Wallet size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Total PO Tercatat</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-1 block">
                            <AnimatedCounter value={stats?.total_po || 0} />
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><ShoppingCart size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Mitra Supplier</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-1 block">
                            <AnimatedCounter value={stats?.total_supplier || 0} />
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Truck size={24} /></div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Item Gudang</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-1 block">
                            <AnimatedCounter value={stats?.total_bahan_baku || 0} />
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><Boxes size={24} /></div>
                </div>
            </div>

            {/* ANALYTICS & ALERT SECTION (GRID 2/3 : 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CHART ARUS KAS */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" /> Tren Pengeluaran (7 Hari)
                            </h3>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">Grafik realisasi biaya pembelian bahan baku & barang</p>
                        </div>
                    </div>
                    <div className="h-[250px] w-full min-w-0 min-h-0 flex-1">
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `${(val/1000000)}Jt`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBlue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* STOK KRITIS ALERT */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-800">Perhatian Gudang</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Stok Paling Menipis</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {!criticalItems || criticalItems.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <p className="text-sm font-black text-slate-500">Stok Gudang Aman</p>
                            </div>
                        ) : (
                            safeCriticalItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-rose-50/50 rounded-xl border border-slate-100 transition-colors">
                                    <div className="truncate pr-2">
                                        <p className="text-sm font-bold text-slate-800 truncate">{item.nama_barang}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{item.kode_barang}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-rose-600 bg-white px-2.5 py-1 rounded-lg border border-rose-100 shadow-sm">
                                            {formatRp(item.saldo_awal)} <span className="text-[10px] uppercase font-bold text-slate-400">{item.satuan}</span>
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <Link href="/master/bahan-baku" className="mt-auto pt-4 flex items-center justify-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">
                        Kelola Stok Lengkap <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* TRANSAKSI PO TERAKHIR */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ShoppingCart size={18} className="text-blue-500" /> Transaksi PO Terakhir
                        </h3>
                    </div>
                    <Link href="/transaksi" className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all self-start sm:self-auto">
                        Lihat Semua Riwayat
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4">Nomor PO</th>
                                <th className="px-6 py-4">Mitra Supplier</th>
                                <th className="px-6 py-4">Tanggal Pesanan</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Total Anggaran</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {!recentPos || recentPos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                                        Belum Ada Riwayat Transaksi PO.
                                    </td>
                                </tr>
                            ) : (
                                recentPos.map((act, i) => {
                                    // Cari nama supplier dari relasi details (Jika ada)
                                    const supplierName = act.details && act.details[0] && act.details[0].supplier ? act.details[0].supplier.nama_perusahaan : '-';
                                    
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-8 py-4 font-black text-blue-600 hover:underline">
                                                <Link href={`/purchase-orders/${act.id || ''}/edit`}>{act.nomor_po}</Link>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{supplierName}</td>
                                            <td className="px-6 py-4 text-slate-500 font-bold">{act.tanggal_pesan}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${
                                                    act.status === 'selesai' || act.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    act.status === 'draft' || act.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {act.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 font-black text-slate-800 text-right">
                                                {formatRp(act.grand_total)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </motion.div>
    );
}