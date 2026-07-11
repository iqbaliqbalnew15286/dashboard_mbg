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
            $table->string('kode_transaksi', 50)->unique();
            $table->string('nama_transaksi');
            $table->string('satuan', 50);
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