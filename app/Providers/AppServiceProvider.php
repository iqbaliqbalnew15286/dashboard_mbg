<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Database\Schema\Blueprint;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-run migration jika tabel kategori_biayas belum ada di database hosting
        try {
            if (Schema::hasTable('users') && !Schema::hasTable('kategori_biayas')) {
                Artisan::call('migrate', ['--force' => true]);

                if (!Schema::hasTable('kategori_biayas')) {
                    Schema::create('kategori_biayas', function (Blueprint $table) {
                        $table->id();
                        $table->string('nama_kategori')->unique();
                        $table->string('keterangan')->nullable();
                        $table->timestamps();
                    });
                }
            }
        } catch (\Throwable $e) {
            // Ignore if DB not yet configured
        }
    }
}
