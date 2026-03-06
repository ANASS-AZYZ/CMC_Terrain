<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Terrain extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image_url',
        'type',
        'location',
        'capacity',
        'status',
        'online_booking',
    ];

    protected $casts = [
        'online_booking' => 'boolean',
    ];

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(SportMatch::class, 'terrain_id');
    }
}
