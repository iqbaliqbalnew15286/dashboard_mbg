<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Akun Super Admin
        User::updateOrCreate(
            ['email' => 'superadmin@mbginternal.com'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'superadmin',
                'avatar' => null,
                'last_seen' => now(), 
            ]
        );

        // Akun Admin Biasa
        User::updateOrCreate(
            ['email' => 'admin@mbginternal.com'],
            [
                'name' => 'Admin Operasional',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'avatar' => null,
            ]
        );
    }
}