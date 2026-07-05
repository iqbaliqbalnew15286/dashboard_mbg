<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterOperasional extends Model
{
    // Tambahkan array fillable ini
    protected $fillable = [
        'kode_transaksi',
        'nama_transaksi',
        'satuan',
        'pagu_awal',
        'jumlah_bayar'
    ];
}