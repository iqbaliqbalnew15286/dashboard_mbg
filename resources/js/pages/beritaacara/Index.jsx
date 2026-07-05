import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import { 
  FileSignature, Search, Calendar, Plus, 
  Trash2, Printer, X, FileText, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function BeritaAcaraIndex() {
  const { props } = usePage();
  const bas = props.bas || [];
  const availablePos = props.available_pos || [];

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

  // LOGIKA FILTER TABLE
  const filteredBas = useMemo(() => {
    return bas.filter(ba => {
      const po = ba.purchase_order || {};
      const matchSearch = 
        (ba.nomor_ba || '').toLowerCase().includes(search.toLowerCase()) || 
        (po.nomor_po || '').toLowerCase().includes(search.toLowerCase()) ||
        (ba.keterangan || '').toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori ? po.kategori_biaya === filterKategori : true;
      const matchTglAwal = tglAwal ? ba.tanggal_ba >= tglAwal : true;
      const matchTglAkhir = tglAkhir ? ba.tanggal_ba <= tglAkhir : true;
      
      return matchSearch && matchKategori && matchTglAwal && matchTglAkhir;
    });
  }, [bas, search, filterKategori, tglAwal, tglAkhir]);

  const formatRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

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

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-10">
      <Toaster position="top-right" />
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <FileSignature className="text-emerald-500" size={28} /> BA Pengajuan Anggaran
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="w-[180px] bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 shadow-sm"
            value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Operasional">Operasional</option>
            <option value="Insentif Fasilitas">Insentif Fasilitas</option>
          </select>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <span className="pl-3 pr-2 text-slate-400"><Calendar size={16}/></span>
            <input type="date" value={tglAwal} onChange={(e) => setTglAwal(e.target.value)} className="py-2.5 px-2 bg-transparent font-bold text-sm text-slate-700 outline-none" />
            <span className="px-2 bg-slate-50 text-slate-400 font-bold text-xs">s/d</span>
            <input type="date" value={tglAkhir} onChange={(e) => setTglAkhir(e.target.value)} className="py-2.5 px-2 bg-transparent font-bold text-sm text-slate-700 outline-none" />
          </div>

          <div className="relative w-[220px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-slate-400" /></span>
            <input 
              type="text" placeholder="No BA, PO, Ket..." 
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 font-bold text-sm text-slate-700 outline-none focus:border-emerald-500 shadow-sm" 
            />
          </div>

          <button onClick={() => setIsInputModalOpen(true)} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2">
            <Plus size={18} /> Buat BA Baru
          </button>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl border border-slate-200/60 border-t-4 border-t-emerald-500 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest align-middle text-center sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-[50px]">No</th>
                <th className="px-4 py-4 w-[110px]">Tgl BA</th>
                <th className="px-4 py-4 w-[180px]">Nomor BA</th>
                <th className="px-4 py-4 w-[180px]">No. PO Ref</th>
                <th className="px-4 py-4 text-left">Keterangan</th>
                <th className="px-4 py-4 w-[140px]">Kategori</th>
                <th className="px-4 py-4 w-[140px] text-right">Nominal (Rp)</th>
                <th className="px-4 py-4 w-[110px]">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm align-middle">
              {filteredBas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-base">Data Berita Acara (BA) Kosong</p>
                  </td>
                </tr>
              ) : (
                filteredBas.map((ba, idx) => (
                  <tr key={ba.id} className="hover:bg-slate-50 transition-colors text-center">
                    <td className="px-4 py-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{ba.tanggal_ba}</td>
                    <td className="px-4 py-3 font-black text-slate-800">{ba.nomor_ba}</td>
                    <td className="px-4 py-3 font-bold text-blue-600 bg-blue-50/50 border-x border-blue-100">{ba.purchase_order?.nomor_po || '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 text-left line-clamp-2">{ba.keterangan}</td>
                    <td className="px-4 py-3 font-bold text-slate-600">{ba.purchase_order?.kategori_biaya || '-'}</td>
                    <td className="px-4 py-3 font-black text-slate-800 text-right">{formatRp(ba.purchase_order?.grand_total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setPrintData(ba)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors" title="Cetak BA">
                          <Printer size={16}/>
                        </button>
                        <button onClick={() => handleHapus(ba.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-colors" title="Hapus">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT BA */}
      <AnimatePresence>
        {isInputModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="bg-emerald-500 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <h5 className="font-black flex items-center gap-2 text-lg"><FileSignature size={20} /> Form Pengajuan Pembayaran (BA)</h5>
                <button onClick={() => setIsInputModalOpen(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={18} /></button>
              </div>
              
              <form onSubmit={handleSimpan} className="flex-1 overflow-y-auto bg-slate-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Tanggal BA <span className="text-rose-500">*</span></label>
                    <input type="date" required value={form.tanggal_ba} onChange={(e) => setForm({...form, tanggal_ba: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-emerald-500 shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Nomor BA <span className="text-rose-500">*</span></label>
                    <input type="text" value={form.nomor_ba} onChange={(e) => setForm({...form, nomor_ba: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-bold text-sm text-blue-600 outline-none focus:border-emerald-500 shadow-sm" placeholder="Kosongkan untuk otomatis..." />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
                  <div className="bg-slate-100 font-black text-slate-500 py-3 px-4 text-xs uppercase tracking-widest border-b border-slate-200">Referensi Transaksi</div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Pilih Nomor PO (Tersedia) <span className="text-rose-500">*</span></label>
                      <select required value={form.purchase_order_id} onChange={(e) => setForm({...form, purchase_order_id: e.target.value})} className="w-full bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl p-3 font-bold text-sm outline-none shadow-sm">
                        <option value="">Pilih No PO...</option>
                        {availablePos.map(po => (
                          <option key={po.id} value={po.id}>{po.nomor_po} - {po.kategori_biaya}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1.5 italic font-medium">Hanya menampilkan PO yang belum memiliki Berita Acara.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Kategori Biaya (Auto)</label>
                        <input type="text" readOnly value={selectedPo ? selectedPo.kategori_biaya : '-'} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-bold text-sm text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Nominal Pencairan (Auto)</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-black text-slate-400">Rp</span>
                          <input type="text" readOnly value={selectedPo ? selectedPo.grand_total.toLocaleString('id-ID') : '0'} className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pr-4 pl-12 text-right font-black text-slate-800 text-sm cursor-not-allowed" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-2">Keterangan Pengajuan <span className="text-rose-500">*</span></label>
                  <textarea required value={form.keterangan} onChange={(e) => setForm({...form, keterangan: e.target.value})} rows="3" className="w-full bg-white border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-emerald-500 shadow-sm" placeholder="Contoh: Pembayaran bahan baku sayuran dan protein minggu ke-2..."></textarea>
                </div>
              </form>

              <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0 gap-2">
                <button type="button" onClick={() => setIsInputModalOpen(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="button" onClick={handleSimpan} disabled={loading || !form.purchase_order_id} className="px-6 py-2.5 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <CheckCircle2 size={16} /> {loading ? 'Memproses...' : 'Terbitkan BA'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PREVIEW & CETAK BA */}
      <AnimatePresence>
        {printData && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm print:bg-white print:p-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
              
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 print:hidden">
                <h5 className="font-black flex items-center gap-2"><Printer size={18} /> Preview Berita Acara Cetak</h5>
                <button onClick={() => setPrintData(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100 print:bg-white print:overflow-visible print:p-0">
                <div className="bg-white p-8 md:p-12 shadow-sm mx-auto print:shadow-none print:w-full print:max-w-none relative" style={{ maxWidth: '900px', minHeight: '297mm' }}>
                  
                  {/* CSS KHUSUS CETAK DARI CLIENT */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      body * { visibility: hidden; }
                      .print\\:bg-white, .print\\:bg-white * { visibility: visible; }
                      .print\\:bg-white { position: absolute; left: 0; top: 0; width: 100%; overflow: visible !important; }
                      .print\\:hidden { display: none !important; }
                      @page { margin: 1cm; }
                    }
                    .judul-ba { text-align: center; font-weight: bold; margin-top: 20px; font-size: 16px; font-family: 'Times New Roman', Times, serif;}
                    .nomor-ba { text-align: center; margin-bottom: 30px; font-size: 15px; font-family: 'Times New Roman', Times, serif;}
                    .paragraf-ba { text-align: justify; text-justify: inter-word; font-family: 'Times New Roman', Times, serif; font-size: 15px; line-height: 1.6; margin-bottom: 25px; text-indent: 40px; }
                    .table-cetak-ba { width: 100%; border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 14px; margin-bottom: 40px; }
                    .table-cetak-ba th { background-color: #b4c6e7 !important; -webkit-print-color-adjust: exact; color: black; border: 1px solid black; text-align: center; padding: 10px; font-weight: bold;}
                    .table-cetak-ba td { border: 1px solid black; padding: 8px; }
                    .ttd-area-ba { width: 100%; font-family: 'Times New Roman', Times, serif; font-size: 14px; text-align: center; margin-top: 50px; page-break-inside: avoid;}
                    .ttd-col { width: 33.33%; float: left; }
                    .clearfix::after { content: ""; clear: both; display: table; }
                  `}} />

                  <img src="/storage/images/kop_surat.jpg" style={{ width: '100%', marginBottom: '15px', display: 'block' }} alt="Kop Surat" onError={(e) => e.target.style.display = 'none'} />

                  <div className="judul-ba">BERITA ACARA PENGAJUAN PEMBAYARAN KEPADA PIC</div>
                  <div className="nomor-ba">{printData.nomor_ba}</div>

                  <div className="paragraf-ba">
                    Pada hari ini, tanggal <strong>{printData.tanggal_ba}</strong>, telah diajukan pencairan anggaran untuk kebutuhan operasional/pengadaan barang berdasarkan Purchase Order (PO) sistem nomor <strong>{printData.purchase_order?.nomor_po}</strong>. Dokumen ini menjadi bukti sah pengajuan dan validasi pencairan dana dari Manajemen Keuangan. Detail pengajuan adalah sebagai berikut:
                  </div>

                  <table className="table-cetak-ba">
                    <thead>
                      <tr>
                        <th style={{ width: '5%' }}>NO</th>
                        <th style={{ width: '15%' }}>TANGGAL</th>
                        <th style={{ width: '40%' }}>KETERANGAN</th>
                        <th style={{ width: '20%' }}>NOMINAL</th>
                        <th style={{ width: '20%' }}>KATEGORI BIAYA</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td style={{ textAlign: 'center' }}>{printData.tanggal_ba}</td>
                        <td>{printData.keterangan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatRp(printData.purchase_order?.grand_total)}</td>
                        <td style={{ textAlign: 'center' }}>{printData.purchase_order?.kategori_biaya}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="ttd-area-ba">
                    <div className="ttd-col">
                      <p>Diajukan Oleh,</p>
                      <br/><br/><br/><br/>
                      <p style={{ textDecoration: 'underline', marginBottom: '2px', fontWeight: 'bold' }}>.....................................</p>
                      <span style={{ fontSize: '13px' }}>Staf Pengadaan</span>
                    </div>
                    <div className="ttd-col">
                      <p>Mengetahui,</p>
                      <br/><br/><br/><br/>
                      <p style={{ textDecoration: 'underline', marginBottom: '2px', fontWeight: 'bold' }}>.....................................</p>
                      <span style={{ fontSize: '13px' }}>Kepala Divisi / Manajer</span>
                    </div>
                    <div className="ttd-col">
                      <p>Disetujui Oleh,</p>
                      <br/><br/><br/><br/>
                      <p style={{ textDecoration: 'underline', marginBottom: '2px', fontWeight: 'bold' }}>.....................................</p>
                      <span style={{ fontSize: '13px' }}>Finance & Accounting</span>
                    </div>
                    <div className="clearfix"></div>
                  </div>

                </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0 gap-3 print:hidden">
                <button type="button" onClick={() => setPrintData(null)} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">Tutup Preview</button>
                <button type="button" onClick={() => window.print()} className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2">
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