<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Terrain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class TerrainController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Terrain::latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'type' => ['required', 'string', 'max:120'],
            'location' => ['required', 'string', 'max:120'],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:active,inactive'],
            'online_booking' => ['nullable', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $uploadsPath = public_path('uploads/terrains');
            File::ensureDirectoryExists($uploadsPath);

            $filename = uniqid('terrain_', true).'.'.$request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($uploadsPath, $filename);
            $data['image_url'] = url('uploads/terrains/'.$filename);
        }

        unset($data['image']);

        return response()->json(Terrain::create($data), 201);
    }

    public function update(Request $request, Terrain $terrain): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'image' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'type' => ['sometimes', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:120'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:active,inactive'],
            'online_booking' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $uploadsPath = public_path('uploads/terrains');
            File::ensureDirectoryExists($uploadsPath);

            $filename = uniqid('terrain_', true).'.'.$request->file('image')->getClientOriginalExtension();
            $request->file('image')->move($uploadsPath, $filename);
            $data['image_url'] = url('uploads/terrains/'.$filename);
        }

        unset($data['image']);

        $terrain->update($data);

        return response()->json($terrain);
    }

    public function destroy(Terrain $terrain): JsonResponse
    {
        $terrain->delete();

        return response()->json(['message' => 'Terrain deleted']);
    }
}
