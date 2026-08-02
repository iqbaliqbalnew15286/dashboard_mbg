<?php

namespace App\Http\Controllers;

use App\Models\BeritaAcara;
use App\Models\PurchaseOrder;
use App\Models\KategoriBiaya;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BeritaAcaraController extends Controller
{
    public function index(Request $request)
    {
        $query = BeritaAcara::with(['purchaseOrder.details.supplier', 'purchaseOrder.details.bahanBaku']);

        if ($request->filled('jenis_ba')) {
            $query->where('jenis_ba', $request->jenis_ba);
        }

        $bas = $query->latest()->get();
        
        $poTersedia = PurchaseOrder::whereNotIn('id', BeritaAcara::pluck('purchase_order_id'))
                                   ->orderByDesc('tanggal_pesan')
                                   ->get();

        $jenisBaList = [
            'SURAT PERINTAH MEMBAYAR',
            'BERITA ACARA PENGEMBALIAN DANA',
            'BERITA ACARA PENGALIHAN SISA DANA PETTY CASH',
            'BERITA ACARA INSENTIF FASILITAS'
        ];

        return Inertia::render('beritaacara/Index', [
            'bas'             => $bas,
            'available_pos'   => $poTersedia,
            'kategori_biayas' => KategoriBiaya::all(),
            'jenis_ba_list'   => $jenisBaList,
            'filters'         => $request->only('jenis_ba')
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal_ba'        => 'required|date',
            'nomor_ba'          => 'nullable|string|unique:berita_acaras,nomor_ba',
            'jenis_ba'          => 'required|string',
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'keterangan'        => 'required|string',
        ]);

        $nomorBa = $validated['nomor_ba'] ?? 'BA-MBG-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        BeritaAcara::create([
            'tanggal_ba'        => $validated['tanggal_ba'],
            'nomor_ba'          => $nomorBa,
            'jenis_ba'          => $validated['jenis_ba'],
            'purchase_order_id' => $validated['purchase_order_id'],
            'keterangan'        => $validated['keterangan'],
        ]);

        PurchaseOrder::where('id', $validated['purchase_order_id'])->update(['status' => 'approved']);

        return back()->with('success', 'Berita Acara (' . $validated['jenis_ba'] . ') berhasil diterbitkan.');
    }

    public function destroy($id)
    {
        $ba = BeritaAcara::findOrFail($id);
        
        if ($ba->purchaseOrder) {
            $ba->purchaseOrder->update(['status' => 'draft']);
        }
        
        $ba->delete();

        return back()->with('success', 'Berita Acara berhasil dihapus dari sistem.');
    }
}