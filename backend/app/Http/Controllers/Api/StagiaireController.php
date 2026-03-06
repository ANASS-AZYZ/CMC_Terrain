<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StagiaireController extends Controller
{
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
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
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
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($stagiaire->id)],
            'password' => ['nullable', 'string', 'min:8'],
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

        $stagiaire->delete();

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
