<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterBahanBaku extends Model 
{
    protected $fillable = [
        'kode_barang', 
        'nama_barang', 
        'satuan', 
        'harga_beli_awal', 
        'saldo_awal'
    ];
}