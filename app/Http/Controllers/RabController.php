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
        // 1. Ambil Parameter Pencarian dan Filter Tanggal
        $query = Rab::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_menu', 'like', "%{$search}%")
                  ->orWhere('tanggal', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tgl_awal')) {
            $query->whereDate('tanggal', '>=', $request->tgl_awal);
        }

        if ($request->filled('tgl_akhir')) {
            $query->whereDate('tanggal', '<=', $request->tgl_akhir);
        }

        // Ambil data history RAB dengan Filter & Paginasi
        $rabs = $query->orderByDesc('tanggal')->orderByDesc('id')->paginate(10)->withQueryString();
        
        // 2. Hitung realisasi dari PO (Hanya yang statusnya selesai/approved)
        $realisasi_po = PurchaseOrder::where('status', 'selesai')->sum('grand_total');
        
        // 3. Hitung realisasi operasional langsung di level database
        $realisasi_ops = Schema::hasColumn('master_operasionals', 'jumlah_bayar') 
            ? MasterOperasional::sum('jumlah_bayar') 
            : 0;
        
        // 4. Tentukan Pagu Anggaran Utama
        $total_pagu = 50000000; 

        return Inertia::render('rab/Index', [
            'rabs'          => $rabs,
            'operasionals'  => MasterOperasional::orderByDesc('created_at')->get(),
            'realisasi_po'  => (float) $realisasi_po,
            'realisasi_ops' => (float) $realisasi_ops,
            'total_pagu'    => $total_pagu,
            // Kembalikan filter ke frontend agar state terjaga
            'filters'       => $request->only(['search', 'tgl_awal', 'tgl_akhir']) 
        ]);
    }

    public function create()
    {
        return Inertia::render('rab/Create', [
            'bahan_bakus' => MasterBahanBaku::all(),
            'suppliers'   => Supplier::all(),
        ]);
    }

    public function store(Request $request)
    {
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
            
            // 1. Hitung Anggaran (Pagu Belanja)
            $totalPorsiKecil = $validated['qty_porsi_kecil'] * $validated['harga_porsi_kecil'];
            $totalPorsiBesar = $validated['qty_porsi_besar'] * $validated['harga_porsi_besar'];
            $totalPagu       = $totalPorsiKecil + $totalPorsiBesar;

            // 2. Hitung Total Belanja dari Items
            $totalBelanja = 0;
            foreach ($validated['items'] as &$item) {
                $item['subtotal'] = $item['qty'] * $item['harga_satuan'];
                $totalBelanja += $item['subtotal'];
            }
            unset($item);

            // 3. Hitung Selisih (Pagu - Total Belanja)
            $selisih = $totalPagu - $totalBelanja;

            // 4. Simpan Data Master RAB
            $rab = Rab::create([
                'tanggal'           => $validated['tanggal'],
                'nama_menu'         => $validated['nama_menu'],
                'qty_porsi_kecil'   => $validated['qty_porsi_kecil'],
                'harga_porsi_kecil' => $validated['harga_porsi_kecil'],
                'total_porsi_kecil' => $totalPorsiKecil,
                'qty_porsi_besar'   => $validated['qty_porsi_besar'],
                'harga_porsi_besar' => $validated['harga_porsi_besar'],
                'total_porsi_besar' => $totalPorsiBesar,
                'total_pagu'        => $totalPagu,
                'total_belanja'     => $totalBelanja,
                'selisih'           => $selisih,
            ]);

            // 5. Simpan Detail RAB dan Kumpulkan Item Berdasarkan Supplier
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

            // 6. AUTO GENERATE PO TERPISAH PER SUPPLIER
            foreach ($itemsPerSupplier as $supplierId => $items) {
                $poGrandTotal = collect($items)->sum('subtotal');
                
                $nomorPo = 'PO-RAB-' . date('ymd', strtotime($validated['tanggal'])) . '-S' . $supplierId . '-' . strtoupper(Str::random(3));

                $po = PurchaseOrder::create([
                    'nomor_po'          => $nomorPo,
                    'tanggal_pesan'     => $validated['tanggal'],
                    'kategori_biaya'    => 'Bahan Baku',
                    'grand_total'       => $poGrandTotal,
                    'status'            => 'draft'
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
    
    public function show($id)
    {
        $rab = Rab::with(['details.bahanBaku', 'details.supplier'])->findOrFail($id);
        return response()->json(['data' => $rab]);
    }
}