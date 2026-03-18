<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $reservations = DB::table('reservations')
            ->select('id', 'terrain_id', 'starts_at', 'ends_at', 'reservation_code')
            ->orderBy('terrain_id')
            ->orderBy('starts_at')
            ->orderBy('ends_at')
            ->orderBy('id')
            ->get();

        $groups = [];

        foreach ($reservations as $reservation) {
            $slotKey = $reservation->terrain_id.'|'.$reservation->starts_at.'|'.$reservation->ends_at;
            $groups[$slotKey][] = $reservation;
        }

        foreach ($groups as $group) {
            $sharedCode = null;

            foreach ($group as $reservation) {
                if (!empty($reservation->reservation_code)) {
                    $sharedCode = (string) $reservation->reservation_code;
                    break;
                }
            }

            if ($sharedCode === null) {
                $sharedCode = (string) random_int(1000000, 9999999);
            }

            foreach ($group as $reservation) {
                DB::table('reservations')
                    ->where('id', $reservation->id)
                    ->update(['reservation_code' => $sharedCode]);
            }
        }
    }

    public function down(): void
    {
        
    }
};
