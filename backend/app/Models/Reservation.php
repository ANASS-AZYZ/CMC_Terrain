<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_code',
        'parent_reservation_id',
        'terrain_id',
        'match_id',
        'first_name',
        'last_name',
        'student_name',
        'cin',
        'student_email',
        'class_name',
        'filiere',
        'starts_at',
        'ends_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function terrain(): BelongsTo
    {
        return $this->belongsTo(Terrain::class);
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(SportMatch::class, 'match_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parentReservation(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_reservation_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(self::class, 'parent_reservation_id');
    }
}
