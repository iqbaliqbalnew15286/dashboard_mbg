<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        // 1. Update status 'last_seen' pengguna yang sedang login saat ini
        if (auth()->check()) {
            auth()->user()->update(['last_seen' => now()]);
        }

        $users = User::latest()->get();
        $onlineThreshold = now()->subMinutes(5); // Aktif dalam 5 menit terakhir dianggap Online

        return Inertia::render('User', [
            'users' => $users,
            'stats' => [
                'total_akun' => $users->count(),
                'total_superadmin' => $users->where('role', 'superadmin')->count(),
                'total_online' => $users->where('last_seen', '>=', $onlineThreshold)->count(),
            ]
        ]);
    }

    public function store(Request $request)
    {
        // Otorisasi: Hanya superadmin yang boleh menambah admin
        if (auth()->user()->role !== 'superadmin') {
            return back()->withErrors(['message' => 'Akses Ditolak: Hanya Super Admin yang dapat menambahkan pengguna.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['superadmin', 'admin'])],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Pengguna baru berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $currentUser = auth()->user();

        // Otorisasi Dinamis:
        // - Superadmin bisa mengedit siapa saja.
        // - Admin hanya bisa mengedit akunnya sendiri.
        if ($currentUser->role !== 'superadmin' && $currentUser->id !== $user->id) {
            return back()->withErrors(['message' => 'Akses Ditolak: Anda hanya diizinkan mengubah data profil Anda sendiri.']);
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
        ];

        // Hak ubah role HANYA diberikan jika yang mengedit adalah Superadmin
        if ($currentUser->role === 'superadmin') {
            $rules['role'] = ['required', Rule::in(['superadmin', 'admin'])];
        }

        $validated = $request->validate($rules);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']); // Hapus dari array jika password tidak diisi
        }

        $user->update($validated);

        return back()->with('success', 'Data profil berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        // Otorisasi: Hanya superadmin yang boleh menghapus admin lain
        if (auth()->user()->role !== 'superadmin') {
            return back()->withErrors(['message' => 'Akses Ditolak: Hanya Super Admin yang dapat menghapus pengguna.']);
        }

        if (auth()->id() === $user->id) {
            return back()->withErrors(['message' => 'Aksi Ditolak: Anda tidak dapat menghapus akun Anda sendiri saat sedang login.']);
        }

        $user->delete();

        return back()->with('success', 'Pengguna berhasil dihapus.');
    }
}