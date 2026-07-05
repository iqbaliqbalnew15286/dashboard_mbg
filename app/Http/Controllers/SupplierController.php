<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index()
    {
        // Mengarahkan ke file resources/js/pages/po/Supplier.jsx
        return Inertia::render('po/Supplier', [
            'suppliers' => Supplier::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_perusahaan' => 'required|string|max:255|unique:suppliers,nama_perusahaan',
            'nama'            => 'nullable|string|max:255',
            'kontak'          => 'nullable|string|max:50',
            'alamat'          => 'nullable|string',
        ]);

        Supplier::create($validated);

        return back()->with('success', 'Supplier berhasil ditambahkan.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nama_perusahaan' => 'required|string|max:255|unique:suppliers,nama_perusahaan,' . $supplier->id,
            'nama'            => 'nullable|string|max:255',
            'kontak'          => 'nullable|string|max:50',
            'alamat'          => 'nullable|string',
        ]);

        $supplier->update($validated);

        return back()->with('success', 'Data Supplier berhasil diperbarui.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return back()->with('success', 'Supplier berhasil dihapus.');
    }
}