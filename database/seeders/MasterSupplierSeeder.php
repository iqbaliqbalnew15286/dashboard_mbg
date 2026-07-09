<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterSupplierSeeder extends Seeder
{
    public function run(): void
    {
        // Data mentah dengan duplikasi
        $rawSuppliers = [
            'CV Sumber Pangan',
            'Toko Daging Segar',
            'CV Sumber Pangan',
            'PT Maju Jaya',
            'CV Sumber Pangan',
            'CV Sumber Pangan',
            'CV Sumber Pangan',
            'PT Maju Jaya',
            'PT. Warung Kelontong',
            'CV Sumber Pangan',
            'CV Sumber Pangan'
        ];

        // Menyaring data duplikat agar tidak melanggar aturan unique() pada migration
        $suppliers = array_unique($rawSuppliers);

        $data = [];
        foreach ($suppliers as $nama) {
            $data[] = [
                'nama_perusahaan' => $nama,
                'nama'            => '-', // PIC
                'kontak'          => '-',
                'alamat'          => '-',
                'created_at'      => now(),
                'updated_at'      => now(),
            ];
        }

        // Insert massal agar lebih ringan dan cepat
        DB::table('suppliers')->insert($data);
    }
}