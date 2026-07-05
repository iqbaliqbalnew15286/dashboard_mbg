<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model 
{
    protected $fillable = [
        'nomor_po', 
        'tanggal_pesan', 
        'tanggal_diberikan', 
        'kategori_biaya', 
        'grand_total', 
        'status'
    ];

    public function details(): HasMany 
    {
        return $this->hasMany(PoDetail::class, 'purchase_order_id');
    }
}