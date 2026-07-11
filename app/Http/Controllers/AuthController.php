<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        // Jika sudah login, tendang langsung ke dashboard
        if (Auth::check()) {
            return redirect()->intended('/dashboard');
        }
        return Inertia::render('auth/login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Kunci pembatasan berdasarkan Email dan IP Address (Keamanan bagus)
        $throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);

            return back()->withErrors([
                'email' => "Terlalu banyak percobaan gagal. Silakan coba lagi dalam {$minutes} menit.",
            ]);
        }

        // PROSES LOGIN
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($throttleKey);
            
            // Regenerate session untuk mencegah serangan Session Fixation
            $request->session()->regenerate();
            
            // Update last_seen saat pertama kali login
            $user = Auth::user();
            $user->last_seen = now();
            $user->save();

            // Gunakan intended agar kembali ke rute yang sebelumnya ingin diakses
            return redirect()->intended('/dashboard');
        }

        RateLimiter::hit($throttleKey, 15 * 60);

        return back()->withErrors([
            'email' => 'Email atau kata sandi yang Anda masukkan salah.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        
        if ($user) {
            // Mundurkan waktu last_seen 5 menit 1 detik agar langsung terdeteksi Offline 
            // tanpa selisih waktu yang terlalu jauh.
            $user->update(['last_seen' => now()->subMinutes(5)->subSeconds(1)]);
        }

        // Hancurkan sesi login
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}