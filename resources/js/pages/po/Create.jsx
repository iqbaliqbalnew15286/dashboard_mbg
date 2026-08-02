import React, { useState, useMemo } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { 
  FileText, Search, Printer, Edit2, RotateCcw, 
  ShoppingBag, CheckCircle2, ChevronRight, Layers, Truck, Building2 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ListPoIndex() {
    const { props } = usePage();
    const pos = props.pos || [];
    const kategoriBiayasProp = props.kategori_biayas || [];
    const filters = props.filters || {};
    const { pengaturanGlobal = {} } = props;

    const [selectedKategori, setSelectedKategori] = useState(filters.kategori || '');
    const [search, setSearch] = useState(filters.search || '');
    const [printPo, setPrintPo] = useState(null);

    const defaultKategoris = ['Bahan Baku', 'Operasional', 'Insentif Fasilitas'];
    const daftarKategori = kategoriBiayasProp.length > 0
        ? kategoriBiayasProp.map(k => k.nama_kategori)
        : defaultKategoris;

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
        const originalTitle = document.title;
        document.title = ''; // Hapus title sementara agar header cetakan browser bersih dari 'MBG Internal'
        setPrintPo(po);
        setTimeout(() => {
            window.print();
            document.title = originalTitle;
        }, 300);
    };

    const handleReset = () => {
        setSelectedKategori('');
        setSearch('');
    };

    // Signatures / Pejabat Penandatangan dari Pengaturan Global
    const kotaPengaturan = pengaturanGlobal.kota || 'Bogor';

    // Konfigurasi TTD untuk PO / Nota Pesanan dari Pengaturan
    const defaultKonfigPO = { yayasan: false, pengawas: true, sppg: true, asisten: true, penerima: false };
    const konfigCetakPo = pengaturanGlobal.konfigurasi_cetak?.po || defaultKonfigPO;

    // Daftar Pejabat Penandatangan Dinamis dari Pengaturan Global
    const listPejabat = [
        { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
        { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
        { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
        { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
        { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
    ];

    // Filter Pejabat berdasarkan Toggle Checkbox di Pengaturan untuk PO
    const pejabatTampilPo = listPejabat.filter(p => konfigCetakPo[p.key]);

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
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    
                    {/* DROPDOWN KATEGORI BIAYA */}
                    <div className="flex-1 max-w-md">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                            Pilih Kategori Biaya
                        </label>
                        <div className="relative">
                            <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedKategori}
                                onChange={(e) => setSelectedKategori(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-10 text-sm font-extrabold text-slate-800 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 cursor-pointer appearance-none"
                            >
                                <option value="">Semua Kategori (List PO)</option>
                                {daftarKategori.map(kat => (
                                    <option key={kat} value={kat}>{kat}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={18} className="rotate-90" />
                            </div>
                        </div>
                    </div>

                    {/* INPUT PENCARIAN */}
                    <div className="flex-1 max-w-md">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">
                            Cari PO / Supplier / Item
                        </label>
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Nomor PO, Supplier, atau Nama Barang..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>
                    </div>

                    {/* RESET */}
                    <div className="flex items-end">
                        <button
                            onClick={handleReset}
                            className="px-5 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 shrink-0"
                            title="Reset Filter"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>

                </div>
            </div>

            {/* DAFTAR NOTA PO TERPISAH PER SUPPLIER */}
            <div className="space-y-6 print:hidden">
                {filteredPos.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 p-16 text-center shadow-sm">
                        <ShoppingBag size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="font-extrabold text-lg text-slate-700">Tidak ada Purchase Order (PO) ditemukan</h3>
                        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                            Buat RAB terlebih dahulu di menu <strong>[+ BUAT RAB BARU]</strong> agar nota pesanan diterbitkan secara otomatis per supplier.
                        </p>
                        <div className="mt-6">
                            <Link href="/rab/create" className="px-6 py-3 bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-all inline-flex items-center gap-2 shadow-md">
                                + Buat RAB Baru
                            </Link>
                        </div>
                    </div>
                ) : (
                    filteredPos.map((po) => {
                        const supplierObj = po.details && po.details[0] ? po.details[0].supplier : null;
                        const supplierName = supplierObj ? supplierObj.nama_perusahaan : 'Supplier Pengadaan';
                        const supplierSales = supplierObj?.sales_person || '-';
                        const supplierTelp = supplierObj?.no_telp || '-';

                        return (
                            <div key={po.id} className="bg-white rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                
                                {/* CARD HEADER PO */}
                                <div className="bg-slate-900 text-white px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-black text-lg tracking-wide text-white">{supplierName}</h3>
                                                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    po.kategori_biaya === 'Bahan Baku'
                                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                                    : po.kategori_biaya === 'Insentif Fasilitas'
                                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                                }`}>
                                                    {po.kategori_biaya}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                No PO: <strong className="text-blue-400 font-bold">#{po.nomor_po}</strong> • Tgl Pesan: {formatTanggalLokal(po.tanggal_pesan)} • Kontak: {supplierSales} ({supplierTelp})
                                            </p>
                                        </div>
                                    </div>

                                    {/* TOMBOL AKSI CETAK & REVISI VIA RAB */}
                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                        {po.rab_id && (
                                            <Link
                                                href={`/rab/${po.rab_id}/edit`}
                                                className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
                                                title="Revisi Data PO ini dari RAB Pusat"
                                            >
                                                <Edit2 size={14} /> Revisi via RAB
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handlePrintPo(po)}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                                        >
                                            <Printer size={16} /> Cetak Nota PO
                                        </button>
                                    </div>
                                </div>

                                {/* RINCIAN ITEM BANNER PO */}
                                <div className="p-6 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 w-16 text-center">No</th>
                                                <th className="px-6 py-3">Nama Bahan / Pengadaan</th>
                                                <th className="px-6 py-3 text-center w-24">Qty</th>
                                                <th className="px-6 py-3 text-center w-28">Satuan</th>
                                                <th className="px-6 py-3 text-right w-40">Harga Satuan</th>
                                                <th className="px-6 py-3 text-right w-44">Total Sub</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm align-middle">
                                            {po.details && po.details.map((detail, idx) => {
                                                const itemNama = detail.nama_pengadaan || detail.bahan_baku?.nama_barang || '-';
                                                const satuan = detail.bahan_baku?.satuan || 'KG';
                                                return (
                                                    <tr key={detail.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-6 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                                        <td className="px-6 py-3.5 font-black text-slate-800">{itemNama}</td>
                                                        <td className="px-6 py-3.5 text-center font-black text-blue-600 bg-blue-50/30">{Number(detail.qty)}</td>
                                                        <td className="px-6 py-3.5 text-center font-bold text-slate-500 uppercase text-xs tracking-wider">{satuan}</td>
                                                        <td className="px-6 py-3.5 text-right font-bold text-slate-600">{formatRp(detail.harga_satuan)}</td>
                                                        <td className="px-6 py-3.5 text-right font-black text-emerald-700 bg-emerald-50/20">{formatRp(detail.subtotal)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50/80 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-right font-black text-xs uppercase tracking-widest text-slate-500">
                                                    Grand Total Nota Pesanan PO #{po.nomor_po}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-base text-blue-600">
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
            {/* PRINT VIEW: OFFICIAL NOTA PESANAN (TAMPIL HANYA SAAT CETAK) */}
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

                    {/* SECTION TANDA TANGAN DINAMIS SESUAI PENGATURAN */}
                    <div className="mt-12 text-sm">
                        <p className="mb-10 text-left font-bold">
                            {kotaPengaturan}, {formatTanggalLokal(printPo.tanggal_pesan)}
                        </p>

                        <div className={`grid text-center font-bold uppercase gap-4 ${
                            pejabatTampilPo.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                            pejabatTampilPo.length === 2 ? 'grid-cols-2 max-w-lg mx-auto' :
                            pejabatTampilPo.length === 3 ? 'grid-cols-3' :
                            pejabatTampilPo.length === 4 ? 'grid-cols-4' :
                            'grid-cols-5'
                        }`} style={{ pageBreakInside: 'avoid' }}>
                            {pejabatTampilPo.map((pejabat) => (
                                <div key={pejabat.key} className="text-center flex flex-col items-center justify-end">
                                    <p className="mb-20 tracking-wider text-xs">{pejabat.jabatan}</p>
                                    <p className="underline font-black text-xs">{pejabat.nama || '(..................................)'}</p>
                                    {pejabat.nip && <p className="text-[10px] text-slate-500 font-normal mt-0.5">NIP. {pejabat.nip}</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* INJECT PRINT LAYOUT STYLE */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: portrait; margin: 12mm 15mm; }
                    body * { 
                        visibility: hidden; 
                    }
                    .print\\:block, .print\\:block * { 
                        visibility: visible; 
                    }
                    .print\\:block { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                    }
                    nav, header, footer, aside, .sidebar, .print\\:hidden { 
                        display: none !important; 
                    }
                }
            `}} />

        </div>
    );
}