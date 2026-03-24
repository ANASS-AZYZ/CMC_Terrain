<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\SportMatch;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->syncStatusesFromMatches();

        if ($user && $user->role === 'stagiaire' && $request->boolean('for_availability')) {
            $availabilityRows = Reservation::query()
                ->select(['id', 'terrain_id', 'starts_at', 'ends_at', 'status'])
                ->whereNull('parent_reservation_id')
                ->where('ends_at', '>', now())
                ->whereNotIn('status', ['cancelled', 'rejected', 'completed'])
                ->latest('starts_at')
                ->get();

            return response()->json($availabilityRows);
        }

        $query = Reservation::with(['terrain', 'match', 'creator', 'scanner'])
            ->whereNull('parent_reservation_id')
            ->latest('starts_at');

        if ($user && $user->role === 'stagiaire') {
            $query->where('created_by', $user->id)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->where('ends_at', '>', now());
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->filled('join_reservation_code')) {
            $normalizedJoinCode = $this->normalizeReservationCode((string) $request->input('join_reservation_code'));

            if ($normalizedJoinCode !== null) {
                $request->merge(['join_reservation_code' => $normalizedJoinCode]);
            }
        }

        $data = $request->validate([
            'terrain_id' => ['required', 'exists:terrains,id'],
            'match_id' => ['nullable', 'exists:matches,id'],
            'join_reservation_code' => ['nullable', 'string', 'exists:reservations,reservation_code'],
            'first_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['nullable', 'string', 'max:80'],
            'student_name' => ['required', 'string', 'max:120'],
            'cin' => ['nullable', 'string', 'max:40'],
            'student_email' => ['required', 'email'],
            'class_name' => ['nullable', 'string', 'max:120'],
            'filiere' => ['nullable', 'string', 'max:120'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['nullable', 'in:pending,confirmed,rejected,on_hold,completed,cancelled'],
        ]);

        if (empty($data['first_name']) && empty($data['last_name']) && !empty($data['student_name'])) {
            $parts = preg_split('/\s+/', trim((string) $data['student_name']), 2);
            $data['first_name'] = $parts[0] ?? null;
            $data['last_name'] = $parts[1] ?? null;
        }

        $data['student_name'] = trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? '')) ?: $data['student_name'];
        $data['cin'] = ! empty($data['cin']) ? trim((string) $data['cin']) : null;
        $data['student_email'] = strtolower(trim((string) $data['student_email']));

        $data['created_by'] = (int) $request->user()->id;
        $data['status'] = $data['status'] ?? 'pending';
        $data['reservation_code'] = $this->generateReservationCode();
        $data['parent_reservation_id'] = null;

        $startsAt = Carbon::parse($data['starts_at']);
        $endsAt = Carbon::parse($data['ends_at']);
        $joinSourceReservation = null;

        if (! empty($data['join_reservation_code'])) {
            $joinSourceReservation = Reservation::query()
                ->whereNull('parent_reservation_id')
                ->where('reservation_code', $data['join_reservation_code'])
                ->first();

            if (! $joinSourceReservation) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => ['join_reservation_code' => ['Reservation ID invalide.']],
                ], 422);
            }

            $data['terrain_id'] = $joinSourceReservation->terrain_id;
            $startsAt = Carbon::parse($joinSourceReservation->starts_at);
            $endsAt = Carbon::parse($joinSourceReservation->ends_at);
            $data['starts_at'] = $startsAt->toISOString();
            $data['ends_at'] = $endsAt->toISOString();

            $parentReservationId = (int) ($joinSourceReservation->parent_reservation_id ?: $joinSourceReservation->id);
            $parentReservation = Reservation::query()->find($parentReservationId);

            if (! $parentReservation) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => ['join_reservation_code' => ['Reservation source introuvable.']],
                ], 422);
            }

            $data['reservation_code'] = null;
            $data['parent_reservation_id'] = $parentReservation->id;
        }

        if ($startsAt->lt(now()->startOfDay())) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['starts_at' => ['Date de reservation ne peut pas etre dans le passe.']],
            ], 422);
        }

        if ($startsAt->diffInMinutes($endsAt) > 120) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['ends_at' => ['La duree maximum d\'une reservation est 2 heures.']],
            ], 422);
        }

        if (! $joinSourceReservation) {
            $hasOverlap = Reservation::query()
                ->whereNull('parent_reservation_id')
                ->where('terrain_id', $data['terrain_id'])
                ->whereNotIn('status', ['cancelled', 'rejected'])
                ->where('starts_at', '<', $endsAt)
                ->where('ends_at', '>', $startsAt)
                ->exists();

            if ($hasOverlap) {
                return response()->json([
                    'message' => 'Validation error',
                    'errors' => ['starts_at' => ['Ce creneau est deja reserve. Choisissez un autre horaire.']],
                ], 422);
            }
        }

        unset($data['join_reservation_code']);

        $data['status'] = $this->resolveStatusFromMatch((int) ($data['match_id'] ?? 0), (string) $data['status']);

        $reservation = Reservation::create($data)->load(['terrain', 'match', 'creator', 'scanner']);

        return response()->json($reservation, 201);
    }

    public function findByCode(string $code): JsonResponse
    {
        $normalizedCode = $this->normalizeReservationCode($code);

        if ($normalizedCode === null) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $this->syncStatusesFromMatches();

        $reservation = Reservation::query()
            ->with(['terrain', 'creator', 'scanner'])
            ->where('reservation_code', $normalizedCode)
            ->whereNull('parent_reservation_id')
            ->first();

        if (! $reservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $players = Reservation::query()
            ->where(function ($query) use ($reservation): void {
                $query->where('id', $reservation->id)
                    ->orWhere('parent_reservation_id', $reservation->id);
            })
            ->orderBy('id')
            ->get(['id', 'first_name', 'last_name', 'student_name', 'cin', 'class_name', 'filiere', 'student_email']);

        return response()->json([
            'reservation' => $reservation,
            'players' => $players,
        ]);
    }

    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        $data = $request->validate([
            'terrain_id' => ['sometimes', 'exists:terrains,id'],
            'match_id' => ['nullable', 'exists:matches,id'],
            'first_name' => ['sometimes', 'nullable', 'string', 'max:80'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:80'],
            'student_name' => ['sometimes', 'string', 'max:120'],
            'cin' => ['sometimes', 'nullable', 'string', 'max:40'],
            'student_email' => ['sometimes', 'email'],
            'class_name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'filiere' => ['sometimes', 'nullable', 'string', 'max:120'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'status' => ['sometimes', 'in:pending,confirmed,rejected,on_hold,completed,cancelled'],
        ]);

        if (
            array_key_exists('first_name', $data)
            || array_key_exists('last_name', $data)
            || array_key_exists('student_name', $data)
        ) {
            $first = $data['first_name'] ?? $reservation->first_name;
            $last = $data['last_name'] ?? $reservation->last_name;
            $data['student_name'] = trim(($first ?? '').' '.($last ?? '')) ?: ($data['student_name'] ?? $reservation->student_name);
        }

        if (array_key_exists('cin', $data)) {
            $data['cin'] = ! empty($data['cin']) ? trim((string) $data['cin']) : null;
        }

        if (array_key_exists('student_email', $data)) {
            $data['student_email'] = strtolower(trim((string) $data['student_email']));
        }

        if (empty($reservation->reservation_code)) {
            $data['reservation_code'] = $this->generateReservationCode();
        }

        $startsAt = Carbon::parse($data['starts_at'] ?? $reservation->starts_at);
        $endsAt = Carbon::parse($data['ends_at'] ?? $reservation->ends_at);
        $terrainId = $data['terrain_id'] ?? $reservation->terrain_id;

        if ($startsAt->lt(now()->startOfDay())) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['starts_at' => ['Date de reservation ne peut pas etre dans le passe.']],
            ], 422);
        }

        if ($startsAt->diffInMinutes($endsAt) > 120) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['ends_at' => ['La duree maximum d\'une reservation est 2 heures.']],
            ], 422);
        }

        $hasOverlap = Reservation::query()
            ->whereNull('parent_reservation_id')
            ->where('terrain_id', $terrainId)
            ->where('id', '!=', $reservation->id)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->exists();

        if ($hasOverlap) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['starts_at' => ['Ce creneau est deja reserve. Choisissez un autre horaire.']],
            ], 422);
        }

        $matchId = array_key_exists('match_id', $data) ? (int) ($data['match_id'] ?? 0) : (int) ($reservation->match_id ?? 0);
        $statusFallback = (string) ($data['status'] ?? $reservation->status ?? 'pending');
        $data['status'] = $this->resolveStatusFromMatch($matchId, $statusFallback);

        $reservation->update($data);

        return response()->json($reservation->load(['terrain', 'match', 'creator', 'scanner']));
    }

    public function updateStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! in_array((string) $user->role, ['admin', 'monitor'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'in:completed,cancelled'],
        ]);

        $mainReservationId = (int) ($reservation->parent_reservation_id ?: $reservation->id);

        $mainReservation = Reservation::query()
            ->whereKey($mainReservationId)
            ->whereNull('parent_reservation_id')
            ->first();

        if (! $mainReservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        $mainReservation->update([
            'status' => $data['status'],
            'scanned_by' => $data['status'] === 'completed' ? (int) $user->id : null,
        ]);

        
        Reservation::query()
            ->where('parent_reservation_id', $mainReservation->id)
            ->update([
                'status' => $data['status'],
                'scanned_by' => $data['status'] === 'completed' ? (int) $user->id : null,
            ]);

        return response()->json($mainReservation->load(['terrain', 'match', 'creator', 'scanner']));
    }

    public function cancelOwn(Request $request, Reservation $reservation): JsonResponse
    {
        $user = $request->user();

        if (! $user || (string) $user->role !== 'stagiaire') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $mainReservationId = (int) ($reservation->parent_reservation_id ?: $reservation->id);

        $mainReservation = Reservation::query()
            ->whereKey($mainReservationId)
            ->whereNull('parent_reservation_id')
            ->first();

        if (! $mainReservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        if ((int) $mainReservation->created_by !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (in_array((string) $mainReservation->status, ['completed', 'rejected'], true)) {
            return response()->json(['message' => 'Reservation cannot be cancelled in its current status.'], 422);
        }

        $mainReservation->update(['status' => 'cancelled']);

        Reservation::query()
            ->where('parent_reservation_id', $mainReservation->id)
            ->whereNotIn('status', ['completed', 'rejected'])
            ->update(['status' => 'cancelled']);

        return response()->json($mainReservation->load(['terrain', 'match', 'creator', 'scanner']));
    }

    public function confirmByQr(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! in_array((string) $user->role, ['admin', 'monitor'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $payload = $request->validate([
            'reservation_code' => ['nullable', 'string', 'max:120'],
            'qr_payload' => ['nullable', 'string', 'max:500'],
        ]);

        $rawCode = trim((string) ($payload['reservation_code'] ?? ''));
        $rawQrPayload = trim((string) ($payload['qr_payload'] ?? ''));

        if ($rawCode === '' && $rawQrPayload === '') {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['qr_payload' => ['QR payload or reservation code is required.']],
            ], 422);
        }

        $code = $rawCode !== '' ? $this->normalizeReservationCode($rawCode) : $this->normalizeReservationCode($rawQrPayload);

        if ($code === null) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['qr_payload' => ['Reservation code from QR is invalid.']],
            ], 422);
        }

        $mainReservation = Reservation::query()
            ->whereNull('parent_reservation_id')
            ->where('reservation_code', $code)
            ->first();

        if (! $mainReservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        if (in_array((string) $mainReservation->status, ['cancelled', 'rejected'], true)) {
            return response()->json(['message' => 'Reservation cannot be completed in its current status.'], 422);
        }

        $mainReservation->update([
            'status' => 'completed',
            'scanned_by' => (int) $user->id,
        ]);

        Reservation::query()
            ->where('parent_reservation_id', $mainReservation->id)
            ->whereIn('status', ['pending', 'on_hold', 'confirmed'])
            ->update([
                'status' => 'completed',
                'scanned_by' => (int) $user->id,
            ]);

        return response()->json($mainReservation->load(['terrain', 'match', 'creator', 'scanner']));
    }

    private function generateReservationCode(): string
    {
        do {
            $code = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Reservation::whereNull('parent_reservation_id')->where('reservation_code', $code)->exists());

        return $code;
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $reservation->delete();

        return response()->json(['message' => 'Reservation deleted']);
    }

    public function addPlayer(Request $request, Reservation $reservation): JsonResponse
    {
        $payload = $request->validate([
            'student_id' => ['required', 'string', 'max:20'],
        ]);

        $stagiaire = User::query()
            ->where('student_id', trim($payload['student_id']))
            ->where('role', 'stagiaire')
            ->first();

        if (! $stagiaire) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['student_id' => ['Stagiaire introuvable.']],
            ], 422);
        }

        $startsAt = Carbon::parse($reservation->starts_at);
        $endsAt = Carbon::parse($reservation->ends_at);

        $alreadyInSameSlot = Reservation::query()
            ->where('terrain_id', $reservation->terrain_id)
            ->where('starts_at', $reservation->starts_at)
            ->where('ends_at', $reservation->ends_at)
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->where(function ($query) use ($stagiaire): void {
                $query->where('student_email', strtolower((string) $stagiaire->email));

                if (! empty($stagiaire->cin)) {
                    $query->orWhere('cin', trim((string) $stagiaire->cin));
                }
            })
            ->exists();

        if ($alreadyInSameSlot) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => ['student_id' => ['Ce stagiaire est deja dans cette reservation.']],
            ], 422);
        }

        $newReservation = Reservation::create([
            'parent_reservation_id' => (int) ($reservation->parent_reservation_id ?: $reservation->id),
            'terrain_id' => $reservation->terrain_id,
            'match_id' => $reservation->match_id,
            'first_name' => $stagiaire->first_name,
            'last_name' => $stagiaire->last_name,
            'student_name' => trim((string) $stagiaire->name),
            'cin' => $stagiaire->cin ? trim((string) $stagiaire->cin) : null,
            'student_email' => strtolower((string) $stagiaire->email),
            'class_name' => $stagiaire->class_name,
            'filiere' => $stagiaire->filiere,
            'starts_at' => $reservation->starts_at,
            'ends_at' => $reservation->ends_at,
            'status' => 'pending',
            'created_by' => (int) $stagiaire->id,
            'reservation_code' => null,
        ])->load(['terrain', 'match', 'creator', 'scanner']);

        return response()->json($newReservation, 201);
    }

    public function removePlayer(Request $request, Reservation $reservation, Reservation $player): JsonResponse
    {
        $user = $request->user();

        if (! $user || ! in_array((string) $user->role, ['admin', 'monitor', 'stagiaire'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $mainReservationId = (int) ($reservation->parent_reservation_id ?: $reservation->id);

        $mainReservation = Reservation::query()
            ->whereKey($mainReservationId)
            ->whereNull('parent_reservation_id')
            ->first();

        if (! $mainReservation) {
            return response()->json(['message' => 'Reservation not found'], 404);
        }

        if ((string) $user->role === 'stagiaire' && (int) $mainReservation->created_by !== (int) $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((int) $player->id === (int) $mainReservation->id) {
            return response()->json(['message' => 'Main reservation owner cannot be removed.'], 422);
        }

        if ((int) ($player->parent_reservation_id ?? 0) !== (int) $mainReservation->id) {
            return response()->json(['message' => 'Player not found in this reservation.'], 404);
        }

        $player->delete();

        return response()->json(['message' => 'Player removed']);
    }

    private function resolveStatusFromMatch(int $matchId, string $fallbackStatus): string
    {
        if ($matchId <= 0) {
            return $fallbackStatus;
        }

        $matchStatus = SportMatch::query()->whereKey($matchId)->value('status');

        if ($matchStatus === 'finished') {
            return 'completed';
        }

        if ($matchStatus === 'cancelled') {
            return 'cancelled';
        }

        return $fallbackStatus;
    }

    private function syncStatusesFromMatches(): void
    {
        Reservation::query()
            ->whereNull('parent_reservation_id')
            ->whereIn('status', ['pending', 'confirmed', 'on_hold'])
            ->whereHas('match', function ($query): void {
                $query->where('status', 'finished');
            })
            ->update(['status' => 'completed']);

        Reservation::query()
            ->whereNull('parent_reservation_id')
            ->whereIn('status', ['pending', 'confirmed', 'on_hold'])
            ->whereHas('match', function ($query): void {
                $query->where('status', 'cancelled');
            })
            ->update(['status' => 'cancelled']);
    }

    private function normalizeReservationCode(string $rawValue): ?string
    {
        $value = strtoupper(trim($rawValue));

        if ($value === '') {
            return null;
        }

        if (preg_match('/\bRES[-_ ]?(\d{5})\b/', $value, $matches) === 1) {
            return $matches[1];
        }

        if (preg_match('/\b(\d{5})\b/', $value, $matches) === 1) {
            return $matches[1];
        }

        return null;
    }
}
