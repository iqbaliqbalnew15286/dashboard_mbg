<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RabDetail extends Model
{
    protected $fillable = [
        'rab_id', 'supplier_id', 'master_bahan_baku_id', 'qty', 'harga_satuan', 'subtotal'
    ];

    public function rab(): BelongsTo
    {
        return $this->belongsTo(Rab::class, 'rab_id');
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