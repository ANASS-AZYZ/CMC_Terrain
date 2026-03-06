<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\SportMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            SportMatch::with('terrain')->latest('starts_at')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'terrain_id' => ['required', 'exists:terrains,id'],
            'team_a' => ['required', 'string', 'max:120'],
            'team_b' => ['required', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['required', 'in:scheduled,in_progress,finished,cancelled'],
        ]);

        $match = SportMatch::create($data)->load('terrain');

        return response()->json($match, 201);
    }

    public function update(Request $request, SportMatch $match): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:120'],
            'terrain_id' => ['sometimes', 'exists:terrains,id'],
            'team_a' => ['sometimes', 'string', 'max:120'],
            'team_b' => ['sometimes', 'string', 'max:120'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'status' => ['sometimes', 'in:scheduled,in_progress,finished,cancelled'],
        ]);

        $match->update($data);

        if ($match->status === 'finished') {
            Reservation::query()
                ->where('match_id', $match->id)
                ->whereIn('status', ['pending', 'confirmed', 'on_hold'])
                ->update(['status' => 'completed']);
        }

        if ($match->status === 'cancelled') {
            Reservation::query()
                ->where('match_id', $match->id)
                ->whereIn('status', ['pending', 'confirmed', 'on_hold'])
                ->update(['status' => 'cancelled']);
        }

        return response()->json($match->load('terrain'));
    }

    public function destroy(SportMatch $match): JsonResponse
    {
        $match->delete();

        return response()->json(['message' => 'Match deleted']);
    }
}
