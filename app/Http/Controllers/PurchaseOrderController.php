<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PoDetail;
use App\Models\MasterBahanBaku;
use App\Models\Supplier; 
use App\Models\KategoriBiaya;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function create(Request $request)
    {
        $query = PurchaseOrder::with(['details.bahanBaku', 'details.supplier', 'rab']);

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
        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            'nomor_po'              => 'nullable|string|unique:purchase_orders,nomor_po',
            'tanggal_pesan'         => 'required|date',
            'tanggal_diberikan'     => 'nullable|date',
            'grand_total'           => 'required|numeric|min:0',
            'items'                 => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
            'items.*.supplier_id'   => 'required|exists:suppliers,id',
            'items.*.qty'           => 'required|numeric|min:0.01',
            'items.*.harga_satuan'  => 'required|numeric|min:0',
            'items.*.subtotal'      => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            $nomorPo = $validated['nomor_po'] ?? 'PO-MBG-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            $po = PurchaseOrder::create([
                'nomor_po'          => $nomorPo,
                'tanggal_pesan'     => $validated['tanggal_pesan'],
                'tanggal_diberikan' => $validated['tanggal_diberikan'] ?? null,
                'kategori_biaya'    => $validated['kategori_biaya'],
                'grand_total'       => $validated['grand_total'],
                'status'            => 'draft'
            ]);

            foreach ($validated['items'] as $item) {
                PoDetail::create([
                    'purchase_order_id'    => $po->id,
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'supplier_id'          => $item['supplier_id'],
                    'qty'                  => $item['qty'],
                    'harga_satuan'         => $item['harga_satuan'],
                    'subtotal'             => $item['subtotal']
                ]);
            }
        });

        return redirect('/transaksi')->with('success', 'Purchase Order Berhasil Disimpan');
    }
    
    public function edit($id)
    {
        $purchaseOrder = PurchaseOrder::with('details')->findOrFail($id);

        return Inertia::render('po/Edit', [
            'po'           => $purchaseOrder,
            'bahan_bakus'  => MasterBahanBaku::all(),
            'suppliers'    => Supplier::all(), 
        ]);
    }

    public function update(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            'nomor_po'              => 'nullable|string|unique:purchase_orders,nomor_po,' . $purchaseOrder->id,
            'tanggal_pesan'         => 'required|date',
            'tanggal_diberikan'     => 'nullable|date',
            'grand_total'           => 'required|numeric|min:0',
            'items'                 => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
            'items.*.supplier_id'   => 'required|exists:suppliers,id',
            'items.*.qty'           => 'required|numeric|min:0.01',
            'items.*.harga_satuan'  => 'required|numeric|min:0',
            'items.*.subtotal'      => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $purchaseOrder) {
            $nomorPo = $validated['nomor_po'] ?? $purchaseOrder->nomor_po;

            $purchaseOrder->update([
                'nomor_po'          => $nomorPo,
                'tanggal_pesan'     => $validated['tanggal_pesan'],
                'tanggal_diberikan' => $validated['tanggal_diberikan'] ?? null,
                'kategori_biaya'    => $validated['kategori_biaya'],
                'grand_total'       => $validated['grand_total'],
            ]);

            $purchaseOrder->details()->delete();

            foreach ($validated['items'] as $item) {
                PoDetail::create([
                    'purchase_order_id'    => $purchaseOrder->id,
                    'master_bahan_baku_id' => $item['bahan_baku_id'],
                    'supplier_id'          => $item['supplier_id'],
                    'qty'                  => $item['qty'],
                    'harga_satuan'         => $item['harga_satuan'],
                    'subtotal'             => $item['subtotal']
                ]);
            }
        });

        return redirect('/transaksi')->with('success', 'Purchase Order Berhasil Diperbarui');
    }

    public function destroy($id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        $purchaseOrder->delete();

        return redirect()->back()->with('success', 'Purchase Order berhasil dihapus dari sistem.');
    }

    // =========================================================================
    // HALAMAN TRANSAKSI (Dioptimasi dengan Pagination)
    // =========================================================================
    public function transaksi(Request $request)
    {
        $query = PurchaseOrder::with(['details.bahanBaku', 'details.supplier', 'rab']);

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

    // =========================================================================
    // API UNTUK STOK TERIMA (Ringan, khusus JSON)
    // =========================================================================
    public function searchPoForTerima($nomor_po)
    {
        $po = PurchaseOrder::with(['details.bahanBaku', 'details.supplier'])
            ->where('nomor_po', $nomor_po)
            ->first();

        if (!$po) {
            return response()->json(['message' => 'Data PO tidak ditemukan atau nomor salah.'], 404);
        }

        $items = $po->details->map(function($detail) {
            return [
                'bahan_baku_id' => $detail->master_bahan_baku_id,
                'supplier_id'   => $detail->supplier_id,
                'nama_bahan'    => $detail->bahanBaku->nama_barang ?? 'Barang Tidak Ditemukan',
                'nama_supplier' => $detail->supplier->nama_perusahaan ?? '-',
                'qty_pesan'     => $detail->qty,
                'qty_terima'    => 0, 
                'harga_satuan'  => $detail->harga_satuan,
                'satuan'        => $detail->bahanBaku->satuan ?? '-'
            ];
        });

        return response()->json([
            'po' => [
                'no_po' => $po->nomor_po,
                'tgl_pesan' => $po->tanggal_pesan,
            ],
            'items' => $items
        ]);
    }
}