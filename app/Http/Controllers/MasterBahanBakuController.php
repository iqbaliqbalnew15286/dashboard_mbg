<?php

namespace App\Http\Controllers;

use App\Models\MasterBahanBaku;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterBahanBakuController extends Controller
{
    public function index()
    {
        $bahanBakus = MasterBahanBaku::latest()->get();
        
        $totalBarang = $bahanBakus->count();
        $totalAset = $bahanBakus->sum(function($item) {
            return $item->harga_beli_awal * $item->saldo_awal;
        });

        return Inertia::render('Master/BahanBaku', [
            'bahan_bakus' => $bahanBakus,
            'stats' => [
                'total_barang' => $totalBarang,
                'total_aset' => $totalAset
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang'     => 'required|unique:master_bahan_bakus,kode_barang',
            'nama_barang'     => 'required|string|max:255',
            'satuan'          => 'required|string|max:30',
            // Kita pastikan nilainya diterima sebagai integer
            'harga_beli_awal' => 'required|integer|min:0',
            'saldo_awal'      => 'required|integer|min:0',
        ]);

        MasterBahanBaku::create($validated);
        return back()->with('success', 'Bahan baku berhasil ditambahkan');
    }

    public function update(Request $request, MasterBahanBaku $bahanBaku)
    {
        $validated = $request->validate([
            'kode_barang'     => 'required|unique:master_bahan_bakus,kode_barang,' . $bahanBaku->id,
            'nama_barang'     => 'required|string|max:255',
            'satuan'          => 'required|string|max:30',
            'harga_beli_awal' => 'required|integer|min:0',
            'saldo_awal'      => 'required|integer|min:0',
        ]);

        $bahanBaku->update($validated);
        return back()->with('success', 'Bahan baku berhasil diperbarui');
    }

    public function destroy(MasterBahanBaku $bahanBaku)
    {
        $bahanBaku->delete();
        return back()->with('success', 'Bahan baku berhasil dihapus');
    }
}