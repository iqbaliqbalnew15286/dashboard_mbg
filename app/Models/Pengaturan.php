<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengaturan extends Model
{
    // Mendaftarkan semua kolom agar bisa di-save ke database
    protected $fillable = [
        'kop_surat',
        'yayasan_jabatan', 'yayasan_nama', 'yayasan_nip',
        'pengawas_jabatan', 'pengawas_nama', 'pengawas_nip',
        'sppg_jabatan', 'sppg_nama', 'sppg_nip',
        'asisten_jabatan', 'asisten_nama', 'asisten_nip',
        'penerima_jabatan', 'penerima_nama', 'penerima_nip',
        'konfigurasi_cetak'
    ];

    // Mengonversi format JSON dari database menjadi Array agar mudah dibaca React
    protected $casts = [
        'konfigurasi_cetak' => 'array',
    ];
}