<?php

namespace App\Http\Controllers;

use App\Models\Rab;
use App\Models\RabDetail;
use App\Models\PurchaseOrder;
use App\Models\PoDetail;
use App\Models\MasterBahanBaku;
use App\Models\MasterOperasional;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Illuminate\Support\Str;

class RabController extends Controller
{
    public function index(Request $request)
    {
        $query = Rab::with(['details.bahanBaku', 'details.supplier', 'purchaseOrders']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_menu', 'like', "%{$search}%")
                  ->orWhere('kategori_pengadaan', 'like', "%{$search}%")
                  ->orWhere('tanggal', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tgl_awal')) {
            $query->whereDate('tanggal', '>=', $request->tgl_awal);
        }

        if ($request->filled('tgl_akhir')) {
            $query->whereDate('tanggal', '<=', $request->tgl_akhir);
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        $rabs = $query->orderByDesc('tanggal')->orderByDesc('id')->paginate(10)->withQueryString();
        
        // Realisasi PO selesai
        $realisasi_po = PurchaseOrder::where('status', 'selesai')->sum('grand_total');
        
        // Realisasi Operasional
        $realisasi_ops = Schema::hasColumn('master_operasionals', 'jumlah_bayar') 
            ? MasterOperasional::sum('jumlah_bayar') 
            : 0;
        
        $total_pagu = 50000000; 

        return Inertia::render('rab/Index', [
            'rabs'          => $rabs,
            'operasionals'  => MasterOperasional::orderByDesc('created_at')->get(),
            'realisasi_po'  => (float) $realisasi_po,
            'realisasi_ops' => (float) $realisasi_ops,
            'total_pagu'    => $total_pagu,
            'filters'       => $request->only(['search', 'tgl_awal', 'tgl_akhir', 'tipe']) 
        ]);
    }

    public function create(Request $request)
    {
        $tipe = $request->query('tipe', 'bahan');

        return Inertia::render('rab/Create', [
            'tipe_rab'    => $tipe,
            'bahan_bakus' => MasterBahanBaku::all(),
            'suppliers'   => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
        $tipe = $request->input('tipe', 'bahan');

        if ($tipe === 'operasional') {
            $validated = $request->validate([
                'tipe'               => 'required|string',
                'kategori_pengadaan' => 'required|string|in:Insentif Fasilitas,Operasional',
                'tanggal'            => 'required|date',
                'nama_menu'          => 'nullable|string',
                'total_pagu'         => 'required|numeric|min:0',
                'items'              => 'required|array|min:1',
                'items.*.nama_pengadaan' => 'required|string',
                'items.*.supplier_id'    => 'required|exists:suppliers,id',
                'items.*.qty'            => 'required|numeric|min:0.01',
                'items.*.harga_satuan'   => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated) {
                $totalPagu = (float) $validated['total_pagu'];
                $totalBelanja = 0;
                foreach ($validated['items'] as &$item) {
                    $item['subtotal'] = (float) $item['qty'] * (float) $item['harga_satuan'];
                    $totalBelanja += $item['subtotal'];
                }
                unset($item);

                $selisih = $totalPagu - $totalBelanja;

                $rab = Rab::create([
                    'tipe'               => 'operasional',
                    'kategori_pengadaan' => $validated['kategori_pengadaan'],
                    'tanggal'            => $validated['tanggal'],
                    'nama_menu'          => $validated['nama_menu'] ?? ('Pengadaan ' . $validated['kategori_pengadaan']),
                    'total_pagu'         => $totalPagu,
                    'total_belanja'      => $totalBelanja,
                    'selisih'            => $selisih,
                ]);

                $itemsPerSupplier = [];
                foreach ($validated['items'] as $item) {
                    RabDetail::create([
                        'rab_id'         => $rab->id,
                        'supplier_id'    => $item['supplier_id'],
                        'nama_pengadaan' => $item['nama_pengadaan'],
                        'qty'            => $item['qty'],
                        'harga_satuan'   => $item['harga_satuan'],
                        'subtotal'       => $item['subtotal']
                    ]);
                    $itemsPerSupplier[$item['supplier_id']][] = $item;
                }

                // Generate PO Operasional / Insentif Fasilitas
                foreach ($itemsPerSupplier as $supplierId => $items) {
                    $poGrandTotal = collect($items)->sum('subtotal');
                    $nomorPo = 'PO-OPS-' . date('ymd', strtotime($validated['tanggal'])) . '-S' . $supplierId . '-' . strtoupper(Str::random(3));

                    $po = PurchaseOrder::create([
                        'rab_id'         => $rab->id,
                        'nomor_po'       => $nomorPo,
                        'tanggal_pesan'  => $validated['tanggal'],
                        'kategori_biaya' => $validated['kategori_pengadaan'],
                        'grand_total'    => $poGrandTotal,
                        'status'         => 'draft'
                    ]);

                    foreach ($items as $item) {
                        PoDetail::create([
                            'purchase_order_id' => $po->id,
                            'supplier_id'       => $supplierId,
                            'nama_pengadaan'    => $item['nama_pengadaan'],
                            'qty'               => $item['qty'],
                            'harga_satuan'      => $item['harga_satuan'],
                            'subtotal'          => $item['subtotal']
                        ]);
                    }
                }
            });

            return redirect()->route('rab.index')->with('success', 'RAB Operasional berhasil disimpan, dan PO otomatis diterbitkan!');
        } else {
            // RAB Bahan Baku
            $validated = $request->validate([
                'tanggal'           => 'required|date',
                'nama_menu'         => 'nullable|string',
                'qty_porsi_kecil'   => 'required|numeric|min:0',
                'harga_porsi_kecil' => 'required|numeric|min:0',
                'qty_porsi_besar'   => 'required|numeric|min:0',
                'harga_porsi_besar' => 'required|numeric|min:0',
                'items'             => 'required|array|min:1',
                'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
                'items.*.supplier_id'   => 'required|exists:suppliers,id',
                'items.*.qty'           => 'required|numeric|min:0.01',
                'items.*.harga_satuan'  => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated) {
                $totalPorsiKecil = $validated['qty_porsi_kecil'] * $validated['harga_porsi_kecil'];
                $totalPorsiBesar = $validated['qty_porsi_besar'] * $validated['harga_porsi_besar'];
                $totalPagu       = $totalPorsiKecil + $totalPorsiBesar;

                $totalBelanja = 0;
                foreach ($validated['items'] as &$item) {
                    $item['subtotal'] = $item['qty'] * $item['harga_satuan'];
                    $totalBelanja += $item['subtotal'];
                }
                unset($item);

                $selisih = $totalPagu - $totalBelanja;

                $rab = Rab::create([
                    'tipe'               => 'bahan',
                    'kategori_pengadaan' => 'Bahan Baku',
                    'tanggal'            => $validated['tanggal'],
                    'nama_menu'          => $validated['nama_menu'],
                    'qty_porsi_kecil'    => $validated['qty_porsi_kecil'],
                    'harga_porsi_kecil'  => $validated['harga_porsi_kecil'],
                    'total_porsi_kecil'  => $totalPorsiKecil,
                    'qty_porsi_besar'    => $validated['qty_porsi_besar'],
                    'harga_porsi_besar'  => $validated['harga_porsi_besar'],
                    'total_porsi_besar'  => $totalPorsiBesar,
                    'total_pagu'         => $totalPagu,
                    'total_belanja'      => $totalBelanja,
                    'selisih'            => $selisih,
                ]);

                $itemsPerSupplier = [];
                foreach ($validated['items'] as $item) {
                    RabDetail::create([
                        'rab_id'               => $rab->id,
                        'supplier_id'          => $item['supplier_id'],
                        'master_bahan_baku_id' => $item['bahan_baku_id'],
                        'qty'                  => $item['qty'],
                        'harga_satuan'         => $item['harga_satuan'],
                        'subtotal'             => $item['subtotal']
                    ]);

                    $itemsPerSupplier[$item['supplier_id']][] = $item;
                }

                foreach ($itemsPerSupplier as $supplierId => $items) {
                    $poGrandTotal = collect($items)->sum('subtotal');
                    $nomorPo = 'PO-RAB-' . date('ymd', strtotime($validated['tanggal'])) . '-S' . $supplierId . '-' . strtoupper(Str::random(3));

                    $po = PurchaseOrder::create([
                        'rab_id'         => $rab->id,
                        'nomor_po'       => $nomorPo,
                        'tanggal_pesan'  => $validated['tanggal'],
                        'kategori_biaya' => 'Bahan Baku',
                        'grand_total'    => $poGrandTotal,
                        'status'         => 'draft'
                    ]);

                    foreach ($items as $item) {
                        PoDetail::create([
                            'purchase_order_id'    => $po->id,
                            'master_bahan_baku_id' => $item['bahan_baku_id'],
                            'supplier_id'          => $supplierId,
                            'qty'                  => $item['qty'],
                            'harga_satuan'         => $item['harga_satuan'],
                            'subtotal'             => $item['subtotal']
                        ]);
                    }
                }
            });

            return redirect()->route('rab.index')->with('success', 'RAB berhasil disimpan, dan PO otomatis diterbitkan per Supplier!');
        }
    }

    public function show($id)
    {
        $rab = Rab::with(['details.bahanBaku', 'details.supplier', 'purchaseOrders'])->findOrFail($id);
        return response()->json(['data' => $rab]);
    }

    public function edit($id)
    {
        $rab = Rab::with(['details.bahanBaku', 'details.supplier', 'purchaseOrders'])->findOrFail($id);

        return Inertia::render('rab/Edit', [
            'rab'         => $rab,
            'bahan_bakus' => MasterBahanBaku::all(),
            'suppliers'   => Supplier::all(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $rab = Rab::findOrFail($id);
        $tipe = $request->input('tipe', $rab->tipe ?? 'bahan');

        if ($tipe === 'operasional') {
            $validated = $request->validate([
                'kategori_pengadaan' => 'required|string|in:Insentif Fasilitas,Operasional',
                'tanggal'            => 'required|date',
                'nama_menu'          => 'nullable|string',
                'total_pagu'         => 'required|numeric|min:0',
                'items'              => 'required|array|min:1',
                'items.*.nama_pengadaan' => 'required|string',
                'items.*.supplier_id'    => 'required|exists:suppliers,id',
                'items.*.qty'            => 'required|numeric|min:0.01',
                'items.*.harga_satuan'   => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated, $rab) {
                $totalPagu = (float) $validated['total_pagu'];
                $totalBelanja = 0;
                foreach ($validated['items'] as &$item) {
                    $item['subtotal'] = (float) $item['qty'] * (float) $item['harga_satuan'];
                    $totalBelanja += $item['subtotal'];
                }
                unset($item);

                $selisih = $totalPagu - $totalBelanja;

                $rab->update([
                    'tipe'               => 'operasional',
                    'kategori_pengadaan' => $validated['kategori_pengadaan'],
                    'tanggal'            => $validated['tanggal'],
                    'nama_menu'          => $validated['nama_menu'] ?? ('Pengadaan ' . $validated['kategori_pengadaan']),
                    'total_pagu'         => $totalPagu,
                    'total_belanja'      => $totalBelanja,
                    'selisih'            => $selisih,
                ]);

                // Clear & re-insert details
                $rab->details()->delete();

                $itemsPerSupplier = [];
                foreach ($validated['items'] as $item) {
                    RabDetail::create([
                        'rab_id'         => $rab->id,
                        'supplier_id'    => $item['supplier_id'],
                        'nama_pengadaan' => $item['nama_pengadaan'],
                        'qty'            => $item['qty'],
                        'harga_satuan'   => $item['harga_satuan'],
                        'subtotal'       => $item['subtotal']
                    ]);
                    $itemsPerSupplier[$item['supplier_id']][] = $item;
                }

                // Delete old POs linked to this RAB and recreate updated POs
                PurchaseOrder::where('rab_id', $rab->id)->delete();

                foreach ($itemsPerSupplier as $supplierId => $items) {
                    $poGrandTotal = collect($items)->sum('subtotal');
                    $nomorPo = 'PO-OPS-' . date('ymd', strtotime($validated['tanggal'])) . '-S' . $supplierId . '-' . strtoupper(Str::random(3));

                    $po = PurchaseOrder::create([
                        'rab_id'         => $rab->id,
                        'nomor_po'       => $nomorPo,
                        'tanggal_pesan'  => $validated['tanggal'],
                        'kategori_biaya' => $validated['kategori_pengadaan'],
                        'grand_total'    => $poGrandTotal,
                        'status'         => 'draft'
                    ]);

                    foreach ($items as $item) {
                        PoDetail::create([
                            'purchase_order_id' => $po->id,
                            'supplier_id'       => $supplierId,
                            'nama_pengadaan'    => $item['nama_pengadaan'],
                            'qty'               => $item['qty'],
                            'harga_satuan'      => $item['harga_satuan'],
                            'subtotal'          => $item['subtotal']
                        ]);
                    }
                }
            });

            return redirect()->route('rab.index')->with('success', 'RAB Operasional berhasil direvisi, dan PO/Laporan diperbarui!');
        } else {
            // RAB Bahan Baku Update
            $validated = $request->validate([
                'tanggal'           => 'required|date',
                'nama_menu'         => 'nullable|string',
                'qty_porsi_kecil'   => 'required|numeric|min:0',
                'harga_porsi_kecil' => 'required|numeric|min:0',
                'qty_porsi_besar'   => 'required|numeric|min:0',
                'harga_porsi_besar' => 'required|numeric|min:0',
                'items'             => 'required|array|min:1',
                'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
                'items.*.supplier_id'   => 'required|exists:suppliers,id',
                'items.*.qty'           => 'required|numeric|min:0.01',
                'items.*.harga_satuan'  => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($validated, $rab) {
                $totalPorsiKecil = $validated['qty_porsi_kecil'] * $validated['harga_porsi_kecil'];
                $totalPorsiBesar = $validated['qty_porsi_besar'] * $validated['harga_porsi_besar'];
                $totalPagu       = $totalPorsiKecil + $totalPorsiBesar;

                $totalBelanja = 0;
                foreach ($validated['items'] as &$item) {
                    $item['subtotal'] = $item['qty'] * $item['harga_satuan'];
                    $totalBelanja += $item['subtotal'];
                }
                unset($item);

                $selisih = $totalPagu - $totalBelanja;

                $rab->update([
                    'tipe'               => 'bahan',
                    'kategori_pengadaan' => 'Bahan Baku',
                    'tanggal'            => $validated['tanggal'],
                    'nama_menu'          => $validated['nama_menu'],
                    'qty_porsi_kecil'    => $validated['qty_porsi_kecil'],
                    'harga_porsi_kecil'  => $validated['harga_porsi_kecil'],
                    'total_porsi_kecil'  => $totalPorsiKecil,
                    'qty_porsi_besar'    => $validated['qty_porsi_besar'],
                    'harga_porsi_besar'  => $validated['harga_porsi_besar'],
                    'total_porsi_besar'  => $totalPorsiBesar,
                    'total_pagu'         => $totalPagu,
                    'total_belanja'      => $totalBelanja,
                    'selisih'            => $selisih,
                ]);

                $rab->details()->delete();

                $itemsPerSupplier = [];
                foreach ($validated['items'] as $item) {
                    RabDetail::create([
                        'rab_id'               => $rab->id,
                        'supplier_id'          => $item['supplier_id'],
                        'master_bahan_baku_id' => $item['bahan_baku_id'],
                        'qty'                  => $item['qty'],
                        'harga_satuan'         => $item['harga_satuan'],
                        'subtotal'             => $item['subtotal']
                    ]);

                    $itemsPerSupplier[$item['supplier_id']][] = $item;
                }

                PurchaseOrder::where('rab_id', $rab->id)->delete();

                foreach ($itemsPerSupplier as $supplierId => $items) {
                    $poGrandTotal = collect($items)->sum('subtotal');
                    $nomorPo = 'PO-RAB-' . date('ymd', strtotime($validated['tanggal'])) . '-S' . $supplierId . '-' . strtoupper(Str::random(3));

                    $po = PurchaseOrder::create([
                        'rab_id'         => $rab->id,
                        'nomor_po'       => $nomorPo,
                        'tanggal_pesan'  => $validated['tanggal'],
                        'kategori_biaya' => 'Bahan Baku',
                        'grand_total'    => $poGrandTotal,
                        'status'         => 'draft'
                    ]);

                    foreach ($items as $item) {
                        PoDetail::create([
                            'purchase_order_id'    => $po->id,
                            'master_bahan_baku_id' => $item['bahan_baku_id'],
                            'supplier_id'          => $supplierId,
                            'qty'                  => $item['qty'],
                            'harga_satuan'         => $item['harga_satuan'],
                            'subtotal'             => $item['subtotal']
                        ]);
                    }
                }
            });

            return redirect()->route('rab.index')->with('success', 'RAB Bahan Baku berhasil direvisi, dan PO/Laporan diperbarui!');
        }
    }

    public function destroy($id)
    {
        $rab = Rab::findOrFail($id);
        $rab->delete();

        return redirect()->route('rab.index')->with('success', 'RAB berhasil dihapus beserta PO yang terhubung.');
    }
}