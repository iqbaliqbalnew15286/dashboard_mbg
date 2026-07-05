<?php

namespace App\Http\Controllers;

use App\Models\PoDetail;
use App\Models\PurchaseOrder;
use App\Models\StockMutation;
use App\Models\MasterBahanBaku;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockController extends Controller
{
    // =========================================================================
    // 0. RENDER HALAMAN INERTIA (FRONTEND)
    // =========================================================================
    
    public function indexTerima()
    {
        return Inertia::render('stok/Terima');
    }

    // =========================================================================
    // 1. MODUL: PENERIMAAN BARANG & RIWAYAT MASUK
    // =========================================================================

    public function riwayatMasukData(Request $request)
    {
        $tgl_awal = $request->query('tgl_awal');
        $tgl_akhir = $request->query('tgl_akhir');
        $q = trim((string) $request->query('q', ''));

        $query = StockMutation::query()
            ->from('stock_mutations as sm')
            ->where('sm.jenis', 'masuk')
            ->leftJoin('purchase_orders as po', 'sm.purchase_order_id', '=', 'po.id')
            ->leftJoin('master_bahan_bakus as mb', 'sm.master_bahan_baku_id', '=', 'mb.id')
            ->leftJoin('suppliers as s', 'sm.supplier_id', '=', 's.id')
            ->select([
                'sm.id',
                DB::raw('po.no_po as no_po'),
                DB::raw('sm.tanggal as tgl_terima'),
                DB::raw('mb.nama_barang as nama_barang'),
                DB::raw('s.nama_supplier as nama_supplier'),
                'sm.qty as qty_terima',
                DB::raw('mb.satuan as satuan'),
                'sm.harga_satuan as harga_beli',
                DB::raw('(sm.qty * sm.harga_satuan) as total_harga'),
                'sm.petugas'
            ]);

        if ($tgl_awal) $query->whereDate('sm.tanggal', '>=', $tgl_awal);
        if ($tgl_akhir) $query->whereDate('sm.tanggal', '<=', $tgl_akhir);

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('po.no_po', 'like', "%{$q}%")
                   ->orWhere('mb.nama_barang', 'like', "%{$q}%")
                   ->orWhere('s.nama_supplier', 'like', "%{$q}%")
                   ->orWhere('sm.petugas', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => $query->orderByDesc('sm.tanggal')->orderByDesc('sm.id')->get()
        ]);
    }

    public function poPendingForTerima()
    {
        $pos = PurchaseOrder::query()
            ->where('status', 'pending')
            ->orderByDesc('tgl_pesan')
            ->get(['id', 'no_po', 'tgl_pesan']);

        return response()->json(['data' => $pos]);
    }

    public function poDetailForTerima(string $noPo)
    {
        $po = PurchaseOrder::query()->where('no_po', $noPo)->firstOrFail();

        $items = PoDetail::query()
            ->where('po_id', $po->id)
            ->leftJoin('master_bahan_bakus as mb', 'po_details.bahan_baku_id', '=', 'mb.id')
            ->leftJoin('suppliers as s', 'po_details.supplier_id', '=', 's.id')
            ->select([
                'po_details.*',
                'mb.nama_barang as nama_bahan',
                's.nama_supplier as nama_supplier',
                'mb.satuan as satuan',
                DB::raw('(po_details.harga_satuan * po_details.qty) as subtotal_aktual'),
                DB::raw('po_details.qty as qty_pesan'),
            ])->get();

        return response()->json([
            'po' => ['id' => $po->id, 'no_po' => $po->no_po, 'tgl_pesan' => $po->tgl_pesan],
            'items' => $items
        ]);
    }

    public function simpanTerima(Request $request)
    {
        $validated = $request->validate([
            'no_po'      => 'required|string',
            'tgl_terima' => 'required|date',
            'petugas'    => 'required|string',
            'items'      => 'required|array',
        ]);

        $po = PurchaseOrder::query()->where('no_po', $validated['no_po'])->firstOrFail();

        DB::transaction(function () use ($validated, $po) {
            foreach ($validated['items'] as $item) {
                $qtyTerima = (float) ($item['qty_terima'] ?? 0);
                if ($qtyTerima <= 0) continue;

                StockMutation::create([
                    'purchase_order_id'    => $po->id,
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'supplier_id'          => $item['supplier_id'] ?? null,
                    'user_id'              => auth()->id() ?? null,
                    'jenis'                => 'masuk',
                    'tanggal'              => $validated['tgl_terima'],
                    'qty'                  => $qtyTerima,
                    'harga_satuan'         => $item['harga_satuan'] ?? 0,
                    'petugas'              => $validated['petugas'],
                ]);
            }
            
            // Tandai PO Selesai
            $po->update(['status' => 'selesai']);
        });

        return response()->json(['ok' => true]);
    }

    // =========================================================================
    // 2. MODUL: BARANG KELUAR & RIWAYAT KELUAR
    // =========================================================================

    public function riwayatKeluarData(Request $request)
    {
        $tgl_awal = $request->query('tgl_awal');
        $tgl_akhir = $request->query('tgl_akhir');
        $q = trim((string) $request->query('q', ''));

        $query = StockMutation::query()
            ->from('stock_mutations as sm')
            ->where('sm.jenis', 'keluar')
            ->leftJoin('master_bahan_bakus as mb', 'sm.master_bahan_baku_id', '=', 'mb.id')
            ->select([
                'sm.id',
                'sm.tanggal',
                'sm.petugas',
                'mb.nama_barang',
                'sm.qty',
                'mb.satuan'
            ]);

        if ($tgl_awal) $query->whereDate('sm.tanggal', '>=', $tgl_awal);
        if ($tgl_akhir) $query->whereDate('sm.tanggal', '<=', $tgl_akhir);
        
        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('mb.nama_barang', 'like', "%{$q}%")
                   ->orWhere('sm.petugas', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => $query->orderByDesc('sm.tanggal')->orderByDesc('sm.id')->get()
        ]);
    }

    public function listBarangTersedia()
    {
        $barangs = MasterBahanBaku::select('id', 'kode_barang', 'nama_barang', 'satuan', 'harga_beli_awal')->get();
        
        // Kalkulasi real-time stok tersedia untuk form barang keluar
        $stokAktual = $barangs->map(function ($barang) {
            $masuk = StockMutation::where('master_bahan_baku_id', $barang->id)->where('jenis', 'masuk')->sum('qty');
            $keluar = StockMutation::where('master_bahan_baku_id', $barang->id)->where('jenis', 'keluar')->sum('qty');
            
            return [
                'id'     => $barang->id,
                'nama'   => $barang->nama_barang,
                'satuan' => $barang->satuan,
                'stok'   => $barang->saldo_awal + $masuk - $keluar,
                'harga'  => $barang->harga_beli_awal
            ];
        });

        return response()->json(['data' => $stokAktual]);
    }

    public function simpanKeluar(Request $request)
    {
        $validated = $request->validate([
            'tgl_keluar' => 'required|date',
            'petugas'    => 'required|string',
            'items'      => 'required|array',
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $item) {
                $qtyKeluar = (float) ($item['qty'] ?? 0);
                if ($qtyKeluar <= 0) continue;

                StockMutation::create([
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'user_id'              => auth()->id() ?? null,
                    'jenis'                => 'keluar',
                    'tanggal'              => $validated['tgl_keluar'],
                    'qty'                  => $qtyKeluar,
                    'harga_satuan'         => $item['harga'] ?? 0, 
                    'petugas'              => $validated['petugas'],
                ]);
            }
        });

        return response()->json(['ok' => true]);
    }

    // =========================================================================
    // 3. MODUL: REKAP STOK GUDANG (INTEGRASI PENUH)
    // =========================================================================

    public function rekapStokData(Request $request)
    {
        $tgl_awal = $request->query('tgl_awal');
        $tgl_akhir = $request->query('tgl_akhir');
        $q = trim((string) $request->query('q', ''));
        $hide_empty = $request->query('hide_empty') === 'true';

        $query = MasterBahanBaku::query();

        if ($q !== '') {
            $query->where('nama_barang', 'like', "%{$q}%")
                  ->orWhere('kode_barang', 'like', "%{$q}%");
        }

        $bahanBakus = $query->get();

        $rekap = $bahanBakus->map(function ($bb) use ($tgl_awal, $tgl_akhir) {
            // Kalkulasi Saldo Awal Berdasarkan Tanggal Filter
            $masuk_sebelum = 0;
            $keluar_sebelum = 0;

            if ($tgl_awal) {
                $masuk_sebelum = StockMutation::where('master_bahan_baku_id', $bb->id)
                                    ->where('jenis', 'masuk')->whereDate('tanggal', '<', $tgl_awal)->sum('qty');
                $keluar_sebelum = StockMutation::where('master_bahan_baku_id', $bb->id)
                                    ->where('jenis', 'keluar')->whereDate('tanggal', '<', $tgl_awal)->sum('qty');
            }
            
            $saldo_awal_aktual = $bb->saldo_awal + $masuk_sebelum - $keluar_sebelum;

            // Kalkulasi Mutasi Selama Periode Terpilih
            $qMasuk = StockMutation::where('master_bahan_baku_id', $bb->id)->where('jenis', 'masuk');
            $qKeluar = StockMutation::where('master_bahan_baku_id', $bb->id)->where('jenis', 'keluar');

            if ($tgl_awal) {
                $qMasuk->whereDate('tanggal', '>=', $tgl_awal);
                $qKeluar->whereDate('tanggal', '>=', $tgl_awal);
            }
            if ($tgl_akhir) {
                $qMasuk->whereDate('tanggal', '<=', $tgl_akhir);
                $qKeluar->whereDate('tanggal', '<=', $tgl_akhir);
            }

            $masuk_periode = $qMasuk->sum('qty');
            $keluar_periode = $qKeluar->sum('qty');
            
            // Kalkulasi Hasil Akhir
            $saldo_akhir = $saldo_awal_aktual + $masuk_periode - $keluar_periode;
            $jumlah_rp = $saldo_akhir * $bb->harga_beli_awal;

            return [
                'kode'        => $bb->kode_barang,
                'nama'        => $bb->nama_barang,
                'saldo_awal'  => (float) $saldo_awal_aktual,
                'masuk'       => (float) $masuk_periode,
                'keluar'      => (float) $keluar_periode,
                'saldo_akhir' => (float) $saldo_akhir,
                'jumlah_rp'   => (float) $jumlah_rp,
            ];
        });

        // Filter untuk Toggle 'Sembunyikan Data Kosong' di UI
        if ($hide_empty) {
            $rekap = $rekap->filter(function ($r) {
                return $r['saldo_awal'] > 0 || $r['masuk'] > 0 || $r['keluar'] > 0 || $r['saldo_akhir'] > 0;
            })->values();
        }

        return response()->json(['data' => $rekap]);
    }
}