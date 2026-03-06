<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->foreignId('parent_reservation_id')
                ->nullable()
                ->after('reservation_code')
                ->constrained('reservations')
                ->nullOnDelete();

            $table->index(['parent_reservation_id', 'starts_at']);
        });

        $reservations = DB::table('reservations')
            ->select('id', 'terrain_id', 'starts_at', 'ends_at', 'reservation_code')
            ->orderBy('terrain_id')
            ->orderBy('starts_at')
            ->orderBy('ends_at')
            ->orderBy('id')
            ->get();

        $groups = [];

        foreach ($reservations as $reservation) {
            $key = implode('|', [
                (string) $reservation->terrain_id,
                (string) $reservation->starts_at,
                (string) $reservation->ends_at,
                (string) ($reservation->reservation_code ?? ''),
            ]);

            $groups[$key][] = $reservation;
        }

        foreach ($groups as $group) {
            if (count($group) <= 1) {
                continue;
            }

            $parent = $group[0];

            for ($i = 1; $i < count($group); $i++) {
                DB::table('reservations')
                    ->where('id', $group[$i]->id)
                    ->update(['parent_reservation_id' => $parent->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropIndex(['parent_reservation_id', 'starts_at']);
            $table->dropConstrainedForeignId('parent_reservation_id');
        });
    }
};
