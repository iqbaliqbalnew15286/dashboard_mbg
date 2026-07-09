<?php

namespace App\Http\Controllers;

use App\Models\MasterBahanBaku;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class MasterBahanBakuController extends Controller
{
    public function index(Request $request)
    {
        // Paginasi dan fitur pencarian di Backend (Super Ringan)
        $query = MasterBahanBaku::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('nama_barang', 'like', '%' . $request->search . '%')
                  ->orWhere('kode_barang', 'like', '%' . $request->search . '%');
        }

        // Ambil 10 data per halaman dan bawa query parameter ('search')
        $bahanBakus = $query->latest()->paginate(10)->withQueryString();
        
        // Kalkulasi statistik langsung di Database (Jauh lebih cepat dari array sum PHP)
        $totalBarang = MasterBahanBaku::count();
        $totalAset = MasterBahanBaku::sum(DB::raw('harga_beli_awal * saldo_awal'));

        return Inertia::render('Master/BahanBaku', [
            'bahan_bakus' => $bahanBakus,
            'filters' => $request->only('search'),
            'stats' => [
                'total_barang' => $totalBarang,
                'total_aset' => (int) $totalAset
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang'     => 'required|unique:master_bahan_bakus,kode_barang',
            'nama_barang'     => 'required|string|max:255',
            'satuan'          => 'required|string|max:30',
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