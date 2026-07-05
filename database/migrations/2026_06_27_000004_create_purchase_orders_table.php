<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_po')->unique();

            $table->date('tanggal_pesan');
            $table->date('tanggal_diberikan')->nullable();

            // Disesuaikan dengan form HTML: Bahan Baku, Operasional, Insentif Fasilitas
            $table->string('kategori_biaya'); 

            $table->decimal('grand_total', 15, 2)->default(0);

            // status sederhana untuk flow BA
            $table->string('status')->default('draft'); // draft | approved | ba_created

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};