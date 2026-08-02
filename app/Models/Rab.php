<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rab extends Model
{
    protected $fillable = [
        'tipe', 'kategori_pengadaan', 'tanggal', 'nama_menu',
        'qty_porsi_kecil', 'harga_porsi_kecil', 'total_porsi_kecil',
        'qty_porsi_besar', 'harga_porsi_besar', 'total_porsi_besar',
        'total_pagu', 'total_belanja', 'selisih'
    ];

    public function details(): HasMany
    {
        return $this->hasMany(RabDetail::class, 'rab_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class, 'rab_id');
    }
}