import React, { useState, useMemo, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
  FileSignature, Search, Calendar, Plus, 
  Trash2, Printer, X, FileText, CheckCircle2, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function BeritaAcaraIndex() {
  const { props } = usePage();
  const bas = props.bas || [];
  const availablePos = props.available_pos || [];

  // 1. Ambil pengaturan global dari Inertia
  const { pengaturanGlobal = {} } = props;

  // 2. Default Konfigurasi TTD untuk Berita Acara
  const defaultKonfigBA = { yayasan: false, pengawas: true, sppg: true, asisten: true, penerima: true };
  const konfigCetak = pengaturanGlobal.konfigurasi_cetak?.berita_acara || defaultKonfigBA;

  // FILTER STATE
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [tglAwal, setTglAwal] = useState('');
  const [tglAkhir, setTglAkhir] = useState('');

  // MODAL STATE
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(false);

  // FORM STATE
  const [form, setForm] = useState({
    tanggal_ba: new Date().toISOString().slice(0, 10),
    nomor_ba: '',
    purchase_order_id: '',
    keterangan: ''
  });

  // HELPER FORMAT TANGGAL LOKAL (Contoh: 10 Juli 2026)
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

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

  // LOGIKA FILTER TABLE REAL-TIME
  const filteredBas = useMemo(() => {
    return bas.filter(ba => {
      const po = ba.purchase_order || {};
      const matchSearch = 
        (ba.nomor_ba || '').toLowerCase().includes(search.toLowerCase()) || 
        (po.nomor_po || '').toLowerCase().includes(search.toLowerCase()) ||
        (ba.keterangan || '').toLowerCase().includes(search.toLowerCase());
      
      const matchKategori = filterKategori ? po.kategori_biaya === filterKategori : true;
      
      const baDateOnly = ba.tanggal_ba ? ba.tanggal_ba.split(' ')[0] : '';
      const matchTglAwal = tglAwal ? baDateOnly >= tglAwal : true;
      const matchTglAkhir = tglAkhir ? baDateOnly <= tglAkhir : true;
      
      return matchSearch && matchKategori && matchTglAwal && matchTglAkhir;
    });
  }, [bas, search, filterKategori, tglAwal, tglAkhir]);

  const totalNominal = useMemo(() => filteredBas.reduce((sum, b) => sum + (Number(b.purchase_order?.grand_total) || 0), 0), [filteredBas]);

  // AUTO FILL SAAT PO DIPILIH
  const selectedPo = useMemo(() => {
    return availablePos.find(p => p.id.toString() === form.purchase_order_id.toString()) || null;
  }, [form.purchase_order_id, availablePos]);

  // HANDLER SUBMIT
  const handleSimpan = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/berita-acara', form, {
      onSuccess: () => {
        toast.success('Berita Acara berhasil diterbitkan!');
        setIsInputModalOpen(false);
        setForm({ tanggal_ba: new Date().toISOString().slice(0, 10), nomor_ba: '', purchase_order_id: '', keterangan: '' });
      },
      onError: () => toast.error('Gagal menyimpan BA. Periksa kelengkapan input.'),
      onFinish: () => setLoading(false)
    });
  };

  const handleHapus = (id) => {
    if (confirm('Yakin ingin menghapus Berita Acara ini? Status PO akan dikembalikan.')) {
      router.delete(`/berita-acara/${id}`, {
        onSuccess: () => toast.success('Berita acara terhapus!')
      });
    }
  };

  const handlePrintRekap = () => {
    window.print();
  };

  // DAFTAR PEJABAT PENANDATANGAN DINAMIS
  const listPejabat = [
      { key: 'yayasan', jabatan: pengaturanGlobal.yayasan_jabatan || 'Kepala Yayasan / PIC', nama: pengaturanGlobal.yayasan_nama, nip: pengaturanGlobal.yayasan_nip },
      { key: 'pengawas', jabatan: pengaturanGlobal.pengawas_jabatan || 'Pengawas Keuangan', nama: pengaturanGlobal.pengawas_nama, nip: pengaturanGlobal.pengawas_nip },
      { key: 'sppg', jabatan: pengaturanGlobal.sppg_jabatan || 'Kepala SPPG', nama: pengaturanGlobal.sppg_nama, nip: pengaturanGlobal.sppg_nip },
      { key: 'asisten', jabatan: pengaturanGlobal.asisten_jabatan || 'Asisten Lapangan', nama: pengaturanGlobal.asisten_nama, nip: pengaturanGlobal.asisten_nip },
      { key: 'penerima', jabatan: pengaturanGlobal.penerima_jabatan || 'Penerima Barang', nama: pengaturanGlobal.penerima_nama, nip: pengaturanGlobal.penerima_nip },
  ];

  // Filter Pejabat berdasarkan konfigurasi di Pengaturan
  const pejabatTampil = listPejabat.filter(p => konfigCetak[p.key]);

  return (
    <div className="w-full pb-10 font-['Plus_Jakarta_Sans',sans-serif] relative space-y-6 bg-white min-h-screen print:pb-0 print:bg-white">
      <Toaster position="top-right" />
      
      {/* ======================================================== */}
      {/* 1. BAGIAN CETAK: REKAPITULASI TABEL BA (Print Main Page) */}
      {/* ======================================================== */}
      <div className={`w-full ${printData ? 'print:hidden' : 'block'}`}>
        
        {/* Kop Surat Khusus Cetak Rekap */}
        <div className="hidden print:block w-full mb-4">
            {pengaturanGlobal.kop_surat && (
                <div className="w-full mb-4 text-center flex justify-center">
                    {pengaturanGlobal.kop_surat.toLowerCase().endsWith('.pdf') ? (
                        <p className="text-xs text-red-500 italic">Preview PDF tidak didukung saat pencetakan, gunakan gambar (JPG/PNG).</p>
                    ) : (
                        <img src={`/storage/${pengaturanGlobal.kop_surat}`} alt="Kop Surat" className="w-full h-auto max-h-[160px] object-contain" />
                    )}
                </div>
            )}
            <div className="text-center mb-6">
                <h3 className="font-bold text-[16px] uppercase tracking-wider underline underline-offset-4">Rekapitulasi Berita Acara</h3>
            </div>
            <div className="flex gap-4 mb-1 text-[12px] font-bold text-slate-800">
                <div className="w-16">Periode</div>
                <div>: {tglAwal ? formatTanggalLokal(tglAwal) : 'Awal'} s/d {tglAkhir ? formatTanggalLokal(tglAkhir) : formatTanggalLokal(new Date().toISOString().split('T')[0])}</div>
            </div>
            {filterKategori && (
              <div className="flex gap-4 mb-2 text-[12px] font-bold text-slate-800">
                  <div className="w-16">Kategori</div>
                  <div>: {filterKategori}</div>
              </div>
            )}
        </div>

        {/* HEADER & FILTER (Layar Saja) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden px-4 md:px-0 pt-4 md:pt-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">BA Pengajuan Anggaran</h2>
            <p className="text-slate-500 text-sm mt-1">Kelola dan cetak Berita Acara (BA) pencairan dana.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <select 
              className="w-full sm:w-[160px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-xs text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
              value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Operasional">Operasional</option>
              <option value="Insentif Fasilitas">Insentif Fasilitas</option>
            </select>

            <div className="flex flex-1 sm:flex-none items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-all">
              <span className="pl-3 pr-2 text-slate-400"><Calendar size={14}/></span>
              <input type="date" value={tglAwal} onChange={(e) => setTglAwal(e.target.value)} className="py-2.5 px-1 bg-transparent font-bold text-xs text-slate-700 outline-none w-[110px] cursor-pointer" />
              <span className="px-1 bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest h-full flex items-center">s/d</span>
              <input type="date" value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} className="py-2.5 px-2 bg-transparent font-bold text-xs text-slate-700 outline-none w-[110px] cursor-pointer" />
            </div>

            <div className="relative w-full sm:w-[180px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={14} className="text-slate-400" /></span>
              <input 
                type="text" placeholder="Cari No BA, PO..." 
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-bold text-xs text-slate-700 outline-none focus:border-blue-500 transition-all" 
              />
            </div>

            {/* Tombol Cetak Daftar BA (Rekap) */}
            <button 
              onClick={handlePrintRekap} 
              disabled={filteredBas.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shrink-0 disabled:opacity-50"
            >
              <Printer size={16} /> Cetak Daftar
            </button>

            <button 
              onClick={() => setIsInputModalOpen(true)} 
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <Plus size={16} /> Buat BA
            </button>
          </div>
        </div>

        {/* TABEL DATA REKAP */}
        <div className="bg-white md:rounded-[2rem] md:border border-slate-200/60 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none mt-4 mx-4 md:mx-0">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse table-auto print:border print:border-black print:text-xs">
              
              {/* THEAD Layar */}
              <thead className="print:hidden bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 w-[60px] text-center border-b border-slate-100">No</th>
                  <th className="px-4 py-5 w-[140px] border-b border-slate-100">Tgl BA</th>
                  <th className="px-4 py-5 w-[180px] border-b border-slate-100">Nomor BA</th>
                  <th className="px-4 py-5 w-[180px] border-b border-slate-100">No. PO Ref</th>
                  <th className="px-4 py-5 text-left border-b border-slate-100">Keterangan</th>
                  <th className="px-4 py-5 w-[150px] text-center border-b border-slate-100">Kategori</th>
                  <th className="px-6 py-5 w-[150px] text-right border-b border-slate-100">Nominal (Rp)</th>
                  <th className="px-6 py-5 w-[120px] text-center border-b border-slate-100">Aksi</th>
                </tr>
              </thead>

              {/* THEAD Cetak */}
              <thead 
                className="hidden print:table-header-group text-[10px] font-black text-black uppercase tracking-widest border-b border-black"
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#b4c6e7' }}
              >
                <tr>
                  <th className="px-4 py-3 border border-black text-center">NO</th>
                  <th className="px-4 py-3 border border-black text-center">TGL BA</th>
                  <th className="px-4 py-3 border border-black text-center">NOMOR BA</th>
                  <th className="px-4 py-3 border border-black text-center">NO. PO REF</th>
                  <th className="px-4 py-3 border border-black text-center">KETERANGAN</th>
                  <th className="px-4 py-3 border border-black text-center">KATEGORI</th>
                  <th className="px-4 py-3 border border-black text-center">NOMINAL (Rp)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 text-sm align-middle print:divide-black">
                {filteredBas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400 print:border print:border-black">
                      <FileText size={40} className="mx-auto mb-3 opacity-20 text-blue-500 print:hidden" />
                      <p className="font-bold text-base text-slate-600">Data Berita Acara Kosong</p>
                      <p className="text-xs mt-1 print:hidden">Belum ada dokumen atau tidak sesuai kriteria filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBas.map((ba, idx) => (
                    <tr key={ba.id} className="hover:bg-slate-50/80 transition-colors print:text-black print:border print:border-black">
                      <td className="px-6 py-4 font-bold text-slate-400 text-center print:border print:border-black print:text-black print:text-[11px]">{idx + 1}</td>
                      <td className="px-4 py-4 font-bold text-slate-600 whitespace-nowrap print:border print:border-black print:text-black print:text-[11px]">{formatTanggalLokal(ba.tanggal_ba)}</td>
                      <td className="px-4 py-4 font-black text-blue-600 break-words print:border print:border-black print:text-black print:text-[11px]">{ba.nomor_ba}</td>
                      <td className="px-4 py-4 font-bold text-slate-700 break-words print:border print:border-black print:text-black print:text-[11px]">{ba.purchase_order?.nomor_po || '-'}</td>
                      <td className="px-4 py-4 font-medium text-slate-500 leading-tight print:border print:border-black print:text-black print:text-[11px]">{ba.keterangan}</td>
                      <td className="px-4 py-4 text-center print:border print:border-black print:text-black print:text-[11px]">
                        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap print:border-none print:shadow-none print:p-0">
                          {ba.purchase_order?.kategori_biaya || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-800 text-right whitespace-nowrap bg-slate-50/30 print:border print:border-black print:bg-transparent print:text-black print:text-[12px]">{formatRp(ba.purchase_order?.grand_total)}</td>
                      
                      {/* Kolom Aksi hanya di layar */}
                      <td className="px-6 py-4 print:hidden">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => setPrintData(ba)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Cetak Dokumen BA">
                            <Printer size={15}/>
                          </button>
                          <button onClick={() => handleHapus(ba.id)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Hapus BA">
                            <Trash2 size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* FOOTER TOTAL */}
              {filteredBas.length > 0 && (
                <>
                  <tfoot className="print:hidden bg-slate-900 border-t border-slate-800 text-white font-black">
                    <tr className="align-middle">
                      <td colSpan={6} className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">
                        TOTAL KESELURUHAN BA
                      </td>
                      <td className="px-6 py-5 text-right font-black text-lg text-blue-400 whitespace-nowrap">
                        {formatRp(totalNominal)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                  <tfoot className="hidden print:table-row-group text-black font-black">
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-right text-[11px] uppercase tracking-widest border border-black">
                        TOTAL KESELURUHAN BA
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] border border-black">
                        {formatRp(totalNominal)}
                      </td>
                    </tr>
                  </tfoot>
                </>
              )}
            </table>
          </div>
        </div>

        {/* Tanda Tangan Khusus Cetak Tabel Rekap */}
        {filteredBas.length > 0 && (
          <div className="hidden print:flex flex-wrap justify-around items-end mt-12 w-full gap-y-12" style={{ pageBreakInside: 'avoid' }}>
              {pejabatTampil.map((pejabat) => (
                  <div key={pejabat.key} className="text-center flex flex-col items-center justify-end w-48">
                      <p className="text-[12px] font-bold uppercase tracking-wider mb-20">{pejabat.jabatan}</p>
                      <div className="text-center">
                          <p className="font-bold text-[12px] uppercase underline underline-offset-4 mb-1">{pejabat.nama || '(..................................)'}</p>
                          {pejabat.nip && <p className="text-[10px]">NIP. {pejabat.nip}</p>}
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL INPUT BA BARU */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isInputModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <FileSignature className="text-blue-600" size={24} /> Form Berita Acara
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Lengkapi data untuk menerbitkan BA pembayaran.</p>
                </div>
                <button onClick={() => setIsInputModalOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"><X size={18} /></button>
              </div>
              
              <form onSubmit={handleSimpan} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Tanggal BA <span className="text-rose-500">*</span></label>
                    <input type="date" required value={form.tanggal_ba} onChange={(e) => setForm({...form, tanggal_ba: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nomor BA <span className="text-rose-500">*</span></label>
                    <input type="text" value={form.nomor_ba} onChange={(e) => setForm({...form, nomor_ba: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Kosongkan untuk otomatis..." />
                  </div>
                </div>

                <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Pilih Nomor PO (Tersedia) <span className="text-rose-500">*</span></label>
                    <select required value={form.purchase_order_id} onChange={(e) => setForm({...form, purchase_order_id: e.target.value})} className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl p-3.5 font-bold text-sm outline-none shadow-sm transition-all cursor-pointer appearance-none">
                      <option value="">Pilih No PO...</option>
                      {availablePos.map(po => (
                        <option key={po.id} value={po.id}>{po.nomor_po} - {po.kategori_biaya}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Hanya menampilkan PO yang belum memiliki Berita Acara.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Kategori Biaya (Auto)</label>
                      <input type="text" readOnly value={selectedPo ? selectedPo.kategori_biaya : '-'} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3.5 font-bold text-sm text-slate-500 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Nominal Pencairan (Auto)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-black text-slate-400 text-sm">Rp</span>
                        <input type="text" readOnly value={selectedPo ? selectedPo.grand_total.toLocaleString('id-ID') : '0'} className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3.5 pr-4 pl-11 text-right font-black text-slate-800 text-sm cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2 tracking-widest">Keterangan Pengajuan <span className="text-rose-500">*</span></label>
                  <textarea required value={form.keterangan} onChange={(e) => setForm({...form, keterangan: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-semibold placeholder:text-slate-400" placeholder="Contoh: Pembayaran bahan baku sayuran dan protein..."></textarea>
                </div>
              </form>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0 gap-3">
                <button type="button" onClick={() => setIsInputModalOpen(false)} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="button" onClick={handleSimpan} disabled={loading || !form.purchase_order_id} className="px-8 py-3.5 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/30">
                  {loading ? <><Loader2 size={16} className="animate-spin"/> Memproses...</> : 'Terbitkan BA'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. BAGIAN CETAK: PREVIEW DOKUMEN INDIVIDUAL BA */}
      {/* ======================================================== */}
      <AnimatePresence>
        {printData && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none border border-slate-200/60 print:border-none">
              
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center shrink-0 print:hidden">
                <h5 className="font-black flex items-center gap-2"><Printer size={18} className="text-blue-400" /> Preview Berita Acara Cetak</h5>
                <button onClick={() => setPrintData(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 print:bg-white print:overflow-visible print:p-0">
                <div className="bg-white p-8 md:p-12 shadow-sm border border-slate-200 mx-auto print:shadow-none print:border-none print:w-full print:max-w-none relative" style={{ maxWidth: '900px', minHeight: '297mm' }}>
                  
                  {/* CSS KHUSUS CETAK INDIVIDUAL BA */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      body * { visibility: hidden; }
                      .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
                      .print\\:bg-white { position: absolute; left: 0; top: 0; width: 100%; overflow: visible !important; }
                      .print\\:hidden { display: none !important; }
                      @page { margin: 1cm; size: portrait; }
                    }
                    .judul-ba { text-align: center; font-weight: bold; margin-top: 20px; font-size: 16px; font-family: 'Times New Roman', Times, serif;}
                    .nomor-ba { text-align: center; margin-bottom: 30px; font-size: 15px; font-family: 'Times New Roman', Times, serif;}
                    .paragraf-ba { text-align: justify; text-justify: inter-word; font-family: 'Times New Roman', Times, serif; font-size: 15px; line-height: 1.6; margin-bottom: 25px; text-indent: 40px; }
                    .table-cetak-ba { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 14px; margin-bottom: 40px; }
                    .table-cetak-ba th { background-color: #b4c6e7 !important; -webkit-print-color-adjust: exact; color: black; border: 1px solid black; text-align: center; padding: 10px; font-weight: bold;}
                    .table-cetak-ba td { border: 1px solid black; padding: 8px; }
                  `}} />

                  {/* KOP SURAT INDIVIDUAL BA */}
                  {pengaturanGlobal.kop_surat && (
                      <div className="w-full mb-4 text-center flex justify-center">
                          {pengaturanGlobal.kop_surat.toLowerCase().endsWith('.pdf') ? (
                              <p className="text-xs text-red-500 italic print:hidden">Gunakan JPG/PNG untuk cetakan PDF.</p>
                          ) : (
                              <img src={`/storage/${pengaturanGlobal.kop_surat}`} alt="Kop Surat" className="w-full h-auto max-h-[160px] object-contain" />
                          )}
                      </div>
                  )}

                  <div className="judul-ba">BERITA ACARA PENGAJUAN PEMBAYARAN KEPADA PIC</div>
                  <div className="nomor-ba">{printData.nomor_ba}</div>

                  <div className="paragraf-ba">
                    Pada hari ini, tanggal <strong>{formatTanggalLokal(printData.tanggal_ba)}</strong>, telah diajukan pencairan anggaran untuk kebutuhan operasional/pengadaan barang berdasarkan Purchase Order (PO) sistem nomor <strong>{printData.purchase_order?.nomor_po}</strong>. Dokumen ini menjadi bukti sah pengajuan dan validasi pencairan dana dari Manajemen Keuangan. Detail pengajuan adalah sebagai berikut:
                  </div>

                  <table className="table-cetak-ba">
                    <thead>
                      <tr>
                        <th style={{ width: '5%' }}>NO</th>
                        <th style={{ width: '20%' }}>TANGGAL</th>
                        <th style={{ width: '35%' }}>KETERANGAN</th>
                        <th style={{ width: '20%' }}>NOMINAL</th>
                        <th style={{ width: '20%' }}>KATEGORI BIAYA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'center' }}>{formatTanggalLokal(printData.tanggal_ba)}</td>
                        <td>{printData.keterangan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRp(printData.purchase_order?.grand_total)}</td>
                        <td style={{ textAlign: 'center' }}>{printData.purchase_order?.kategori_biaya}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* TANDA TANGAN DINAMIS INDIVIDUAL BA */}
                  <div className="flex flex-wrap justify-around items-end mt-12 w-full gap-y-12" style={{ pageBreakInside: 'avoid' }}>
                      {pejabatTampil.map((pejabat) => (
                          <div key={pejabat.key} className="text-center flex flex-col items-center justify-end w-48 font-['Times_New_Roman',Times,serif]">
                              <p className="text-[14px] font-bold uppercase tracking-wider mb-20">
                                  {pejabat.jabatan}
                              </p>
                              <div className="text-center">
                                  <p className="font-bold text-[14px] uppercase underline underline-offset-4 mb-1">
                                      {pejabat.nama || '(..................................)'}
                                  </p>
                                  {pejabat.nip && (
                                      <p className="text-[12px]">NIP. {pejabat.nip}</p>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                </div>
              </div>
              
              <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0 gap-3 print:hidden">
                <button type="button" onClick={() => setPrintData(null)} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Tutup Preview</button>
                <button type="button" onClick={() => window.print()} className="px-8 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                  <Printer size={16} /> Cetak Dokumen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}