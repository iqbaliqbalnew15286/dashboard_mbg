<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PoDetail extends Model
{
    protected $fillable = [
        'purchase_order_id', 
        'master_bahan_baku_id', 
        'supplier_id', 
        'qty', 
        'harga_satuan', 
        'subtotal'
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function bahanBaku(): BelongsTo
    {
        return $this->belongsTo(MasterBahanBaku::class, 'master_bahan_baku_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}