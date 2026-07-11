import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login Admin - SPPG Bantarjati 03" />

            <div className="min-h-screen flex bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 selection:bg-blue-200">
                
                {/* --- LEFT PANEL (Informasi & Branding) --- */}
                <div className="hidden md:flex md:w-1/2 lg:w-2/3 bg-white p-12 flex-col justify-between border-r border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-96 bg-blue-50/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
                    
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0">
                            <img 
                                src="/images/logo.png" 
                                alt="Logo Bantarjati" 
                                className="w-full h-full object-contain drop-shadow-sm"
                                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                            />
                            <div className="hidden w-full h-full bg-blue-600 rounded-xl items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/20">B</div>
                        </div>
                        <div className="leading-tight">
                            <p className="text-xl font-black tracking-tight text-slate-800">LAPORAN KEUANGAN</p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600 mt-0.5">SPPG BANTARJATI 03</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center py-10 relative z-10">
                        <div className="relative w-full max-w-lg h-72 rounded-[2rem] overflow-hidden shadow-2xl border border-blue-900/10 bg-slate-900 group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 opacity-95 transition-opacity duration-500 group-hover:opacity-100"></div>
                            
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl"></div>

                            <div className="absolute inset-0 p-10 flex flex-col justify-end text-white">
                                <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-4 py-1.5 rounded-full uppercase mb-4 inline-block w-fit tracking-wider border border-white/10 shadow-sm">
                                    <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                                    Sistem Aktif
                                </span>
                                <p className="text-3xl font-black tracking-tight">Manajemen Terpadu</p>
                                <p className="text-sm mt-3 text-blue-100 font-medium leading-relaxed max-w-sm">
                                    Kelola kasir, inventaris, dan laporan keuangan dengan efisiensi maksimal dan keamanan penuh.
                                </p>
                            </div>
                        </div>
                    </div>

                    <footer className="text-[10px] font-bold uppercase tracking-widest text-slate-400 relative z-10">
                        &copy; {new Date().getFullYear()} SPPG BANTARJATI 03 • Secure Access Point
                    </footer>
                </div>

                {/* --- RIGHT PANEL (Form Login) --- */}
                <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col justify-center px-8 sm:px-12 py-16 relative z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.02)]">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-12">
                            <h1 className="text-4xl font-black mb-3 tracking-tight text-slate-800">
                                Sign In<span className="text-blue-600">.</span>
                            </h1>
                            <p className="text-sm font-medium text-slate-500">Otorisasi Administrator Sistem Internal</p>
                            <div className="w-12 h-1.5 bg-blue-600 mt-5 rounded-full"></div>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            
                            {/* Input Email */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-blue-600 transition-colors">
                                    Email Address
                                </label>
                                <div className="relative text-slate-400 focus-within:text-blue-600 transition-colors">
                                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Mail size={18} />
                                    </span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl py-3.5 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white outline-none transition-all duration-300 font-semibold text-sm text-slate-800"
                                        placeholder="admin@bantarjati.com"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.email}</p>}
                            </div>

                            {/* Input Password */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 group-focus-within:text-blue-600 transition-colors">
                                    Security Password
                                </label>
                                <div className="relative text-slate-400 focus-within:text-blue-600 transition-colors">
                                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl py-3.5 pl-12 pr-12 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white outline-none transition-all duration-300 font-semibold text-sm text-slate-800"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 focus:text-blue-600 transition-colors outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.password}</p>}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center pt-2">
                                <label className="flex items-center group cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 border-slate-300 rounded text-blue-600 focus:ring-blue-600/20 cursor-pointer transition-colors"
                                    />
                                    <span className="ml-3 text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">
                                        Keep me logged in
                                    </span>
                                </label>
                            </div>

                            {/* Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[13px] tracking-widest uppercase transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                                >
                                    {processing ? 'Memproses...' : 'Masuk Ke Sistem'}
                                </button>
                            </div>
                        </form>

                        <div className="text-center mt-12">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secured by Sistem Internal</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}