<?php

namespace App\Http\Controllers;

use App\Models\Pengaturan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class PengaturanController extends Controller
{
    public function index()
    {
        // Ambil data pengaturan pertama (jika belum ada, buat instans kosong)
        $pengaturan = Pengaturan::first() ?? new Pengaturan();
        
        return Inertia::render('pengaturan/Index', [
            'pengaturan' => $pengaturan
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->except(['kop_surat_file']);
        $pengaturan = Pengaturan::first();

        // Handle Upload Gambar (Kop Surat)
        if ($request->hasFile('kop_surat_file')) {
            $file = $request->file('kop_surat_file');
            
            // Hapus logo lama jika ada
            if ($pengaturan && $pengaturan->kop_surat && Storage::disk('public')->exists($pengaturan->kop_surat)) {
                Storage::disk('public')->delete($pengaturan->kop_surat);
            }

            // Simpan gambar baru ke folder storage/app/public/kop_surat
            $path = $file->store('kop_surat', 'public');
            $data['kop_surat'] = $path;
        }

        // Simpan atau Update
        if ($pengaturan) {
            $pengaturan->update($data);
        } else {
            Pengaturan::create($data);
        }

        return back()->with('success', 'Format Cetakan & Penandatangan berhasil disimpan!');
    }

    public function resetDataUji()
    {
        // PERINGATAN: Ini akan mengosongkan tabel transaksi. 
        // Pastikan nama tabel disesuaikan dengan yang ada di database Anda.
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Contoh pembersihan tabel transaksi (Kosongkan tabel master dibiarkan)
        DB::table('purchase_orders')->truncate();
        DB::table('po_details')->truncate();
        DB::table('stock_mutations')->truncate();
        DB::table('rabs')->truncate();
        DB::table('rab_details')->truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        return back()->with('success', 'Data Uji Transaksi berhasil dibersihkan! Sistem kembali ke titik 0.');
    }
}