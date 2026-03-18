<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        
        DB::table('reservations')
            ->whereNotNull('parent_reservation_id')
            ->update(['reservation_code' => null]);

        $parents = DB::table('reservations')
            ->select('id', 'reservation_code')
            ->whereNull('parent_reservation_id')
            ->orderBy('id')
            ->get();

        $usedCodes = [];

        foreach ($parents as $parent) {
            $currentCode = trim((string) ($parent->reservation_code ?? ''));
            $isValidCurrent = preg_match('/^\d{5}$/', $currentCode) === 1;

            if (! $isValidCurrent || isset($usedCodes[$currentCode])) {
                $currentCode = $this->generateUniqueCode($usedCodes);

                DB::table('reservations')
                    ->where('id', $parent->id)
                    ->update(['reservation_code' => $currentCode]);
            }

            $usedCodes[$currentCode] = true;
        }

        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropIndex(['reservation_code']);
            $table->unique('reservation_code');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropUnique(['reservation_code']);
            $table->index('reservation_code');
        });
    }

    private function generateUniqueCode(array $usedCodes): string
    {
        do {
            $code = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (
            isset($usedCodes[$code])
            || DB::table('reservations')
                ->whereNull('parent_reservation_id')
                ->where('reservation_code', $code)
                ->exists()
        );

        return $code;
    }
};
