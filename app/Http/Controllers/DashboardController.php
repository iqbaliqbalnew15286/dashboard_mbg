<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\MasterBahanBaku;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Data Statistik (Di-cache 5 menit agar super ringan)
        $stats = Cache::remember('dashboard_stats', 300, function () {
            return [
                'total_pengeluaran' => PurchaseOrder::whereIn('status', ['selesai', 'approved'])->sum('grand_total') ?? 0,
                'total_po'          => PurchaseOrder::count(),
                'total_supplier'    => Supplier::count(),
                'total_bahan_baku'  => MasterBahanBaku::count(),
            ];
        });

        // 2. Transaksi PO Terbaru (Ambil 5 terakhir beserta relasi supplier-nya)
        $recent_pos = Cache::remember('recent_pos', 300, function () {
            return PurchaseOrder::with(['details.supplier'])->latest()->take(5)->get();
        });

        // 3. Peringatan Stok Kritis (Ambil 5 bahan baku dengan saldo paling sedikit)
        $critical_items = Cache::remember('critical_items', 300, function () {
            return MasterBahanBaku::orderBy('saldo_awal', 'asc')->take(5)->get();
        });

        // 4. Data Tren Grafik Arus Kas (7 Hari Terakhir)
        $trends = Cache::remember('dashboard_trends', 300, function () {
            $trendData = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i)->format('Y-m-d');
                $total = PurchaseOrder::whereDate('tanggal_pesan', $date)->sum('grand_total');
                $trendData[] = [
                    'tanggal' => Carbon::now()->subDays($i)->format('d M'),
                    'total'   => (float) $total
                ];
            }
            return $trendData;
        });

        return Inertia::render('Dashboard', [
            'stats'         => $stats,
            'recentPos'     => $recent_pos,
            'criticalItems' => $critical_items,
            'trends'        => $trends
        ]);
    }
}