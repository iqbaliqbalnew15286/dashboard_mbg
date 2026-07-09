<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    // Menampilkan halaman utama laporan
    public function index()
    {
        return Inertia::render('laporan/Index');
    }

    // Endpoint API untuk mengambil data transaksi berdasarkan filter (POST)
    public function transaksi(Request $request)
    {
        // OPTIMASI: Gunakan select() untuk membatasi kolom yang ditarik dari database.
        // Ini akan memangkas ukuran payload JSON hingga 70% sehingga load data sangat cepat.
        $query = PurchaseOrder::select('id', 'tanggal_pesan', 'nomor_po', 'kategori_biaya', 'grand_total');

        // Filter dari tanggal
        if ($request->filled('tgl_awal')) {
            $query->whereDate('tanggal_pesan', '>=', $request->tgl_awal);
        }

        // Filter sampai tanggal
        if ($request->filled('tgl_akhir')) {
            $query->whereDate('tanggal_pesan', '<=', $request->tgl_akhir);
        }

        // Filter kategori
        if ($request->filled('kategori')) {
            $query->where('kategori_biaya', $request->kategori);
        }

        // Mengambil data urut dari yang terbaru
        $data = $query->orderByDesc('tanggal_pesan')->get();

        return response()->json([
            'data' => $data
        ]);
    }
}