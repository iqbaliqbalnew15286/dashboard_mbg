<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Pengaturan;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        if (auth()->check()) {
            $user = auth()->user();
            if (!$user->last_seen || $user->last_seen->diffInMinutes(now()) >= 1) {
                $user->update(['last_seen' => now()]);
            }
        }

        $pengaturan = Pengaturan::first() ?? [];

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'pengaturanGlobal' => $pengaturan, 
        ];
    }
}