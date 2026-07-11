<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_po', 'tanggal_pesan', 'tanggal_diberikan', 
        'kategori_biaya', 'grand_total', 'status'
    ];

    // Relasi agar bahan baku menyatu di dalam 1 PO
    public function details()
    {
        return $this->hasMany(PoDetail::class, 'purchase_order_id', 'id');
    }
}