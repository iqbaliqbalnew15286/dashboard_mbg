import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Package, ClipboardList, Users, 
  Building2, LogOut, ChevronLeft, Settings, Wallet, Database, 
  FileEdit, FileSignature, PieChart, ListOrdered, Truck
} from 'lucide-react';

const MENU_SECTIONS = [
  {
    title: 'Utama',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'RAB', path: '/rab', icon: <Wallet size={20} /> },
      { name: 'Input PO', path: '/purchase-orders/create', icon: <FileEdit size={20} /> },
      { name: 'Transaksi', path: '/transaksi', icon: <ListOrdered size={20} /> },
      { name: 'Berita Acara', path: '/berita-acara', icon: <FileSignature size={20} /> },
      { name: 'Laporan', path: '/laporan', icon: <PieChart size={20} /> },
    ]
  },
  {
    title: 'Master Data',
    items: [
      { name: 'Bahan Baku', path: '/master/bahan-baku', icon: <Database size={20} /> },
      { name: 'Operasional', path: '/master/operasional', icon: <Building2 size={20} /> },
      { name: 'Supplier', path: '/master/supplier', icon: <Truck size={20} /> },
    ]
  },
  {
    title: 'Laporan Stok',
    items: [
      { name: 'Terima Barang', path: '/stok/terima', icon: <ClipboardList size={20} /> },
      { name: 'Riwayat Masuk', path: '/stok/riwayat-masuk', icon: <Package size={20} /> },
      { name: 'Barang Keluar', path: '/stok/keluar', icon: <Package size={20} /> },
      { name: 'Rekap Stok', path: '/stok/rekap', icon: <Package size={20} /> },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { name: 'Manajemen Akses', path: '/user', icon: <Users size={20} /> },
    ]
  }
];

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);
  
  const { url } = usePage();

  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  const bottomButtonStyle = `w-full h-12 rounded-xl border border-white/20 text-slate-300 flex items-center font-bold text-xs hover:bg-rose-500 hover:text-white hover:border-transparent transition-all uppercase tracking-widest ${isSidebarOpen ? "px-4 gap-3" : "justify-center"}`;

  return (
    <div className="flex h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden selection:bg-slate-300">
      
      {/* SIDEBAR */}
      <aside
        className={`
          relative ${isSidebarOpen ? "w-[280px]" : "w-[90px]"}
          transition-all duration-500 ease-in-out shrink-0 flex flex-col h-full
          bg-gradient-to-b from-slate-900 via-slate-800 to-zinc-900
          shadow-xl z-20
        `}
      >
        <div className="absolute top-0 left-0 w-full h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* LOGO AREA - Diperbaiki layout & spacing agar proporsional */}
        <div className={`relative z-10 shrink-0 flex items-center h-[90px] transition-all duration-300 ${isSidebarOpen ? "px-6" : "px-0 justify-center"}`}>
          <div className="flex items-center gap-3 w-full">
            
            {/* Ukuran logo proporsional (w-12 h-12) */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img 
                src="/images/logo.png" 
                alt="logo" 
                className="w-full h-full object-contain drop-shadow-md" 
                onError={(e) => { 
                  e.target.style.display='none'; 
                  e.target.nextSibling.style.display='flex'; 
                }} 
              />
              {/* Fallback Inisial Jika Gambar Tidak Ada */}
              <div className="hidden w-full h-full bg-blue-600 rounded-xl items-center justify-center text-white font-black text-2xl shadow-md shadow-blue-600/30">
                M
              </div>
            </div>
            
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }} 
                  animate={{ width: "auto", opacity: 1 }} 
                  exit={{ width: 0, opacity: 0 }} 
                  className="flex flex-col overflow-hidden whitespace-nowrap"
                >
                  <p className="font-black text-white text-[13px] leading-tight tracking-wide">
                    LAPORAN KEUANGAN
                  </p>
                  <p className="font-bold text-blue-400 text-[10px] leading-tight mt-1 tracking-[0.05em] uppercase">
                    SPPG BANTARJATI 03
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* NAVIGATION GROUPS */}
        <nav className="flex-1 mt-2 relative z-10 flex flex-col gap-6 py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {MENU_SECTIONS.map((group) => (
            <div key={group.title}>
              {isSidebarOpen && (
                <p className="px-8 text-[10px] font-black text-slate-400/50 uppercase tracking-widest mb-2 select-none">
                  {group.title}
                </p>
              )}
              
              {group.items.map((item) => {
                const isActive = url === item.path || (item.path !== '/dashboard' && url.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className="relative flex items-center h-[48px] px-6 group"
                    title={!isSidebarOpen ? item.name : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute inset-y-0 left-3 right-0 bg-slate-50 rounded-l-2xl z-0"
                      >
                        <div className="absolute -top-6 right-0 w-6 h-6 bg-transparent rounded-br-2xl shadow-[12px_12px_0_0_#f8fafc]" />
                        <div className="absolute -bottom-6 right-0 w-6 h-6 bg-transparent rounded-tr-2xl shadow-[12px_-12px_0_0_#f8fafc]" />
                      </motion.div>
                    )}

                    <div className={`relative z-10 flex items-center gap-4 pl-2 transition-colors duration-300 ${isActive ? "text-slate-900" : "text-slate-300 group-hover:text-white"}`}>
                      <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</div>
                      <AnimatePresence>
                        {isSidebarOpen && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-sm whitespace-nowrap">
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER SIDEBAR - LINK KE PENGATURAN */}
        <div className="p-6 relative z-10 space-y-3 shrink-0 border-t border-white/10">
          <Link href="/pengaturan" className={`w-full h-12 rounded-xl bg-white/10 text-white flex items-center font-bold text-xs transition-all tracking-wide hover:bg-white/20 ${isSidebarOpen ? "px-4 gap-3" : "justify-center"}`}>
            <Settings size={18} className="shrink-0" /> {isSidebarOpen && <span className="truncate">Pengaturan</span>}
          </Link>
          
          <button onClick={handleLogout} className={bottomButtonStyle}>
            <LogOut size={18} className="shrink-0" /> {isSidebarOpen && "Logout"}
          </button>
        </div>

        {/* TOGGLE BUTTON */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-12 -right-4 z-50 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 text-slate-800"
        >
          <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
            <ChevronLeft size={16} strokeWidth={2.5} />
          </motion.div>
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10 bg-slate-50">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}