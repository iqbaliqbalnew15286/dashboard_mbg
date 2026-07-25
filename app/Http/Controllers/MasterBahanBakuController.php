<?php

namespace App\Http\Controllers;

use App\Models\MasterBahanBaku;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MasterBahanBakuController extends Controller
{
    public function index(Request $request)
    {
        // Paginasi dan fitur pencarian di Backend (Super Ringan)
        $query = MasterBahanBaku::query();

        if ($request->has('search') && $request->search != '') {
            $query->where('nama_barang', 'like', '%' . $request->search . '%')
                  ->orWhere('kode_barang', 'like', '%' . $request->search . '%');
        }

        // Ambil 10 data per halaman dan bawa query parameter ('search')
        $bahanBakus = $query->latest()->paginate(10)->withQueryString();
        
        // Kalkulasi statistik langsung di Database (Jauh lebih cepat dari array sum PHP)
        $totalBarang = MasterBahanBaku::count();
        $totalAset = MasterBahanBaku::sum(DB::raw('harga_beli_awal * saldo_awal'));

        return Inertia::render('Master/BahanBaku', [
            'bahan_bakus' => $bahanBakus,
            'filters' => $request->only('search'),
            'stats' => [
                'total_barang' => $totalBarang,
                'total_aset' => (int) $totalAset
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_barang'     => 'required|unique:master_bahan_bakus,kode_barang',
            'nama_barang'     => 'required|string|max:255',
            'satuan'          => 'required|string|max:30',
            'harga_beli_awal' => 'required|integer|min:0',
            'saldo_awal'      => 'required|integer|min:0',
        ]);

        MasterBahanBaku::create($validated);
        return back()->with('success', 'Bahan baku berhasil ditambahkan');
    }

    public function update(Request $request, MasterBahanBaku $bahanBaku)
    {
        $validated = $request->validate([
            'kode_barang'     => 'required|unique:master_bahan_bakus,kode_barang,' . $bahanBaku->id,
            'nama_barang'     => 'required|string|max:255',
            'satuan'          => 'required|string|max:30',
            'harga_beli_awal' => 'required|integer|min:0',
            'saldo_awal'      => 'required|integer|min:0',
        ]);

        $bahanBaku->update($validated);
        return back()->with('success', 'Bahan baku berhasil diperbarui');
    }

    public function destroy(MasterBahanBaku $bahanBaku)
    {
        $bahanBaku->delete();
        return back()->with('success', 'Bahan baku berhasil dihapus');
    }

    public function export()
    {
        $items = MasterBahanBaku::all();
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Master Bahan Baku');

        $sheet->setCellValue('A1', 'Kode Barang');
        $sheet->setCellValue('B1', 'Nama Barang');
        $sheet->setCellValue('C1', 'Satuan');
        $sheet->setCellValue('D1', 'Harga Beli Awal');
        $sheet->setCellValue('E1', 'Saldo Awal');

        $row = 2;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $row, $item->kode_barang);
            $sheet->setCellValue('B' . $row, $item->nama_barang);
            $sheet->setCellValue('C' . $row, $item->satuan);
            $sheet->setCellValue('D' . $row, $item->harga_beli_awal);
            $sheet->setCellValue('E' . $row, $item->saldo_awal);
            $row++;
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'Master_Bahan_Baku_' . date('Y-m-d_His') . '.xlsx';

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
        $sheet->setTitle('Template Bahan Baku');

        $sheet->setCellValue('A1', 'Kode Barang');
        $sheet->setCellValue('B1', 'Nama Barang');
        $sheet->setCellValue('C1', 'Satuan');
        $sheet->setCellValue('D1', 'Harga Beli Awal');
        $sheet->setCellValue('E1', 'Saldo Awal');

        $sheet->setCellValue('A2', 'BB-00001');
        $sheet->setCellValue('B2', 'Wortel Premium');
        $sheet->setCellValue('C2', 'KG');
        $sheet->setCellValue('D2', 15000);
        $sheet->setCellValue('E2', 100);

        $writer = new Xlsx($spreadsheet);
        $filename = 'Template_Import_Bahan_Baku.xlsx';

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
                
                $kodeBarang    = trim($row[0] ?? '');
                $namaBarang    = trim($row[1] ?? '');
                $satuan        = trim($row[2] ?? '');
                $hargaBeliAwal = (int) preg_replace('/\D/', '', trim((string)($row[3] ?? '0')));
                $saldoAwal     = (int) preg_replace('/\D/', '', trim((string)($row[4] ?? '0')));

                if (empty($namaBarang)) {
                    continue;
                }

                if (empty($kodeBarang)) {
                    $kodeBarang = 'BB-' . strtoupper(Str::random(5));
                }

                if (empty($satuan)) {
                    $satuan = 'PCS';
                }

                MasterBahanBaku::updateOrCreate(
                    ['kode_barang' => $kodeBarang],
                    [
                        'nama_barang'     => $namaBarang,
                        'satuan'          => strtoupper($satuan),
                        'harga_beli_awal' => $hargaBeliAwal,
                        'saldo_awal'      => $saldoAwal
                    ]
                );
                $importedCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['message' => 'Gagal mengimpor Excel: ' . $e->getMessage()]);
        }

        return back()->with('success', "Berhasil mengimpor {$importedCount} data Bahan Baku dari Excel.");
    }
}