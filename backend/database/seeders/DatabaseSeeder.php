<?php

namespace Database\Seeders;

use App\Models\Reservation;
use App\Models\SportMatch;
use App\Models\Terrain;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    


    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@cmc-sportbooking.ma')],
            [
                'name' => 'Main Admin',
                'password' => Hash::make('admin12345'),
                'role' => 'admin',
            ]
        );

        $stagiaire = User::updateOrCreate(
            ['email' => 'stagiaire@cmc-sportbooking.ma'],
            [
                'name' => 'Stagiaire User',
                'password' => Hash::make('stagiaire12345'),
                'role' => 'stagiaire',
            ]
        );

        $football = Terrain::updateOrCreate(
            ['name' => 'Football Pitch A'],
            [
                'type' => 'Football',
                'location' => 'Outdoor Zone',
                'capacity' => 22,
                'status' => 'active',
            ]
        );

        $futsal = Terrain::updateOrCreate(
            ['name' => 'Futsal Pitch B'],
            [
                'type' => 'Futsal',
                'location' => 'Indoor Facility',
                'capacity' => 12,
                'status' => 'active',
            ]
        );

        $match = SportMatch::updateOrCreate(
            ['title' => 'Campus Derby'],
            [
                'terrain_id' => $football->id,
                'team_a' => 'Team A',
                'team_b' => 'Team B',
                'starts_at' => now()->addDay()->setHour(15)->setMinute(0),
                'ends_at' => now()->addDay()->setHour(16)->setMinute(30),
                'status' => 'scheduled',
            ]
        );

        Reservation::updateOrCreate(
            [
                'student_email' => 'student.one@ofppt-edu.ma',
                'starts_at' => now()->addHours(6),
            ],
            [
                'terrain_id' => $futsal->id,
                'match_id' => $match->id,
                'student_name' => 'Student One',
                'ends_at' => now()->addHours(8),
                'status' => 'confirmed',
                'created_by' => $admin->id,
            ]
        );

        Reservation::updateOrCreate(
            [
                'student_email' => 'student.two@ofppt-edu.ma',
                'starts_at' => now()->addHours(10),
            ],
            [
                'terrain_id' => $football->id,
                'match_id' => null,
                'student_name' => 'Student Two',
                'ends_at' => now()->addHours(12),
                'status' => 'pending',
                'created_by' => $stagiaire->id,
            ]
        );
    }
}
