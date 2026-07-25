<?php

namespace App\Http\Controllers;

use App\Models\KategoriBiaya;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KategoriBiayaController extends Controller
{
    /**
     * Auto-seed data awal jika belum ada kategori sama sekali
     */
    private function seedDefaultsIfNeeded()
    {
        if (KategoriBiaya::count() === 0) {
            $defaults = [
                ['nama_kategori' => 'Bahan Baku', 'keterangan' => 'Belanja bahan baku pangan dan dapur operasional'],
                ['nama_kategori' => 'Operasional', 'keterangan' => 'Biaya operasional harian, listrik, kebersihan, dll.'],
                ['nama_kategori' => 'Insentif Fasilitas', 'keterangan' => 'Insentif pendukung dan pemeliharaan fasilitas'],
            ];

            foreach ($defaults as $d) {
                KategoriBiaya::firstOrCreate(
                    ['nama_kategori' => $d['nama_kategori']],
                    ['keterangan' => $d['keterangan']]
                );
            }
        }
    }

    public function index(Request $request)
    {
        $this->seedDefaultsIfNeeded();

        $query = KategoriBiaya::query();

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama_kategori', 'like', '%' . $search . '%')
                  ->orWhere('keterangan', 'like', '%' . $search . '%');
            });
        }

        $kategoriBiayas = $query->latest()->paginate(10)->withQueryString();
        $totalKategori = KategoriBiaya::count();

        return Inertia::render('master/Kategori', [
            'kategoris' => $kategoriBiayas,
            'filters' => $request->only('search'),
            'stats' => [
                'total_kategori' => $totalKategori
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:100|unique:kategori_biayas,nama_kategori',
            'keterangan'    => 'nullable|string|max:255',
        ]);

        KategoriBiaya::create($validated);
        return back()->with('success', 'Kategori biaya berhasil ditambahkan');
    }

    public function update(Request $request, KategoriBiaya $kategori)
    {
        $validated = $request->validate([
            'nama_kategori' => 'required|string|max:100|unique:kategori_biayas,nama_kategori,' . $kategori->id,
            'keterangan'    => 'nullable|string|max:255',
        ]);

        $kategori->update($validated);
        return back()->with('success', 'Kategori biaya berhasil diperbarui');
    }

    public function destroy(KategoriBiaya $kategori)
    {
        $kategori->delete();
        return back()->with('success', 'Kategori biaya berhasil dihapus');
    }
}
