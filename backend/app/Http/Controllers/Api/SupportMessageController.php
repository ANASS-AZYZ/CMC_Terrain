<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportMessageController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = SupportMessage::query()
            ->with('user')
            ->latest()
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120'],
            'subject' => ['required', 'string', 'max:180'],
            'message' => ['required', 'string', 'min:10'],
        ]);

        $data['user_id'] = (int) $user->id;

        $supportMessage = SupportMessage::create($data);

        return response()->json($supportMessage, 201);
    }
}
