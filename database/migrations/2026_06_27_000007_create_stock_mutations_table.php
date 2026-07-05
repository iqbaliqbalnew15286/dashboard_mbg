<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_mutations', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke Master dan Transaksi
            $table->foreignId('master_bahan_baku_id')->constrained('master_bahan_bakus')->onDelete('cascade');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->onDelete('set null');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            // Inti Data Mutasi
            $table->string('jenis'); // Isinya hanya: 'masuk' atau 'keluar'
            $table->date('tanggal');
            $table->decimal('qty', 12, 2);
            $table->decimal('harga_satuan', 15, 2)->default(0); 
            
            // Input manual dari frontend
            $table->string('petugas')->nullable(); 
            $table->string('keterangan')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_mutations');
    }
};