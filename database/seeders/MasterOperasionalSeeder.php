<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterOperasionalSeeder extends Seeder
{
    public function run(): void
    {
        $operasionals = [
            ['nama_transaksi' => 'Sewa Booth KEBAPER / Tempat', 'satuan' => 'BULAN', 'pagu' => 1500000],
            ['nama_transaksi' => 'Isi Ulang Gas LPG', 'satuan' => 'TABUNG', 'pagu' => 300000],
            ['nama_transaksi' => 'Listrik Operasional', 'satuan' => 'BULAN', 'pagu' => 500000],
            ['nama_transaksi' => 'Retribusi Keamanan & Sampah', 'satuan' => 'BULAN', 'pagu' => 150000],
            ['nama_transaksi' => 'Biaya Promosi / Ads', 'satuan' => 'KALI', 'pagu' => 500000],
        ];

        $data = [];
        foreach ($operasionals as $op) {
            $data[] = [
                'kode_transaksi' => 'OP-' . strtoupper(Str::random(4)),
                'nama_transaksi' => $op['nama_transaksi'],
                'satuan'         => $op['satuan'],
                'pagu_awal'      => $op['pagu'],
                'jumlah_bayar'   => 0,
                'created_at'     => now(),
                'updated_at'     => now(),
            ];
        }

        DB::table('master_operasionals')->insert($data);
    }
}