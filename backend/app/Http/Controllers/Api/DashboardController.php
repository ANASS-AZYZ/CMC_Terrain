<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\SportMatch;
use App\Models\Terrain;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $today = now()->startOfDay();

        return response()->json([
            'stats' => [
                'totalTerrains' => Terrain::count(),
                'totalMatches' => SportMatch::count(),
                'totalReservations' => Reservation::count(),
                'todayReservations' => Reservation::where('starts_at', '>=', $today)->count(),
            ],
            'latestReservations' => Reservation::with(['terrain', 'match'])
                ->latest()
                ->limit(6)
                ->get(),
        ]);
    }
}
