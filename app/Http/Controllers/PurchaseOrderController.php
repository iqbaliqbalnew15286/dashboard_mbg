<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PoDetail;
use App\Models\MasterBahanBaku;
use App\Models\Supplier; 
use App\Models\KategoriBiaya;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    private function ensureSchemaUpdated()
    {
        if (!Schema::hasColumn('purchase_orders', 'rab_id') || 
            !Schema::hasColumn('rabs', 'tipe') ||
            !Schema::hasColumn('po_details', 'nama_pengadaan')) {
            try {
                Artisan::call('migrate', ['--force' => true]);
            } catch (\Throwable $e) {
                // Ignore if permission denied
            }
        }
    }

    public function create(Request $request)
    {
        $this->ensureSchemaUpdated();

        $withRelations = ['details.bahanBaku', 'details.supplier'];
        if (Schema::hasColumn('purchase_orders', 'rab_id')) {
            $withRelations[] = 'rab';
        }

        $query = PurchaseOrder::with($withRelations);

        if ($request->filled('kategori')) {
            $query->where('kategori_biaya', $request->kategori);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_po', 'like', "%{$search}%")
                  ->orWhere('kategori_biaya', 'like', "%{$search}%");
            });
        }

        $pos = $query->orderByDesc('tanggal_pesan')->orderByDesc('id')->get();

        return Inertia::render('po/Create', [
            'pos'             => $pos,
            'bahan_bakus'     => MasterBahanBaku::all(),
            'suppliers'       => Supplier::all(), 
            'kategori_biayas' => KategoriBiaya::all(),
            'filters'         => $request->only(['kategori', 'search'])
        ]);
    }

    public function store(Request $request)
    {
        $this->ensureSchemaUpdated();

        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            'nomor_po'              => 'nullable|string|unique:purchase_orders,nomor_po',
            'tanggal_pesan'         => 'required|date',
            'tanggal_diberikan'     => 'nullable|date',
            'items'                 => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
            'items.*.supplier_id'   => 'required|exists:suppliers,id',
            'items.*.qty'           => 'required|numeric|min:0.01',
            'items.*.harga_satuan'  => 'required|numeric|min:0',
        ]);

        $nomorPo = $validated['nomor_po'] ?? 'PO-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        DB::transaction(function () use ($validated, $nomorPo) {
            $grandTotal = 0;
            foreach ($validated['items'] as $item) {
                $grandTotal += ($item['qty'] * $item['harga_satuan']);
            }

            $po = PurchaseOrder::create([
                'nomor_po'          => $nomorPo,
                'kategori_biaya'    => $validated['kategori_biaya'],
                'tanggal_pesan'     => $validated['tanggal_pesan'],
                'tanggal_diberikan' => $validated['tanggal_diberikan'] ?? null,
                'grand_total'       => $grandTotal,
                'status'            => 'draft'
            ]);

            foreach ($validated['items'] as $item) {
                PoDetail::create([
                    'purchase_order_id'    => $po->id,
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'supplier_id'          => $item['supplier_id'],
                    'qty'                  => $item['qty'],
                    'harga_satuan'         => $item['harga_satuan'],
                    'subtotal'             => ($item['qty'] * $item['harga_satuan'])
                ]);
            }
        });

        return redirect('/transaksi')->with('success', 'Purchase Order berhasil dibuat');
    }

    public function show($id)
    {
        $this->ensureSchemaUpdated();

        $withRelations = ['details.bahanBaku', 'details.supplier'];
        if (Schema::hasColumn('purchase_orders', 'rab_id')) {
            $withRelations[] = 'rab';
        }

        $purchaseOrder = PurchaseOrder::with($withRelations)->findOrFail($id);
        return Inertia::render('po/Show', ['po' => $purchaseOrder]);
    }

    public function edit($id)
    {
        $this->ensureSchemaUpdated();

        $withRelations = ['details.bahanBaku', 'details.supplier'];
        if (Schema::hasColumn('purchase_orders', 'rab_id')) {
            $withRelations[] = 'rab';
        }

        $purchaseOrder = PurchaseOrder::with($withRelations)->findOrFail($id);
        
        return Inertia::render('po/Edit', [
            'po'              => $purchaseOrder,
            'bahan_bakus'     => MasterBahanBaku::all(),
            'suppliers'       => Supplier::all(),
            'kategori_biayas' => KategoriBiaya::all()
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->ensureSchemaUpdated();

        $purchaseOrder = PurchaseOrder::findOrFail($id);

        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            'tanggal_pesan'         => 'required|date',
            'tanggal_diberikan'     => 'nullable|date',
            'items'                 => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
            'items.*.supplier_id'   => 'required|exists:suppliers,id',
            'items.*.qty'           => 'required|numeric|min:0.01',
            'items.*.harga_satuan'  => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $grandTotal = 0;
            foreach ($validated['items'] as $item) {
                $grandTotal += ($item['qty'] * $item['harga_satuan']);
            }

            $purchaseOrder->update([
                'kategori_biaya'    => $validated['kategori_biaya'],
                'tanggal_pesan'     => $validated['tanggal_pesan'],
                'tanggal_diberikan' => $validated['tanggal_diberikan'] ?? null,
                'grand_total'       => $grandTotal
            ]);

            $purchaseOrder->details()->delete();

            foreach ($validated['items'] as $item) {
                PoDetail::create([
                    'purchase_order_id'    => $purchaseOrder->id,
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'supplier_id'          => $item['supplier_id'],
                    'qty'                  => $item['qty'],
                    'harga_satuan'         => $item['harga_satuan'],
                    'subtotal'             => ($item['qty'] * $item['harga_satuan'])
                ]);
            }
        });

        return redirect('/transaksi')->with('success', 'Purchase Order Berhasil Diperbarui');
    }

    public function destroy($id)
    {
        $this->ensureSchemaUpdated();
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        $purchaseOrder->delete();

        return redirect()->back()->with('success', 'Purchase Order berhasil dihapus dari sistem.');
    }

    public function transaksi(Request $request)
    {
        $this->ensureSchemaUpdated();

        $withRelations = ['details.bahanBaku', 'details.supplier'];
        if (Schema::hasColumn('purchase_orders', 'rab_id')) {
            $withRelations[] = 'rab';
        }

        $query = PurchaseOrder::with($withRelations);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nomor_po', 'like', "%{$search}%")
                  ->orWhere('kategori_biaya', 'like', "%{$search}%")
                  ->orWhereHas('details.supplier', function($sq) use ($search) {
                      $sq->where('nama_perusahaan', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('tgl_awal')) {
            $query->whereDate('tanggal_pesan', '>=', $request->tgl_awal);
        }

        if ($request->filled('tgl_akhir')) {
            $query->whereDate('tanggal_pesan', '<=', $request->tgl_akhir);
        }

        if ($request->filled('kategori')) {
            $query->where('kategori_biaya', $request->kategori);
        }

        $transactions = $query->orderByDesc('tanggal_pesan')->orderByDesc('id')->paginate(10)->withQueryString();
                            
        return Inertia::render('po/Transaksi', [
            'transactions'    => $transactions,
            'kategori_biayas' => KategoriBiaya::all(),
            'filters'         => $request->only(['search', 'tgl_awal', 'tgl_akhir', 'kategori'])
        ]);
    }

    public function searchPoForTerima($nomor_po)
    {
        $this->ensureSchemaUpdated();

        $withRelations = ['details.bahanBaku', 'details.supplier'];
        $po = PurchaseOrder::with($withRelations)
            ->where('nomor_po', $nomor_po)
            ->first();

        if (!$po) {
            return response()->json(['message' => 'Data PO tidak ditemukan atau nomor salah.'], 404);
        }

        $items = $po->details->map(function($detail) {
            return [
                'bahan_baku_id' => $detail->master_bahan_baku_id,
                'supplier_id'   => $detail->supplier_id,
                'nama_barang'   => $detail->bahan_baku ? $detail->bahan_baku->nama_barang : ($detail->nama_pengadaan ?? 'Bahan / Pengadaan'),
                'satuan'        => $detail->bahan_baku ? $detail->bahan_baku->satuan : 'Porsi/Unit',
                'qty_po'        => (float) $detail->qty,
                'harga_satuan'  => (float) $detail->harga_satuan,
                'supplier_nama' => $detail->supplier ? $detail->supplier->nama_perusahaan : '-'
            ];
        });

        return response()->json([
            'status'         => 'success',
            'po_id'          => $po->id,
            'nomor_po'       => $po->nomor_po,
            'kategori_biaya' => $po->kategori_biaya,
            'tanggal_pesan'  => $po->tanggal_pesan,
            'items'          => $items
        ]);
    }
}