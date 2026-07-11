<?php

namespace App\Http\Controllers;

use App\Models\BeritaAcara;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BeritaAcaraController extends Controller
{
    public function index()
    {
        // Ambil semua BA beserta relasi PO-nya
        $bas = BeritaAcara::with('purchaseOrder')->latest()->get();
        
        // Ambil PO yang BELUM memiliki Berita Acara (Untuk pilihan dropdown Input BA)
        // Mengecualikan ID PO yang sudah ada di tabel Berita Acara
        $poTersedia = PurchaseOrder::whereNotIn('id', BeritaAcara::pluck('purchase_order_id'))
                                   ->orderByDesc('tanggal_pesan')
                                   ->get();

        // Nama folder "beritaacara" (huruf kecil semua) dan "Index" (I besar)
        return Inertia::render('beritaacara/Index', [
            'bas' => $bas,
            'available_pos' => $poTersedia
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tanggal_ba'        => 'required|date',
            'nomor_ba'          => 'nullable|string|unique:berita_acaras,nomor_ba',
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'keterangan'        => 'required|string',
        ]);

        // Auto-generate nomor BA jika dikosongkan
        $nomorBa = $validated['nomor_ba'] ?? 'BA-MBG-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        BeritaAcara::create([
            'tanggal_ba'        => $validated['tanggal_ba'],
            'nomor_ba'          => $nomorBa,
            'purchase_order_id' => $validated['purchase_order_id'],
            'keterangan'        => $validated['keterangan'],
        ]);

        // PERBAIKAN ERROR SQL 1265: 
        // Mengubah 'ba_created' menjadi 'approved' agar sesuai dengan ENUM database
        PurchaseOrder::where('id', $validated['purchase_order_id'])->update(['status' => 'approved']);

        return back()->with('success', 'Berita Acara berhasil diterbitkan.');
    }

    public function destroy($id)
    {
        $ba = BeritaAcara::findOrFail($id);
        
        // Kembalikan status PO menjadi draft sebelum BA dihapus agar bisa diproses ulang
        if ($ba->purchaseOrder) {
            $ba->purchaseOrder->update(['status' => 'draft']);
        }
        
        $ba->delete();

        return back()->with('success', 'Berita Acara berhasil dihapus dari sistem.');
    }
}