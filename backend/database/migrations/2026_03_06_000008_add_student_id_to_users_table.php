<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('student_id', 20)->nullable()->unique()->after('filiere');
        });

        $stagiaires = DB::table('users')
            ->where('role', 'stagiaire')
            ->orderBy('id')
            ->get(['id']);

        foreach ($stagiaires as $stagiaire) {
            DB::table('users')
                ->where('id', $stagiaire->id)
                ->update(['student_id' => 'STG'.str_pad((string) $stagiaire->id, 6, '0', STR_PAD_LEFT)]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['student_id']);
            $table->dropColumn('student_id');
        });
    }
};
