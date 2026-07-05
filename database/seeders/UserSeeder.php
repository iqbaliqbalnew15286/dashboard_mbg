<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@mbginternal.com'],
            [
                'name' => 'MBG Internal Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'kasir@mbginternal.com'],
            [
                'name' => 'Kasir Shift 1',
                'password' => Hash::make('kasir123'),
                'role' => 'kasir',
            ]
        );
    }
}