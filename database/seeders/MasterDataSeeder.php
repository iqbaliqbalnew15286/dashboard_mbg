<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['nama_perusahaan' => 'CV Sumber Pangan', 'nama' => '-', 'kontak' => '-', 'alamat' => '-'],
            ['nama_perusahaan' => 'Toko Daging Segar', 'nama' => '-', 'kontak' => '-', 'alamat' => '-'],
            ['nama_perusahaan' => 'PT Maju Jaya', 'nama' => '-', 'kontak' => '-', 'alamat' => '-'],
            ['nama_perusahaan' => 'PT. Warung Kelontong', 'nama' => '-', 'kontak' => '-', 'alamat' => '-'],
        ];

        foreach ($suppliers as $sup) {
            // firstOrCreate akan mengecek: jika "CV Sumber Pangan" sudah ada, jangan ditambahkan lagi.
            Supplier::firstOrCreate(
                ['nama_perusahaan' => $sup['nama_perusahaan']], 
                [
                    'nama' => $sup['nama'],
                    'kontak' => $sup['kontak'],
                    'alamat' => $sup['alamat']
                ]
            );
        }
    }
}