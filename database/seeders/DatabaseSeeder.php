<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan urutannya seperti ini:
        $this->call([
            // 1. Data Utama/Master dulu (Tidak punya Foreign Key atau Foreign Key sudah ada)
            UserSeeder::class,
           
            MasterBahanBakuSeeder::class,
            
            // 2. Data Transaksi Induk (Purchase Order)
           
            
            // 3. Data Transaksi Anak (Tergantung pada PO)
            StockMutationSeeder::class, 
        ]);
    }
}