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
        $terrains = Terrain::query()
            ->latest()
            ->get()
            ->map(fn (Terrain $terrain) => $this->normalizeTerrainImages($terrain));

        return response()->json($terrains);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'image_url' => ['nullable', 'url', 'max:500'],
            'image' => ['nullable', 'image', 'max:5120'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['image', 'max:5120'],
            'image_urls' => ['nullable', 'array', 'max:10'],
            'image_urls.*' => ['url', 'max:500'],
            'type' => ['required', 'string', 'max:120'],
            'location' => ['required', 'string', 'max:120'],
            'capacity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:active,inactive'],
            'online_booking' => ['nullable', 'boolean'],
        ]);

        $uploadedImageUrls = $this->storeUploadedImages($request);
        $manualImageUrls = array_values(array_unique($data['image_urls'] ?? []));

        $finalImageUrls = array_values(array_unique(array_merge(
            $manualImageUrls,
            isset($data['image_url']) && filled($data['image_url']) ? [$data['image_url']] : [],
            $uploadedImageUrls,
        )));

        unset($data['image'], $data['images'], $data['image_urls']);

        $data['image_urls'] = $finalImageUrls;
        $data['image_url'] = $finalImageUrls[0] ?? null;

        $terrain = Terrain::create($data);

        return response()->json($this->normalizeTerrainImages($terrain), 201);
    }

    public function update(Request $request, Terrain $terrain): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'image' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'images' => ['sometimes', 'array', 'max:10'],
            'images.*' => ['image', 'max:5120'],
            'image_urls' => ['sometimes', 'array', 'max:10'],
            'image_urls.*' => ['url', 'max:500'],
            'replace_images' => ['sometimes', 'boolean'],
            'type' => ['sometimes', 'string', 'max:120'],
            'location' => ['sometimes', 'string', 'max:120'],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:active,inactive'],
            'online_booking' => ['sometimes', 'boolean'],
        ]);

        $receivedImagePayload =
            ($data['replace_images'] ?? false)
            ||
            $request->has('image_urls')
            || $request->has('image_url')
            || $request->hasFile('images')
            || $request->hasFile('image');

        if ($receivedImagePayload) {
            $uploadedImageUrls = $this->storeUploadedImages($request);
            $manualImageUrls = array_values(array_unique($data['image_urls'] ?? []));

            $finalImageUrls = array_values(array_unique(array_merge(
                $manualImageUrls,
                isset($data['image_url']) && filled($data['image_url']) ? [$data['image_url']] : [],
                $uploadedImageUrls,
            )));

            $data['image_urls'] = $finalImageUrls;
            $data['image_url'] = $finalImageUrls[0] ?? null;
        }

    unset($data['image'], $data['images'], $data['replace_images']);

        $terrain->update($data);

        return response()->json($this->normalizeTerrainImages($terrain->fresh()));
    }

    public function destroy(Terrain $terrain): JsonResponse
    {
        $terrain->delete();

        return response()->json(['message' => 'Terrain deleted']);
    }

    private function storeUploadedImages(Request $request): array
    {
        $uploadsPath = public_path('uploads/terrains');
        File::ensureDirectoryExists($uploadsPath);

        $uploaded = [];

        $files = [];
        if ($request->hasFile('images')) {
            $files = array_merge($files, $request->file('images'));
        }

        if ($request->hasFile('image')) {
            $files[] = $request->file('image');
        }

        foreach ($files as $file) {
            $filename = uniqid('terrain_', true).'.'.$file->getClientOriginalExtension();
            $file->move($uploadsPath, $filename);
            $uploaded[] = url('uploads/terrains/'.$filename);
        }

        return array_values(array_unique($uploaded));
    }

    private function normalizeTerrainImages(Terrain $terrain): Terrain
    {
        $imageUrls = $terrain->image_urls;
        if (! is_array($imageUrls)) {
            $imageUrls = [];
        }

        if ($terrain->image_url) {
            array_unshift($imageUrls, $terrain->image_url);
        }

        $imageUrls = array_values(array_unique(array_filter($imageUrls, fn ($url) => filled($url))));

        $terrain->setAttribute('image_urls', $imageUrls);
        $terrain->setAttribute('image_url', $imageUrls[0] ?? null);

        return $terrain;
    }
}
