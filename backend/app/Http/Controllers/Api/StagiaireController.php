<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StagiaireController extends Controller
{
    private const GMAIL_EMAIL_REGEX = '/^[^\\s@]+@gmail\\.com$/i';

    public function index(): JsonResponse
    {
        $stagiaires = User::query()
            ->where('role', 'stagiaire')
            ->withCount('reservations')
            ->orderByDesc('id')
            ->get();

        return response()->json($stagiaires);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'cin' => ['required', 'string', 'max:40', 'unique:users,cin'],
            'class_name' => ['required', 'string', 'max:120'],
            'filiere' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'regex:'.self::GMAIL_EMAIL_REGEX, 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'email.regex' => 'L\'email doit se terminer par @gmail.com.',
        ]);

        $data['name'] = trim($data['first_name'].' '.$data['last_name']);
        $data['role'] = 'stagiaire';
        $data['student_id'] = $this->generateStudentId();

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $stagiaire): JsonResponse
    {
        if ($stagiaire->role !== 'stagiaire') {
            return response()->json(['message' => 'User is not a stagiaire.'], 422);
        }

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'cin' => ['required', 'string', 'max:40', Rule::unique('users', 'cin')->ignore($stagiaire->id)],
            'class_name' => ['required', 'string', 'max:120'],
            'filiere' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'regex:'.self::GMAIL_EMAIL_REGEX, Rule::unique('users', 'email')->ignore($stagiaire->id)],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'email.regex' => 'L\'email doit se terminer par @gmail.com.',
        ]);

        $data['name'] = trim($data['first_name'].' '.$data['last_name']);

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $stagiaire->update($data);

        return response()->json($stagiaire->fresh()->loadCount('reservations'));
    }

    public function destroy(User $stagiaire): JsonResponse
    {
        if ($stagiaire->role !== 'stagiaire') {
            return response()->json(['message' => 'User is not a stagiaire.'], 422);
        }

        DB::transaction(function () use ($stagiaire): void {
            // Extra safety: remove reservations created by this stagiaire even if FK constraints differ by environment.
            Reservation::query()->where('created_by', $stagiaire->id)->delete();
            $stagiaire->delete();
        });

        return response()->json(['status' => 'deleted']);
    }

    private function generateStudentId(): string
    {
        do {
            $code = 'STG'.(string) random_int(100000, 999999);
        } while (User::where('student_id', $code)->exists());

        return $code;
    }
}
