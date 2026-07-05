import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import AdminLayout from './layouts/AdminLayout';

// Eager load semua halaman agar navigasi instan tanpa jeda download
const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });

// MEMBUAT LOOKUP TABLE (Solusi untuk Error Page Not Found)
// Mengubah semua path menjadi huruf kecil agar case-insensitive
const pageLookup = {};
for (const path in pages) {
    const normalizedKey = path
        .replace('./pages/', '') // Hapus awalan './pages/'
        .replace('.jsx', '')     // Hapus akhiran '.jsx'
        .toLowerCase();          // Jadikan huruf kecil semua
        
    pageLookup[normalizedKey] = pages[path];
}

createInertiaApp({
    title: (title) => `${title} - MBG Internal`,
    
        resolve: (name) => {
        // Normalisasi nama yang dipanggil controller menjadi huruf kecil juga
        // Inertia biasanya mengirim nama seperti "master/operasional/Index" (huruf besar kecil bisa bervariasi)
        // Kita normalisasi agar pencarian aman.
        const normalizedName = name.toLowerCase();

    // Cari halaman di lookup table
        let page = pageLookup[normalizedName];

        // Fallback: perbaiki variasi path case/format Inertia
        if (!page) {
            const candidates = [
                normalizedName.replace('/index', '/Index'),
                normalizedName.replace('/index', ''),
                normalizedName.replace('index', 'Index'),
                normalizedName.replace('operasional', 'Operasional'),
                normalizedName.replace('master/operasional/index', 'master/operasional/Index'),
                normalizedName.replace('master/operasional', 'master/operasional'),
            ];

            for (const c of candidates) {
                page = pageLookup[c];
                if (page) break;
            }
        }



        if (!page) {
            throw new Error(`Page not found: ${name} (dicari sebagai: ${normalizedName})`);
        }

        // Persistent Layout agar sidebar tidak berkedip
        const isAuthPage = normalizedName.includes('auth') || normalizedName.includes('login');
        if (!isAuthPage) {
            page.default.layout = page.default.layout || ((pageComponent) => <AdminLayout>{pageComponent}</AdminLayout>);
        }

        return page;
    },
    
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    
    // Mematikan garis loading biru di atas layar
    progress: false, 
});