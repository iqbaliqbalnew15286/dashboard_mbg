<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMutation extends Model
{
    protected $fillable = [
        'master_bahan_baku_id',
        'purchase_order_id',
        'supplier_id',
        'user_id',
        'jenis',
        'tanggal',
        'qty',
        'harga_satuan',
        'petugas',
        'keterangan'
    ];

    public function bahanBaku()
    {
        return $this->belongsTo(MasterBahanBaku::class, 'master_bahan_baku_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}