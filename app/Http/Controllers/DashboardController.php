<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\MasterBahanBaku;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index()
    {
        /**
         * OPTIMASI: 
         * Menggunakan Cache selama 5 menit (300 detik). 
         * Ini akan membuat dashboard terbuka INSTAN karena data 
         * diambil dari memori, bukan dari database setiap saat.
         */
        $stats = Cache::remember('dashboard_stats', 300, function () {
            return [
                'total_pengeluaran' => PurchaseOrder::where('status', 'selesai')->sum('grand_total'),
                'total_po'          => PurchaseOrder::count(),
                'total_bahan_baku'  => MasterBahanBaku::count(),
                'total_users'       => User::count(),
            ];
        });

        // PERBAIKAN: with('user') dihapus karena model PurchaseOrder tidak memiliki relasi user
        $recent_pos = Cache::remember('recent_pos', 300, function () {
            return PurchaseOrder::latest()->take(5)->get();
        });

        return Inertia::render('Dashboard', [
            'stats'      => $stats,
            'recent_pos' => $recent_pos
        ]);
    }
}