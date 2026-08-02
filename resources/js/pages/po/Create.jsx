import React, { useState, useEffect, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Printer, Search, RotateCcw, Box, Truck, 
    FileText, ArrowRightLeft, Calendar, Edit2, X, AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PoList() {
    const { props } = usePage();
    const { 
        pos = [], 
        kategori_biayas = [], 
        filters = {},
        pengaturanGlobal = {}
    } = props;

    const defaultKategoris = ['Bahan Baku', 'Operasional', 'Insentif Fasilitas'];
    const daftarKategori = kategori_biayas.length > 0
        ? kategori_biayas.map(k => k.nama_kategori)
        : defaultKategoris;

    // Filter States
    const [selectedKategori, setSelectedKategori] = useState(filters.kategori || 'Bahan Baku');
    const [search, setSearch] = useState(filters.search || '');
    
    // State untuk Modal / Modal Cetak Nota PO
    const [printPo, setPrintPo] = useState(null);

    // Formatters
    const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

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

    // Filter Data PO lokal
    const filteredPos = useMemo(() => {
        return pos.filter(po => {
            const matchKat = !selectedKategori || po.kategori_biaya === selectedKategori;
            const matchSearch = !search || 
                (po.nomor_po && po.nomor_po.toLowerCase().includes(search.toLowerCase())) ||
                (po.kategori_biaya && po.kategori_biaya.toLowerCase().includes(search.toLowerCase())) ||
                (po.details && po.details.some(d => 
                    (d.nama_pengadaan && d.nama_pengadaan.toLowerCase().includes(search.toLowerCase())) ||
                    (d.bahan_baku?.nama_barang && d.bahan_baku.nama_barang.toLowerCase().includes(search.toLowerCase())) ||
                    (d.supplier?.nama_perusahaan && d.supplier.nama_perusahaan.toLowerCase().includes(search.toLowerCase()))
                ));
            return matchKat && matchSearch;
        });
    }, [pos, selectedKategori, search]);

    const handlePrintPo = (po) => {
        setPrintPo(po);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleReset = () => {
        setSelectedKategori('');
        setSearch('');
    };

    // Signatures / Pejabat Penandatangan dari Pengaturan Global
    const kotaPengaturan = pengaturanGlobal.kota || 'Bogor';

    return (
        <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] space-y-6 min-h-screen bg-slate-50/50 print:bg-white print:p-0">
            <Toaster position="top-right" />

            {/* ======================================================== */}
            {/* SCREEN VIEW (LIST PO DISPLAY)                            */}
            {/* ======================================================== */}
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                            <FileText size={22} />
                        </div>
                        List Purchase Order (PO)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Output nota pesanan per supplier yang terdaftar otomatis dari RAB.</p>
                </div>
            </div>

            {/* FILTER KATEGORI & PENCARIAN */}
            <div className="bg-white rounded-[2rem] border border-blue-100 p-6 shadow-sm relative overflow-hidden print:hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-amber-500"></div>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    
                    {/* DROP-DOWN KATEGORI */}
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pilih Kategori PO</label>
                        <div className="relative">
                            <Box size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all cursor-pointer"
                                value={selectedKategori}
                                onChange={(e) => setSelectedKategori(e.target.value)}
                            >
                                <option value="">Semua Kategori</option>
                                {daftarKategori.map(kat => (
                                    <option key={kat} value={kat}>{kat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* SEARCH INPUT */}
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Pencarian No. PO / Supplier / Item</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition-all"
                                placeholder="Cari nomor PO, supplier, atau item..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* RESET BUTTON */}
                    <button
                        onClick={handleReset}
                        className="p-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                        title="Reset Filter"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            {/* DAFTAR NOTA PO PER SUPPLIER */}
            <div className="space-y-6 print:hidden">
                {filteredPos.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 p-16 text-center text-slate-400 shadow-sm">
                        <Box size={48} className="mx-auto mb-3 opacity-30 text-blue-500" />
                        <h3 className="font-bold text-lg text-slate-600">Tidak Ada Data Nota PO Ditemukan</h3>
                        <p className="text-xs mt-1">Coba sesuaikan pilihan kategori atau kata kunci pencarian Anda.</p>
                    </div>
                ) : (
                    filteredPos.map((po) => {
                        const supplierObj = po.details && po.details[0] ? po.details[0].supplier : null;
                        const supplierName = supplierObj ? supplierObj.nama_perusahaan : (po.details && po.details[0]?.nama_pengadaan || 'Supplier Umum');

                        return (
                            <div key={po.id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:border-blue-200 transition-all">
                                {/* CARD HEADER */}
                                <div className="px-8 py-5 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black shrink-0">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-800 text-base">#{po.nomor_po}</h3>
                                                <span className={`px-3 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    po.kategori_biaya === 'Bahan Baku'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : po.kategori_biaya === 'Insentif Fasilitas'
                                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                    {po.kategori_biaya}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-bold mt-0.5 flex items-center gap-2">
                                                <span>Supplier: <strong className="text-slate-800">{supplierName}</strong></span>
                                                <span>•</span>
                                                <span>Tgl Pesan: {formatTanggalLokal(po.tanggal_pesan)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* CARD ACTIONS */}
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        {po.rab_id && (
                                            <Link
                                                href={`/rab/${po.rab_id}/edit`}
                                                className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                                title="Revisi PO ini via RAB Pusat"
                                            >
                                                <Edit2 size={14} /> Revisi via RAB
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handlePrintPo(po)}
                                            className="px-5 py-2 bg-slate-900 text-white hover:bg-blue-600 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-md shrink-0"
                                        >
                                            <Printer size={15} /> Cetak Nota PO
                                        </button>
                                    </div>
                                </div>

                                {/* CARD TABLE RINCIAN */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-50/40 text-[9px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-8 py-3.5 w-12 text-center">NO</th>
                                                <th className="px-6 py-3.5">NAMA BAHAN / TRANSAKSI</th>
                                                <th className="px-6 py-3.5 text-center">QTY</th>
                                                <th className="px-6 py-3.5 text-center">SATUAN</th>
                                                <th className="px-6 py-3.5 text-right">HARGA SATUAN</th>
                                                <th className="px-8 py-3.5 text-right">TOTAL SUB</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {po.details && po.details.length > 0 ? (
                                                po.details.map((d, idx) => {
                                                    const itemNama = d.nama_pengadaan || d.bahan_baku?.nama_barang || '-';
                                                    const satuan = d.bahan_baku?.satuan || 'KG';
                                                    return (
                                                        <tr key={d.id || idx} className="hover:bg-slate-50/50">
                                                            <td className="px-8 py-4 font-bold text-slate-400 text-center">{idx + 1}</td>
                                                            <td className="px-6 py-4 font-black text-slate-800">{itemNama}</td>
                                                            <td className="px-6 py-4 font-black text-blue-600 text-center">{d.qty}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-500 text-center uppercase">{satuan}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-700 text-right">{formatRp(d.harga_satuan)}</td>
                                                            <td className="px-8 py-4 font-black text-emerald-600 text-right">{formatRp(d.subtotal)}</td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-6 text-center text-slate-400">Tidak ada rincian item.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50 border-t border-slate-100 font-black">
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-right text-xs uppercase tracking-wider text-slate-500">
                                                    Total Nota PO ({supplierName})
                                                </td>
                                                <td className="px-8 py-4 text-right text-base text-slate-800">
                                                    {formatRp(po.grand_total)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ======================================================== */}
            {/* LAYOUT CETAK OFFICIAL NOTA PESANAN (KHUSUS PADA CETAKAN)  */}
            {/* ======================================================== */}
            {printPo && (
                <div className="hidden print:block w-full font-['Times_New_Roman',serif] text-black leading-relaxed">
                    
                    {/* HEADING TITLE */}
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold uppercase tracking-wider underline underline-offset-4">
                            {printPo.kategori_biaya === 'Bahan Baku' 
                                ? 'NOTA PESANAN BAHAN BAKU PANGAN'
                                : printPo.kategori_biaya === 'Insentif Fasilitas'
                                ? 'NOTA PESANAN INSENTIF FASILITAS'
                                : 'NOTA PESANAN OPERASIONAL'
                            }
                        </h2>
                        <p className="text-sm font-bold mt-1">
                            PO {printPo.nomor_po}
                        </p>
                    </div>

                    {/* PARAGRAF PERNYATAAN */}
                    <p className="text-sm text-justify mb-6 indent-8">
                        Pada hari ini, tanggal <strong className="font-bold">{formatTanggalLokal(printPo.tanggal_pesan)}</strong>, telah diajukan pencairan anggaran untuk kebutuhan operasional/pengadaan barang berdasarkan Purchase Order (PO) sistem nomor <strong className="font-bold">{printPo.nomor_po}</strong>. Dokumen ini menjadi bukti sah pengajuan dan validasi pencairan dana dari Manajemen Keuangan. Detail pengajuan adalah sebagai berikut:
                    </p>

                    {/* TABEL OFFICIAL NOTA PESANAN */}
                    <div className="w-full mb-6 border border-slate-300 rounded-2xl overflow-hidden">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-slate-50 border-b border-slate-300 font-bold text-[11px] uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="py-3 px-4 text-center border-r border-slate-200 w-12">NO</th>
                                    <th className="py-3 px-4 text-left border-r border-slate-200">NAMA BAHAN/TRANSAKSI</th>
                                    <th className="py-3 px-4 text-center border-r border-slate-200 w-20">QTY</th>
                                    <th className="py-3 px-4 text-center border-r border-slate-200 w-24">SATUAN</th>
                                    <th className="py-3 px-4 text-right border-r border-slate-200 w-36">HARGA SATUAN</th>
                                    <th className="py-3 px-4 text-right w-40">TOTAL SUB</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {printPo.details && printPo.details.map((d, idx) => {
                                    const itemNama = d.nama_pengadaan || d.bahan_baku?.nama_barang || '-';
                                    const satuan = d.bahan_baku?.satuan || 'KG';
                                    return (
                                        <tr key={d.id || idx} className="align-middle">
                                            <td className="py-3 px-4 text-center font-bold border-r border-slate-200 text-slate-500">{idx + 1}</td>
                                            <td className="py-3 px-4 font-bold border-r border-slate-200 text-slate-900">{itemNama}</td>
                                            <td className="py-3 px-4 text-center font-black border-r border-slate-200 text-blue-600">{d.qty}</td>
                                            <td className="py-3 px-4 text-center font-bold border-r border-slate-200 text-slate-500 uppercase">{satuan}</td>
                                            <td className="py-3 px-4 text-right font-bold border-r border-slate-200 text-slate-700">{formatRp(d.harga_satuan)}</td>
                                            <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRp(d.subtotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* GRAND TOTAL SUMMARY */}
                    <div className="flex justify-end items-center gap-8 mb-12 text-sm font-bold pr-4">
                        <span className="text-slate-800">Total</span>
                        <span className="text-base font-black text-slate-900">{formatRp(printPo.grand_total)}</span>
                    </div>

                    {/* SECTION TANDA TANGAN */}
                    <div className="mt-12 text-sm">
                        <p className="mb-10 text-left font-bold">
                            {kotaPengaturan}, {formatTanggalLokal(printPo.tanggal_pesan)}
                        </p>

                        <div className="grid grid-cols-3 text-center font-bold uppercase gap-4" style={{ pageBreakInside: 'avoid' }}>
                            <div>
                                <p className="mb-20 tracking-wider">PENGAWAS KEUANGAN</p>
                                <p className="underline font-black">{pengaturanGlobal.pengawas_nama || '(..................................)'}</p>
                                {pengaturanGlobal.pengawas_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.pengawas_nip}</p>}
                            </div>
                            <div>
                                <p className="mb-20 tracking-wider">KEPALA SPPG</p>
                                <p className="underline font-black">{pengaturanGlobal.sppg_nama || '(..................................)'}</p>
                                {pengaturanGlobal.sppg_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.sppg_nip}</p>}
                            </div>
                            <div>
                                <p className="mb-20 tracking-wider">ASISTEN LAPANGAN</p>
                                <p className="underline font-black">{pengaturanGlobal.asisten_nama || '(..................................)'}</p>
                                {pengaturanGlobal.asisten_nip && <p className="text-xs text-slate-500 font-normal">NIP. {pengaturanGlobal.asisten_nip}</p>}
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* INJECT PRINT LAYOUT STYLE */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: portrait; margin: 1.5cm; }
                    body { 
                        background: white !important; 
                        color: black !important;
                    }
                    nav, header, footer, aside, .sidebar, .print\\:hidden { 
                        display: none !important; 
                    }
                    .print\\:block { 
                        display: block !important; 
                    }
                }
            `}} />

        </div>
    );
}