<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berita_acaras', function (Blueprint $table) {
            if (!Schema::hasColumn('berita_acaras', 'jenis_ba')) {
                $table->string('jenis_ba', 100)->default('SURAT PERINTAH MEMBAYAR')->after('nomor_ba');
            }
        });
    }

    public function down(): void
    {
        Schema::table('berita_acaras', function (Blueprint $table) {
            if (Schema::hasColumn('berita_acaras', 'jenis_ba')) {
                $table->dropColumn('jenis_ba');
            }
        });
    }
};
