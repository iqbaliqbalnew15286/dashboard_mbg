<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterOperasional extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode_transaksi', 'nama_transaksi', 'satuan', 
        'pagu_awal', 'jumlah_bayar'
    ];
}