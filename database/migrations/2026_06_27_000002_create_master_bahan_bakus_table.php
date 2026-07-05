<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_bahan_bakus', function (Blueprint $table) {
            $table->id();
            $table->string('kode_barang')->unique();
            $table->string('nama_barang');
            $table->string('satuan', 30);
            
            $table->integer('harga_beli_awal')->default(0);
            // Kolom ini yang sebelumnya bikin error, sekarang sudah benar 'saldo_awal'
            $table->integer('saldo_awal')->default(0); 

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_bahan_bakus');
    }
};