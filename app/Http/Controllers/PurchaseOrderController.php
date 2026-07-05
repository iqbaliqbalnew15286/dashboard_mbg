<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PoDetail;
use App\Models\MasterBahanBaku;
use App\Models\Supplier; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function create()
    {
        // Hanya mengirim data Bahan Baku dan Supplier dari Master Data
        return Inertia::render('po/Create', [
            'bahan_bakus'  => MasterBahanBaku::all(),
            'suppliers'    => Supplier::all(), 
        ]);
    }

    public function store(Request $request)
    {
        // Validasi disesuaikan dengan HTML form
        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            'nomor_po'              => 'nullable|string|unique:purchase_orders,nomor_po',
            'tanggal_pesan'         => 'required|date',
            'tanggal_diberikan'     => 'nullable|date',
            'grand_total'           => 'required|numeric|min:0',
            'items'                 => 'required|array|min:1',
            'items.*.bahan_baku_id' => 'required|exists:master_bahan_bakus,id',
            'items.*.supplier_id'   => 'required|exists:suppliers,id',
            'items.*.qty'           => 'required|numeric|min:0.01', // Mendukung desimal (misal 0.5 kg)
            'items.*.harga_satuan'  => 'required|numeric|min:0',
            'items.*.subtotal'      => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            // Auto-generate nomor PO jika kosong/Otomatis
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
    
    // =========================================================================
    // FITUR EDIT (Form Update PO)
    // =========================================================================
    public function edit($id)
    {
        // Cari PO berdasarkan ID beserta relasi detailnya
        $purchaseOrder = PurchaseOrder::with('details')->findOrFail($id);

        return Inertia::render('po/Edit', [
            'po'           => $purchaseOrder,
            'bahan_bakus'  => MasterBahanBaku::all(),
            'suppliers'    => Supplier::all(), 
        ]);
    }

    // =========================================================================
    // FITUR UPDATE (Simpan Perubahan Edit)
    // =========================================================================
    public function update(Request $request, $id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);

        $validated = $request->validate([
            'kategori_biaya'        => 'required|string',
            // Pastikan pengecekan unique mengecualikan ID PO yang sedang diedit
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

            // 1. Update data utama PO
            $purchaseOrder->update([
                'nomor_po'          => $nomorPo,
                'tanggal_pesan'     => $validated['tanggal_pesan'],
                'tanggal_diberikan' => $validated['tanggal_diberikan'] ?? null,
                'kategori_biaya'    => $validated['kategori_biaya'],
                'grand_total'       => $validated['grand_total'],
            ]);

            // 2. Hapus seluruh item lama (agar lebih aman dari duplikasi / selisih perhitungan)
            $purchaseOrder->details()->delete();

            // 3. Masukkan item baru yang diedit
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

    // =========================================================================
    // FITUR DELETE (Hapus PO)
    // =========================================================================
    public function destroy($id)
    {
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        // PO akan terhapus, dan jika di migration ada onDelete('cascade'), 
        // maka po_details akan otomatis ikut terhapus.
        $purchaseOrder->delete();

        return redirect()->back()->with('success', 'Purchase Order berhasil dihapus dari sistem.');
    }

    // =========================================================================
    // HALAMAN TRANSAKSI
    // =========================================================================
    public function transaksi()
    {
        $transactions = PurchaseOrder::with('details.bahanBaku', 'details.supplier')
                            ->orderByDesc('tanggal_pesan')
                            ->get();
                            
        return Inertia::render('po/Transaksi', [
            'transactions' => $transactions
        ]);
    }
}