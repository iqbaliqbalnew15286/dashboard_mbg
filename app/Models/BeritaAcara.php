<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BeritaAcara extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'nomor_ba',
        'tanggal_ba',
        'keterangan'
    ];

    // Relasi ke tabel purchase_orders
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }
}