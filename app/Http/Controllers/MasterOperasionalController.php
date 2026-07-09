<?php

namespace App\Http\Controllers;

use App\Models\MasterOperasional;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class MasterOperasionalController extends Controller
{
    public function index(Request $request)
    {
        // Paginasi & Pencarian Super Ringan di sisi Server
        $query = MasterOperasional::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('nama_transaksi', 'like', '%' . $request->search . '%')
                  ->orWhere('kode_transaksi', 'like', '%' . $request->search . '%');
        }

        $operasionals = $query->orderByDesc('created_at')->paginate(10)->withQueryString();

        // Kalkulasi di level Database (Tidak membebani RAM PHP)
        $totalTransaksi = MasterOperasional::count();
        $totalPagu = MasterOperasional::sum('pagu_awal');
        $totalBayar = MasterOperasional::sum('jumlah_bayar');

        return Inertia::render('master/operasional/Index', [
            'operasionals' => $operasionals,
            'filters'      => $request->only('search'),
            'stats'        => [
                'total_transaksi' => $totalTransaksi,
                'total_pagu'      => (int) $totalPagu,
                'total_bayar'     => (int) $totalBayar
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_transaksi' => 'nullable|string|unique:master_operasionals,kode_transaksi',
            'nama_transaksi' => 'required|string|max:255',
            'satuan'         => 'required|string|max:50',
            'pagu_awal'      => 'required|numeric|min:0',
            'jumlah_bayar'   => 'nullable|numeric|min:0',
        ]);

        $kodeTransaksi = $validated['kode_transaksi'] ?? 'OP-' . strtoupper(Str::random(4));

        MasterOperasional::create([
            'kode_transaksi' => $kodeTransaksi,
            'nama_transaksi' => $validated['nama_transaksi'],
            'satuan'         => $validated['satuan'],
            'pagu_awal'      => $validated['pagu_awal'],
            'jumlah_bayar'   => $validated['jumlah_bayar'] ?? 0,
        ]);

        return back()->with('success', 'Data Anggaran Operasional berhasil disimpan.');
    }

    public function update(Request $request, $id)
    {
        $operasional = MasterOperasional::findOrFail($id);

        $validated = $request->validate([
            'kode_transaksi' => 'nullable|string|unique:master_operasionals,kode_transaksi,' . $id,
            'nama_transaksi' => 'required|string|max:255',
            'satuan'         => 'required|string|max:50',
            'pagu_awal'      => 'required|numeric|min:0',
            'jumlah_bayar'   => 'nullable|numeric|min:0',
        ]);

        $operasional->update([
            'kode_transaksi' => $validated['kode_transaksi'] ?? $operasional->kode_transaksi,
            'nama_transaksi' => $validated['nama_transaksi'],
            'satuan'         => $validated['satuan'],
            'pagu_awal'      => $validated['pagu_awal'],
            'jumlah_bayar'   => $validated['jumlah_bayar'] ?? $operasional->jumlah_bayar,
        ]);

        return back()->with('success', 'Data Anggaran Operasional berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterOperasional::findOrFail($id)->delete();
        return back()->with('success', 'Data Anggaran Operasional berhasil dihapus.');
    }
}