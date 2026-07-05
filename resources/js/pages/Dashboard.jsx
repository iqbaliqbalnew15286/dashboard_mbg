import React, { useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { TrendingUp, AlertCircle, Activity, Layers, Package, Clock, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePage } from '@inertiajs/react';

const AnimatedCounter = ({ value, prefix = "", suffix = "" }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => `${prefix}${Math.round(latest).toLocaleString("id-ID")}${suffix}`);
    useEffect(() => {
        const controls = animate(count, value || 0, { duration: 1.5, ease: "easeOut" });
        return controls.stop;
    }, [value, count]);
    return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ title, value, icon, color, bg }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4`}>{icon}</div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
);

export default function Dashboard({ stats, trends, activities, criticalItems, topProducts }) {
    const { auth } = usePage().props;
    const user = auth?.user || { name: 'Admin' };
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => { setMounted(true); }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Halo, {user.name}!</h2>
                <p className="text-slate-500 font-medium mt-1">Selamat datang kembali di Dashboard MBG.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Aset" value={<AnimatedCounter value={stats?.total_aset || 0} prefix="Rp " />} icon={<DollarSign size={24} />} color="text-blue-600" bg="bg-blue-50" />
                <StatCard title="Omzet" value={<AnimatedCounter value={stats?.omzet || 0} prefix="Rp " />} icon={<TrendingUp size={24} />} color="text-emerald-600" bg="bg-emerald-50" />
                <StatCard title="Total SKU" value={<AnimatedCounter value={stats?.total_sku || 0} />} icon={<Layers size={24} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard title="Stok Kritis" value={<AnimatedCounter value={stats?.stok_kritis_count || 0} />} icon={<AlertCircle size={24} />} color="text-rose-600" bg="bg-rose-50" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6">Tren Finansial</h3>
                    <div className="h-[300px] w-full min-w-0 min-h-0">
                        {mounted && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends || []}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="nama" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={4} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                        <AlertCircle size={18} className="text-rose-500" /> Stok Kritis
                    </h3>
                    <div className="space-y-4">
                        {(criticalItems || []).map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl border border-rose-100">
                                <div>
                                    <p className="text-sm font-black text-slate-800">{item.merk}</p>
                                    <p className="text-[10px] font-bold text-rose-600 uppercase">{item.sku}</p>
                                </div>
                                <span className="text-lg font-black text-rose-600">{item.stok}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}