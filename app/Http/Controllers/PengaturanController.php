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
        $pengaturan = Pengaturan::first() ?? new Pengaturan();
        
        // Memastikan konfigurasi cetak memiliki default jika baru pertama kali dijalankan
        if (!$pengaturan->konfigurasi_cetak) {
            $pengaturan->konfigurasi_cetak = [];
        }

        return Inertia::render('pengaturan/Index', [
            'pengaturan' => $pengaturan
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kop_surat_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $data = $request->except(['kop_surat_file']);
        
        // Ambil data konfigurasi cetak, pastikan selalu berupa array
        $data['konfigurasi_cetak'] = $request->input('konfigurasi_cetak', []);

        $pengaturan = Pengaturan::first();

        // Handle Upload File (Kop Surat)
        if ($request->hasFile('kop_surat_file')) {
            $file = $request->file('kop_surat_file');
            
            if ($pengaturan && $pengaturan->kop_surat && Storage::disk('public')->exists($pengaturan->kop_surat)) {
                Storage::disk('public')->delete($pengaturan->kop_surat);
            }

            $path = $file->store('kop_surat', 'public');
            $data['kop_surat'] = $path;
        }

        if ($pengaturan) {
            $pengaturan->update($data);
        } else {
            Pengaturan::create($data);
        }

        return back()->with('success', 'Format Cetakan & Konfigurasi Tanda Tangan berhasil disimpan!');
    }

    public function backupDanReset()
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('purchase_orders')->truncate();
            DB::table('po_details')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            return back()->with('success', 'Backup & Reset Data berhasil! Sistem kembali ke titik 0.');
        } catch (\Exception $e) {
            return back()->with('error', 'Terjadi kesalahan saat mereset data: ' . $e->getMessage());
        }
    }
}