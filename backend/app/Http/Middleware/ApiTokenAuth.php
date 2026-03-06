<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->bearerToken();

        if (!$token) {
            return new JsonResponse(['message' => 'Unauthorized'], 401);
        }

        $user = User::where('api_token', hash('sha256', $token))->first();

        if (!$user) {
            return new JsonResponse(['message' => 'Unauthorized'], 401);
        }

        auth()->setUser($user);

        return $next($request);
    }
}
