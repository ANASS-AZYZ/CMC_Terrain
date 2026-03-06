<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MonitorController extends Controller
{
    private const GMAIL_EMAIL_REGEX = '/^[^\\s@]+@gmail\\.com$/i';

    public function index(): JsonResponse
    {
        $monitors = User::query()
            ->where('role', 'monitor')
            ->orderByDesc('id')
            ->get();

        return response()->json($monitors);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120', 'regex:'.self::GMAIL_EMAIL_REGEX, 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ], [
            'email.regex' => 'L\'email doit se terminer par @gmail.com.',
        ]);

        $data['name'] = trim($data['first_name'].' '.$data['last_name']);
        $data['role'] = 'monitor';
        $data['email_verified_at'] = now();

        $monitor = User::create($data);

        return response()->json($monitor, 201);
    }

    public function update(Request $request, User $monitor): JsonResponse
    {
        if ($monitor->role !== 'monitor') {
            return response()->json(['message' => 'User is not a monitor.'], 422);
        }

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120', 'regex:'.self::GMAIL_EMAIL_REGEX, Rule::unique('users', 'email')->ignore($monitor->id)],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'email.regex' => 'L\'email doit se terminer par @gmail.com.',
        ]);

        $data['name'] = trim($data['first_name'].' '.$data['last_name']);

        // Monitor accounts are managed by admin, so updated emails are trusted as verified.
        if (! empty($data['email'])) {
            $data['email_verified_at'] = now();
        }

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $monitor->update($data);

        return response()->json($monitor->fresh());
    }

    public function destroy(User $monitor): JsonResponse
    {
        if ($monitor->role !== 'monitor') {
            return response()->json(['message' => 'User is not a monitor.'], 422);
        }

        $monitor->delete();

        return response()->json(['status' => 'deleted']);
    }
}
