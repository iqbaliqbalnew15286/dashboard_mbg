<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        if (auth()->check()) {
            auth()->user()->update(['last_seen' => now()]);
        }

        $users = User::latest()->get();
        $onlineThreshold = now()->subMinutes(5);

        return Inertia::render('User', [
            'auth' => [
                'user' => auth()->user(), 
            ],
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
        if (strtolower(auth()->user()->role) !== 'superadmin') {
            return back()->withErrors(['message' => 'Akses Ditolak: Hanya Super Admin yang dapat menambahkan pengguna.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['superadmin', 'admin'])],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'], // Validasi Foto Opsional
        ]);

        $validated['password'] = Hash::make($validated['password']);

        // LOGIKA UPLOAD FOTO
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/avatars'), $filename);
            $validated['avatar'] = 'uploads/avatars/' . $filename;
        }

        User::create($validated);

        return back()->with('success', 'Pengguna baru berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $currentUser = auth()->user();

        if (strtolower($currentUser->role) !== 'superadmin' && $currentUser->id !== $user->id) {
            return back()->withErrors(['message' => 'Akses Ditolak: Anda hanya diizinkan mengubah data profil Anda sendiri.']);
        }

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:6'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ];

        if (strtolower($currentUser->role) === 'superadmin') {
            $rules['role'] = ['required', Rule::in(['superadmin', 'admin'])];
        }

        $validated = $request->validate($rules);

        // Jika password diisi, enkripsi. Jika kosong, hapus dari array agar tidak ikut di-update.
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']); 
        }

        // LOGIKA UPDATE FOTO (PERBAIKAN BUG HILANG FOTO)
        if ($request->hasFile('avatar')) {
            // Hapus foto lama jika ada di folder public
            if ($user->avatar && File::exists(public_path($user->avatar))) {
                File::delete(public_path($user->avatar));
            }
            $file = $request->file('avatar');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/avatars'), $filename);
            $validated['avatar'] = 'uploads/avatars/' . $filename;
        } else {
            // PERBAIKAN: Jika tidak ada file baru yang diunggah, JANGAN timpa foto lama dengan "null".
            // Hapus 'avatar' dari array update.
            unset($validated['avatar']);
        }

        $user->update($validated);

        return back()->with('success', 'Data profil berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if (strtolower(auth()->user()->role) !== 'superadmin') {
            return back()->withErrors(['message' => 'Akses Ditolak: Hanya Super Admin yang dapat menghapus pengguna.']);
        }

        if (auth()->id() === $user->id) {
            return back()->withErrors(['message' => 'Aksi Ditolak: Anda tidak dapat menghapus akun Anda sendiri saat sedang login.']);
        }

        // Hapus foto profil dari storage jika ada
        if ($user->avatar && File::exists(public_path($user->avatar))) {
            File::delete(public_path($user->avatar));
        }

        $user->delete();

        return back()->with('success', 'Pengguna berhasil dihapus.');
    }
}