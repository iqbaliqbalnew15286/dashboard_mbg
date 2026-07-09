import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import AdminLayout from './layouts/AdminLayout';

// Hapus eager: true untuk mengaktifkan Lazy Loading (memori lebih ringan)
const pages = import.meta.glob('./pages/**/*.jsx');

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
            // Promise handling untuk lazy load di Vite
            return page().then((module) => {
                module.default.layout = module.default.layout || ((pageComponent) => <AdminLayout>{pageComponent}</AdminLayout>);
                return module;
            });
        }

        return page();
    },
    
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    
    // Mematikan garis loading biru di atas layar
    progress: false, 
});