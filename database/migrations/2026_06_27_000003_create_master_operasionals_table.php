<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_operasionals', function (Blueprint $table) {
            $table->id();
            // Kolom ini yang sebelumnya hilang sehingga menyebabkan error 1054
            $table->string('kode_transaksi')->unique();
            $table->string('nama_transaksi');
            $table->string('satuan')->nullable()->default('-');
            $table->decimal('pagu_awal', 15, 2)->default(0);
            $table->decimal('jumlah_bayar', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_operasionals');
    }
};