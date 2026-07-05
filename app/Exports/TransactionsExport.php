<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TransactionsExport implements FromCollection, WithHeadings
{
    protected $startDate, $endDate;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        $query = Transaction::query()->with('user');
        
        // Filter logika
        if ($this->startDate) $query->where('created_at', '>=', $this->startDate);
        if ($this->endDate) $query->where('created_at', '<=', $this->endDate);

        return $query->get()->map(function($t) {
            return [
                $t->order_id,
                $t->created_at->format('d-m-Y H:i'),
                $t->user->name ?? 'Kasir',
                $t->total_price,
            ];
        });
    }

    public function headings(): array
    {
        return ['ID Transaksi', 'Waktu', 'Kasir', 'Total'];
    }
}