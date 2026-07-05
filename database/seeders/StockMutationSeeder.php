<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class StockMutationSeeder extends Seeder
{
    public function run(): void
    {
        // Matikan Foreign Key agar bisa truncate
        Schema::disableForeignKeyConstraints();
        DB::table('stock_mutations')->truncate();
        Schema::enableForeignKeyConstraints();

        $now = Carbon::now();

        // Ambil purchase_orders yang ada agar purchase_order_id tidak mengacu ID yang tidak tersedia.
        // Kalau purchase_orders belum ada, maka purchase_order_id dibuat null (karena nullable + ON DELETE SET NULL).
        $purchaseOrders = DB::table('purchase_orders')->orderBy('id')->pluck('id')->values();
        $po1 = $purchaseOrders[0] ?? null;
        $po2 = $purchaseOrders[1] ?? ($purchaseOrders[0] ?? null);

        // Data Simulasi
        $mutations = [
            // --- BARANG MASUK (TERIMA) ---
            ['master_bahan_baku_id' => 1, 'purchase_order_id' => $po1, 'user_id' => 1, 'jenis' => 'masuk', 'tanggal' => '2026-06-01', 'qty' => 50, 'harga_satuan' => 15000, 'petugas' => 'Admin'],
            ['master_bahan_baku_id' => 2, 'purchase_order_id' => $po1, 'user_id' => 1, 'jenis' => 'masuk', 'tanggal' => '2026-06-02', 'qty' => 100, 'harga_satuan' => 20000, 'petugas' => 'Admin'],
            ['master_bahan_baku_id' => 3, 'purchase_order_id' => $po2, 'user_id' => 1, 'jenis' => 'masuk', 'tanggal' => '2026-06-03', 'qty' => 20, 'harga_satuan' => 50000, 'petugas' => 'Admin'],

            // --- BARANG KELUAR ---
            ['master_bahan_baku_id' => 1, 'purchase_order_id' => null, 'user_id' => 1, 'jenis' => 'keluar', 'tanggal' => '2026-06-04', 'qty' => 10, 'harga_satuan' => 0, 'petugas' => 'Gudang'],
            ['master_bahan_baku_id' => 2, 'purchase_order_id' => null, 'user_id' => 1, 'jenis' => 'keluar', 'tanggal' => '2026-06-05', 'qty' => 25, 'harga_satuan' => 0, 'petugas' => 'Gudang'],
            ['master_bahan_baku_id' => 3, 'purchase_order_id' => null, 'user_id' => 1, 'jenis' => 'keluar', 'tanggal' => '2026-06-06', 'qty' => 5, 'harga_satuan' => 0, 'petugas' => 'Gudang'],
        ];

        // Masukkan data dengan timestamp
        foreach ($mutations as $m) {
            DB::table('stock_mutations')->insert(array_merge($m, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }

        $this->command->info('Data Stock Mutation berhasil di-seeding!');
    }
}

