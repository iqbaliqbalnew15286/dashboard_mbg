import React, { useState } from 'react';
import { useForm, Head } from '@inertiajs/react';

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
            <Head title="Login Admin - MBG Internal" />

            <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
                {/* --- LEFT PANEL (Informasi & Branding) --- */}
                <div className="hidden md:flex md:w-1/2 lg:w-2/3 bg-white p-12 flex-col justify-between border-r border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-mbg-500 rounded-xl flex items-center justify-center shadow-lg shadow-mbg-500/20">
                            <span className="text-xl font-black text-white">M</span>
                        </div>
                        <div className="leading-tight">
                            <p className="text-lg font-extrabold tracking-tight">MBG Internal</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-mbg-500">System Management</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center py-10">
                        {/* Hero Card */}
                        <div className="relative w-full max-w-lg h-72 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-900">
                            <div className="absolute inset-0 bg-gradient-to-br from-mbg-600 to-indigo-900 opacity-90"></div>
                            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                                <span className="bg-white/20 backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-3 inline-block w-fit">
                                    Sistem Aktif
                                </span>
                                <p className="text-3xl font-bold tracking-tight">Dashboard Terpadu</p>
                                <p className="text-sm mt-1 text-slate-200">
                                    Kelola kasir dan inventaris dengan efisiensi maksimal.
                                </p>
                            </div>
                        </div>
                    </div>

                    <footer className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        &copy; {new Date().getFullYear()} MBG Internal • Secure Access Point
                    </footer>
                </div>

                {/* --- RIGHT PANEL (Form Login) --- */}
                <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col justify-center px-10 py-16 relative z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.03)]">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-10">
                            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                                Sign <span className="text-mbg-500">In.</span>
                            </h1>
                            <p className="text-sm font-medium text-slate-400">Otorisasi Administrator Sistem</p>
                            <div className="w-12 h-1.5 bg-mbg-500 mt-4 rounded-full"></div>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Input Email */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <i className="fa-solid fa-envelope"></i>
                                    </span>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full rounded-xl py-4 pl-12 pr-4 bg-slate-50 border border-slate-100 focus:border-mbg-500 focus:ring-2 focus:ring-mbg-500/20 outline-none transition-all font-medium text-sm"
                                        placeholder="admin@mbg.com"
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}
                            </div>

                            {/* Input Password */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Security Password</label>
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                                        <i className="fa-solid fa-shield-halved"></i>
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-xl py-4 pl-12 pr-12 bg-slate-50 border border-slate-100 focus:border-mbg-500 focus:ring-2 focus:ring-mbg-500/20 outline-none transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-mbg-500 transition-colors"
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-[10px]">{errors.password}</p>}
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center py-1">
                                <label className="flex items-center group cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 border-slate-200 rounded text-mbg-500 focus:ring-mbg-500/20"
                                    />
                                    <span className="ml-3 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
                                        Keep me logged in
                                    </span>
                                </label>
                            </div>

                            {/* Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-4 rounded-xl bg-mbg-500 hover:bg-mbg-600 text-white font-extrabold text-sm tracking-widest uppercase transition-all duration-300 shadow-lg shadow-mbg-500/20 hover:shadow-mbg-500/40 transform hover:-translate-y-0.5"
                            >
                                {processing ? 'Initializing...' : 'Initialize Access'}
                            </button>
                        </form>

                        <div className="text-center mt-10">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Secured by MBG Node</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

