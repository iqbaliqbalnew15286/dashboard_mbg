<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Modifikasi tabel rabs
        Schema::table('rabs', function (Blueprint $table) {
            if (!Schema::hasColumn('rabs', 'tipe')) {
                $table->string('tipe', 50)->default('bahan')->after('id');
            }
            if (!Schema::hasColumn('rabs', 'kategori_pengadaan')) {
                $table->string('kategori_pengadaan', 100)->nullable()->after('tipe');
            }
        });

        // 2. Modifikasi tabel rab_details
        Schema::table('rab_details', function (Blueprint $table) {
            if (!Schema::hasColumn('rab_details', 'nama_pengadaan')) {
                $table->string('nama_pengadaan')->nullable()->after('master_bahan_baku_id');
            }
        });

        // Mengubah master_bahan_baku_id agar nullable di rab_details
        Schema::table('rab_details', function (Blueprint $table) {
            $table->unsignedBigInteger('master_bahan_baku_id')->nullable()->change();
        });

        // 3. Modifikasi tabel purchase_orders
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'rab_id')) {
                $table->foreignId('rab_id')->nullable()->after('id')->constrained('rabs')->onDelete('cascade');
            }
        });

        // 4. Modifikasi tabel po_details
        Schema::table('po_details', function (Blueprint $table) {
            if (!Schema::hasColumn('po_details', 'nama_pengadaan')) {
                $table->string('nama_pengadaan')->nullable()->after('master_bahan_baku_id');
            }
        });

        Schema::table('po_details', function (Blueprint $table) {
            $table->unsignedBigInteger('master_bahan_baku_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('po_details', function (Blueprint $table) {
            if (Schema::hasColumn('po_details', 'nama_pengadaan')) {
                $table->dropColumn('nama_pengadaan');
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_orders', 'rab_id')) {
                $table->dropForeign(['rab_id']);
                $table->dropColumn('rab_id');
            }
        });

        Schema::table('rab_details', function (Blueprint $table) {
            if (Schema::hasColumn('rab_details', 'nama_pengadaan')) {
                $table->dropColumn('nama_pengadaan');
            }
        });

        Schema::table('rabs', function (Blueprint $table) {
            if (Schema::hasColumn('rabs', 'kategori_pengadaan')) {
                $table->dropColumn('kategori_pengadaan');
            }
            if (Schema::hasColumn('rabs', 'tipe')) {
                $table->dropColumn('tipe');
            }
        });
    }
};
