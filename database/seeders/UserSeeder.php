<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Akun Super Admin (Bisa tambah/hapus admin lain)
        User::updateOrCreate(
            ['email' => 'superadmin@mbginternal.com'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'superadmin',
                'last_seen' => now(), // Simulasi sedang online
            ]
        );

        // Akun Admin Biasa (Hanya bisa melihat)
        User::updateOrCreate(
            ['email' => 'admin@mbginternal.com'],
            [
                'name' => 'Admin Operasional',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );
    }
}