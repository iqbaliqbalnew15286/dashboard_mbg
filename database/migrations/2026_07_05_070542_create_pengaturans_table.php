<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturans', function (Blueprint $table) {
            $table->id();
            $table->string('kop_surat')->nullable();
            
            // Pengawas Keuangan
            $table->string('pengawas_jabatan')->nullable();
            $table->string('pengawas_nama')->nullable();
            $table->string('pengawas_nip')->nullable();
            
            // Kepala SPPG
            $table->string('sppg_jabatan')->nullable();
            $table->string('sppg_nama')->nullable();
            $table->string('sppg_nip')->nullable();
            
            // Asisten Lapangan
            $table->string('asisten_jabatan')->nullable();
            $table->string('asisten_nama')->nullable();
            $table->string('asisten_nip')->nullable();
            
            // Penerima Barang
            $table->string('penerima_jabatan')->nullable();
            $table->string('penerima_nama')->nullable();
            $table->string('penerima_nip')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturans');
    }
};