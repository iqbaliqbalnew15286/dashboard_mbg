<?php

namespace App\Http\Controllers;

use App\Models\MasterOperasional;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MasterOperasionalController extends Controller
{
    public function index(Request $request)
    {
        // Paginasi & Pencarian Super Ringan di sisi Server
        $query = MasterOperasional::query();

        // Menggunakan filled() lebih aman daripada sekadar mengecek keberadaan key
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('nama_transaksi', 'like', "%{$search}%")
                  ->orWhere('kode_transaksi', 'like', "%{$search}%");
        }

        $operasionals = $query->orderByDesc('created_at')->paginate(10)->withQueryString();

        // Kalkulasi di level Database (Tidak membebani RAM PHP)
        $totalTransaksi = MasterOperasional::count();
        $totalPagu      = MasterOperasional::sum('pagu_awal');
        $totalBayar     = MasterOperasional::sum('jumlah_bayar');

        return Inertia::render('master/operasional/Index', [
            'operasionals' => $operasionals,
            'filters'      => $request->only('search'),
            'stats'        => [
                'total_transaksi' => $totalTransaksi,
                'total_pagu'      => (float) $totalPagu,  // Menggunakan float agar angka desimal tidak terpotong
                'total_bayar'     => (float) $totalBayar
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_transaksi' => 'nullable|string|max:50|unique:master_operasionals,kode_transaksi',
            'nama_transaksi' => 'required|string|max:255',
            'satuan'         => 'required|string|max:50',
            'pagu_awal'      => 'required|numeric|min:0',
            'jumlah_bayar'   => 'nullable|numeric|min:0',
        ]);

        // Perbaikan: Gunakan !empty() agar input string kosong ("") tetap memicu generator otomatis
        $kodeTransaksi = !empty($validated['kode_transaksi']) 
            ? $validated['kode_transaksi'] 
            : 'OP-' . strtoupper(Str::random(5));

        MasterOperasional::create([
            'kode_transaksi' => $kodeTransaksi,
            'nama_transaksi' => $validated['nama_transaksi'],
            'satuan'         => $validated['satuan'],
            'pagu_awal'      => $validated['pagu_awal'],
            'jumlah_bayar'   => $validated['jumlah_bayar'] ?? 0,
        ]);

        return back()->with('success', 'Data Anggaran Operasional berhasil disimpan.');
    }

    public function update(Request $request, $id)
    {
        $operasional = MasterOperasional::findOrFail($id);

        $validated = $request->validate([
            'kode_transaksi' => 'nullable|string|max:50|unique:master_operasionals,kode_transaksi,' . $id,
            'nama_transaksi' => 'required|string|max:255',
            'satuan'         => 'required|string|max:50',
            'pagu_awal'      => 'required|numeric|min:0',
            'jumlah_bayar'   => 'nullable|numeric|min:0',
        ]);

        $operasional->update([
            // Tetap gunakan kode lama jika user mengosongkan kolom input saat update
            'kode_transaksi' => !empty($validated['kode_transaksi']) ? $validated['kode_transaksi'] : $operasional->kode_transaksi,
            'nama_transaksi' => $validated['nama_transaksi'],
            'satuan'         => $validated['satuan'],
            'pagu_awal'      => $validated['pagu_awal'],
            'jumlah_bayar'   => $validated['jumlah_bayar'] ?? 0,
        ]);

        return back()->with('success', 'Data Anggaran Operasional berhasil diperbarui.');
    }

    public function destroy($id)
    {
        MasterOperasional::findOrFail($id)->delete();
        
        return back()->with('success', 'Data Anggaran Operasional berhasil dihapus.');
    }

    public function export()
    {
        $items = MasterOperasional::all();
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Master Operasional');

        $sheet->setCellValue('A1', 'Kode Transaksi');
        $sheet->setCellValue('B1', 'Nama Transaksi');
        $sheet->setCellValue('C1', 'Satuan');
        $sheet->setCellValue('D1', 'Pagu Awal');
        $sheet->setCellValue('E1', 'Jumlah Bayar');

        $row = 2;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $row, $item->kode_transaksi);
            $sheet->setCellValue('B' . $row, $item->nama_transaksi);
            $sheet->setCellValue('C' . $row, $item->satuan);
            $sheet->setCellValue('D' . $row, $item->pagu_awal);
            $sheet->setCellValue('E' . $row, $item->jumlah_bayar);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'Master_Operasional_' . date('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function template()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Operasional');

        $sheet->setCellValue('A1', 'Kode Transaksi');
        $sheet->setCellValue('B1', 'Nama Transaksi');
        $sheet->setCellValue('C1', 'Satuan');
        $sheet->setCellValue('D1', 'Pagu Awal');
        $sheet->setCellValue('E1', 'Jumlah Bayar');

        $sheet->setCellValue('A2', 'OP-00001');
        $sheet->setCellValue('B2', 'Sewa Tempat Operasional');
        $sheet->setCellValue('C2', 'BULAN');
        $sheet->setCellValue('D2', 5000000);
        $sheet->setCellValue('E2', 5000000);

        $writer = new Xlsx($spreadsheet);
        $filename = 'Template_Import_Operasional.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240'
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray();

        if (count($rows) <= 1) {
            return back()->withErrors(['message' => 'File Excel kosong atau hanya berisi header.']);
        }

        $importedCount = 0;
        DB::beginTransaction();
        try {
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];

                $kodeTransaksi = trim($row[0] ?? '');
                $namaTransaksi = trim($row[1] ?? '');
                $satuan        = trim($row[2] ?? '');
                $paguAwal      = (float) preg_replace('/[^\d.]/', '', str_replace(',', '.', trim((string)($row[3] ?? '0'))));
                $jumlahBayar   = (float) preg_replace('/[^\d.]/', '', str_replace(',', '.', trim((string)($row[4] ?? '0'))));

                if (empty($namaTransaksi)) {
                    continue;
                }

                if (empty($kodeTransaksi)) {
                    $kodeTransaksi = 'OP-' . strtoupper(Str::random(5));
                }

                if (empty($satuan)) {
                    $satuan = 'UNIT';
                }

                MasterOperasional::updateOrCreate(
                    ['kode_transaksi' => $kodeTransaksi],
                    [
                        'nama_transaksi' => $namaTransaksi,
                        'satuan'         => strtoupper($satuan),
                        'pagu_awal'      => $paguAwal,
                        'jumlah_bayar'   => $jumlahBayar
                    ]
                );
                $importedCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal mengimpor Excel: ' . $e->getMessage()]);
        }

        return back()->with('success', "Berhasil mengimpor {$importedCount} data Operasional dari Excel.");
    }
}