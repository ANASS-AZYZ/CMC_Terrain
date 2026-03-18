<?php

namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    
    use HasFactory, Notifiable;

    




    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'cin',
        'class_name',
        'filiere',
        'student_id',
        'api_token',
    ];

    




    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    




    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'created_by');
    }

    public function supportMessages(): HasMany
    {
        return $this->hasMany(SupportMessage::class);
    }
}
