<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SportMatch extends Model
{
    use HasFactory;

    protected $table = 'matches';

    protected $fillable = [
        'title',
        'terrain_id',
        'team_a',
        'team_b',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function terrain(): BelongsTo
    {
        return $this->belongsTo(Terrain::class);
    }
}
