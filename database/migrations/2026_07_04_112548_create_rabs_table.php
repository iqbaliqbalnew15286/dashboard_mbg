<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rabs', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->string('nama_menu')->nullable(); // cth: "sushi (with kyuri & wortel)"

            // Perhitungan Pagu / Anggaran
            $table->integer('qty_porsi_kecil')->default(0);
            $table->decimal('harga_porsi_kecil', 15, 2)->default(8000);
            $table->decimal('total_porsi_kecil', 15, 2)->default(0);

            $table->integer('qty_porsi_besar')->default(0);
            $table->decimal('harga_porsi_besar', 15, 2)->default(10000);
            $table->decimal('total_porsi_besar', 15, 2)->default(0);

            // Summary Finansial
            $table->decimal('total_pagu', 15, 2)->default(0);    // Total Anggaran (Besar+Kecil)
            $table->decimal('total_belanja', 15, 2)->default(0); // Total Kebutuhan Supplier
            $table->decimal('selisih', 15, 2)->default(0);       // Pagu - Belanja

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rabs');
    }
};